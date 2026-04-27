#!/usr/bin/env node
// ============================================================================
// Orchestrator MultiAgents TUI
// Dispatch tasks to multiple AI coding agents from a single dashboard.
// Supports: Claude Code, Codex, Gemini CLI, OpenCode, Cursor, Abacus AI
// Usage: node orchestrator.js [options]
// ============================================================================

const blessed = require("blessed");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const WORKSPACE = process.env.ORCHESTRATOR_WORKSPACE
  ? path.resolve(process.env.ORCHESTRATOR_WORKSPACE)
  : path.resolve(process.cwd());

// ============================================================================
// CONFIGURATION — loaded from orchestrator.config.json
// ============================================================================
const CONFIG_FILE = path.join(WORKSPACE, "orchestrator.config.json");

const CONFIG_TEMPLATE = {
  projectName: "My Project",
  maxConcurrent: 5,
  pollIntervalSeconds: 30,
  taskTimeoutMinutes: 30,
  repos: {
    backend: "/path/to/backend",
    frontend: "/path/to/frontend",
  },
  agents: {
    Backend: {
      cli: "claude",
      defaultRepo: "backend",
      model: "sonnet",
      instructionsFile: "agents/BACKEND.md",
    },
    Frontend: {
      cli: "claude",
      defaultRepo: "frontend",
      model: "sonnet",
      instructionsFile: "agents/FRONTEND.md",
    },
    Codex: {
      cli: "codex",
      defaultRepo: "backend",
      instructionsFile: "agents/CODEX.md",
    },
    Gemini: {
      cli: "gemini",
      defaultRepo: "backend",
      instructionsFile: "agents/GEMINI.md",
    },
    OpenCode: {
      cli: "opencode",
      defaultRepo: "backend",
      instructionsFile: "agents/OPENCODE.md",
    },
    Cursor: {
      cli: "cursor",
      defaultRepo: "backend",
      instructionsFile: "agents/CURSOR.md",
    },
    Abacus: {
      cli: "abacusai",
      defaultRepo: "backend",
      instructionsFile: "agents/ABACUS.md",
    },
  },
};

