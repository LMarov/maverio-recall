const fs = require('node:fs');

function loadEnvFile(candidates) {
  for (const p of candidates) {
    try {
      const raw = fs.readFileSync(p, 'utf8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      }
      return p;
    } catch {
      // try next candidate
    }
  }
  return null;
}

module.exports = { loadEnvFile };
