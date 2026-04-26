#!/usr/bin/env node
// ============================================================================
// Monitor script - Ejecutar cada 5 minutos desde Windows Task Scheduler
// SOLO corre cuando Modo Ausencia está activado (.away-mode existe)
// En cada revisión manda un prompt a Claude para que monitoree y tome decisiones
// ============================================================================

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const WORKSPACE = process.env.ORCHESTRATOR_WORKSPACE || process.cwd();
const QUEUE_FILE = path.join(WORKSPACE, 'QUEUE.md');
const INBOX_FILE = path.join(WORKSPACE, 'INBOX.md');
const STATE_FILE = path.join(WORKSPACE, 'logs', 'orchestrator-state.json');
const ACTIONS_FILE = path.join(WORKSPACE, 'ACTIONS.md');
const AWAY_MODE_FILE = path.join(WORKSPACE, '.away-mode');

// Si Away Mode no está activado, salir inmediatamente
if (!fs.existsSync(AWAY_MODE_FILE)) {
  console.log('Monitor: Away Mode no activado. Saltando.');
  process.exit(0);
}

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function detectLanguage() {
  if (!fs.existsSync(QUEUE_FILE)) return 'en';
  try {
    const content = fs.readFileSync(QUEUE_FILE, 'utf-8');
    return (content.includes('## Pendientes') || content.includes('## Completadas')) ? 'es' : 'en';
  } catch { return 'en'; }
}

const lang = detectLanguage();

function readQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return { pending: [], inProgress: [], completed: [] };
  const result = { pending: [], inProgress: [], completed: [] };
  let section = '';
  for (const line of fs.readFileSync(QUEUE_FILE, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## Pending') || trimmed.startsWith('## Pendientes')) { section = 'pending'; continue; }
    if (trimmed.startsWith('## In Progress') || trimmed.startsWith('## En progreso')) { section = 'inProgress'; continue; }
    if (trimmed.startsWith('## Completed') || trimmed.startsWith('## Completadas')) { section = 'completed'; continue; }
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>')) continue;
    if (section && trimmed.includes('|')) result[section].push(trimmed);
  }
  return result;
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
  catch { return null; }
}

function launchClaude(prompt) {
  const claude = spawn('claude', [
    '-p', prompt,
    '--add-dir', WORKSPACE,
    '--dangerously-skip-permissions'
  ], {
    cwd: WORKSPACE,
    stdio: 'inherit',
    shell: true
  });
  claude.on('error', err => console.error(`[${timestamp()}] Error lanzando Claude: ${err.message}`));
  return claude;
}

// ============================================================================
// RECOPILAR ESTADO ACTUAL
// ============================================================================
const queue = readQueue();
const state = readState();

const busyAgents = Object.values(state?.agents || {}).filter(a => a.status === 'busy').length;
const failedAgents = Object.entries(state?.agents || {})
  .filter(([, ag]) => (ag.lastLine || '').startsWith('FALLÓ:') || (ag.lastLine || '').startsWith('FAILED:'))
  .map(([name, ag]) => `${name}: ${ag.lastLine}`);
const retryingAgents = Object.entries(state?.agents || {})
  .filter(([, ag]) => {
    const ll = ag.lastLine || '';
    return ll.startsWith('REINTENTO:') || ll.startsWith('LÍMITE:') || ll.startsWith('RETRY:');
  })
  .map(([name, ag]) => `${name}: ${ag.lastLine}`);

const hasWork = queue.pending.length > 0 || (state?.inProgress?.length || 0) > 0 || busyAgents > 0;

console.log(`[${timestamp()}] Monitor Modo Ausencia:`);
console.log(`  Pendientes: ${queue.pending.length} | En progreso: ${state?.inProgress?.length || 0} | Completadas: ${queue.completed.length}`);
console.log(`  Agentes ocupados: ${busyAgents} | Fallidos: ${failedAgents.length} | Reintentando: ${retryingAgents.length}`);

