#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import process from 'process';
import {spawn} from 'child_process';
import {fileURLToPath} from 'url';
import React from 'react';
import {render} from 'ink';
import {App} from './app.mjs';

const __filename = fileURLToPath(import.meta.url);
const PACKAGE_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const ROOT = process.cwd();
const CONFIG_FILE = path.join(ROOT, 'orchestrator.config.json');
const ENGINE_FILE = path.join(PACKAGE_ROOT, 'orchestrator.js');
const STATE_FILE = path.join(ROOT, 'logs', 'orchestrator-state.json');
const LOCK_FILE = path.join(ROOT, 'logs', 'orchestrator.lock');
const CONTROL_FILE = path.join(ROOT, 'logs', 'orchestrator-control.json');

const argv = process.argv.slice(2);
const startPaused = argv.includes('--paused');
const startYolo = argv.includes('--yolo');
const TEXT = {
	es: {
		configMissing: root =>
			`No se encontró orchestrator.config.json en ${root}. Ejecuta esta UI desde la raíz del proyecto.`,
		waitingEngine: 'Esperando motor',
		startingEngine: '[INFO] Iniciando motor del orchestrator...',
		paused: 'Pausado',
		running: 'Ejecutando',
		ready: 'Listo para trabajar',
		attached: pid => `Adjuntado a motor existente (PID ${pid})`,
		startPaused: 'Levantando motor en modo PAUSADO',
		startRunning: 'Levantando motor en modo EJECUTANDO',
		engineExited: code => `Motor finalizado con código ${code ?? 0}`,
		engineError: message => `Error iniciando motor: ${message}`,
		resume: 'Comando enviado: REANUDAR',
		pause: 'Comando enviado: PAUSAR',
		reload: 'Comando enviado: RECARGAR COLA',
		quit: 'Comando enviado: SALIR'
	},
	en: {
		configMissing: root =>
			`orchestrator.config.json was not found in ${root}. Run this UI from the project root.`,
		waitingEngine: 'Waiting for engine',
		startingEngine: '[INFO] Starting orchestrator engine...',
		paused: 'Paused',
		running: 'Running',
		ready: 'Ready to work',
		attached: pid => `Attached to existing engine (PID ${pid})`,
		startPaused: 'Starting engine in PAUSED mode',
		startRunning: 'Starting engine in RUNNING mode',
		engineExited: code => `Engine exited with code ${code ?? 0}`,
		engineError: message => `Error starting engine: ${message}`,
		resume: 'Command sent: RESUME',
		pause: 'Command sent: PAUSE',
		reload: 'Command sent: RELOAD QUEUE',
		quit: 'Command sent: QUIT'
	}
};

function languageFromConfig(config) {
	return config.workspaceLanguage === 'en' ? 'en' : 'es';
}

let detectedLanguage = 'en';
try {
	if (fs.existsSync(CONFIG_FILE)) {
		const _cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
		detectedLanguage = languageFromConfig(_cfg);
	}
} catch {}

const SYSTEM_LOCALE = Intl.DateTimeFormat().resolvedOptions().locale;
function getLocale() { return SYSTEM_LOCALE; }

// Limpiar control.json orphan al iniciar
if (fs.existsSync(CONTROL_FILE)) {
	try {
		const content = JSON.parse(fs.readFileSync(CONTROL_FILE, 'utf8'));
		const age = Date.now() - (content.requestedAt || 0);
		if (age > 5000) {
			fs.unlinkSync(CONTROL_FILE);
		}
	} catch {
		try { fs.unlinkSync(CONTROL_FILE); } catch {}
	}
}

let inkApp = null;
let refreshTimer = null;
let spawnedEngine = null;
let localEvents = [];
let quitRequested = false;
let resizeTimer = null;
let isResizing = false;
let lastColumns = process.stdout?.columns ?? 0;

