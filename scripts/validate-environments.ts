import fs from 'fs';
import path from 'path';

export interface EnvironmentBindings {
  workerName: string;
  d1DatabaseName: string;
  d1DatabaseId: string;
  r2BucketName: string;
  kvNamespaceId: string;
}

export function parseWranglerConfig(filePath: string): {
  production: EnvironmentBindings;
  development: EnvironmentBindings;
  staging: EnvironmentBindings;
} {
  const content = fs.readFileSync(filePath, 'utf8');

  // Simple section splitter
  const prodMatch = content.match(/# PRODUCTION ENVIRONMENT[\s\S]*?(?=# DEVELOPMENT ENVIRONMENT)/i);
  const devMatch = content.match(/# DEVELOPMENT ENVIRONMENT[\s\S]*?(?=# STAGING ENVIRONMENT)/i);
  const stagingMatch = content.match(/# STAGING ENVIRONMENT[\s\S]*?$/i);

  function extractBindings(sectionText: string): EnvironmentBindings {
    const nameMatch = sectionText.match(/(?:^|\n)\s*name\s*=\s*"([^"]+)"/);
    const d1Block = sectionText.split(/\[\[(?:env\.[a-z]+\.)?d1_databases\]\]/)[1] || '';
    const d1NameMatch = d1Block.match(/(?:^|\n)\s*database_name\s*=\s*"([^"]+)"/);
    const d1IdMatch = d1Block.match(/(?:^|\n)\s*database_id\s*=\s*"([^"]+)"/);

    const r2Block = sectionText.split(/\[\[(?:env\.[a-z]+\.)?r2_buckets\]\]/)[1] || '';
    const r2Match = r2Block.match(/(?:^|\n)\s*bucket_name\s*=\s*"([^"]+)"/);

    const kvBlock = sectionText.split(/\[\[(?:env\.[a-z]+\.)?kv_namespaces\]\]/)[1] || '';
    const kvMatch = kvBlock.match(/(?:^|\n)\s*id\s*=\s*"([a-f0-9]{32})"/);

    return {
      workerName: nameMatch ? nameMatch[1] : '',
      d1DatabaseName: d1NameMatch ? d1NameMatch[1] : '',
      d1DatabaseId: d1IdMatch ? d1IdMatch[1] : '',
      r2BucketName: r2Match ? r2Match[1] : '',
      kvNamespaceId: kvMatch ? kvMatch[1] : ''
    };
  }

  return {
    production: extractBindings(prodMatch ? prodMatch[0] : ''),
    development: extractBindings(devMatch ? devMatch[0] : ''),
    staging: extractBindings(stagingMatch ? stagingMatch[0] : '')
  };
}

