import fs from 'fs';
import path from 'path';

export function validateSecrets(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rootDir = path.resolve(__dirname, '..');
  const wranglerPath = path.join(rootDir, 'wrangler.toml');
  const gitignorePath = path.join(rootDir, '.gitignore');

  console.log('====================================================');
  console.log('CLOUDFLARE SECRET & AUTHENTICATION HYGIENE VALIDATOR');
  console.log('====================================================\n');

  // 1. Check wrangler.toml for committed JWT_SECRET
  if (fs.existsSync(wranglerPath)) {
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    if (/JWT_SECRET\s*=/i.test(wranglerContent)) {
      errors.push("CRITICAL SECRET EXPOSURE: 'JWT_SECRET' found in plain-text inside wrangler.toml vars.");
    } else {
      console.log('✅ PASS: wrangler.toml is clean (zero committed JWT_SECRET plain-text vars).');
    }

    if (/cfut_[a-zA-Z0-9_-]{30,}/i.test(wranglerContent)) {
      errors.push("CRITICAL SECRET EXPOSURE: Cloudflare API token pattern found in wrangler.toml.");
    } else {
      console.log('✅ PASS: wrangler.toml contains no committed Cloudflare API tokens.');
    }
  }

  // 2. Check .gitignore for .dev.vars and .env exclusion
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    const hasDevVars = /\.dev\.vars/i.test(gitignoreContent);
    const hasEnv = /\.env/i.test(gitignoreContent);

    if (!hasDevVars) {
      errors.push("SECURITY FAULT: '.dev.vars*' is not present in .gitignore.");
    } else {
      console.log('✅ PASS: .dev.vars* is properly excluded in .gitignore.');
    }

    if (!hasEnv) {
      errors.push("SECURITY FAULT: '.env*' is not present in .gitignore.");
    } else {
      console.log('✅ PASS: .env* is properly excluded in .gitignore.');
    }
  }

  // 3. Fail-Closed Authentication Verification
  // In server/src/worker.ts, getSecret must throw if JWT_SECRET is missing or < 32 chars
  try {
    const workerTs = fs.readFileSync(path.join(rootDir, 'server/src/worker.ts'), 'utf8');
    const hasFailClosed = workerTs.includes('SECURITY FATAL') && workerTs.includes('JWT_SECRET must be at least 32 characters');
    const disallowsFallback = workerTs.includes('Compromised or placeholder JWT_SECRET is strictly forbidden');

    if (!hasFailClosed || !disallowsFallback) {
      errors.push("SECURITY FAULT: Worker authentication does not strictly fail closed or allow placeholder fallbacks.");
    } else {
      console.log('✅ PASS: Worker authentication strictly fails closed with zero placeholder bypasses.');
    }
  } catch (err: any) {
    errors.push('Failed to read server/src/worker.ts: ' + err.message);
  }

  console.log('\n--- Secret Hygiene Verdict ---');
  if (errors.length === 0) {
    console.log('✅ PASS: All secret management and authentication security rules validated.');
    console.log('====================================================');
    return { valid: true, errors: [] };
  } else {
    console.error('❌ FAIL: Secret management violations detected:');
    for (const err of errors) {
      console.error('  - ' + err);
    }
    console.log('====================================================');
    return { valid: false, errors };
  }
}

if (require.main === module) {
  const result = validateSecrets();
  if (!result.valid) {
    process.exit(1);
  }
}