// Handle --init flag BEFORE the existence check, otherwise `--init` on a fresh
// checkout hits the "config not found" exit and can never create the file.
if (process.argv.includes("--init")) {
  if (fs.existsSync(CONFIG_FILE)) {
    console.log(
      "La configuración ya existe. Elimina orchestrator.config.json para reinicializar.",
    );
    process.exit(0);
  }
  fs.writeFileSync(
    CONFIG_FILE,
    JSON.stringify(CONFIG_TEMPLATE, null, 2) + "\n",
    "utf-8",
  );
  console.log(
    `Se creó ${CONFIG_FILE}\nEdítalo para que coincida con tus repos y agentes, luego ejecuta: node orchestrator.js`,
  );
  process.exit(0);
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Orchestrator Multi-Agents TUI

Usage: node orchestrator.js [options]

Options:
  --init         Generate the default orchestrator.config.json
  --headless     Run only the engine, without the Blessed UI
  --paused       Start paused
  --yolo         Enable explicit bypass/aggressive mode for this session
  --max-budget=N Stop after spending $N
  --help         Show this help

Keyboard:
  S  Start/resume   P  Pause/resume
  R  Reload queue   Q  Quit
`);
  process.exit(0);
}

if (!fs.existsSync(CONFIG_FILE)) {
  console.error(
    `No se encontró la configuración: ${CONFIG_FILE}\nEjecuta: node orchestrator.js --init`,
  );
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));

const QUEUE_FILE = path.join(WORKSPACE, "QUEUE.md");
const INBOX_FILE = path.join(WORKSPACE, "INBOX.md");
const NOTIFY_FILE = path.join(WORKSPACE, "NOTIFY.md");
const AWAY_MODE_FILE = path.join(WORKSPACE, ".away-mode");
const LOG_DIR = path.join(WORKSPACE, "logs");

const REPOS = config.repos || {};
const AGENTS = config.agents || {};
const PROJECT_NAME = config.projectName || "Orchestrator Multi-Agents";
const WORKSPACE_LANGUAGE = ["en", "es"].includes(config.workspaceLanguage)
  ? config.workspaceLanguage
  : "es";

// OpenAI model pricing ($ per 1M tokens) — update when prices change
const OPENAI_MODEL_PRICING = {
  "gpt-4.1":           { input: 2.0,  output: 8.0  },
  "gpt-4.1-mini":      { input: 0.4,  output: 1.6  },
  "gpt-4.1-nano":      { input: 0.1,  output: 0.4  },
  "gpt-4o":            { input: 2.5,  output: 10.0 },
  "gpt-4o-mini":       { input: 0.15, output: 0.6  },
  "o4-mini":           { input: 1.1,  output: 4.4  },
  "o3":                { input: 10.0, output: 40.0 },
  "o3-mini":           { input: 1.1,  output: 4.4  },
  "o1":                { input: 15.0, output: 60.0 },
  "o1-mini":           { input: 3.0,  output: 12.0 },
  "gpt-5":             { input: 5.0,  output: 20.0 },
  "gpt-5.5":           { input: 5.0,  output: 20.0 },
  "codex-mini-latest": { input: 1.5,  output: 6.0  },
};

function calcOpenAICost(model, usage) {
  if (!model || !usage) return null;
  const modelLower = String(model).toLowerCase();
  const key = Object.keys(OPENAI_MODEL_PRICING).find(k =>
    modelLower === k || modelLower.startsWith(k) || modelLower.includes(k)
  );
  if (!key) return null;
  const price = OPENAI_MODEL_PRICING[key];
  const inputTokens  = usage.input_tokens  || usage.prompt_tokens     || 0;
  const outputTokens = usage.output_tokens || usage.completion_tokens  || 0;
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}
const TEXT = {
  es: {
    configExists:
      "La configuración ya existe. Elimina orchestrator.config.json para reinicializar.",
    configCreated: (file) =>
      `Se creó ${file}\nEdítalo para que coincida con tus repos y agentes, luego ejecuta: node orchestrator.js`,
    configMissing: (file) =>
      `No se encontró la configuración: ${file}\nEjecuta: node orchestrator.js --init`,
    usage: "Uso",
    options: "Opciones",
    keyboard: "Teclado",
    headlessHelp: "Ejecuta solo el motor, sin la UI blessed",
    pausedHelp: "Inicia en pausa (presiona S para comenzar)",
    yoloHelp: "Activa bypass/agresivo para una sesión explícita",
    budgetHelp: "Se detiene al gastar $N",
    helpHelp: "Muestra esta ayuda",
    initHelp: "Genera orchestrator.config.json por defecto",
    startResume: "Iniciar/reanudar",
    pauseResume: "Pausar/reanudar",
    reloadQueue: "Recargar cola",
    quit: "Salir",
    summary: "Resumen de sesión",
    duration: "Duración",
    completed: "Completadas",
    tasks: "tareas",
    cost: "Costo",
    resumed: "REANUDADO",
    paused: "PAUSADO",
    running: "EJECUTANDO",
    busy: "OCUPADO",
    idle: "EN ESPERA",
    failed: "FALLÓ",
    retrying: "REINTENTANDO",
    queueReloaded: (count) => `Cola recargada: ${count} tareas`,
    quitRequested: "Cierre solicitado desde Ink",
    starting: (name) => `${name} iniciando`,
    loadedCompleted: (count) =>
      `Se cargaron ${count} tareas completadas desde QUEUE.md`,
    queue: "COLA",
    pending: "pendientes",
    empty: "(vacía)",
    after: "después de",
    quotaLimit: "LÍMITE DE CUOTA",
    retryAt: (time, remaining) => `reintenta a las ${time} (${remaining} min)`,
    log: "REGISTRO",
    controls: "Seguir  Pausa  Recargar  Quitar",
    // QUEUE.md section headers
    sectionPending: "## Pendientes",
    sectionInProgress: "## En progreso",
    sectionCompleted: "## Completadas",
    // appendToAgent messages
    agentTaskHeader: (id, title) => `=== ${id}: ${title} ===`,
    agentCwd: (dir) => `CWD: ${dir}`,
    agentCompleted: (elapsed, cost) => `=== COMPLETADA en ${elapsed}${cost} ===`,
    agentFailed: (code, attempt) => `=== FALLÓ (salida ${code}, intento ${attempt}) ===`,
    agentRateLimit: (resetStr) => `=== LÍMITE DE CUOTA (${resetStr}) ===`,
    agentTimeout: "=== TIMEOUT ===",
    agentDied: "=== PROCESS DIED ===",
    agentReassigned: (agent, reason) => `=== REASIGNADA A ${agent} (${reason}) ===`,
    // ag.lastLine state machine prefixes (used for status detection)
    lastCompleted: (id) => `Última: ${id} completada`,
    lastRetry: (id) => `REINTENTO: ${id}`,
    lastLimit: (id, time) => `LÍMITE: ${id} (reintento a las ${time})`,
    lastFailed: (id) => `FALLÓ: ${id}`,
    // Fallback reasons
    reasonQuota: "cuota o límite agotado",
    reasonProvider: "proveedor o sesión no disponibles",
    reasonNoWork: "el agente no trabajó nada (sin cambios)",
    reasonPersistent: "fallo persistente",
    // Log messages
    logRateLimit: (agent, id, resetStr) => `${agent} alcanzó el límite en ${id} (${resetStr})`,
    logFail: (agent, id, code, retries, max) => `${agent} falló ${id} (salida ${code}, ${retries}/${max})`,
    logDone: (agent, id, elapsed, cost) => `${agent} completó ${id} en ${elapsed}${cost}`,
    logFallback: (id, from, to, reason) => `${id} reasignada de ${from} a ${to} (${reason})`,
    logReassignWarn: (id, agent) => `${id} reasignada a ${agent}, pero QUEUE.md no pudo actualizarse`,
    logTimeout: (agent, id) => `${agent} timed out on ${id}`,
    logUnknownAgent: (id, agent) => `${id} skipped — agente "${agent}" no definido en orchestrator.config.json`,
    logPermanentFail: (id, retries) => `${id} falló definitivamente tras ${retries} intentos`,
    logDied: (agent, id) => `${agent} terminó silenciosamente en ${id}`,
    // STATUS.md
    statusTitle: (ts) => `# Estado del Orquestador - ${ts}`,
    statusProject: "**Proyecto:**",
    statusState: "**Estado:**",
    statusRunning: "EJECUTANDO",
    statusPausedLabel: "PAUSADO",
    statusActiveTime: "**Activo:**",
    statusSectionAgents: "## Agentes",
    statusSectionQueue: "## Cola",
    statusPendingLabel: "Pendientes:",
    statusCompletedLabel: "Completadas:",
    statusInProgressLabel: "En progreso:",
    statusInProgressHeader: "### En progreso",
    statusAgentBusy: "🟡 OCUPADO",
    statusAgentIdle: "⚪ EN ESPERA",
    statusNoTask: "Sin tarea",
    // INBOX.md
    inboxDone: (ts, id, agent) => `## [${ts}] ${id} completada — ${agent}`,
    inboxTaskLabel: "- **Tarea:**",
    inboxDurationLabel: "- **Duración:**",
    inboxReportLabel: "- **Reporte:**",
    inboxActionLabel: (file) => `- **Acción:** Lee \`${file}\` y crea las siguientes TASKs si corresponde.`,
    inboxFailed: (ts, id, from, to) => `## [${ts}] ${id} falló — ${from} → reasignada a ${to}`,
    inboxReasonLabel: "- **Motivo:**",
    inboxNewAgentLabel: "- **Nuevo agente:**",
    inboxFailAction: "- **Acción:** La TUI reasignó automáticamente. Verifica en QUEUE.md o espera la siguiente notificación de completada.",
    // NOTIFY.md — notificación concisa a la sesión interactiva de Claude
    notifyComplete: (ts, id, agent, dur) => `🔔 [${ts}] ${id} completada por ${agent} (${dur}).\nRevisa INBOX.md y crea la siguiente tarea de implementación en QUEUE.md si aún no existe.`,
    notifyFailed: (ts, id, from, to, reason) => `⚠️ [${ts}] ${id} falló en ${from} → reasignada a ${to}.\nMotivo: ${reason}\nRevisa INBOX.md para el contexto.`,
    notifyPermanentFail: (ts, id, agent) => `🚨 [${ts}] ${id} falló permanentemente en ${agent} (sin más reintentos).\nDecide si eliminar, reasignar o escalar la tarea en QUEUE.md.`,
  },
  en: {
    configExists:
      "Configuration already exists. Delete orchestrator.config.json to reinitialize.",
    configCreated: (file) =>
      `Created ${file}\nEdit it to match your repos and agents, then run: node orchestrator.js`,
    configMissing: (file) =>
      `Configuration not found: ${file}\nRun: node orchestrator.js --init`,
    usage: "Usage",
    options: "Options",
    keyboard: "Keyboard",
    headlessHelp: "Run only the engine, without the Blessed UI",
    pausedHelp: "Start paused (press S to begin)",
    yoloHelp: "Enable explicit bypass/aggressive mode for this session",
    budgetHelp: "Stop after spending $N",
    helpHelp: "Show this help",
    initHelp: "Generate the default orchestrator.config.json",
    startResume: "Start/resume",
    pauseResume: "Pause/resume",
    reloadQueue: "Reload queue",
    quit: "Quit",
    summary: "Session summary",
    duration: "Duration",
    completed: "Completed",
    tasks: "tasks",
    cost: "Cost",
    resumed: "RESUMED",
    paused: "PAUSED",
    running: "RUNNING",
    busy: "BUSY",
    idle: "IDLE",
    failed: "FAILED",
    retrying: "RETRYING",
    queueReloaded: (count) => `Queue reloaded: ${count} tasks`,
    quitRequested: "Quit requested from Ink",
    starting: (name) => `${name} starting`,
    loadedCompleted: (count) => `Loaded ${count} completed tasks from QUEUE.md`,
    queue: "QUEUE",
    pending: "pending",
    empty: "(empty)",
    after: "after",
    quotaLimit: "QUOTA LIMIT",
    retryAt: (time, remaining) => `retry at ${time} (${remaining} min)`,
    log: "LOG",
    controls: "Start  Pause  Reload  Quit",
    // QUEUE.md section headers
    sectionPending: "## Pending",
    sectionInProgress: "## In Progress",
    sectionCompleted: "## Completed",
    // appendToAgent messages
    agentTaskHeader: (id, title) => `=== ${id}: ${title} ===`,
    agentCwd: (dir) => `CWD: ${dir}`,
    agentCompleted: (elapsed, cost) => `=== COMPLETED in ${elapsed}${cost} ===`,
    agentFailed: (code, attempt) => `=== FAILED (exit ${code}, attempt ${attempt}) ===`,
    agentRateLimit: (resetStr) => `=== QUOTA LIMIT (${resetStr}) ===`,
    agentTimeout: "=== TIMEOUT ===",
    agentDied: "=== PROCESS DIED ===",
    agentReassigned: (agent, reason) => `=== REASSIGNED TO ${agent} (${reason}) ===`,
    // ag.lastLine state machine prefixes
    lastCompleted: (id) => `Last: ${id} completed`,
    lastRetry: (id) => `RETRY: ${id}`,
    lastLimit: (id, time) => `LIMIT: ${id} (retry at ${time})`,
    lastFailed: (id) => `FAILED: ${id}`,
    // Fallback reasons
    reasonQuota: "quota or rate limit exhausted",
    reasonProvider: "provider or session unavailable",
    reasonNoWork: "agent did no real work (no changes)",
    reasonPersistent: "persistent failure",
    // Log messages
    logRateLimit: (agent, id, resetStr) => `${agent} hit rate limit on ${id} (${resetStr})`,
    logFail: (agent, id, code, retries, max) => `${agent} failed ${id} (exit ${code}, ${retries}/${max})`,
    logDone: (agent, id, elapsed, cost) => `${agent} completed ${id} in ${elapsed}${cost}`,
    logFallback: (id, from, to, reason) => `${id} reassigned from ${from} to ${to} (${reason})`,
    logReassignWarn: (id, agent) => `${id} reassigned to ${agent}, but QUEUE.md could not be updated`,
    logTimeout: (agent, id) => `${agent} timed out on ${id}`,
    logUnknownAgent: (id, agent) => `${id} skipped — agent "${agent}" not in orchestrator.config.json`,
    logPermanentFail: (id, retries) => `${id} permanently failed after ${retries} attempts`,
    logDied: (agent, id) => `${agent} died silently on ${id}`,
    // STATUS.md
    statusTitle: (ts) => `# Orchestrator Status - ${ts}`,
    statusProject: "**Project:**",
    statusState: "**State:**",
    statusRunning: "RUNNING",
    statusPausedLabel: "PAUSED",
    statusActiveTime: "**Active:**",
    statusSectionAgents: "## Agents",
    statusSectionQueue: "## Queue",
    statusPendingLabel: "Pending:",
    statusCompletedLabel: "Completed:",
    statusInProgressLabel: "In progress:",
    statusInProgressHeader: "### In progress",
    statusAgentBusy: "🟡 BUSY",
    statusAgentIdle: "⚪ IDLE",
    statusNoTask: "No task",
    // INBOX.md
    inboxDone: (ts, id, agent) => `## [${ts}] ${id} completed — ${agent}`,
    inboxTaskLabel: "- **Task:**",
    inboxDurationLabel: "- **Duration:**",
    inboxReportLabel: "- **Report:**",
    inboxActionLabel: (file) => `- **Action:** Read \`${file}\` and create next TASKs if applicable.`,
    inboxFailed: (ts, id, from, to) => `## [${ts}] ${id} failed — ${from} → reassigned to ${to}`,
    inboxReasonLabel: "- **Reason:**",
    inboxNewAgentLabel: "- **New agent:**",
    inboxFailAction: "- **Action:** TUI reassigned automatically. Check QUEUE.md or wait for the next completion notification.",
    // NOTIFY.md — concise notification to the interactive Claude session
    notifyComplete: (ts, id, agent, dur) => `🔔 [${ts}] ${id} completed by ${agent} (${dur}).\nCheck INBOX.md and create the next implementation task in QUEUE.md if it does not exist yet.`,
    notifyFailed: (ts, id, from, to, reason) => `⚠️ [${ts}] ${id} failed on ${from} → reassigned to ${to}.\nReason: ${reason}\nCheck INBOX.md for context.`,
    notifyPermanentFail: (ts, id, agent) => `🚨 [${ts}] ${id} permanently failed on ${agent} (no more retries).\nDecide whether to remove, reassign, or escalate the task in QUEUE.md.`,
  },
};
const L = TEXT[WORKSPACE_LANGUAGE];

let lastRenderTime = 0;
const RENDER_DEBOUNCE_MS = 500;

function safeRenderDashboard() {
  const now = Date.now();
  if (now - lastRenderTime < RENDER_DEBOUNCE_MS) return;
  lastRenderTime = now;
  renderDashboard();
}

// CLI args
const argv = process.argv.slice(2);
const CLI = {
  paused: argv.includes("--paused"),
  headless: argv.includes("--headless"),
  yolo: argv.includes("--yolo"),
  help: argv.includes("--help") || argv.includes("-h"),
  maxBudget:
    parseFloat(
      argv.find((a) => a.startsWith("--max-budget="))?.split("=")[1] || "0",
    ) || 0,
};

if (CLI.help) {
  console.log(`
${PROJECT_NAME} TUI

${L.usage}: node orchestrator.js [options]

${L.options}:
  --init         ${L.initHelp}
  --headless     ${L.headlessHelp}
  --paused       ${L.pausedHelp}
  --yolo         ${L.yoloHelp}
  --max-budget=N ${L.budgetHelp}
  --help         ${L.helpHelp}

${L.keyboard}:
  S  ${L.startResume}   P  ${L.pauseResume}
  R  ${L.reloadQueue}   Q  ${L.quit}
`);
  process.exit(0);
}

const MAX_CONCURRENT = config.maxConcurrent || Object.keys(AGENTS).length;
const POLL_INTERVAL_MS = (config.pollIntervalSeconds || 30) * 1000;
const TASK_TIMEOUT_MS = (config.taskTimeoutMinutes || 30) * 60 * 1000;
const SKIP_PERMISSIONS = process.env.SKIP_PERMISSIONS === "true" || CLI.yolo;
const PERMISSION_FLAGS = SKIP_PERMISSIONS
  ? ["--dangerously-skip-permissions"]
  : ["--permission-mode", "default"];

