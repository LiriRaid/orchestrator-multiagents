#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const CONFIG_FILE = path.join(ROOT, 'orchestrator.config.json');
const CONFIG = fs.existsSync(CONFIG_FILE)
	? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
	: {};
const LANGUAGE = CONFIG.workspaceLanguage === 'en' ? 'en' : 'es';

const CONTENT = {
	es: {
		claude: [
			'# Claude Local Config',
			'',
			'Esta carpeta contiene la configuración local del proyecto para Claude.',
			'',
			'- `skills/` guarda skills propias del repo',
			'- `CLAUDE.md` en la raíz define el routing del proyecto',
			'- esta capa local debe priorizarse sobre configuración global del usuario'
		],
		codex: [
			'# Codex Local Config',
			'',
			'Esta carpeta reserva la configuración local del proyecto para Codex.',
			'',
			'- hoy se usa como base reusable del proyecto',
			'- mañana puede alojar prompts, perfiles, reglas o plugins locales',
			'- no debe depender solo de configuración global del usuario'
		],
		opencode: [
			'# OpenCode Local Config',
			'',
			'Esta carpeta reserva la configuración local del proyecto para OpenCode.',
			'',
			'- hoy se usa como base reusable del proyecto',
			'- mañana puede alojar reglas, prompts o convenciones específicas',
			'- no debe depender solo de configuración global del usuario'
		],
		done: 'Configuración local por agente creada o verificada.'
	},
	en: {
		claude: [
			'# Claude Local Config',
			'',
			'This folder contains project-local Claude configuration.',
			'',
			'- `skills/` stores repo-specific skills',
			'- root `CLAUDE.md` defines project routing',
			'- this local layer should take priority over global user config'
		],
		codex: [
			'# Codex Local Config',
			'',
			'This folder reserves project-local configuration for Codex.',
			'',
			'- today it is used as the reusable local project base',
			'- later it can hold prompts, profiles, rules, or local plugins',
			'- it should not depend only on global user config'
		],
		opencode: [
			'# OpenCode Local Config',
			'',
			'This folder reserves project-local configuration for OpenCode.',
			'',
			'- today it is used as the reusable local project base',
			'- later it can hold rules, prompts, or specific conventions',
			'- it should not depend only on global user config'
		],
		done: 'Local agent configuration created or verified.'
	}
};
const L = CONTENT[LANGUAGE];

const files = [
	[
		'.claude/README.md',
		L.claude.join('\n')
	],
	[
		'.codex/README.md',
		L.codex.join('\n')
	],
	[
		'.opencode/README.md',
		L.opencode.join('\n')
	]
];

for (const [relativePath, content] of files) {
	const absolutePath = path.join(ROOT, relativePath);
	fs.mkdirSync(path.dirname(absolutePath), {recursive: true});
	if (!fs.existsSync(absolutePath)) {
		fs.writeFileSync(absolutePath, `${content}\n`, 'utf8');
	}
}

console.log(L.done);
