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
			'This folder contains project-local Claude configuration.',
			'',
			'- `skills/` stores repo-specific skills',
			'- root `CLAUDE.md` defines project routing',
			'- this local layer should take priority over global user config'
		].join('\n')
	],
	[
		'.codex/README.md',
		[
			'# Codex Local Config',
			'',
			'This folder reserves project-local configuration for Codex.',
			'',
			'- today it is used as the reusable local project base',
			'- later it can hold prompts, profiles, rules, or local plugins',
			'- it should not depend only on global user config'
		].join('\n')
	],
	[
		'.opencode/README.md',
		[
			'# OpenCode Local Config',
			'',
			'This folder reserves project-local configuration for OpenCode.',
			'',
			'- today it is used as the reusable local project base',
			'- later it can hold rules, prompts, or specific conventions',
			'- it should not depend only on global user config'
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

console.log('Local agent configuration created or verified.');