// ============================================================================
// LOCK FILE
// ============================================================================
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const LOCK_FILE = path.join(LOG_DIR, "orchestrator.lock");
const STATE_FILE = path.join(LOG_DIR, "orchestrator-state.json");
const CONTROL_FILE = path.join(LOG_DIR, "orchestrator-control.json");
const STATUS_FILE = path.join(WORKSPACE, "STATUS.md");

function updateStatusFile() {
  const statusLines = [
    L.statusTitle(timestamp()),
    ``,
    `${L.statusProject} ${PROJECT_NAME}`,
    `${L.statusState} ${state.paused ? L.statusPausedLabel : L.statusRunning}`,
    `${L.statusActiveTime} ${formatDuration(Math.round((Date.now() - state.startTime) / 1000))}`,
    ``,
    L.statusSectionAgents,
    ``,
  ];
  for (const [name, ag] of Object.entries(state.agents)) {
    const status = ag.status === "busy" ? L.statusAgentBusy : L.statusAgentIdle;
    const task = ag.task ? `${ag.task.id}: ${ag.task.title}` : L.statusNoTask;
    statusLines.push(`- **${name}**: ${status} - ${task}`);
  }
  statusLines.push("", L.statusSectionQueue);
  statusLines.push("", `${L.statusPendingLabel} ${state.queue.length}`);
  statusLines.push("", `${L.statusCompletedLabel} ${state.completed.length}`);
  statusLines.push("", `${L.statusInProgressLabel} ${state.inProgress.length}`);
  if (state.inProgress.length > 0) {
    statusLines.push("", L.statusInProgressHeader);
    for (const t of state.inProgress) {
      statusLines.push(`- ${t.id}: ${t.title} (${t.agent})`);
    }
  }
  try {
    fs.writeFileSync(STATUS_FILE, statusLines.join("\n"), "utf-8");
  } catch {}
}

// Limpiar control.json orphan al iniciar (si el proceso anterior fechou mal)
if (fs.existsSync(CONTROL_FILE)) {
  try {
    const content = JSON.parse(fs.readFileSync(CONTROL_FILE, "utf-8"));
    const age = Date.now() - (content.requestedAt || 0);
    if (age > 5000) {
      fs.unlinkSync(CONTROL_FILE);
    }
  } catch {
    fs.unlinkSync(CONTROL_FILE);
  }
}

if (fs.existsSync(LOCK_FILE)) {
  const lockPid = parseInt(fs.readFileSync(LOCK_FILE, "utf-8").trim(), 10);
  let running = false;
  try {
    process.kill(lockPid, 0);
    running = true;
  } catch {}
  if (running) {
    console.error(
      `Orchestrator ya está ejecutándose (PID ${lockPid}). Ciérralo o elimina ${LOCK_FILE}`,
    );
    process.exit(1);
  }
  fs.unlinkSync(LOCK_FILE);
}
fs.writeFileSync(LOCK_FILE, String(process.pid), "utf-8");
const cleanupLock = () => {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch {}
};
const cleanupState = () => {
  try {
    fs.unlinkSync(STATE_FILE);
  } catch {}
};
const cleanupControl = () => {
  try {
    fs.unlinkSync(CONTROL_FILE);
  } catch {}
};
process.on("exit", cleanupLock);
process.on("exit", cleanupState);
process.on("exit", cleanupControl);
// Windows: process.on('exit') no siempre corre con Ctrl+C
// Usar handle uncaught para asegurar limpieza
process.on("uncaughtException", () => {
  cleanupLock();
  cleanupState();
  cleanupControl();
});
// Signal handlers con limpieza sincrona forzada
const doCleanup = () => {
  cleanupLock();
  cleanupState();
  cleanupControl();
};
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    doCleanup();
    // Forzar exit sincrono para Windows
    process.exit(0);
  });
}

// ============================================================================
// STATE
// ============================================================================
const state = {
  agents: {},
  queue: [],
  completed: [],
  inProgress: [],
  logs: [],
  paused: CLI.paused,
  startTime: Date.now(),
  totalCost: 0,
};

for (const name of Object.keys(AGENTS)) {
  state.agents[name] = {
    status: "idle",
    task: null,
    process: null,
    startTime: null,
    logFile: null,
    output: "",
    lastLine: "",
    exitCode: null,
    cost: null,
    totalCost: 0,
    turns: 0,
  };
}

// ============================================================================
// BLESSED SCREEN
// ============================================================================
const screen = CLI.headless
  ? null
  : blessed.screen({
      smartCSR: true,
      title: PROJECT_NAME,
      fullUnicode: true,
    });

const dashboard =
  CLI.headless || !screen
    ? null
    : blessed.box({
        parent: screen,
        top: 0,
        left: 0,
        width: "100%",
        height: "40%",
        border: { type: "line" },
        style: { border: { fg: "cyan" } },
        label: ` {bold}{cyan-fg}${PROJECT_NAME.toUpperCase()}{/cyan-fg}{/bold} `,
        tags: true,
        scrollable: true,
        alwaysScroll: true,
        keys: true,
        scrollbar: { style: { bg: "cyan" } },
      });

const agentNames = Object.keys(AGENTS);
const agentBoxes = {};
const panelWidth = Math.max(
  1,
  Math.floor(100 / Math.max(1, agentNames.length)),
);

if (!CLI.headless && screen) {
  agentNames.forEach((name, i) => {
    const isLast = i === agentNames.length - 1;
    agentBoxes[name] = blessed.box({
      parent: screen,
      top: "40%",
      left: `${i * panelWidth}%`,
      width: isLast ? `${100 - i * panelWidth}%` : `${panelWidth}%`,
      height: "60%",
      border: { type: "line" },
      style: { border: { fg: "gray" } },
      label: ` {bold}${name}{/bold} {gray-fg}EN ESPERA{/gray-fg} `,
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { style: { bg: "gray" } },
    });
  });
}

