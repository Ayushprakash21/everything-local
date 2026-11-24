require('dotenv').config();
const { execSync } = require('child_process');

const fullCmd = process.argv.slice(2).join(' ');
if (!fullCmd) {
  console.error('Usage: node scripts/run_with_env.js <command>');
  process.exit(1);
}

try {
  execSync(fullCmd, {
    env: process.env,
    stdio: 'inherit'
  });
} catch (err) {
  process.exit(err.status || 1);
}