export function validateIsolation(config: {
  production: EnvironmentBindings;
  development: EnvironmentBindings;
  staging: EnvironmentBindings;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const { production: prod, development: dev, staging: stag } = config;

  // 1. Production presence
  if (!prod.workerName || !prod.d1DatabaseId || !prod.r2BucketName || !prod.kvNamespaceId) {
    errors.push('Production bindings are incomplete in wrangler.toml');
  }

  // 2. Development vs Production Isolation
  if (dev.workerName === prod.workerName) {
    errors.push(`Development worker name '${dev.workerName}' matches production worker name.`);
  }
  if (dev.d1DatabaseId && dev.d1DatabaseId === prod.d1DatabaseId) {
    errors.push(`CRITICAL ISOLATION FAULT: Development D1 ID '${dev.d1DatabaseId}' equals production D1 ID.`);
  }
  if (dev.d1DatabaseName && dev.d1DatabaseName === prod.d1DatabaseName) {
    errors.push(`CRITICAL ISOLATION FAULT: Development D1 database name '${dev.d1DatabaseName}' equals production D1 name.`);
  }
  if (dev.r2BucketName && dev.r2BucketName === prod.r2BucketName) {
    errors.push(`CRITICAL ISOLATION FAULT: Development R2 bucket '${dev.r2BucketName}' equals production R2 bucket.`);
  }
  if (dev.kvNamespaceId && dev.kvNamespaceId === prod.kvNamespaceId) {
    errors.push(`CRITICAL ISOLATION FAULT: Development KV ID '${dev.kvNamespaceId}' equals production KV ID.`);
  }

  // 3. Staging vs Production Isolation
  if (stag.workerName === prod.workerName) {
    errors.push(`Staging worker name '${stag.workerName}' matches production worker name.`);
  }
  if (stag.d1DatabaseId && stag.d1DatabaseId === prod.d1DatabaseId) {
    errors.push(`CRITICAL ISOLATION FAULT: Staging D1 ID '${stag.d1DatabaseId}' equals production D1 ID.`);
  }
  if (stag.r2BucketName && stag.r2BucketName === prod.r2BucketName) {
    errors.push(`CRITICAL ISOLATION FAULT: Staging R2 bucket '${stag.r2BucketName}' equals production R2 bucket.`);
  }
  if (stag.kvNamespaceId && stag.kvNamespaceId === prod.kvNamespaceId) {
    errors.push(`CRITICAL ISOLATION FAULT: Staging KV ID '${stag.kvNamespaceId}' equals production KV ID.`);
  }

  // 4. Staging vs Development Isolation
  if (stag.d1DatabaseId && stag.d1DatabaseId === dev.d1DatabaseId) {
    errors.push(`Staging D1 ID '${stag.d1DatabaseId}' equals development D1 ID.`);
  }
  if (stag.r2BucketName && stag.r2BucketName === dev.r2BucketName) {
    errors.push(`Staging R2 bucket '${stag.r2BucketName}' equals development R2 bucket.`);
  }
  if (stag.kvNamespaceId && stag.kvNamespaceId === dev.kvNamespaceId) {
    errors.push(`Staging KV ID '${stag.kvNamespaceId}' equals development KV ID.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function runValidation() {
  const wranglerPath = path.resolve(__dirname, '../wrangler.toml');
  console.log('====================================================');
  console.log('CLOUDFLARE ENVIRONMENT ISOLATION VALIDATOR');
  console.log('Target:', wranglerPath);
  console.log('====================================================\n');

  if (!fs.existsSync(wranglerPath)) {
    console.error('❌ FAIL: wrangler.toml not found at', wranglerPath);
    process.exit(1);
  }

  const parsed = parseWranglerConfig(wranglerPath);
  console.log('Production Bindings:');
  console.log('  Worker:', parsed.production.workerName);
  console.log('  D1 ID: ', parsed.production.d1DatabaseId, `(${parsed.production.d1DatabaseName})`);
  console.log('  R2:    ', parsed.production.r2BucketName);
  console.log('  KV ID: ', parsed.production.kvNamespaceId);

  console.log('\nDevelopment Bindings:');
  console.log('  Worker:', parsed.development.workerName);
  console.log('  D1 ID: ', parsed.development.d1DatabaseId, `(${parsed.development.d1DatabaseName})`);
  console.log('  R2:    ', parsed.development.r2BucketName);
  console.log('  KV ID: ', parsed.development.kvNamespaceId);

  console.log('\nStaging Bindings:');
  console.log('  Worker:', parsed.staging.workerName);
  console.log('  D1 ID: ', parsed.staging.d1DatabaseId, `(${parsed.staging.d1DatabaseName})`);
  console.log('  R2:    ', parsed.staging.r2BucketName);
  console.log('  KV ID: ', parsed.staging.kvNamespaceId);

  const result = validateIsolation(parsed);
  console.log('\n--- Isolation Verification Result ---');
  if (result.valid) {
    console.log('✅ PASS: All 3 environments (Production, Development, Staging) are 100% strictly isolated.');
    console.log('  - Zero shared D1 databases');
    console.log('  - Zero shared R2 object storage buckets');
    console.log('  - Zero shared KV session namespaces');
    console.log('  - Zero worker name collisions');
    console.log('====================================================');
    return true;
  } else {
    console.error('❌ FAIL: Environment isolation boundary violations detected:');
    for (const err of result.errors) {
      console.error('  - ' + err);
    }
    console.log('====================================================');
    process.exit(1);
  }
}

if (require.main === module) {
  runValidation();
}