// ============================================================================
// HELPERS
// ============================================================================
function timestamp() {
  return new Date().toLocaleTimeString("es-HN", { hour12: false });
}
function datestamp() {
  return new Date().toISOString().slice(0, 10);
}
function formatDuration(s) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m${s % 60 > 0 ? (s % 60) + "s" : ""}`;
  return `${Math.floor(m / 60)}h${m % 60}m`;
}
function elapsedSince(t) {
  return t ? formatDuration(Math.round((Date.now() - t) / 1000)) : "--";
}

function log(tag, msg) {
  const entry = `[${timestamp()}] [${tag}] ${msg}`;
  state.logs.push(entry);
  if (state.logs.length > 100) state.logs.shift();
  fs.appendFileSync(
    path.join(LOG_DIR, `orchestrator-${datestamp()}.log`),
    entry + "\n",
  );
}

function persistState() {
  const snapshot = {
    projectName: PROJECT_NAME,
    workspaceLanguage: WORKSPACE_LANGUAGE,
    paused: state.paused,
    startTime: state.startTime,
    totalCost: state.totalCost,
    queue: state.queue,
    completed: state.completed,
    inProgress: state.inProgress,
    logs: state.logs.slice(-20),
    updatedAt: Date.now(),
    pid: process.pid,
    agents: Object.fromEntries(
      Object.entries(state.agents).map(([name, ag]) => [
        name,
        {
          status: ag.status,
          task: ag.task,
          startTime: ag.startTime,
          lastLine: ag.lastLine,
          exitCode: ag.exitCode,
          cost: ag.cost,
          totalCost: ag.totalCost || 0,
          turns: ag.turns,
        },
      ]),
    ),
  };
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(snapshot, null, 2) + "\n",
    "utf-8",
  );
}

function consumeControlCommand() {
  if (!fs.existsSync(CONTROL_FILE)) return null;
  try {
    const payload = JSON.parse(fs.readFileSync(CONTROL_FILE, "utf-8"));
    fs.unlinkSync(CONTROL_FILE);
    return payload;
  } catch {
    try {
      fs.unlinkSync(CONTROL_FILE);
    } catch {}
    return null;
  }
}

function stopAllAgents() {
  for (const ag of Object.values(state.agents)) {
    if (ag.process)
      try {
        ag.process.kill("SIGTERM");
      } catch {}
  }
}

function exitWithSummary() {
  stopAllAgents();
  if (!CLI.headless && screen) screen.destroy();
  console.log(`\n${PROJECT_NAME} — ${L.summary}`);
  console.log(`  ${L.duration}: ${elapsedSince(state.startTime)}`);
  console.log(`  ${L.completed}: ${state.completed.length} ${L.tasks}`);
  console.log(`  ${L.cost}: $${state.totalCost.toFixed(2)}`);
  for (const t of state.completed)
    console.log(
      `    ✓ ${t.id} ${t.title} (${t.agent}, ${formatDuration(t.elapsed)})`,
    );
  process.exit(0);
}

function applyControlCommand(command) {
  if (!command?.type) return;
  switch (command.type) {
    case "start":
      if (state.paused) {
        state.paused = false;
        log("INFO", L.resumed);
      }
      scheduleNext();
      renderDashboard();
      break;
    case "pause":
      if (!state.paused) {
        state.paused = true;
        log("INFO", L.paused);
      }
      renderDashboard();
      break;
    case "reload":
      reloadQueue();
      log("INFO", L.queueReloaded(state.queue.length));
      renderDashboard();
      break;
    case "quit":
      log("INFO", L.quitRequested);
      exitWithSummary();
      break;
  }
}

function escBl(s) {
  return String(s == null ? "" : s)
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

function appendToAgent(name, text, raw = false) {
  if (CLI.headless) return;
  const box = agentBoxes[name];
  if (!box) return;
  const content = raw ? text : escBl(text);
  try {
    box.pushLine(content);
  } catch {
    // Blessed's tag parser can crash on malformed content that slipped past
    // escaping (e.g. unclosed tags from agent output with `raw=true`). Fall
    // back to fully-escaped content so the TUI stays alive.
    try {
      box.pushLine(escBl(String(text == null ? "" : text)));
    } catch {
      return;
    }
  }
  while (box.getLines().length > 500) box.shiftLine(0);
  box.setScrollPerc(100);
}

// ============================================================================
// DASHBOARD RENDER
// ============================================================================
function renderDashboard() {
  persistState();
  if (CLI.headless || !dashboard || !screen) return;
  const lines = [];
  const up = elapsedSince(state.startTime);
  const cost = state.totalCost > 0 ? `$${state.totalCost.toFixed(2)}` : "";
  const mode = state.paused
    ? `{yellow-fg}${L.paused}{/yellow-fg}`
    : `{green-fg}${L.running}{/green-fg}`;

  lines.push(
    `  ${datestamp()} ${timestamp()}  ${WORKSPACE_LANGUAGE === "es" ? "activo" : "active"} ${up}  ${cost}  ${mode}`,
  );
  lines.push("");

  for (const [name, ag] of Object.entries(state.agents)) {
    const lastLine = ag.lastLine || "";
    const isFailed = lastLine.startsWith("FALLÓ:") || lastLine.startsWith("FAILED:");
    const isRetrying = lastLine.startsWith("REINTENTO:") || lastLine.startsWith("LÍMITE:") || lastLine.startsWith("RETRY:") || lastLine.startsWith("LIMIT:");
    let status, detail, dot;
    if (ag.status === "busy") {
      status = `{yellow-fg}${L.busy}{/yellow-fg}`;
      detail = `${ag.task?.id || "?"} ${(ag.task?.title || "").slice(0, 35)} (${elapsedSince(ag.startTime)})`;
      dot = "{green-fg}●{/green-fg}";
    } else if (isFailed) {
      status = `{red-fg}${L.failed}{/red-fg}`;
      detail = lastLine;
      dot = "{red-fg}✕{/red-fg}";
    } else if (isRetrying) {
      status = `{yellow-fg}${L.retrying}{/yellow-fg}`;
      detail = lastLine;
      dot = "{yellow-fg}⟳{/yellow-fg}";
    } else {
      status = `{gray-fg}${L.idle}{/gray-fg}`;
      detail = lastLine;
      dot = "{gray-fg}○{/gray-fg}";
    }
    lines.push(`  ${dot} {bold}${name}{/bold}  ${status}  ${escBl(detail)}`);
  }
  lines.push("");

  lines.push(
    `  {bold}${L.queue}{/bold} {gray-fg}(${state.queue.length} ${L.pending}){/gray-fg}`,
  );
  for (let i = 0; i < Math.min(state.queue.length, 5); i++) {
    const t = state.queue[i];
    const pri =
      t.priority === "P1"
        ? "{red-fg}P1{/red-fg}"
        : t.priority === "P2"
          ? "{yellow-fg}P2{/yellow-fg}"
          : "{gray-fg}P3{/gray-fg}";
    const dep = t.dependsOn
      ? ` {gray-fg}[${L.after} ${t.dependsOn}]{/gray-fg}`
      : "";
    lines.push(
      `    ${i + 1}. {bold}${escBl(t.id)}{/bold} ${escBl(String(t.title || "").slice(0, 35))} | ${escBl(t.agent)} | ${pri}${dep}`,
    );
  }
  if (state.queue.length === 0) lines.push(`    {gray-fg}${L.empty}{/gray-fg}`);

  const rlEntries = [...rateLimitedAgents.entries()].filter(
    ([, t]) => Date.now() < t,
  );
  if (rlEntries.length > 0) {
    lines.push("");
    lines.push(`  {bold}${L.quotaLimit}{/bold}`);
    for (const [name, cooldown] of rlEntries) {
      const remaining = Math.ceil((cooldown - Date.now()) / 60000);
      const retryAt = new Date(cooldown).toLocaleTimeString("es-HN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      lines.push(
        `    {yellow-fg}⏳{/yellow-fg} ${name} — ${L.retryAt(retryAt, remaining)}`,
      );
    }
  }
  for (const [name, t] of rateLimitedAgents) {
    if (Date.now() >= t) rateLimitedAgents.delete(name);
  }
  lines.push("");

  lines.push(
    `  {bold}${L.completed.toUpperCase()}{/bold} {gray-fg}(${state.completed.length}){/gray-fg}`,
  );
  for (const t of state.completed.slice(-4)) {
    const c = t.cost ? ` $${t.cost.toFixed(2)}` : "";
    lines.push(
      `    {green-fg}✓{/green-fg} {bold}${escBl(t.id)}{/bold} ${escBl(String(t.title || "").slice(0, 30))} | ${escBl(t.agent)} | ${escBl(t.completedAt)} (${formatDuration(t.elapsed)})${escBl(c)}`,
    );
  }
  lines.push("");

  lines.push(`  {bold}${L.log}{/bold}`);
  for (const entry of state.logs.slice(-4)) {
    lines.push(`    {gray-fg}${escBl(entry)}{/gray-fg}`);
  }
  lines.push("");
  lines.push(`  {cyan-fg}S{/cyan-fg} ${L.controls}`);

  dashboard.setContent(lines.join("\n"));

  for (const [name, ag] of Object.entries(state.agents)) {
    const box = agentBoxes[name];
    const lastLine = ag.lastLine || "";
    const isFailed = lastLine.startsWith("FALLÓ:") || lastLine.startsWith("FAILED:");
    const isRetrying = lastLine.startsWith("REINTENTO:") || lastLine.startsWith("LÍMITE:") || lastLine.startsWith("RETRY:") || lastLine.startsWith("LIMIT:");
    if (ag.status === "busy") {
      box.style.border.fg = "yellow";
      box.setLabel(
        ` {bold}${escBl(name)}{/bold} {yellow-fg}${L.busy}{/yellow-fg} ${escBl(ag.task?.id || "")} `,
      );
    } else if (isFailed) {
      box.style.border.fg = "red";
      box.setLabel(` {bold}${escBl(name)}{/bold} {red-fg}${L.failed}{/red-fg} `);
    } else if (isRetrying) {
      box.style.border.fg = "yellow";
      box.setLabel(` {bold}${escBl(name)}{/bold} {yellow-fg}${L.retrying}{/yellow-fg} `);
    } else {
      box.style.border.fg = "gray";
      const agCostLabel = ag.totalCost > 0 ? ` {gray-fg}$${ag.totalCost.toFixed(2)}{/gray-fg}` : "";
      box.setLabel(
        ` {bold}${escBl(name)}{/bold} {gray-fg}${L.idle}{/gray-fg}${agCostLabel} `,
      );
    }
  }
  screen.render();
}

// ============================================================================
// QUEUE PARSER
// ============================================================================
function parseQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  const content = fs.readFileSync(QUEUE_FILE, "utf-8");
  const tasks = [];
  let section = "";
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("## Pending") || line.startsWith("## Pendientes")) {
      section = "pending";
      continue;
    }
    if (
      line.startsWith("## In Progress") ||
      line.startsWith("## En progreso")
    ) {
      section = "inprogress";
      continue;
    }
    if (line.startsWith("## Completed") || line.startsWith("## Completadas")) {
      section = "completed";
      continue;
    }
    if (!line || line.startsWith("#") || line.startsWith(">")) continue;
    if (section !== "pending") continue;
    const parts = line.split("|").map((s) => s.trim());
    if (parts.length < 5) continue;
    const [id, title, agent, priority, repo, ...descParts] = parts;
    const description = descParts.join("|").trim();
    let dependsOn = null;
    const depMatch = description.match(/>\s*after:(TASK-\d+)/i);
    if (depMatch) dependsOn = depMatch[1];
    tasks.push({
      id: id.trim(),
      title: title.trim(),
      agent: agent.trim(),
      priority: priority.trim(),
      repo: repo.trim(),
      description: description.replace(/>\s*after:TASK-\d+/i, "").trim(),
      dependsOn,
      status: "pending",
    });
  }
  return tasks;
}

function parseCompletedFromFile() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  const content = fs.readFileSync(QUEUE_FILE, "utf-8");
  const ids = [];
  let section = "";
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("## Pending") || line.startsWith("## Pendientes")) {
      section = "pending";
      continue;
    }
    if (
      line.startsWith("## In Progress") ||
      line.startsWith("## En progreso")
    ) {
      section = "inprogress";
      continue;
    }
    if (line.startsWith("## Completed") || line.startsWith("## Completadas")) {
      section = "completed";
      continue;
    }
    if (section !== "completed" || !line) continue;
    const match = line.match(/^(TASK-\d+)/);
    if (match)
      ids.push({
        id: match[1],
        status: "completed",
        title: "",
        agent: "",
        elapsed: 0,
      });
  }
  return ids;
}

const loggedUnknownAgents = new Set();
function reloadQueue() {
  state.queue = parseQueue();
  const activeIds = new Set([
    ...state.inProgress.map((t) => t.id),
    ...state.completed.map((t) => t.id),
  ]);
  state.queue = state.queue.filter((t) => {
    if (activeIds.has(t.id)) return false;
    if (!AGENTS[t.agent]) {
      const key = `${t.id}:${t.agent}`;
      if (!loggedUnknownAgents.has(key)) {
        log(
          "SKIP",
          `${t.id} skipped — agent "${t.agent}" not in orchestrator.config.json`,
        );
        loggedUnknownAgents.add(key);
      }
      return false;
    }
    const fails = failedTasks.get(t.id) || 0;
    if (fails >= MAX_RETRIES) {
      log("SKIP", `${t.id} skipped (permanently failed)`);
      return false;
    }
    return true;
  });
}

// ============================================================================
// INBOX NOTIFICATIONS — written when a task completes so the Orchestrator
// session can detect it on next interaction without Modo Ausencia active.
// ============================================================================
function writeInboxNotification(task, agentName, elapsed) {
  const progressFile = `progress/PROGRESS-${agentName}.md`;
  const entry = [
    ``,
    L.inboxDone(timestamp(), task.id, agentName),
    ``,
    `${L.inboxTaskLabel} ${task.title}`,
    `${L.inboxDurationLabel} ${formatDuration(elapsed)}`,
    `${L.inboxReportLabel} ${progressFile}`,
    L.inboxActionLabel(progressFile),
    ``,
  ].join("\n");
  try {
    fs.appendFileSync(INBOX_FILE, entry, "utf-8");
  } catch {}
}

function writeInboxFailureNotification(task, failedAgent, newAgent, reason) {
  const entry = [
    ``,
    L.inboxFailed(timestamp(), task.id, failedAgent, newAgent),
    ``,
    `${L.inboxTaskLabel} ${task.title}`,
    `${L.inboxReasonLabel} ${reason}`,
    `${L.inboxNewAgentLabel} ${newAgent}`,
    L.inboxFailAction,
    ``,
  ].join("\n");
  try {
    fs.appendFileSync(INBOX_FILE, entry, "utf-8");
  } catch {}
}

// Escribe una notificación concisa en NOTIFY.md para la sesión interactiva de Claude.
// Los hooks de .claude/settings.json leen y limpian este archivo automáticamente.
function writeNotifyFile(message) {
  try {
    const sep = fs.existsSync(NOTIFY_FILE) ? '\n---\n' : '';
    fs.appendFileSync(NOTIFY_FILE, sep + message + '\n', 'utf-8');
  } catch {}
}

// GAP 2 — Move a task line from ## Pending to ## In Progress when it starts
function moveTaskToInProgress(task) {
  if (!fs.existsSync(QUEUE_FILE)) return;
  try {
    const lines = fs.readFileSync(QUEUE_FILE, "utf-8").split("\n");
    const idMatcher = new RegExp(
      `^${task.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$|\\|)`,
    );
    // Remove from Pending (wherever it is) — keep line for insertion
    let taskLine = null;
    const without = lines.filter((l) => {
      if (idMatcher.test(l.trim())) {
        taskLine = l;
        return false;
      }
      return true;
    });
    if (!taskLine) return; // already moved or not found
    // Find In Progress section and insert after its header
    const idx = without.findIndex(
      (l) =>
        l.trim().startsWith("## In Progress") ||
        l.trim().startsWith("## En progreso"),
    );
    if (idx >= 0) without.splice(idx + 1, 0, taskLine);
    fs.writeFileSync(QUEUE_FILE, without.join("\n"), "utf-8");
  } catch {}
}

// ============================================================================
// BRIEF GENERATOR
// ============================================================================
function generateBrief(task) {
  const agentCfg = AGENTS[task.agent];
  const briefFile = path.join(WORKSPACE, "briefs", `${task.id}-BRIEF.md`);
  let existingBrief = "";
  if (fs.existsSync(briefFile))
    existingBrief = fs.readFileSync(briefFile, "utf-8");

  let agentInstructions = "";
  if (agentCfg.instructionsFile) {
    const instrFile = path.join(WORKSPACE, agentCfg.instructionsFile);
    if (fs.existsSync(instrFile))
      agentInstructions = fs.readFileSync(instrFile, "utf-8");
  }

  let protocolRules = "";
  const protocolFile = path.join(WORKSPACE, "AGENT-PROTOCOL.md");
  if (fs.existsSync(protocolFile)) {
    const content = fs.readFileSync(protocolFile, "utf-8");
    const match = content.match(
      /## \d+\.\s*(?:Rules|Reglas)[\s\S]*?(?=\n## \d|$)/i,
    );
    if (match) protocolRules = match[0];
  }

  let taskEntry = "";
  const tasksFile = path.join(WORKSPACE, "TASKS.md");
  if (fs.existsSync(tasksFile)) {
    const content = fs.readFileSync(tasksFile, "utf-8");
    const taskMatch = content.match(
      new RegExp(`### ${task.id}[\\s\\S]*?(?=\\n### TASK-|\\n---\\n|$)`),
    );
    if (taskMatch) taskEntry = taskMatch[0];
  }

  // Project plan — if `<projectName>-plan.md` or `PLAN.md` exists in the workspace,
  // inject it as shared context so every agent sees the big-picture plan.
  let projectPlan = "";
  const planCandidates = [
    path.join(
      WORKSPACE,
      `${PROJECT_NAME.toLowerCase().replace(/\s+/g, "-")}-plan.md`,
    ),
    path.join(WORKSPACE, "PLAN.md"),
    path.join(WORKSPACE, "plan.md"),
  ];
  for (const p of planCandidates) {
    if (fs.existsSync(p)) {
      projectPlan = fs.readFileSync(p, "utf-8");
      break;
    }
  }

  const hasBackend = REPOS.backend && fs.existsSync(REPOS.backend);
  const hasFrontend = REPOS.frontend && fs.existsSync(REPOS.frontend);
  const isSingleRepo = (hasBackend && hasFrontend && 
    path.resolve(REPOS.backend) === path.resolve(REPOS.frontend)) || 
    (!hasBackend && hasFrontend) || (hasBackend && !hasFrontend);
  const effectiveRepo = isSingleRepo ? "frontend" : (task.repo || agentCfg.defaultRepo);
  const repoDir = REPOS[effectiveRepo] || REPOS[task.repo] || REPOS[agentCfg.defaultRepo] || ".";
  const progressFile = path.join(
    WORKSPACE,
    "progress",
    `PROGRESS-${task.agent}.md`,
  );

  return `
# Agent: ${task.agent}
# Task: ${task.id} — ${task.title}
# Repository: ${effectiveRepo}
# CWD: ${repoDir}
# Priority: ${task.priority}
# Workspace: ${WORKSPACE}
# Progress file: ${progressFile}

${projectPlan ? `## Project Plan (big picture — use as context, don't try to do everything)\n${projectPlan}\n` : ""}
${agentInstructions ? `## Agent Instructions\n${agentInstructions}` : ""}
${protocolRules ? `## Protocol Rules\n${protocolRules}` : ""}

