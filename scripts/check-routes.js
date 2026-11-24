const fs = require('fs');
const content = fs.readFileSync('server/src/worker.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('app.get') || line.includes('app.post') || line.includes('app.put') || line.includes('app.delete') || line.includes('app.route')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