function normalizeInlineMessage(message) {
	return String(message ?? '')
		.replace(/\r?\n+/g, ' ')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

function pushLocalEvent(message) {
	const normalized = normalizeInlineMessage(message);
	if (!normalized) return;
	const line = `[${new Date().toLocaleTimeString(getLocale(), {hour12: false})}] [INK] ${normalized}`;
	localEvents.push(line);
	if (localEvents.length > 20) localEvents.shift();
}

function loadConfig() {
	if (!fs.existsSync(CONFIG_FILE)) {
		throw new Error(TEXT[detectedLanguage].configMissing(ROOT));
	}

	const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
	detectedLanguage = languageFromConfig(config);
	return config;
}

function isPidRunning(pid) {
	if (!pid || Number.isNaN(pid)) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function readLockPid() {
	if (!fs.existsSync(LOCK_FILE)) return null;
	const raw = fs.readFileSync(LOCK_FILE, 'utf8').trim();
	const pid = Number.parseInt(raw, 10);
	return Number.isNaN(pid) ? null : pid;
}

function formatDuration(seconds) {
	if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m${seconds % 60 ? `${seconds % 60}s` : ''}`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h${minutes % 60}m`;
}

function readEngineState() {
	if (!fs.existsSync(STATE_FILE)) return null;
	try {
		return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
	} catch {
		return null;
	}
}

function sendControlCommand(type) {
	fs.mkdirSync(path.dirname(CONTROL_FILE), {recursive: true});
	fs.writeFileSync(
		CONTROL_FILE,
		JSON.stringify(
			{
				type,
				requestedAt: Date.now(),
				source: 'ink'
			},
			null,
			2
		) + '\n',
		'utf8'
	);
}

function buildFallbackSnapshot(config) {
	const language = languageFromConfig(config);
	const text = TEXT[language];
	const agents = Object.keys(config.agents || {}).map(name => ({
		name,
		status: 'idle',
		task: null,
		detail: text.waitingEngine
	}));

	return {
		projectName: config.projectName || 'Orchestrator Multi-Agents',
		timestamp: new Date().toLocaleString(getLocale(), {hour12: false}),
		totalCost: '$0.00',
		queue: [],
		completed: [],
		logs:
			localEvents.length > 0
				? localEvents.slice(-6)
				: [text.startingEngine],
		agents,
		stateLabel: startPaused ? text.paused : text.running,
		workspaceLanguage: language,
		activeLabel: '0s',
		startedAt: null,
		isRunning: false
	};
}

function buildSnapshot() {
	const config = loadConfig();
	const language = languageFromConfig(config);
	const text = TEXT[language];
	const engineState = readEngineState();

	if (!engineState) {
		return buildFallbackSnapshot(config);
	}

	const busyCount = Object.values(engineState.agents || {}).filter(
		agent => agent.status === 'busy'
	).length;

	const agents = Object.entries(config.agents || {}).map(([name]) => {
		const agent = engineState.agents?.[name];
		return {
			name,
			status: agent?.status === 'busy' ? 'busy' : 'idle',
			task: agent?.task ? `${agent.task.id} · ${agent.task.title}` : null,
			detail:
				agent?.status === 'busy'
					? `${agent.task?.priority || 'P?'} · ${agent.task?.repo || 'repo'}`
					: agent?.lastLine || text.ready
		};
	});

	const activeSeconds = engineState.startTime
		? Math.max(0, Math.round((Date.now() - engineState.startTime) / 1000))
		: 0;

	return {
		projectName: engineState.projectName || config.projectName || 'Orchestrator Multi-Agents',
		timestamp: new Date().toLocaleString(getLocale(), {hour12: false}),
		totalCost:
			typeof engineState.totalCost === 'number'
				? `$${engineState.totalCost.toFixed(2)}`
				: '$0.00',
		queue: engineState.queue || [],
		completed: engineState.completed || [],
		logs:
			engineState.logs && engineState.logs.length > 0
				? engineState.logs.slice(-6)
				: localEvents.slice(-6),
		agents,
		stateLabel: engineState.paused ? text.paused : text.running,
		workspaceLanguage: engineState.workspaceLanguage || language,
		activeLabel: formatDuration(activeSeconds),
		startedAt: engineState.startTime || null,
		isRunning: busyCount > 0 || isPidRunning(engineState.pid)
	};
}

function ensureEngine() {
	const config = loadConfig();
	const text = TEXT[languageFromConfig(config)];
	const runningPid = readLockPid();
	if (runningPid && isPidRunning(runningPid)) {
		pushLocalEvent(text.attached(runningPid));
		return;
	}

	const childArgs = [ENGINE_FILE, '--headless'];
	if (startPaused) childArgs.push('--paused');
	if (startYolo) childArgs.push('--yolo');

	pushLocalEvent(
		startPaused ? text.startPaused : text.startRunning
	);

	spawnedEngine = spawn(process.execPath, childArgs, {
		cwd: ROOT,
		env: {
			...process.env,
			ORCHESTRATOR_WORKSPACE: ROOT,
			NODE_PATH: [path.join(PACKAGE_ROOT, 'node_modules'), process.env.NODE_PATH]
				.filter(Boolean)
				.join(path.delimiter)
		},
		stdio: ['ignore', 'ignore', 'pipe'],
		windowsHide: false
	});

	spawnedEngine.stderr.on('data', chunk => {
		const text = normalizeInlineMessage(String(chunk));
		if (text) pushLocalEvent(text);
	});

	spawnedEngine.on('exit', code => {
		pushLocalEvent(text.engineExited(code));
	});

	spawnedEngine.on('error', error => {
		pushLocalEvent(text.engineError(error.message));
	});
}

function refresh() {
	if (isResizing) return;

	const snapshot = buildSnapshot();
	if (!inkApp) {
		inkApp = render(React.createElement(App, {snapshot, onAction: requestAction}), {
			exitOnCtrlC: false,
			patchConsole: false,
			alternateScreen: true
		});
		return;
	}

	inkApp.rerender(React.createElement(App, {snapshot, onAction: requestAction}));
}

function clearTerminal() {
	if (!process.stdout.isTTY) return;
	process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
}

function requestAction(action) {
	const config = loadConfig();
	const text = TEXT[languageFromConfig(config)];
	switch (action) {
		case 'start':
			pushLocalEvent(text.resume);
			sendControlCommand('start');
			break;
		case 'pause':
			pushLocalEvent(text.pause);
			sendControlCommand('pause');
			break;
		case 'reload':
			pushLocalEvent(text.reload);
			sendControlCommand('reload');
			break;
		case 'quit':
			quitRequested = true;
			pushLocalEvent(text.quit);
			sendControlCommand('quit');
			setTimeout(() => {
				shutdown();
				process.exit(0);
			}, 500);
			break;
	}
}

function shutdown() {
	if (refreshTimer) clearInterval(refreshTimer);
	if (resizeTimer) clearTimeout(resizeTimer);
	if (spawnedEngine && !spawnedEngine.killed && quitRequested) {
		try {
			spawnedEngine.kill('SIGTERM');
		} catch {}
	}
	if (inkApp) inkApp.unmount();
	// Limpiar archivos de control al salir
	try { fs.unlinkSync(CONTROL_FILE); } catch {}
	try { fs.unlinkSync(LOCK_FILE); } catch {}
	try { fs.unlinkSync(STATE_FILE); } catch {}
}

function mount() {
	ensureEngine();
	refresh();
	refreshTimer = setInterval(refresh, 1000);

	if (process.stdout.isTTY) {
		process.stdout.on('resize', () => {
			const nextColumns = process.stdout.columns ?? 0;
			const shrinking = nextColumns > 0 && lastColumns > 0 && nextColumns < lastColumns;
			lastColumns = nextColumns;
			isResizing = true;
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				if (shrinking) {
					clearTerminal();
					if (inkApp) {
						inkApp.unmount();
						inkApp = null;
					}
				}
				isResizing = false;
				refresh();
			}, 180);
		});
	}
}

process.on('SIGINT', () => {
	requestAction('quit');
});

process.on('SIGTERM', () => {
	requestAction('quit');
});

mount();
