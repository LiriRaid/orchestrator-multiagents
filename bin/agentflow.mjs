#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {spawn} from 'child_process';
import {createInterface} from 'readline/promises';
import {stdin as input, stdout as output} from 'process';

const __filename = fileURLToPath(import.meta.url);
const PACKAGE_ROOT = path.dirname(path.dirname(__filename));
const argv = process.argv.slice(2);

const TEMPLATE_PATHS = [
	'README.md',
	'ORCHESTRATOR.md',
	'CLAUDE.md',
	'ENGRAM.md',
	'AGENT-CONFIG.md',
	'PROJECT.md',
	'.atl',
	'docs',
	'orchestrator.config.json',
	'QUEUE.md',
	'agents',
	'openspec',
	'.claude',
	'.codex',
	'.opencode'
];

const RUNTIME_DIRS = ['logs', 'handoffs', 'progress', 'briefs'];
const SUPPORTED_LANGUAGES = new Set(['en', 'es']);
const DEFAULT_LANGUAGE = 'en';
const TEXT = {
	es: {
		unsupported: value => `Idioma no soportado: ${value}. Usa "en" o "es".`,
		missingTemplate: language => `No existe el template de idioma: ${language}`,
		installed: target => `Orquestador instalado en ${target}`,
		language: language => `Idioma del workspace: ${language.toUpperCase()}`,
		next: 'Siguiente paso recomendado:',
		step1: '1. Edita orchestrator.config.json con rutas reales',
		step2: '2. Revisa ORCHESTRATOR.md, CLAUDE.md y docs/',
		step3: '3. Ejecuta: agentflow ink --paused',
		invalidProject: projectPath => `Ruta de proyecto inválida: ${projectPath}`,
		realProject: projectPath => `Proyecto real: ${projectPath}`,
		workspace: workspaceDir => `Workspace del orquestador: ${workspaceDir}`,
		sibling:
			'Este workspace queda fuera del repo del proyecto, como sibling, para no ensuciarlo con archivos del orquestador.',
		unknown: command => `Comando desconocido: ${command}`
	},
	en: {
		unsupported: value => `Unsupported language: ${value}. Use "en" or "es".`,
		missingTemplate: language => `Language template not found: ${language}`,
		installed: target => `Orchestrator installed at ${target}`,
		language: language => `Workspace language: ${language.toUpperCase()}`,
		next: 'Recommended next steps:',
		step1: '1. Edit orchestrator.config.json with real paths',
		step2: '2. Review ORCHESTRATOR.md, CLAUDE.md, and docs/',
		step3: '3. Run: agentflow ink --paused',
		invalidProject: projectPath => `Invalid project path: ${projectPath}`,
		realProject: projectPath => `Real project: ${projectPath}`,
		workspace: workspaceDir => `Orchestrator workspace: ${workspaceDir}`,
		sibling:
			'This workspace stays next to the real project as a sibling, so orchestrator files do not pollute the product repo.',
		unknown: command => `Unknown command: ${command}`
	}
};

function printHelp() {
	console.log(`
agentflow

Uso / Usage:
  agentflow init [targetDir] [--project-name <name>] [--backend <path>] [--frontend <path>] [--lang <en|es>] [--force]
  agentflow init-workspace <projectPath> [--workspace-name <name>] [--backend <path>] [--frontend <path>] [--lang <en|es>] [--force]
  agentflow tui [--paused] [--yolo]
  agentflow ink [--paused] [--yolo]
  agentflow schedule [--uninstall]
  agentflow skills:registry
  agentflow openspec:new <change-name>
  agentflow agent-config:init

Ejemplos / Examples:
  agentflow init . --project-name "Mi Proyecto" --lang es
  agentflow init-workspace C:/code/mi-proyecto --lang en
  agentflow tui --paused
  agentflow ink --yolo
  agentflow schedule
  agentflow schedule --uninstall
`);
}

function parseFlags(args) {
	const flags = {};
	const rest = [];

	for (let i = 0; i < args.length; i += 1) {
		const current = args[i];
		if (!current.startsWith('--')) {
			rest.push(current);
			continue;
		}

		const key = current.slice(2);
		const next = args[i + 1];
		if (!next || next.startsWith('--')) {
			flags[key] = true;
			continue;
		}

		flags[key] = next;
		i += 1;
	}

	return {flags, rest};
}

function normalizeLanguage(value) {
	if (!value || value === true) return null;
	const normalized = String(value).trim().toLowerCase();
	if (normalized === '1' || normalized === 'en' || normalized === 'english') return 'en';
	if (normalized === '2' || normalized === 'es' || normalized === 'spanish' || normalized === 'espanol' || normalized === 'español') return 'es';
	return null;
}

