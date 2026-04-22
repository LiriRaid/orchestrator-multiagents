#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CHANGE_NAME = process.argv[2];

if (!CHANGE_NAME) {
	console.error('Uso: npm run openspec:new -- <change-name>');
	process.exit(1);
}

const base = path.join(ROOT, 'openspec', 'changes', CHANGE_NAME);
const templates = path.join(ROOT, 'openspec', 'templates');

const files = [
	['proposal.md', 'proposal.md'],
	['design.md', 'design.md'],
	['tasks.md', 'tasks.md'],
	['verify-report.md', 'verify-report.md'],
	['archive-report.md', 'archive-report.md'],
	['.openspec.yaml', 'change-metadata.yaml']
];

fs.mkdirSync(base, {recursive: true});
const specsDir = path.join(base, 'specs');
fs.mkdirSync(specsDir, {recursive: true});

for (const [targetName, templateName] of files) {
	const target = path.join(base, targetName);
	if (fs.existsSync(target)) continue;
	const template = fs.readFileSync(path.join(templates, templateName), 'utf8');
	const content = template.replaceAll('<change-name>', CHANGE_NAME);
	fs.writeFileSync(target, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

const specTemplate = fs.readFileSync(path.join(templates, 'spec.md'), 'utf8');
const specTarget = path.join(specsDir, 'spec.md');
if (!fs.existsSync(specTarget)) {
	const specContent = specTemplate.replaceAll('<change-name>', CHANGE_NAME);
	fs.writeFileSync(specTarget, specContent.endsWith('\n') ? specContent : `${specContent}\n`, 'utf8');
}

const readme = [
	`# ${CHANGE_NAME}`,
	'',
	'Este change fue generado desde las plantillas locales de `openspec/`.',
	'',
	'## Files',
	'',
	'- `proposal.md`',
	'- `design.md`',
	'- `tasks.md`',
	'- `verify-report.md`',
	'- `archive-report.md`',
	'- `.openspec.yaml`',
	'- `specs/spec.md`'
].join('\n');

const changeReadme = path.join(base, 'README.md');
if (!fs.existsSync(changeReadme)) {
	fs.writeFileSync(changeReadme, `${readme}\n`, 'utf8');
}

console.log(`OpenSpec change creado en ${base}`);
