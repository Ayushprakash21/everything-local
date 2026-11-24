import { runValidation as validateEnv } from './validate-environments';
import { validateSecrets } from './validate-secrets';

console.log('====================================================');
console.log('EVERYBAZAAR FULL RELEASE CANDIDATE VALIDATION SUITE');
console.log('====================================================\n');

try {
  console.log('STEP 1: Validating Cloudflare Environment Isolation...');
  validateEnv();

  console.log('\nSTEP 2: Validating Secret Hygiene & Fail-Closed Auth...');
  const secResult = validateSecrets();
  if (!secResult.valid) {
    throw new Error('Secret hygiene check failed.');
  }

  console.log('\n🎉 ALL RELEASE CANDIDATE CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
} catch (err: any) {
  console.error('\n❌ RELEASE VALIDATION FAILED:', err.message);
  process.exit(1);
}
