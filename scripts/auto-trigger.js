#!/usr/bin/env node
// ============================================================================
// Auto-trigger script - Ejecutar cada 60 segundos desde Windows Task Scheduler
// Detecta nuevo contenido en INBOX.md y dispara Claude headless para procesarlo
// ============================================================================

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const WORKSPACE = process.env.ORCHESTRATOR_WORKSPACE || process.cwd();
const INBOX_FILE = path.join(WORKSPACE, 'INBOX.md');
const QUEUE_FILE = path.join(WORKSPACE, 'QUEUE.md');
const LAST_CHECK_FILE = path.join(WORKSPACE, 'logs', 'last-auto-check.json');
const LOCK_FILE = path.join(WORKSPACE, 'logs', 'orchestrator.lock');
const AWAY_MODE_FILE = path.join(WORKSPACE, '.away-mode');

// Salir silenciosamente si el TUI no está corriendo y no hay Away Mode activo
function isTuiRunning() {
  if (!fs.existsSync(LOCK_FILE)) return false;
  const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf-8').trim(), 10);
  if (isNaN(pid)) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

if (!isTuiRunning() && !fs.existsSync(AWAY_MODE_FILE)) {
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

// Leer último hash guardado
let lastCheck = { time: 0, inboxHash: '' };
try {
  if (fs.existsSync(LAST_CHECK_FILE)) {
    lastCheck = JSON.parse(fs.readFileSync(LAST_CHECK_FILE, 'utf-8'));
  }
} catch {}

// Leer INBOX actual
let inboxContent = '';
let currentHash = '';
try {
  if (fs.existsSync(INBOX_FILE)) {
    inboxContent = fs.readFileSync(INBOX_FILE, 'utf-8');
    currentHash = inboxContent.slice(0, 500);
  }
} catch {}

// Si no hay contenido o no cambió, salir
if (!inboxContent.trim() || currentHash === lastCheck.inboxHash) {
  console.log(`[${timestamp()}] Sin cambios en INBOX. Nada que procesar.`);
  process.exit(0);
}

console.log(`[${timestamp()}] Nuevo contenido en INBOX detectado — disparando Claude...`);

// Guardar hash y vaciar INBOX inmediatamente para que el próximo ciclo no re-dispare
lastCheck = { time: Date.now(), inboxHash: currentHash };
fs.mkdirSync(path.dirname(LAST_CHECK_FILE), { recursive: true });
fs.writeFileSync(LAST_CHECK_FILE, JSON.stringify(lastCheck), 'utf-8');
try { fs.writeFileSync(INBOX_FILE, '', 'utf-8'); } catch {}

// Prompt para Claude headless — lee INBOX y crea la task de implementación si aplica
const prompt = lang === 'es'
  ? `Eres el orquestador de este workspace. Tu única misión ahora es procesar el INBOX.

Pasos:
1. Lee INBOX.md en ${WORKSPACE}
2. Lee QUEUE.md en ${WORKSPACE} para ver las tareas existentes (secciones Pendientes, En progreso, Completadas)

Si en INBOX.md hay análisis completados de un agente (especialmente OpenCode) que aún NO tienen su tarea de implementación en la sección ## Pendientes de QUEUE.md:
- Determina el siguiente TASK ID disponible leyendo QUEUE.md
- Crea la nueva TASK en QUEUE.md con el formato exacto:
  TASK-NNN | título corto | Codex | P1 | repo | descripción basada en el análisis

Si ya existe la tarea correspondiente, o el análisis no está completo, responde solo: "Sin acción necesaria."

Reglas: No hagas commit ni push. No analices código del proyecto. Solo lee INBOX.md y QUEUE.md, y edita QUEUE.md si hace falta.`
  : `You are the orchestrator for this workspace. Your only mission now is to process the INBOX.

Steps:
1. Read INBOX.md in ${WORKSPACE}
2. Read QUEUE.md in ${WORKSPACE} to see existing tasks (sections Pending, In Progress, Completed)

If INBOX.md contains completed analyses from an agent (especially OpenCode) that do NOT yet have a corresponding implementation task in the ## Pending section of QUEUE.md:
- Determine the next available TASK ID by reading QUEUE.md
- Create the new TASK in QUEUE.md with the exact format:
  TASK-NNN | short title | Codex | P1 | repo | description based on the analysis

If the corresponding task already exists, or the analysis is not complete, reply only: "No action needed."

Rules: Do not commit or push. Do not analyze project code. Only read INBOX.md and QUEUE.md, and edit QUEUE.md if necessary.`;

// Redirigir output de Claude a un log file (no esperar — proceso desacoplado)
const logPath = path.join(WORKSPACE, 'logs', `auto-trigger-${Date.now()}.log`);
fs.mkdirSync(path.dirname(logPath), { recursive: true });
const logFd = fs.openSync(logPath, 'a');

const claude = spawn('claude', [
  '-p', prompt,
  '--add-dir', WORKSPACE,
  '--dangerously-skip-permissions'
], {
  cwd: WORKSPACE,
  stdio: ['ignore', logFd, logFd],
  shell: true,
  windowsHide: true,
  detached: true
});

fs.closeSync(logFd);
claude.unref();

console.log(`[${timestamp()}] Claude lanzado en background. Log: ${logPath}`);