// ============================================================================
// SI NO HAY TRABAJO → DESACTIVAR Y DAR RESUMEN FINAL
// ============================================================================
if (!hasWork && queue.completed.length > 0) {
  console.log(`  -> Sin trabajo pendiente. Desactivando Modo Ausencia.`);

  try { fs.unlinkSync(AWAY_MODE_FILE); } catch {}
  try { if (fs.existsSync(ACTIONS_FILE)) fs.unlinkSync(ACTIONS_FILE); } catch {}

  const donePrompt = lang === 'es'
    ? `Modo Ausencia terminado. Todas las tareas se completaron mientras estabas ausente.

Lee QUEUE.md en ${WORKSPACE} y dame un resumen de todo lo que se logró durante la sesión.
Luego dime si hay algo que podamos continuar o integrar a partir de lo que ya se hizo, o pregúntame qué quiero priorizar a continuación.`
    : `Away Mode ended. All tasks were completed while you were away.

Read QUEUE.md in ${WORKSPACE} and give me a summary of everything accomplished during the session.
Then tell me if there is anything we can continue or integrate from what was done, or ask me what I want to prioritize next.`;

  launchClaude(donePrompt);
  process.exit(0);
}

// ============================================================================
// HAY TRABAJO → MANDAR PROMPT A CLAUDE PARA QUE MONITOREE Y TOME DECISIONES
// ============================================================================

// Construir contexto de estado para incluir en el prompt
const stateLines = [];
if (queue.pending.length > 0) {
  stateLines.push(`Tareas pendientes en cola: ${queue.pending.length}`);
  queue.pending.slice(0, 5).forEach(t => stateLines.push(`  - ${t.split('|').slice(0, 3).join('|').trim()}`));
}
if (state?.inProgress?.length > 0) {
  stateLines.push(`Tareas en progreso: ${state.inProgress.map(t => `${t.id} (${t.agent})`).join(', ')}`);
}
if (failedAgents.length > 0) {
  stateLines.push(`Agentes con fallo: ${failedAgents.join(' | ')}`);
}
if (retryingAgents.length > 0) {
  stateLines.push(`Agentes reintentando: ${retryingAgents.join(' | ')}`);
}
if (queue.completed.length > 0) {
  stateLines.push(`Tareas completadas hasta ahora: ${queue.completed.length}`);
}

const stateContext = stateLines.join('\n');

const monitorPrompt = lang === 'es'
  ? `Modo Ausencia activo — revisión automática cada 5 minutos.

Estado actual del orquestador:
${stateContext}

Instrucciones:
1. Lee INBOX.md en ${WORKSPACE} — si hay análisis completados de agentes que aún no tienen su tarea de implementación en QUEUE.md, crea la TASK correspondiente
2. Lee QUEUE.md en ${WORKSPACE} — si hay tareas fallidas que la TUI no pudo reasignar automáticamente (marcadas como failed), reasígnalas manualmente al siguiente agente disponible
3. Si hay agentes idle y tareas pendientes que no se están procesando, revisa si hay un problema de dependencias o bloqueo y resuélvelo
4. Si detectas que el trabajo avanza normalmente, no hagas nada y responde brevemente el estado

No hagas commit ni push. No inventes tareas nuevas fuera del alcance actual.`
  : `Away Mode active — automatic check every 5 minutes.

Current orchestrator state:
${stateContext}

Instructions:
1. Read INBOX.md in ${WORKSPACE} — if there are completed agent analyses without a corresponding implementation task in QUEUE.md, create the TASK
2. Read QUEUE.md in ${WORKSPACE} — if there are failed tasks that the TUI could not auto-reassign (marked as failed), manually reassign to the next available agent
3. If there are idle agents and pending tasks not being processed, check for dependency or blocking issues and resolve them
4. If work is progressing normally, do nothing and briefly report the status

Do not commit or push. Do not invent new tasks outside the current scope.`;

console.log(`  -> Disparando prompt a Claude para monitoreo...`);
launchClaude(monitorPrompt);