## Task Description
${task.title}
${task.description}

${taskEntry ? `## Full Task Spec\n${taskEntry}` : ""}
${existingBrief ? `## Detailed Brief\n${existingBrief}` : ""}

## Rules
1. NEVER run git commit or git push. Source control is handled manually by the user outside this task.
2. Focus ONLY on this task
3. Update your progress file at ${progressFile} when done

## Completion Report (MANDATORY)
Your LAST message MUST include:
\`\`\`
TASK_REPORT
status: completed | failed | blocked
files_modified: list or "none"
files_created: list or "none"
files_deleted: list or "none"
summary: 1-3 sentences
issues: problems or "none"
TASK_REPORT_END
\`\`\`
`.trim();
}

// ============================================================================
// CLI BUILDERS — maps agent CLI type to spawn command + args
// ============================================================================
function buildCliCommand(agentCfg, task, prompt) {
  const cli = agentCfg.cli;

  // Custom command override — for agents with non-standard CLIs
  if (agentCfg.command) {
    const parts = agentCfg.command.split(" ");
    return { cmd: parts[0], args: parts.slice(1) };
  }

  switch (cli) {
    case "claude":
      return {
        cmd: "claude",
        args: [
          "-p",
          "--output-format",
          "stream-json",
          "--verbose",
          ...PERMISSION_FLAGS,
          ...(agentCfg.model ? ["--model", agentCfg.model] : []),
          "--add-dir",
          WORKSPACE,
          "--name",
          `${task.agent}-${task.id}`,
        ],
      };
    case "codex":
      return {
        cmd: "codex",
        args: ["exec", "--yolo", "--add-dir", WORKSPACE, "-"],
      };
    case "opencode":
      return {
        cmd: "opencode",
        args: [
          "run",
          "--format",
          "json",
          "--pure",
          "--dangerously-skip-permissions",
        ],
      };
    case "gemini":
      return {
        cmd: "gemini",
        args: [
          ...(agentCfg.model ? ["--model", agentCfg.model] : []),
          ...(CLI.yolo ? ["--approval-mode=yolo"] : []),
          "--include-directories",
          WORKSPACE,
          "--output-format",
          "stream-json",
          "-p",
          "execute",
        ],
      };
    case "cursor":
      return {
        cmd: "agent",
        args: [
          ...(agentCfg.model ? ["--model", agentCfg.model] : []),
          ...(CLI.yolo ? ["--yolo"] : []),
        ],
      };
    case "abacusai": {
      const promptFile = path.join(LOG_DIR, `abacus-prompt-${task.id}.txt`);
      fs.writeFileSync(promptFile, prompt, "utf-8");
      const isWin = process.platform === "win32";
      if (isWin) {
        return {
          cmd: "cmd",
          args: [
            "/c",
            `type "${promptFile}" | abacusai -p --output-format stream-json --permission-mode yolo --dangerously-skip-permissions --auto-accept-edits --add-dir "${WORKSPACE}"`,
          ],
        };
      }
      return {
        cmd: "sh",
        args: [
          "-c",
          `cat "${promptFile}" | abacusai -p --output-format stream-json --permission-mode yolo --dangerously-skip-permissions --auto-accept-edits --add-dir "${WORKSPACE}"`,
        ],
      };
    }
    default:
      // Generic: assume CLI accepts prompt via stdin
      return { cmd: cli, args: agentCfg.args || [] };
  }
}

