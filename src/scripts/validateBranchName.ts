import { execSync } from 'child_process';
import logger from '../helpers/logger.js';

const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const validPrefixes = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];
const branchRegex = new RegExp(`^(${validPrefixes.join('|')})\\/.*$`);

if (branchName === 'master' || branchName === 'main') {
  process.exit(0);
}

if (!branchRegex.test(branchName)) {
  logger.error(`❌ Invalid branch name: "${branchName}"`);
  logger.error(`Branch names must follow conventional format: <type>/<description>`);
  logger.error(`Allowed types: ${validPrefixes.join(', ')}`);
  logger.error(`Example: feat/add-logging`);
  process.exit(1);
}

logger.info('✅ Branch name is valid.');
process.exit(0);
