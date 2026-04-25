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
	const triggerLine = content.match(/^Trigger:\s*(.+)$/im);
	if (triggerLine) return triggerLine[1].trim();
	const descriptionTrigger = content.match(/Trigger:\s*([^.\n]+)/im);
	return descriptionTrigger ? descriptionTrigger[1].trim() : 'manual';
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
		: ['Use this skill only for the purpose defined in its description.'];
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
			notes: file === 'ORCHESTRATOR.md' ? 'Orchestrator session entry point' : ''
		})
	);

	const registry = [
		'# Skill Registry',
		'',
		'**Project-local only.** This registry prioritizes skills inside `./.claude/skills/` so the workflow does not depend on global installations such as `gentle-ai`.',
		'',
		'## User Skills',
		'',
		'| Trigger | Skill | Path |',
		'|---------|-------|------|',
		...(skills.length > 0
			? skills.map(skill => `| ${skill.trigger.replaceAll('|', '\\|')} | ${skill.name} | \`${skill.path}\` |`)
			: ['| manual | none | _No local skills yet_ |']),
		'',
		'## Compact Rules',
		'',
		...(skills.length > 0
			? skills.flatMap(skill => [
					`### ${skill.name}`,
					...skill.rules.map(rule => `- ${rule}`),
					''
			  ])
			: ['No local skills are registered yet.', '']),
		'## Project Conventions',
		'',
		'| File | Path | Notes |',
		'|------|------|-------|',
		...(conventions.length > 0
			? conventions.map(item => `| ${item.file} | \`${item.path}\` | ${item.notes || ''} |`)
			: ['| none | none | No convention files found |']),
		'',
		'## Resolution Policy',
		'',
		'- Always prefer local skills from `./.claude/skills/`.',
		'- Do not depend on `~/.claude/skills/` for the main orchestrator workflow.',
		'- If a global skill has the same name as a project-local skill, the local skill wins.',
		'- Regenerate this file after creating, deleting, or changing local skills.'
	];

	return registry.join('\n');
}

ensureDir(OUTPUT_DIR);
const registry = buildRegistry();
fs.writeFileSync(OUTPUT_FILE, `${registry}\n`, 'utf8');
console.log(`Skill registry updated at ${OUTPUT_FILE}`);