// ============================================================================
// AGENT LAUNCHER
// ============================================================================
function launchAgent(task) {
  const agentName = task.agent;
  const ag = state.agents[agentName];
  const agentCfg = AGENTS[agentName];

  if (!ag || !agentCfg) {
    log("ERROR", L.logUnknownAgent(task.id, agentName));
    failedTasks.set(task.id, MAX_RETRIES); // don't retry — config bug, not transient
    return false;
  }

  const repoDir = REPOS[task.repo] || REPOS[agentCfg.defaultRepo];

  if (!repoDir || !fs.existsSync(repoDir)) {
    log("ERROR", `Repo not found: ${task.repo || agentCfg.defaultRepo}`);
    return false;
  }

  const prompt = generateBrief(task);
  const logFile = path.join(
    LOG_DIR,
    `${task.id}-${agentName}-${Date.now()}.log`,
  );
  const { cmd: cliCmd, args } = buildCliCommand(agentCfg, task, prompt);

  log("START", `${agentName} (${cliCmd}) → ${task.id}: ${task.title}`);
  appendToAgent(
    agentName,
    `{cyan-fg}${escBl(L.agentTaskHeader(task.id, task.title))}{/cyan-fg}`,
    true,
  );
  appendToAgent(agentName, `{gray-fg}${escBl(L.agentCwd(repoDir))}{/gray-fg}`, true);
  appendToAgent(agentName, "", true);

  try {
    const proc = spawn(cliCmd, args, {
      cwd: repoDir,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      env: { ...process.env },
    });

    proc.stdin.write(prompt);
    proc.stdin.end();

    const timeout = setTimeout(() => {
      log("WARN", L.logTimeout(agentName, task.id));
      appendToAgent(agentName, `{red-fg}${escBl(L.agentTimeout)}{/red-fg}`, true);
      try {
        proc.kill("SIGTERM");
      } catch {}
    }, TASK_TIMEOUT_MS);

    const logStream = fs.createWriteStream(logFile, { flags: "a" });
    let lineBuffer = "";

    proc.stdout.on("data", (data) => {
      const text = data.toString();
      logStream.write(text);
      lineBuffer += text;
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          // Claude / AbacusAI stream-json events
          if (event.type === "assistant" && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === "text" && block.text) {
                const txt = block.text.trim();
                if (txt) {
                  for (const l of txt.split("\n").slice(-3))
                    appendToAgent(agentName, l.slice(0, 120));
                  ag.lastLine = txt.split("\n").pop().slice(0, 80);
                }
              }
              if (block.type === "tool_use") {
                const detail =
                  block.input?.command ||
                  block.input?.file_path ||
                  block.input?.pattern ||
                  "";
                appendToAgent(
                  agentName,
                  `{yellow-fg}[${escBl(block.name)}]{/yellow-fg} ${escBl(detail.toString().slice(0, 80))}`,
                  true,
                );
                ag.lastLine = `[${block.name}] ${detail.toString().slice(0, 60)}`;
              }
            }
          }
          // Claude: result event with total_cost_usd
          if (event.type === "result" && event.total_cost_usd)
            ag.cost = event.total_cost_usd;
          // Codex: direct cost_usd field (any event)
          if (event.cost_usd != null && ag.cost == null)
            ag.cost = event.cost_usd;
          if (event.usage?.cost_usd != null && ag.cost == null)
            ag.cost = event.usage.cost_usd;
          // Codex: token-based cost calculation from usage event
          if (ag.cost == null && event.usage &&
              (event.type === "usage" || event.type === "result" || event.type === "response.completed")) {
            const usageObj = event.usage.usage || event.usage;
            const model = agentCfg.model || "";
            const calc = calcOpenAICost(model, usageObj);
            if (calc != null) ag.cost = calc;
          }
          // OpenCode events
          if (event.type === "text" && event.part?.text)
            appendToAgent(agentName, event.part.text.slice(0, 120));
          if (event.type === "tool_use" && event.part?.tool)
            appendToAgent(
              agentName,
              `{yellow-fg}[${escBl(event.part.tool)}]{/yellow-fg}`,
              true,
            );
        } catch {
          const trimmed = line.trim();
          if (trimmed.length > 2) {
            appendToAgent(agentName, trimmed.slice(0, 120));
            ag.lastLine = trimmed.slice(0, 80);
          }
        }
      }
      renderDashboard();
    });

    proc.stderr.on("data", (data) => {
      logStream.write(`[STDERR] ${data}`);
      const errText = data.toString().trim();
      if (errText)
        appendToAgent(
          agentName,
          `{red-fg}${escBl(errText.slice(0, 100))}{/red-fg}`,
          true,
        );
    });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      logStream.end();
      ag.exitCode = code;
      code === 0
        ? completeTask(task, agentName)
        : failTask(task, agentName, code);
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      logStream.end();
      log("ERROR", `${agentName}: ${err.message}`);
      appendToAgent(
        agentName,
        `{red-fg}ERROR: ${escBl(err.message)}{/red-fg}`,
        true,
      );
      state.inProgress = state.inProgress.filter((t) => t.id !== task.id);
      ag.status = "idle";
      ag.task = null;
      ag.process = null;
      ag.startTime = null;
      setTimeout(() => {
        scheduleNext();
        renderDashboard();
      }, 3000);
    });

    ag.status = "busy";
    ag.task = task;
    ag.process = proc;
    ag.startTime = Date.now();
    ag.logFile = logFile;
    ag.cost = null;
    ag.turns = 0;
    task.status = "running";
    state.inProgress.push(task);
    moveTaskToInProgress(task); // GAP 2: reflect in QUEUE.md
    renderDashboard();
    return true;
  } catch (err) {
    log("ERROR", `Failed to launch ${agentName}: ${err.message}`);
    return false;
  }
}

// ============================================================================
// TASK LIFECYCLE
// ============================================================================
const MAX_RETRIES = 2;
const MAX_RETRIES_RATE_LIMIT = 10;
const failedTasks = new Map();
const rateLimitedAgents = new Map();

function completeTask(task, agentName) {
  const ag = state.agents[agentName];
  const elapsed = ag.startTime
    ? Math.round((Date.now() - ag.startTime) / 1000)
    : 0;
  if (ag.cost) {
    state.totalCost += ag.cost;
    ag.totalCost = (ag.totalCost || 0) + ag.cost;
  }
  task.status = "completed";
  task.completedAt = timestamp();
  task.elapsed = elapsed;
  task.cost = ag.cost;
  state.inProgress = state.inProgress.filter((t) => t.id !== task.id);
  state.completed.push(task);
  const costStr = ag.cost ? ` ($${ag.cost.toFixed(2)})` : "";
  log("DONE", L.logDone(agentName, task.id, formatDuration(elapsed), costStr));
  appendToAgent(agentName, "", true);
  appendToAgent(
    agentName,
    `{green-fg}${escBl(L.agentCompleted(formatDuration(elapsed), costStr))}{/green-fg}`,
    true,
  );
  ag.status = "idle";
  ag.task = null;
  ag.process = null;
  ag.startTime = null;
  ag.lastLine = L.lastCompleted(task.id);
  updateQueueFile(task);
  writeInboxNotification(task, agentName, elapsed);
  writeNotifyFile(L.notifyComplete(timestamp(), task.id, agentName, formatDuration(elapsed)));
  scheduleNext();
  renderDashboard();
}

function detectRateLimit(agentName) {
  const ag = state.agents[agentName];
  let content = ag.output || ag.lastLine || "";
  if (ag.logFile && fs.existsSync(ag.logFile)) {
    try {
      const stat = fs.statSync(ag.logFile);
      const buf = Buffer.alloc(Math.min(5000, stat.size));
      const fd = fs.openSync(ag.logFile, "r");
      fs.readSync(fd, buf, 0, buf.length, Math.max(0, stat.size - buf.length));
      fs.closeSync(fd);
      content += buf.toString("utf-8");
    } catch {}
  }
  const isRateLimit =
    content.includes("rate_limit") ||
    content.includes("429") ||
    content.includes("out of extra usage") ||
    content.includes("resets") ||
    content.includes("RESOURCE_EXHAUSTED") ||
    content.includes("rateLimitExceeded");
  if (!isRateLimit) return { isRateLimit: false, resetsAt: null };
  let resetsAt = null;
  const tsMatch = content.match(/"resetsAt"\s*:\s*(\d{10,13})/);
  if (tsMatch) {
    let ts = parseInt(tsMatch[1], 10);
    if (ts < 1e12) ts *= 1000;
    resetsAt = new Date(ts);
  }
  if (!resetsAt) {
    const timeMatch = content.match(
      /resets\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
    );
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const mins = parseInt(timeMatch[2] || "0", 10);
      const ampm = (timeMatch[3] || "").toLowerCase();
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
      resetsAt = new Date();
      resetsAt.setHours(hours, mins, 0, 0);
      if (resetsAt.getTime() <= Date.now())
        resetsAt.setDate(resetsAt.getDate() + 1);
    }
  }
  return { isRateLimit: true, resetsAt };
}

function failTask(task, agentName, code) {
  const ag = state.agents[agentName];
  const retries = (failedTasks.get(task.id) || 0) + 1;
  failedTasks.set(task.id, retries);
  const rl = detectRateLimit(agentName);
  const failureFlags = detectSupportAgentFailure(agentName);
  const maxRetries = rl.isRateLimit ? MAX_RETRIES_RATE_LIMIT : MAX_RETRIES;
  if (rl.isRateLimit) {
    const resetStr = rl.resetsAt
      ? `resets ${rl.resetsAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`
      : "retry in 10 min";
    log("RATE", L.logRateLimit(agentName, task.id, resetStr));
    appendToAgent(
      agentName,
      `{yellow-fg}${escBl(L.agentRateLimit(resetStr))}{/yellow-fg}`,
      true,
    );
  } else {
    log("FAIL", L.logFail(agentName, task.id, code, retries, maxRetries));
    appendToAgent(
      agentName,
      `{red-fg}${escBl(L.agentFailed(code, retries))}{/red-fg}`,
      true,
    );
  }
  state.inProgress = state.inProgress.filter((t) => t.id !== task.id);
  ag.status = "idle";
  ag.task = null;
  ag.process = null;
  ag.startTime = null;

  const shouldFallback =
    ["Codex", "OpenCode"].includes(agentName) &&
    (failureFlags.exhaustedQuota ||
      failureFlags.providerUnavailable ||
      failureFlags.noRealWork ||
      retries >= maxRetries);

  if (shouldFallback) {
    const reason = failureFlags.exhaustedQuota
      ? L.reasonQuota
      : failureFlags.providerUnavailable
        ? L.reasonProvider
        : failureFlags.noRealWork
          ? L.reasonNoWork
          : L.reasonPersistent;
    if (tryFallbackToAlternative(task, agentName, reason)) {
      writeInboxFailureNotification(task, agentName, task.agent, reason);
      writeNotifyFile(L.notifyFailed(timestamp(), task.id, agentName, task.agent, reason));
      setTimeout(() => {
        scheduleNext();
        safeRenderDashboard();
      }, 3000);
      return;
    }
  }

  if (retries >= maxRetries) {
    task.status = "failed";
    ag.lastLine = L.lastFailed(task.id);
    log("ERROR", L.logPermanentFail(task.id, retries));
    writeNotifyFile(L.notifyPermanentFail(timestamp(), task.id, agentName));
  } else {
    task.status = "pending";
    let retryDelay = rl.isRateLimit
      ? rl.resetsAt
        ? Math.max(60_000, rl.resetsAt.getTime() - Date.now() + 60_000)
        : 600_000
      : 15_000;
    task._retryAfter = Date.now() + retryDelay;
    state.queue.push(task);
    const retryTime = new Date(task._retryAfter).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    ag.lastLine = rl.isRateLimit
      ? L.lastLimit(task.id, retryTime)
      : L.lastRetry(task.id);
    if (rl.isRateLimit) rateLimitedAgents.set(agentName, task._retryAfter);
  }
  if (rl.isRateLimit && task._retryAfter) {
    setTimeout(
      () => {
        scheduleNext();
        safeRenderDashboard();
      },
      Math.max(
        Math.min(task._retryAfter - Date.now() + 5000, 3600_000),
        60_000,
      ),
    );
  } else {
    setTimeout(() => {
      scheduleNext();
      safeRenderDashboard();
    }, 3000);
  }
}