async function resolveLanguage(flagValue) {
	const fromFlag = normalizeLanguage(flagValue);
	if (fromFlag) return fromFlag;

	if (flagValue && !fromFlag) {
		console.warn(TEXT.es.unsupported(flagValue));
	}

	if (!process.stdin.isTTY || !process.stdout.isTTY) return DEFAULT_LANGUAGE;

	const rl = createInterface({input, output});
	try {
		console.log('');
		console.log('Selecciona el idioma del workspace / Select workspace language:');
		console.log('  1) EN - English (recommended for AI agents)');
		console.log('  2) ES - Español');
		const answer = await rl.question(`Language [${DEFAULT_LANGUAGE}]: `);
		return normalizeLanguage(answer) || DEFAULT_LANGUAGE;
	} finally {
		rl.close();
	}
}

function ensureDir(dir) {
	fs.mkdirSync(dir, {recursive: true});
}

function copyRecursive(source, target, force = false) {
	const stats = fs.statSync(source);

	if (stats.isDirectory()) {
		if (path.basename(source) === 'node_modules') return;
		ensureDir(target);
		for (const entry of fs.readdirSync(source)) {
			copyRecursive(path.join(source, entry), path.join(target, entry), force);
		}
		return;
	}

	if (fs.existsSync(target) && !force) return;
	ensureDir(path.dirname(target));
	fs.copyFileSync(source, target);
}

function patchGitignore(targetDir) {
	const gitignorePath = path.join(targetDir, '.gitignore');
	const entries = ['.atl/', 'logs/', 'handoffs/', 'progress/', 'briefs/'];

	let existing = '';
	if (fs.existsSync(gitignorePath)) {
		existing = fs.readFileSync(gitignorePath, 'utf8');
	}

	const toAdd = entries.filter(e => !existing.includes(e));
	if (toAdd.length === 0) return;

	const trailingNewline = existing.endsWith('\n') ? '' : '\n';
	const block = `${trailingNewline}\n### agentflow\n${toAdd.join('\n')}\n`;
	fs.writeFileSync(gitignorePath, existing + block, 'utf8');
}

function patchConfig(targetDir, options) {
	const configPath = path.join(targetDir, 'orchestrator.config.json');
	if (!fs.existsSync(configPath)) return;

	const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	const projectName = options.projectName || path.basename(path.resolve(targetDir)) || config.projectName;
	config.projectName = projectName;
	config.workspaceLanguage = options.language;

	if (options.backend) {
		config.repos.backend = options.backend;
	}

	if (options.frontend) {
		config.repos.frontend = options.frontend;
	}

	fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

async function initProject(args) {
	const {flags, rest} = parseFlags(args);
	const targetDir = path.resolve(rest[0] || '.');
	const force = Boolean(flags.force);
	const language = await resolveLanguage(flags.lang);
	const templateRoot = path.join(PACKAGE_ROOT, 'templates', language);

	if (!fs.existsSync(templateRoot)) {
		console.error(TEXT[language].missingTemplate(language));
		process.exit(1);
	}

	ensureDir(targetDir);

	for (const relativePath of TEMPLATE_PATHS) {
		const source = path.join(templateRoot, relativePath);
		if (!fs.existsSync(source)) continue;
		const target = path.join(targetDir, relativePath);
		copyRecursive(source, target, force);
	}

	for (const dir of RUNTIME_DIRS) {
		ensureDir(path.join(targetDir, dir));
	}

	patchConfig(targetDir, {
		projectName: flags['project-name'],
		backend: flags.backend,
		frontend: flags.frontend,
		language
	});

	patchGitignore(targetDir);

	const text = TEXT[language];
	console.log(text.installed(targetDir));
	console.log(text.language(language));
	console.log(text.next);
	console.log(text.step1);
	console.log(text.step2);
	console.log(text.step3);
}

async function initWorkspace(args) {
	const {flags, rest} = parseFlags(args);
	const projectPath = path.resolve(rest[0] || '.');
	const language = await resolveLanguage(flags.lang);

	if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
		console.error(TEXT[language].invalidProject(projectPath));
		process.exit(1);
	}

	const projectName = flags['project-name'] || path.basename(projectPath);
	const workspaceName = flags['workspace-name'] || `orchestrator-${projectName.toLowerCase().replace(/\s+/g, '-')}`;
	const workspaceDir = path.join(path.dirname(projectPath), workspaceName);

	await initProject([
		workspaceDir,
		'--project-name',
		projectName,
		'--lang',
		language,
		'--backend',
		flags.backend || projectPath,
		'--frontend',
		flags.frontend || projectPath,
		...(flags.force ? ['--force'] : [])
	]);

	console.log('');
	console.log(TEXT[language].realProject(projectPath));
	console.log(TEXT[language].workspace(workspaceDir));
	console.log(TEXT[language].sibling);
}

