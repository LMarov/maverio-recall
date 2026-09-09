const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

function storePath() {
  return path.join(app.getPath('userData'), 'recall-store.json');
}

function readStore() {
  try {
    const raw = fs.readFileSync(storePath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStore(data) {
  const p = storePath();
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data), 'utf8');
  fs.renameSync(tmp, p);
}

module.exports = { readStore, writeStore, storePath };