// ============================================================================
// SCHEDULER
// ============================================================================
function scheduleNext() {
  if (state.paused) return;
  if (CLI.maxBudget > 0 && state.totalCost >= CLI.maxBudget) return;
  const busyCount = Object.values(state.agents).filter(
    (a) => a.status === "busy",
  ).length;
  if (busyCount >= MAX_CONCURRENT) return;
  reloadQueue();
  const completedIds = new Set(state.completed.map((t) => t.id));
  for (const task of [...state.queue]) {
    if (
      Object.values(state.agents).filter((a) => a.status === "busy").length >=
      MAX_CONCURRENT
    )
      break;
    const ag = state.agents[task.agent];
    if (!ag || ag.status !== "idle") continue;
    if (task.dependsOn && !completedIds.has(task.dependsOn)) continue;
    if (task._retryAfter && Date.now() < task._retryAfter) continue;
    if (task.status === "failed") continue;
    if (launchAgent(task))
      state.queue = state.queue.filter((t) => t.id !== task.id);
  }
}

// ============================================================================
// QUEUE FILE UPDATER
// ============================================================================
function updateQueueFile(completedTask) {
  if (!fs.existsSync(QUEUE_FILE)) return;
  const lines = fs.readFileSync(QUEUE_FILE, "utf-8").split("\n");
  // Word-boundary match so TASK-1 does NOT also remove TASK-10, TASK-11, etc.
  const idMatcher = new RegExp(
    `^${completedTask.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$|\\|)`,
  );
  // Remove task from both Pending and In Progress sections
  const filtered = lines.filter((l) => !idMatcher.test(l.trim()));
  // Find Completed section and insert entry
  const idx = filtered.findIndex(
    (l) =>
      l.trim().startsWith("## Completed") ||
      l.trim().startsWith("## Completadas"),
  );
  if (idx >= 0)
    filtered.splice(
      idx + 1,
      0,
      `${completedTask.id} | ${completedTask.title} | ${completedTask.agent} | ${completedTask.completedAt}`,
    );
  fs.writeFileSync(QUEUE_FILE, filtered.join("\n"), "utf-8");
}

function updateQueueTaskAgent(taskId, newAgent) {
  if (!fs.existsSync(QUEUE_FILE)) return false;
  const lines = fs.readFileSync(QUEUE_FILE, "utf-8").split("\n");
  let updated = false;

  const rewritten = lines.map((line) => {
    const trimmed = line.trim();
    if (updated || !trimmed.startsWith(`${taskId} |`)) return line;
    const parts = line.split("|");
    if (parts.length < 5) return line;
    parts[2] = ` ${newAgent} `;
    updated = true;
    return parts.join("|");
  });

  if (updated) fs.writeFileSync(QUEUE_FILE, rewritten.join("\n"), "utf-8");
  return updated;
}

function detectSupportAgentFailure(agentName) {
  const ag = state.agents[agentName];
  let content = ag.output || ag.lastLine || "";
  if (ag.logFile && fs.existsSync(ag.logFile)) {
    try {
      const stat = fs.statSync(ag.logFile);
      const buf = Buffer.alloc(Math.min(8000, stat.size));
      const fd = fs.openSync(ag.logFile, "r");
      fs.readSync(fd, buf, 0, buf.length, Math.max(0, stat.size - buf.length));
      fs.closeSync(fd);
      content += buf.toString("utf-8");
    } catch {}
  }

  const lower = content.toLowerCase();

  const hasToolUses = content.includes("Write") || content.includes("Read") || 
    content.includes("Bash") || content.includes("Edit") || content.includes("ToolUse");
  const hasFilesModified = content.includes("files_modified") && 
    !content.includes("files_modified: list") && !content.includes("files_modified: none");
  const outputTooShort = ag.output && ag.output.length < 200;
  const noRealWork = outputTooShort && !hasToolUses && !hasFilesModified;

  return {
    exhaustedQuota:
      lower.includes("out of extra usage") ||
      lower.includes("resource_exhausted") ||
      lower.includes("quota") ||
      lower.includes("rate_limit") ||
      lower.includes("ratelimitexceeded") ||
      lower.includes("429") ||
      lower.includes("insufficient credits") ||
      lower.includes("no credits"),
    providerUnavailable:
      lower.includes("session expired") ||
      lower.includes("authentication") ||
      lower.includes("unauthorized") ||
      lower.includes("forbidden") ||
      lower.includes("service unavailable") ||
      lower.includes("internal server error") ||
      lower.includes("connection reset") ||
      lower.includes("econnreset") ||
      lower.includes("timed out") ||
      lower.includes("timeout") ||
      lower.includes("network error"),
    noRealWork: noRealWork || lower.includes("no files") || lower.includes("nothing to"),
  };
}

function getClaudeFallbackAgent(task) {
  const hasBackend = REPOS.backend && fs.existsSync(REPOS.backend);
  const hasFrontend = REPOS.frontend && fs.existsSync(REPOS.frontend);
  const isSameRepo = hasBackend && hasFrontend && 
    path.resolve(REPOS.backend) === path.resolve(REPOS.frontend);

  if (isSameRepo || !hasFrontend) {
    if (AGENTS["Frontend"]?.cli === "claude") return "Frontend";
    if (AGENTS["Backend"]?.cli === "claude") return "Backend";
  }
  if (!hasBackend && hasFrontend) {
    if (AGENTS["Frontend"]?.cli === "claude") return "Frontend";
  }
  
  const preferred = task.repo === "frontend" ? "Frontend" : "Backend";
  if (AGENTS[preferred]?.cli === "claude") return preferred;
  return (
    Object.keys(AGENTS).find((name) => AGENTS[name]?.cli === "claude") || null
  );
}

function getAlternativeSupportAgent(failedAgentName) {
  if (failedAgentName === "Codex") return "OpenCode";
  if (failedAgentName === "OpenCode") return "Codex";
  return null;
}

function tryFallbackToAlternative(task, failedAgentName, reason) {
  if (!["Codex", "OpenCode"].includes(failedAgentName)) return false;

  // Step 1: try sibling support agent (Codex → OpenCode, OpenCode → Codex)
  const siblingAgent = getAlternativeSupportAgent(failedAgentName);
  const siblingAvailable =
    siblingAgent &&
    AGENTS[siblingAgent] &&
    state.agents[siblingAgent]?.status === "idle" &&
    !rateLimitedAgents.has(siblingAgent);

  // Step 2: if sibling is also unavailable, fall back to Claude worker (prefer Frontend)
  const targetAgent = siblingAvailable
    ? siblingAgent
    : getClaudeFallbackAgent(task);
  if (!targetAgent || targetAgent === failedAgentName) return false;

  const queueUpdated = updateQueueTaskAgent(task.id, targetAgent);
  task.agent = targetAgent;
  task.status = "pending";
  task._retryAfter = Date.now() + 3000;
  failedTasks.set(task.id, 0);
  state.queue.push(task);

  log("FALLBACK", L.logFallback(task.id, failedAgentName, targetAgent, reason));
  appendToAgent(
    failedAgentName,
    `{yellow-fg}${escBl(L.agentReassigned(targetAgent, reason))}{/yellow-fg}`,
    true,
  );
  if (!queueUpdated) {
    log("WARN", L.logReassignWarn(task.id, targetAgent));
  }

  // Notificar a Claude (sesión principal) cuando hay fallback
  notifyClaudeOfFallback(task, failedAgentName, targetAgent, reason);
  return true;
}

// ============================================================================
// CLAUDE FALLBACK NOTIFIER — avisa a Claude principal cuando hay reasignación
// ============================================================================
function notifyClaudeOfFallback(task, fromAgent, toAgent, reason) {
  const lang = WORKSPACE_LANGUAGE;
  const prompt = lang === 'es'
    ? `⚠️ FALLBACK: La tarea "${task.id}: ${task.title}" falló en ${fromAgent} (${reason}) y fue reasignada a ${toAgent}.

Estado actual:
- QUEUE.md tiene ahora la tarea asignada a ${toAgent}
- El agente ${toAgent} está procediendo automáticamente

 Acción: No necesitas hacer nada — solo toma nota del cambio. El orquestador将继续 automáticamente.
Si quieres revisar el progreso, lee INBOX.md o STATUS.md.`
    : `⚠️ FALLBACK: Task "${task.id}: ${task.title}" failed on ${fromAgent} (${reason}) and was reassigned to ${toAgent}.

Current state:
- QUEUE.md now has the task assigned to ${toAgent}
- Agent ${toAgent} is proceeding automatically

Action: You don't need to do anything — just take note of the change. The orchestrator will continue automatically.
If you want to check progress, read INBOX.md or STATUS.md.`;

  const logPath = path.join(LOG_DIR, `fallback-notify-${Date.now()}.log`);
  try {
    const logFd = fs.openSync(logPath, 'a');
    const child = spawn('claude', ['-p', prompt, '--add-dir', WORKSPACE, '--dangerously-skip-permissions'], {
      cwd: WORKSPACE, stdio: ['ignore', logFd, logFd], shell: true, windowsHide: true, detached: true
    });
    fs.closeSync(logFd);
    child.unref();
  } catch {}
}

// ============================================================================
// KEYBOARD
// ============================================================================
if (!CLI.headless && screen) {
  screen.key(["q", "C-c"], () => {
    exitWithSummary();
  });

  screen.key("p", () => {
    state.paused = !state.paused;
    log("INFO", state.paused ? L.paused : L.resumed);
    safeRenderDashboard();
    updateStatusFile();
  });
}

// ============================================================================
// MAIN
// ============================================================================
log("INFO", L.starting(PROJECT_NAME));
state.completed = parseCompletedFromFile();
log("INFO", L.loadedCompleted(state.completed.length));
reloadQueue();
log("INFO", `${L.queue}: ${state.queue.length} ${L.tasks}`);
renderDashboard();
updateStatusFile();
if (!state.paused) {
  scheduleNext();
  renderDashboard();
}

setInterval(() => {
  const command = consumeControlCommand();
  if (command) applyControlCommand(command);
}, 1000);