async function scheduleScripts(args) {
	const {flags} = parseFlags(args);
	const uninstall = Boolean(flags.uninstall);
	const workspace = process.cwd();
	const scriptRoot = PACKAGE_ROOT;
	const autoTrigger = path.join(scriptRoot, 'scripts', 'auto-trigger.js');
	const monitorCheck = path.join(scriptRoot, 'scripts', 'monitor-check.js');
	const nodeExe = process.execPath;

	if (process.platform !== 'win32') {
		console.log('agentflow schedule only supports Windows Task Scheduler.');
		console.log('For macOS/Linux, add these to crontab manually:');
		console.log(`  * * * * * ORCHESTRATOR_WORKSPACE="${workspace}" "${nodeExe}" "${autoTrigger}"`);
		console.log(`  */5 * * * * ORCHESTRATOR_WORKSPACE="${workspace}" "${nodeExe}" "${monitorCheck}"`);
		return;
	}

	const {execSync} = await import('child_process');
	const env = `ORCHESTRATOR_WORKSPACE=${workspace}`;

	const tasks = [
		{
			name: 'agentflow-auto-trigger',
			script: autoTrigger,
			description: 'agentflow: check INBOX every 60s and trigger Claude',
			repetition: 'PT1M',
			duration: 'PT1M',
		},
		{
			name: 'agentflow-monitor-check',
			script: monitorCheck,
			description: 'agentflow: Away Mode monitor every 5 minutes',
			repetition: 'PT5M',
			duration: 'PT5M',
		},
	];

	for (const t of tasks) {
		if (uninstall) {
			try {
				execSync(`schtasks /Delete /TN "${t.name}" /F`, {stdio: 'pipe'});
				console.log(`Removed: ${t.name}`);
			} catch {
				console.log(`Not found (already removed): ${t.name}`);
			}
			continue;
		}
		// Delete existing before recreating to avoid duplicates
		try { execSync(`schtasks /Delete /TN "${t.name}" /F`, {stdio: 'pipe'}); } catch {}
		const interval = t.name === 'agentflow-auto-trigger' ? 1 : 5;
		// SYSTEM task: cmd /c to set env var (SYSTEM runs non-interactive — no visible window)
		const cmd = [
			'schtasks /Create',
			`/TN "${t.name}"`,
			`/TR "cmd /c set ORCHESTRATOR_WORKSPACE=${workspace} && \\"${nodeExe}\\" \\"${t.script}\\""`,
			'/SC MINUTE',
			`/MO ${interval}`,
			'/RU SYSTEM',
			'/F',
		].join(' ');
		try {
			execSync(cmd, {stdio: 'pipe'});
			console.log(`Scheduled: ${t.name} (every ${interval} min)`);
		} catch (err) {
			// schtasks /RU SYSTEM may fail without admin — fallback to current user with PowerShell hidden
			const psBody = `{$env:ORCHESTRATOR_WORKSPACE='${workspace.replace(/'/g, "''")}'; & '${nodeExe.replace(/'/g, "''")}' '${t.script.replace(/'/g, "''")}'}`;
			const cmdUser = [
				'schtasks /Create',
				`/TN "${t.name}"`,
				`/TR "powershell -WindowStyle Hidden -NonInteractive -ExecutionPolicy Bypass -Command ${psBody}"`,
				'/SC MINUTE',
				`/MO ${interval}`,
				'/F',
			].join(' ');
			try {
				execSync(cmdUser, {stdio: 'inherit'});
				console.log(`Scheduled (current user, hidden): ${t.name}`);
			} catch (err2) {
				console.error(`Failed to schedule ${t.name}: ${err2.message}`);
				console.error('Run as Administrator or add manually to Task Scheduler.');
			}
		}
	}

	if (!uninstall) {
		console.log('');
		console.log(`Workspace: ${workspace}`);
		console.log('auto-trigger.js → every 1 min  (checks INBOX, triggers Claude)');
		console.log('monitor-check.js → every 5 min (Away Mode monitor)');
		console.log('');
		console.log('To remove: agentflow schedule --uninstall');
	}
}

function runNodeScript(relativeScript, args = []) {
	const scriptPath = path.join(PACKAGE_ROOT, relativeScript);
	const child = spawn(process.execPath, [scriptPath, ...args], {
		cwd: process.cwd(),
		env: {
			...process.env,
			ORCHESTRATOR_WORKSPACE: process.cwd(),
			NODE_PATH: [path.join(PACKAGE_ROOT, 'node_modules'), process.env.NODE_PATH]
				.filter(Boolean)
				.join(path.delimiter)
		},
		stdio: 'inherit'
	});

	child.on('exit', code => process.exit(code ?? 0));
}

const command = argv[0];

switch (command) {
	case undefined:
	case 'help':
	case '--help':
	case '-h':
		printHelp();
		break;
	case 'init':
		await initProject(argv.slice(1));
		break;
	case 'init-workspace':
		await initWorkspace(argv.slice(1));
		break;
	case 'tui':
		runNodeScript('orchestrator.js', argv.slice(1));
		break;
	case 'ink':
		runNodeScript(path.join('src', 'ink', 'index.mjs'), argv.slice(1));
		break;
	case 'skills:registry':
		runNodeScript(path.join('scripts', 'update-skill-registry.mjs'));
		break;
	case 'openspec:new':
		runNodeScript(path.join('scripts', 'scaffold-openspec-change.mjs'), argv.slice(1));
		break;
	case 'agent-config:init':
		runNodeScript(path.join('scripts', 'scaffold-agent-configs.mjs'));
		break;
	case 'schedule':
		await scheduleScripts(argv.slice(1));
		break;
	default:
		console.error(TEXT.es.unknown(command));
		printHelp();
		process.exit(1);
}
