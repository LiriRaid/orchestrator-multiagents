#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import process from 'process';
import {spawn} from 'child_process';
import React from 'react';
import {render} from 'ink';
import {App} from './app.mjs';

const ROOT = process.cwd();
const CONFIG_FILE = path.join(ROOT, 'orchestrator.config.json');
const ENGINE_FILE = path.join(ROOT, 'orchestrator.js');
const STATE_FILE = path.join(ROOT, 'logs', 'orchestrator-state.json');
const LOCK_FILE = path.join(ROOT, 'logs', 'orchestrator.lock');
const CONTROL_FILE = path.join(ROOT, 'logs', 'orchestrator-control.json');

const argv = process.argv.slice(2);
const startPaused = argv.includes('--paused');

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

function pushLocalEvent(message) {
	const line = `[${new Date().toLocaleTimeString('es-HN', {hour12: false})}] [INK] ${message}`;
	localEvents.push(line);
	if (localEvents.length > 20) localEvents.shift();
}

function loadConfig() {
	if (!fs.existsSync(CONFIG_FILE)) {
		throw new Error(
			`No se encontró orchestrator.config.json en ${ROOT}. Ejecuta esta UI desde la raíz del proyecto.`
		);
	}

	return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
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
	const agents = Object.keys(config.agents || {}).map(name => ({
		name,
		status: 'idle',
		task: null,
		detail: 'Esperando motor'
	}));

	return {
		projectName: config.projectName || 'Orchestrator Multi-Agents',
		timestamp: new Date().toLocaleString('es-HN', {hour12: false}),
		totalCost: '$0.00',
		queue: [],
		completed: [],
		logs:
			localEvents.length > 0
				? localEvents.slice(-6)
				: ['[INFO] Iniciando motor del orchestrator...'],
		agents,
		stateLabel: startPaused ? 'Pausado' : 'Ejecutando',
		activeLabel: '0s',
		startedAt: null,
		isRunning: false
	};
}

function buildSnapshot() {
	const config = loadConfig();
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
					: agent?.lastLine || 'Listo para trabajar'
		};
	});

	const activeSeconds = engineState.startTime
		? Math.max(0, Math.round((Date.now() - engineState.startTime) / 1000))
		: 0;

	return {
		projectName: engineState.projectName || config.projectName || 'Orchestrator Multi-Agents',
		timestamp: new Date().toLocaleString('es-HN', {hour12: false}),
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
		stateLabel: engineState.paused ? 'Pausado' : 'Ejecutando',
		activeLabel: formatDuration(activeSeconds),
		startedAt: engineState.startTime || null,
		isRunning: busyCount > 0 || isPidRunning(engineState.pid)
	};
}

function ensureEngine() {
	const runningPid = readLockPid();
	if (runningPid && isPidRunning(runningPid)) {
		pushLocalEvent(`Adjuntado a motor existente (PID ${runningPid})`);
		return;
	}

	const childArgs = [ENGINE_FILE, '--headless'];
	if (startPaused) childArgs.push('--paused');

	pushLocalEvent(
		startPaused ? 'Levantando motor en modo PAUSADO' : 'Levantando motor en modo EJECUTANDO'
	);

	spawnedEngine = spawn(process.execPath, childArgs, {
		cwd: ROOT,
		stdio: ['ignore', 'ignore', 'pipe'],
		windowsHide: false
	});

	spawnedEngine.stderr.on('data', chunk => {
		const text = String(chunk).trim();
		if (text) pushLocalEvent(text);
	});

	spawnedEngine.on('exit', code => {
		pushLocalEvent(`Motor finalizado con código ${code ?? 0}`);
	});

	spawnedEngine.on('error', error => {
		pushLocalEvent(`Error iniciando motor: ${error.message}`);
	});
}

function refresh() {
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

function requestAction(action) {
	switch (action) {
		case 'start':
			pushLocalEvent('Comando enviado: REANUDAR');
			sendControlCommand('start');
			break;
		case 'pause':
			pushLocalEvent('Comando enviado: PAUSAR');
			sendControlCommand('pause');
			break;
		case 'reload':
			pushLocalEvent('Comando enviado: RECARGAR COLA');
			sendControlCommand('reload');
			break;
		case 'quit':
			quitRequested = true;
			pushLocalEvent('Comando enviado: SALIR');
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
}

process.on('SIGINT', () => {
	requestAction('quit');
});

process.on('SIGTERM', () => {
	requestAction('quit');
});

mount();
