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
const LOG_DIR = path.join(WORKSPACE, "logs");

const REPOS = config.repos || {};
const AGENTS = config.agents || {};
const PROJECT_NAME = config.projectName || "Orchestrator Multi-Agents";
const WORKSPACE_LANGUAGE = ["en", "es"].includes(config.workspaceLanguage)
  ? config.workspaceLanguage
  : "es";
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
    retryAt: (time, remaining) =>
      `reintenta a las ${time} (${remaining} min)`,
    log: "REGISTRO",
    controls: "Seguir  Pausa  Recargar  Quitar",
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
  },
};
const L = TEXT[WORKSPACE_LANGUAGE];

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
const SKIP_PERMISSIONS =
  process.env.SKIP_PERMISSIONS === "true" || CLI.yolo;
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
const panelWidth = Math.max(1, Math.floor(100 / Math.max(1, agentNames.length)));

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
          turns: ag.turns,
        },
      ]),
    ),
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(snapshot, null, 2) + "\n", "utf-8");
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

  lines.push(`  ${datestamp()} ${timestamp()}  ${WORKSPACE_LANGUAGE === "es" ? "activo" : "active"} ${up}  ${cost}  ${mode}`);
  lines.push("");

  for (const [name, ag] of Object.entries(state.agents)) {
    const cfg = AGENTS[name];
    let status, detail;
    if (ag.status === "busy") {
      status = `{yellow-fg}${L.busy}{/yellow-fg}`;
      detail = `${ag.task?.id || "?"} ${(ag.task?.title || "").slice(0, 35)} (${elapsedSince(ag.startTime)})`;
    } else {
      status = `{gray-fg}${L.idle}{/gray-fg}`;
      detail = ag.lastLine || "";
    }
    const dot =
      ag.status === "busy" ? "{green-fg}●{/green-fg}" : "{gray-fg}○{/gray-fg}";
    lines.push(`  ${dot} {bold}${name}{/bold}  ${status}  ${detail}`);
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
  lines.push(
    `  {cyan-fg}S{/cyan-fg} ${L.controls}`,
  );

  dashboard.setContent(lines.join("\n"));

  for (const [name, ag] of Object.entries(state.agents)) {
    const box = agentBoxes[name];
    if (ag.status === "busy") {
      box.style.border.fg = "yellow";
      box.setLabel(
        ` {bold}${escBl(name)}{/bold} {yellow-fg}OCUPADO{/yellow-fg} ${escBl(ag.task?.id || "")} `,
      );
    } else {
      box.style.border.fg = "gray";
      box.setLabel(
        ` {bold}${escBl(name)}{/bold} {gray-fg}EN ESPERA{/gray-fg} `,
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
    if (line.startsWith("## In Progress") || line.startsWith("## En progreso")) {
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
    if (line.startsWith("## In Progress") || line.startsWith("## En progreso")) {
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

  const repoDir = REPOS[task.repo] || REPOS[agentCfg.defaultRepo] || ".";
  const progressFile = path.join(
    WORKSPACE,
    "progress",
    `PROGRESS-${task.agent}.md`,
  );

  return `
# Agent: ${task.agent}
# Task: ${task.id} — ${task.title}
# Repository: ${task.repo}
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
        args: [
          "exec",
          ...(agentCfg.model ? ["--model", agentCfg.model] : []),
          ...(CLI.yolo ? ["--dangerously-bypass-approvals-and-sandbox"] : []),
          "--add-dir",
          WORKSPACE,
          "-",
        ],
      };
    case "opencode":
      return {
        cmd: "opencode",
        args: [
          "run",
          ...(agentCfg.model ? ["--model", agentCfg.model] : []),
          "--format",
          "json",
          "--pure",
          ...(CLI.yolo ? ["--dangerously-skip-permissions"] : []),
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
            `type "${promptFile}" | abacusai -p --output-format stream-json --permission-mode ${CLI.yolo ? "yolo" : "default"} ${CLI.yolo ? "--dangerously-skip-permissions --auto-accept-edits" : ""} --add-dir "${WORKSPACE}"`,
          ],
        };
      }
      return {
        cmd: "sh",
        args: [
          "-c",
          `cat "${promptFile}" | abacusai -p --output-format stream-json --permission-mode ${CLI.yolo ? "yolo" : "default"} ${CLI.yolo ? "--dangerously-skip-permissions --auto-accept-edits" : ""} --add-dir "${WORKSPACE}"`,
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
    log(
      "ERROR",
      `Agente desconocido en QUEUE: "${agentName}" — no está definido en orchestrator.config.json`,
    );
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
    `{cyan-fg}=== ${escBl(task.id)}: ${escBl(task.title)} ==={/cyan-fg}`,
    true,
  );
  appendToAgent(agentName, `{gray-fg}CWD: ${escBl(repoDir)}{/gray-fg}`, true);
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
      log("WARN", `${agentName} timed out on ${task.id}`);
      appendToAgent(agentName, "{red-fg}=== TIMEOUT ==={/red-fg}", true);
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
          if (event.type === "result" && event.total_cost_usd)
            ag.cost = event.total_cost_usd;
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
  if (ag.cost) state.totalCost += ag.cost;
  task.status = "completed";
  task.completedAt = timestamp();
  task.elapsed = elapsed;
  task.cost = ag.cost;
  state.inProgress = state.inProgress.filter((t) => t.id !== task.id);
  state.completed.push(task);
  const costStr = ag.cost ? ` ($${ag.cost.toFixed(2)})` : "";
  log(
    "DONE",
    `${agentName} completó ${task.id} en ${formatDuration(elapsed)}${costStr}`,
  );
  appendToAgent(agentName, "", true);
  appendToAgent(
    agentName,
    `{green-fg}=== COMPLETADA en ${formatDuration(elapsed)}${escBl(costStr)} ==={/green-fg}`,
    true,
  );
  ag.status = "idle";
  ag.task = null;
  ag.process = null;
  ag.startTime = null;
  ag.lastLine = `Última: ${task.id} completada`;
  updateQueueFile(task);
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
      : "reintento en 10 min";
    log("RATE", `${agentName} alcanzó el límite en ${task.id} (${resetStr})`);
    appendToAgent(
      agentName,
      `{yellow-fg}=== LÍMITE DE CUOTA (${escBl(resetStr)}) ==={/yellow-fg}`,
      true,
    );
  } else {
    log(
      "FAIL",
      `${agentName} falló ${task.id} (salida ${code}, ${retries}/${maxRetries})`,
    );
    appendToAgent(
      agentName,
      `{red-fg}=== FALLÓ (salida ${code}, intento ${retries}) ==={/red-fg}`,
      true,
    );
  }
  state.inProgress = state.inProgress.filter((t) => t.id !== task.id);
  ag.status = "idle";
  ag.task = null;
  ag.process = null;
  ag.startTime = null;

  const shouldFallbackToClaude =
    ["Codex", "OpenCode"].includes(agentName) &&
    (failureFlags.exhaustedQuota ||
      failureFlags.providerUnavailable ||
      retries >= maxRetries);

  if (shouldFallbackToClaude) {
    const reason = failureFlags.exhaustedQuota
      ? "cuota o límite agotado"
      : failureFlags.providerUnavailable
        ? "proveedor o sesión no disponibles"
        : "fallo persistente";
    if (tryFallbackToClaude(task, agentName, reason)) {
      setTimeout(() => {
        scheduleNext();
        renderDashboard();
      }, 3000);
      renderDashboard();
      return;
    }
  }

  if (retries >= maxRetries) {
    task.status = "failed";
    ag.lastLine = `FALLÓ: ${task.id}`;
    log("ERROR", `${task.id} falló definitivamente tras ${retries} intentos`);
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
      ? `LÍMITE: ${task.id} (reintento a las ${retryTime})`
      : `REINTENTO: ${task.id}`;
    if (rl.isRateLimit) rateLimitedAgents.set(agentName, task._retryAfter);
  }
  if (rl.isRateLimit && task._retryAfter) {
    setTimeout(
      () => {
        scheduleNext();
        renderDashboard();
      },
      Math.max(
        Math.min(task._retryAfter - Date.now() + 5000, 3600_000),
        60_000,
      ),
    );
  } else {
    setTimeout(() => {
      scheduleNext();
      renderDashboard();
    }, 3000);
  }
  renderDashboard();
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
  // Use a word-boundary match so TASK-1 does NOT also remove TASK-10, TASK-11, etc.
  const idMatcher = new RegExp(
    `^${completedTask.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$|\\|)`,
  );
  const filtered = lines.filter((l) => !idMatcher.test(l.trim()));
  const idx = filtered.findIndex((l) => l.trim().startsWith("## Completed") || l.trim().startsWith("## Completadas"));
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
  return {
    exhaustedQuota:
      lower.includes("out of extra usage") ||
      lower.includes("resource_exhausted") ||
      lower.includes("quota") ||
      lower.includes("rate_limit") ||
      lower.includes("ratelimitexceeded") ||
      lower.includes("429"),
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
  };
}

function getClaudeFallbackAgent(task) {
  const preferred = task.repo === "frontend" ? "Frontend" : "Backend";
  if (AGENTS[preferred]?.cli === "claude") return preferred;
  return (
    Object.keys(AGENTS).find((name) => AGENTS[name]?.cli === "claude") || null
  );
}

function tryFallbackToClaude(task, failedAgentName, reason) {
  if (!["Codex", "OpenCode"].includes(failedAgentName)) return false;
  const fallbackAgent = getClaudeFallbackAgent(task);
  if (!fallbackAgent || fallbackAgent === failedAgentName) return false;

  const queueUpdated = updateQueueTaskAgent(task.id, fallbackAgent);
  task.agent = fallbackAgent;
  task.status = "pending";
  task._retryAfter = Date.now() + 3000;
  failedTasks.set(task.id, 0);
  state.queue.push(task);

  log(
    "FALLBACK",
    `${task.id} fue reasignada de ${failedAgentName} a ${fallbackAgent} (${reason})`,
  );
  appendToAgent(
    failedAgentName,
    `{yellow-fg}=== REASIGNADA A ${escBl(fallbackAgent)} (${escBl(reason)}) ==={/yellow-fg}`,
    true,
  );
  if (!queueUpdated) {
    log(
      "WARN",
      `${task.id} fue reasignada a ${fallbackAgent}, pero QUEUE.md no pudo actualizarse automáticamente`,
    );
  }
  return true;
}

// ============================================================================
// KEYBOARD
// ============================================================================
if (!CLI.headless && screen) {
  screen.key(["q", "C-c"], () => {
    exitWithSummary();
  });

  screen.key("s", () => {
    if (state.paused) {
      state.paused = false;
      log("INFO", "Reanudado");
    }
    scheduleNext();
    renderDashboard();
  });
  screen.key("p", () => {
    state.paused = !state.paused;
    log("INFO", state.paused ? L.paused : L.resumed);
    renderDashboard();
  });
  screen.key("r", () => {
    reloadQueue();
    log("INFO", L.queueReloaded(state.queue.length));
    renderDashboard();
  });
}

// ============================================================================
// MAIN
// ============================================================================
log("INFO", L.starting(PROJECT_NAME));
state.completed = parseCompletedFromFile();
log(
  "INFO",
  L.loadedCompleted(state.completed.length),
);
reloadQueue();
log("INFO", `${L.queue}: ${state.queue.length} ${L.tasks}`);
renderDashboard();
if (!state.paused) {
  scheduleNext();
  renderDashboard();
}

setInterval(() => {
  const command = consumeControlCommand();
  if (command) applyControlCommand(command);
}, 1000);

setInterval(() => {
  reloadQueue();
  if (!state.paused) scheduleNext();
  renderDashboard();
}, POLL_INTERVAL_MS);
setInterval(() => {
  for (const [name, ag] of Object.entries(state.agents)) {
    if (ag.status !== "busy" || !ag.process) continue;
    try {
      process.kill(ag.process.pid, 0);
    } catch {
      log("WARN", `${name} died silently on ${ag.task?.id}`);
      appendToAgent(name, "{red-fg}=== PROCESS DIED ==={/red-fg}", true);
      ag.process = null;
      failTask(ag.task, name, -1);
    }
  }
}, 15_000);

if (!CLI.headless && screen) {
  screen.render();
}
