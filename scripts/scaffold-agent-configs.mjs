#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const files = [
	[
		'.claude/README.md',
		[
			'# Claude Local Config',
			'',
			'Esta carpeta contiene la configuración local del proyecto para Claude.',
			'',
			'- `skills/` guarda skills propias del repo',
			'- `CLAUDE.md` en la raíz define el routing del proyecto',
			'- esta capa local debe priorizarse sobre configuración global del usuario'
		].join('\n')
	],
	[
		'.codex/README.md',
		[
			'# Codex Local Config',
			'',
			'Esta carpeta reserva la configuración local del proyecto para Codex.',
			'',
			'- hoy se usa como base reusable del proyecto',
			'- mañana puede alojar prompts, perfiles, reglas o plugins locales',
			'- no debe depender solo de configuración global del usuario'
		].join('\n')
	],
	[
		'.opencode/README.md',
		[
			'# OpenCode Local Config',
			'',
			'Esta carpeta reserva la configuración local del proyecto para OpenCode.',
			'',
			'- hoy se usa como base reusable del proyecto',
			'- mañana puede alojar reglas, prompts o convenciones específicas',
			'- no debe depender solo de configuración global del usuario'
		].join('\n')
	]
];

for (const [relativePath, content] of files) {
	const absolutePath = path.join(ROOT, relativePath);
	fs.mkdirSync(path.dirname(absolutePath), {recursive: true});
	if (!fs.existsSync(absolutePath)) {
		fs.writeFileSync(absolutePath, `${content}\n`, 'utf8');
	}
}

console.log('Configuración local por agente creada o verificada.');
