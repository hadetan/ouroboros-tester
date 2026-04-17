import { Command } from 'commander';
import { createRequire } from 'module';
import { InitCommand } from './commands/init.js';

const require = createRequire(import.meta.url);
const { version, description } = require('../../package.json');

const program = new Command();

program
  .name('orb')
  .description(description)
  .version(version);

program
  .command('init')
  .description('Initialize a new Ouroboros Tester project')
  .argument('<base-url>', 'Base URL of the application to test')
  .option('--name <name>', 'Human-readable project name')
  .option('--dir <dir>', 'Target directory (defaults to current directory)')
  .option('--auth', 'Enable authentication setup')
  .option('--skip-install', 'Skip npm install after scaffolding')
  .action(async (baseUrl: string, options) => {
    const init = new InitCommand();
    await init.execute(baseUrl, options);
  });

program.parse();
