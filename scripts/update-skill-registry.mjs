#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SKILLS_DIR = path.join(ROOT, '.claude', 'skills');
const OUTPUT_DIR = path.join(ROOT, '.atl');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'skill-registry.md');

const CONVENTION_FILES = [
	'AGENTS.md',
	'agents.md',
	'CLAUDE.md',
	'ORCHESTRATOR.md',
	'PROJECT.md',
	'README.md'
];

function ensureDir(dir) {
	fs.mkdirSync(dir, {recursive: true});
}

function listSkillFiles(dir) {
	if (!fs.existsSync(dir)) return [];
	const entries = fs.readdirSync(dir, {withFileTypes: true});
	const files = [];
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const name = entry.name;
		if (name === '_shared') continue;
		const file = path.join(dir, name, 'SKILL.md');
		if (fs.existsSync(file)) files.push(file);
	}
	return files.sort((a, b) => a.localeCompare(b));
}

function extractName(content, fallback) {
	const match = content.match(/^\s*name:\s*(.+)$/im);
	return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : fallback;
}

function extractTrigger(content = '') {
	const match = content.match(/Trigger:\s*["']?(.+?)["']?$/im);
	return match ? match[1].trim() : 'manual';
}

function compactRules(content) {
	const lines = content
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean);

	const bullets = [];
	for (const line of lines) {
		if (line.startsWith('- ') || line.startsWith('* ')) {
			bullets.push(line.replace(/^[-*]\s*/, ''));
		}
	}

	const selected = bullets.slice(0, 8);
	return selected.length > 0
		? selected
		: ['Usa esta skill solo para el propósito definido en su descripción.'];
}

function toPosix(filePath) {
	return filePath.replaceAll('\\', '/');
}

function buildRegistry() {
	const skillFiles = listSkillFiles(SKILLS_DIR);
	const skills = skillFiles.map(file => {
		const content = fs.readFileSync(file, 'utf8');
		return {
			name: extractName(content, path.basename(path.dirname(file))),
			trigger: extractTrigger(content),
			path: toPosix(path.relative(ROOT, file)),
			rules: compactRules(content)
		};
	});

	const conventions = CONVENTION_FILES.filter(file => fs.existsSync(path.join(ROOT, file))).map(
		file => ({
			file,
			path: toPosix(file),
			notes: file === 'ORCHESTRATOR.md' ? 'Punto de entrada de la sesión del orquestador' : ''
		})
	);

	const registry = [
		'# Skill Registry',
		'',
		'**Project-local only.** Este registry prioriza las skills dentro de `./.claude/skills/` para evitar depender de instalaciones globales como `gentle-ai`.',
		'',
		'## User Skills',
		'',
		'| Trigger | Skill | Path |',
		'|---------|-------|------|',
		...(skills.length > 0
			? skills.map(skill => `| ${skill.trigger.replaceAll('|', '\\|')} | ${skill.name} | \`${skill.path}\` |`)
			: ['| manual | none | _No hay skills locales todavía_ |']),
		'',
		'## Compact Rules',
		'',
		...(skills.length > 0
			? skills.flatMap(skill => [
					`### ${skill.name}`,
					...skill.rules.map(rule => `- ${rule}`),
					''
			  ])
			: ['No hay skills locales registradas todavía.', '']),
		'## Project Conventions',
		'',
		'| File | Path | Notes |',
		'|------|------|-------|',
		...(conventions.length > 0
			? conventions.map(item => `| ${item.file} | \`${item.path}\` | ${item.notes || ''} |`)
			: ['| none | none | No se encontraron archivos de convención |']),
		'',
		'## Resolution Policy',
		'',
		'- Prioriza siempre skills locales de `./.claude/skills/`.',
		'- No dependas de `~/.claude/skills/` para el funcionamiento principal del orquestador.',
		'- Si una skill global existe con el mismo nombre, la local del proyecto gana.',
		'- Regenera este archivo después de crear, borrar o cambiar skills locales.'
	];

	return registry.join('\n');
}

ensureDir(OUTPUT_DIR);
const registry = buildRegistry();
fs.writeFileSync(OUTPUT_FILE, `${registry}\n`, 'utf8');
console.log(`Skill registry actualizado en ${OUTPUT_FILE}`);