// Real-time queue detection — watches WORKSPACE directory (not the file directly)
// because on Windows fs.watch on a file is unreliable; watching the parent dir
// and filtering by filename is the stable pattern (same as AWAY MODE watcher).
let _queueWatchDebounce = null;
function startQueueWatcher() {
  try {
    const watchName = path.basename(QUEUE_FILE);
    const watcher = fs.watch(WORKSPACE, {persistent: false}, (eventType, filename) => {
      if (filename !== watchName) return;
      if (_queueWatchDebounce) clearTimeout(_queueWatchDebounce);
      _queueWatchDebounce = setTimeout(() => {
        if (!fs.existsSync(QUEUE_FILE)) return;
        const prevCount = state.queue.length;
        reloadQueue();
        if (!state.paused) scheduleNext();
        renderDashboard();
        if (state.queue.length > prevCount)
          log("INFO", WORKSPACE_LANGUAGE === "es"
            ? `Nueva tarea detectada en QUEUE.md`
            : `New task detected in QUEUE.md`);
      }, 50);
    });
    watcher.on('error', () => {});
  } catch {}
}
startQueueWatcher();

// Slow fallback (5 min) — only runs if there is actually pending work or busy agents
// fs.watch handles real-time; this is just a safety net
setInterval(() => {
  const busy = Object.values(state.agents).some(a => a.status === 'busy');
  if (state.paused || (state.queue.length === 0 && !busy)) return;
  reloadQueue();
  scheduleNext();
  renderDashboard();
}, 5 * 60 * 1000);

// ============================================================================
// INBOX WATCHER — reacts immediately when a task completion is written to INBOX.md
// Spawns headless Claude to check if a new implementation task needs to be created
// ============================================================================
let _inboxDebounce = null;
let _lastInboxContent = '';
let _inboxDispatching = false;

function dispatchInboxClaude() {
  if (_inboxDispatching) return;
  let content = '';
  try { content = fs.existsSync(INBOX_FILE) ? fs.readFileSync(INBOX_FILE, 'utf-8') : ''; } catch {}
  if (!content.trim() || content === _lastInboxContent) return;

  _lastInboxContent = content;
  _inboxDispatching = true;

  const lang = WORKSPACE_LANGUAGE;
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

  const logPath = path.join(LOG_DIR, `inbox-trigger-${Date.now()}.log`);
  try {
    const logFd = fs.openSync(logPath, 'a');
    const child = spawn('claude', [
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
    child.unref();
    log('INFO', lang === 'es'
      ? 'INBOX: Claude despachado para procesar notificación'
      : 'INBOX: Claude dispatched to process notification');
  } catch {}
  setTimeout(() => { _inboxDispatching = false; }, 3 * 60 * 1000);
}

function startInboxWatcher() {
  if (!fs.existsSync(INBOX_FILE)) {
    try { fs.writeFileSync(INBOX_FILE, '', 'utf-8'); } catch {}
  }
  try {
    const watchName = path.basename(INBOX_FILE);
    const watcher = fs.watch(WORKSPACE, {persistent: false}, (eventType, filename) => {
      if (filename !== watchName) return;
      if (_inboxDebounce) clearTimeout(_inboxDebounce);
      _inboxDebounce = setTimeout(dispatchInboxClaude, 100);
    });
    watcher.on('error', () => {});
  } catch {}
}
startInboxWatcher();

// ============================================================================
// AWAY MODE WATCHER — monitors .away-mode file; when active runs periodic
// health checks via headless Claude; auto-deactivates when all tasks are done
// ============================================================================
let _awayModeTimer = null;
let _awayModeActive = false;

function runAwayModeCheck() {
  if (!fs.existsSync(AWAY_MODE_FILE)) {
    deactivateAwayMode();
    return;
  }

  const lang = WORKSPACE_LANGUAGE;
  const pendingTasks = state.queue.filter(t => !t.status || t.status === 'pending');
  const inProgressTasks = state.inProgress || [];
  const busy = Object.values(state.agents).some(a => a.status === 'busy');
  const completedCount = (state.completed || []).length;
  const hasWork = pendingTasks.length > 0 || inProgressTasks.length > 0 || busy;

  if (!hasWork && completedCount > 0) {
    try { fs.unlinkSync(AWAY_MODE_FILE); } catch {}
    deactivateAwayMode();

    const donePrompt = lang === 'es'
      ? `Modo Ausencia terminado. Todas las tareas se completaron mientras estabas ausente.\n\nLee QUEUE.md en ${WORKSPACE} y dame un resumen de todo lo que se logró durante la sesión.\nLuego dime si hay algo que podamos continuar o integrar a partir de lo que ya se hizo, o pregúntame qué quiero priorizar a continuación.`
      : `Away Mode ended. All tasks were completed while you were away.\n\nRead QUEUE.md in ${WORKSPACE} and give me a summary of everything accomplished during the session.\nThen tell me if there is anything we can continue or integrate from what was done, or ask me what I want to prioritize next.`;

    const logPath = path.join(LOG_DIR, `away-done-${Date.now()}.log`);
    try {
      const logFd = fs.openSync(logPath, 'a');
      const child = spawn('claude', ['-p', donePrompt, '--add-dir', WORKSPACE, '--dangerously-skip-permissions'], {
        cwd: WORKSPACE, stdio: ['ignore', logFd, logFd], shell: true, windowsHide: true, detached: true
      });
      fs.closeSync(logFd);
      child.unref();
      log('INFO', lang === 'es' ? 'Modo Ausencia: todo completado — resumen final enviado.' : 'Away Mode: all done — final summary dispatched.');
    } catch {}
    return;
  }

  if (!hasWork) return;

  const lines = [];
  if (pendingTasks.length > 0) {
    lines.push(lang === 'es' ? `Tareas pendientes: ${pendingTasks.length}` : `Pending tasks: ${pendingTasks.length}`);
    pendingTasks.slice(0, 5).forEach(t => lines.push(`  - ${t.id}: ${t.title}`));
  }
  if (inProgressTasks.length > 0) {
    lines.push(lang === 'es'
      ? `En progreso: ${inProgressTasks.map(t => `${t.id} (${t.agent})`).join(', ')}`
      : `In progress: ${inProgressTasks.map(t => `${t.id} (${t.agent})`).join(', ')}`);
  }
  const failedAgents = Object.entries(state.agents)
    .filter(([, a]) => /^(FALLÓ|FAILED):/.test(a.lastLine || ''))
    .map(([n, a]) => `${n}: ${a.lastLine}`);
  if (failedAgents.length > 0) {
    lines.push(lang === 'es' ? `Agentes con fallo: ${failedAgents.join(' | ')}` : `Failed agents: ${failedAgents.join(' | ')}`);
  }
  if (completedCount > 0) {
    lines.push(lang === 'es' ? `Completadas: ${completedCount}` : `Completed: ${completedCount}`);
  }

  const stateCtx = lines.join('\n');
const monitorPrompt = lang === 'es'
    ? `Modo Ausencia activo — revisión automática cada 5 minutos.\n\nEstado del orquestador:\n${stateCtx}\n\nInstrucciones:\n1. Lee INBOX.md — si hay análisis completados sin tarea de implementación en QUEUE.md, créala\n2. Lee QUEUE.md — si hay tareas fallidas no reasignadas, reasígnalas al siguiente agente\n3. Si hay tareas pendientes sin asignar a ningún agente (agent = >0 o vacío), asígnalas a un agente idle (Codex u OpenCode)\n4. Si hay agentes idle y tareas pendientes sin procesar, revisa bloqueos y resuélvelos\n5. Si todo avanza, no hagas nada y responde brevemente "TodoOK"\n\nNo hagas commit ni push. No inventes tareas nuevas.`
    : `Away Mode active — automatic check every 5 minutes.\n\nOrchestrator state:\n${stateCtx}\n\nInstructions:\n1. Read INBOX.md — if there are completed analyses without implementation tasks in QUEUE.md, create them\n2. Read QUEUE.md — if there are failed tasks not reassigned, reassign to next available agent\n3. If there are pending tasks with no agent assigned (agent = >0 or empty), assign them to an idle agent (Codex or OpenCode)\n4. If there are idle agents and pending tasks not being processed, check for blocking issues\n5. If everything is progressing, do nothing and respond briefly "AllGood"\n\nDo not commit or push. Do not invent new tasks.`;

  const logPath = path.join(LOG_DIR, `away-check-${Date.now()}.log`);
  try {
    const logFd = fs.openSync(logPath, 'a');
    const child = spawn('claude', ['-p', monitorPrompt, '--add-dir', WORKSPACE, '--dangerously-skip-permissions'], {
      cwd: WORKSPACE, stdio: ['ignore', logFd, logFd], shell: true, windowsHide: true, detached: true
    });
    fs.closeSync(logFd);
    child.unref();
    log('INFO', lang === 'es' ? 'Modo Ausencia: revisión automática disparada.' : 'Away Mode: automatic check dispatched.');
  } catch {}
}

function activateAwayMode() {
  if (_awayModeActive) return;
  _awayModeActive = true;
  log('INFO', WORKSPACE_LANGUAGE === 'es' ? 'Modo Ausencia activado.' : 'Away Mode activated.');
  runAwayModeCheck();
  _awayModeTimer = setInterval(runAwayModeCheck, 5 * 60 * 1000); // 5 minutos
}

function deactivateAwayMode() {
  if (!_awayModeActive) return;
  _awayModeActive = false;
  if (_awayModeTimer) { clearInterval(_awayModeTimer); _awayModeTimer = null; }
  log('INFO', WORKSPACE_LANGUAGE === 'es' ? 'Modo Ausencia desactivado.' : 'Away Mode deactivated.');
}

function startAwayModeWatcher() {
  if (fs.existsSync(AWAY_MODE_FILE)) activateAwayMode();
  try {
    const watcher = fs.watch(WORKSPACE, {persistent: false}, (eventType, filename) => {
      if (filename !== '.away-mode') return;
      if (fs.existsSync(AWAY_MODE_FILE)) {
        activateAwayMode();
      } else {
        deactivateAwayMode();
      }
    });
    watcher.on('error', () => {});
  } catch {}
}
startAwayModeWatcher();

setInterval(() => {
  updateStatusFile();
}, 60000); // Update STATUS.md cada 60 segundos
setInterval(() => {
  for (const [name, ag] of Object.entries(state.agents)) {
    if (ag.status !== "busy" || !ag.process) continue;
    try {
      process.kill(ag.process.pid, 0);
    } catch {
      log("WARN", L.logDied(name, ag.task?.id));
      appendToAgent(name, `{red-fg}${escBl(L.agentDied)}{/red-fg}`, true);
      ag.process = null;
      failTask(ag.task, name, -1);
    }
  }
}, 15_000);

if (!CLI.headless && screen) {
  screen.render();
}
