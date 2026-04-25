#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {spawn} from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const PACKAGE_ROOT = path.dirname(path.dirname(__filename));
const argv = process.argv.slice(2);

const TEMPLATE_PATHS = [
	'ORCHESTRATOR.md',
	'CLAUDE.md',
	'ENGRAM.md',
	'AGENT-CONFIG.md',
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

function printHelp() {
	console.log(`
orchestrator-multiagents

Usage:
  orchestrator-multiagents init [targetDir] [--project-name <name>] [--backend <path>] [--frontend <path>] [--force]
  orchestrator-multiagents init-workspace <projectPath> [--workspace-name <name>] [--backend <path>] [--frontend <path>] [--force]
  orchestrator-multiagents tui [--paused] [--yolo]
  orchestrator-multiagents ink [--paused] [--yolo]
  orchestrator-multiagents skills:registry
  orchestrator-multiagents openspec:new <change-name>
  orchestrator-multiagents agent-config:init

Examples:
  orchestrator-multiagents init . --project-name "My Project"
  orchestrator-multiagents init-workspace C:/code/my-project
  orchestrator-multiagents tui --paused
  orchestrator-multiagents ink
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

function ensureDir(dir) {
	fs.mkdirSync(dir, {recursive: true});
}

function copyRecursive(source, target, force = false) {
	const stats = fs.statSync(source);

	if (stats.isDirectory()) {
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

function patchConfig(targetDir, options) {
	const configPath = path.join(targetDir, 'orchestrator.config.json');
	if (!fs.existsSync(configPath)) return;

	const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	const projectName = options.projectName || path.basename(path.resolve(targetDir)) || config.projectName;
	config.projectName = projectName;

	if (options.backend) {
		config.repos.backend = options.backend;
	}

	if (options.frontend) {
		config.repos.frontend = options.frontend;
	}

	fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

function initProject(args) {
	const {flags, rest} = parseFlags(args);
	const targetDir = path.resolve(rest[0] || '.');
	const force = Boolean(flags.force);

	ensureDir(targetDir);

	for (const relativePath of TEMPLATE_PATHS) {
		const source = path.join(PACKAGE_ROOT, relativePath);
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
		frontend: flags.frontend
	});

	console.log(`Orchestrator installed at ${targetDir}`);
	console.log('Recommended next steps:');
	console.log('1. Edit orchestrator.config.json with real paths');
	console.log('2. Review ORCHESTRATOR.md, CLAUDE.md, and docs/');
	console.log('3. Run: orchestrator-multiagents ink --paused');
}

function initWorkspace(args) {
	const {flags, rest} = parseFlags(args);
	const projectPath = path.resolve(rest[0] || '.');

	if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
		console.error(`Invalid project path: ${projectPath}`);
		process.exit(1);
	}

	const projectName = flags['project-name'] || path.basename(projectPath);
	const workspaceName = flags['workspace-name'] || `orchestrator-${projectName.toLowerCase().replace(/\s+/g, '-')}`;
	const workspaceDir = path.join(path.dirname(projectPath), workspaceName);

	initProject([
		workspaceDir,
		'--project-name',
		projectName,
		'--backend',
		flags.backend || projectPath,
		'--frontend',
		flags.frontend || projectPath,
		...(flags.force ? ['--force'] : [])
	]);

	console.log('');
	console.log(`Real project: ${projectPath}`);
	console.log(`Orchestrator workspace: ${workspaceDir}`);
	console.log('This workspace stays next to the real project as a sibling, so orchestrator files do not pollute the product repo.');
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
		initProject(argv.slice(1));
		break;
	case 'init-workspace':
		initWorkspace(argv.slice(1));
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
	default:
		console.error(`Unknown command: ${command}`);
		printHelp();
		process.exit(1);
}
