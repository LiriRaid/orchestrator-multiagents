#!/usr/bin/env node
'use strict';
// Reads NOTIFY.md from the workspace and writes its content to stdout so the
// Claude Code hook injects it into the interactive session.
// The file is deleted after reading to avoid repeating the notification.
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
