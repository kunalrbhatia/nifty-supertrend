import { execSync } from 'child_process';

const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const validPrefixes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
const branchRegex = new RegExp(`^(${validPrefixes.join('|')})\\/.*$`);

if (branchName === 'master' || branchName === 'main') {
  process.exit(0);
}

if (!branchRegex.test(branchName)) {
  console.error(`❌ Invalid branch name: "${branchName}"`);
  console.error(`Branch names must follow conventional format: <type>/<description>`);
  console.error(`Allowed types: ${validPrefixes.join(', ')}`);
  console.error(`Example: feat/add-logging`);
  process.exit(1);
}

console.log('✅ Branch name is valid.');
process.exit(0);
