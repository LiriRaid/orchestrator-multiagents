#!/usr/bin/env node
'use strict';
// Lee NOTIFY.md del workspace y vuelca el contenido a stdout para que
// el hook de Claude Code lo inyecte en la sesión interactiva.
// El archivo se elimina después de leerse para no repetir la notificación.
const fs = require('fs');
const path = require('path');

const notifyFile = path.join(process.cwd(), 'NOTIFY.md');
if (!fs.existsSync(notifyFile)) process.exit(0);

const content = fs.readFileSync(notifyFile, 'utf8').trim();
if (!content) {
  try { fs.unlinkSync(notifyFile); } catch {}
  process.exit(0);
}

try { fs.unlinkSync(notifyFile); } catch {}

process.stdout.write('\n' + content + '\n');
