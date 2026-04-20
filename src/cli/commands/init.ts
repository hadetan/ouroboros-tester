import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const bold = '\x1b[1m';
const reset = '\x1b[0m';

interface InitOptions {
  name?: string;
  dir?: string;
  auth?: boolean;
  skipInstall?: boolean;
}

export class InitCommand {
  private packageRoot: string;

  constructor() {
    // two levels up from dist/cli/commands/
    this.packageRoot = path.resolve(__dirname, '..', '..', '..');
  }

  async execute(baseUrl: string, options: InitOptions): Promise<void> {
    const projectName = options.name || this.inferProjectName(baseUrl);
    const targetDir = path.resolve(options.dir || process.cwd());

    this.printBanner();
    console.log(`${cyan}Initializing Ouroboros Tester project${reset}`);
    console.log(`${dim}  Target:  ${targetDir}${reset}`);
    console.log(`${dim}  URL:     ${baseUrl}${reset}`);
    console.log(`${dim}  Name:    ${projectName}${reset}`);
    console.log();

    this.ensureDir(targetDir);

    this.createPackageJson(targetDir, projectName);

    this.createOuroborosConfig(targetDir, baseUrl, projectName, options.auth);

    this.createTsConfig(targetDir);

    this.copyFrameworkFiles(targetDir);

    this.createMcpConfig(targetDir);

    this.scaffoldSrcStructure(targetDir, projectName);

    this.createProjectDocs(targetDir, projectName, baseUrl);

    this.createGitignore(targetDir);

    if (!options.skipInstall) {
      this.installDependencies(targetDir);
    }

    this.printSuccess(targetDir, projectName);
  }

  private printBanner(): void {
    console.log();
    console.log(`${cyan}   ╔═══════════════════════════════════════╗`);
    console.log(`   ║   ${bold}OUROBOROS TESTER${reset}${cyan}                    ║`);
    console.log(`   ║   AI-Driven Domain Test Automation    ║`);
    console.log(`   ╚═══════════════════════════════════════╝${reset}`);
    console.log();
  }

  private inferProjectName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^(www|dev|staging|app)\./, '').split('.')[0] + '-tests';
    } catch {
      return 'ouroboros-tests';
    }
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private createPackageJson(targetDir: string, projectName: string): void {
    const pkgPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      console.log(`${dim}  ⊘ package.json already exists, skipping${reset}`);
      return;
    }

    const pkg = {
      name: this.toKebabCase(projectName),
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        build: 'tsc -p tsconfig.build.json',
        dev: 'tsc -p tsconfig.build.json --watch',
        typecheck: 'tsc --noEmit',
        test: 'npx playwright test --config=src/tests/playwright.config.ts',
        'test:headed': 'npx playwright test --config=src/tests/playwright.config.ts --headed',
        'test:ui': 'npx playwright test --config=src/tests/playwright.config.ts --ui',
        'test:debug': 'npx playwright test --config=src/tests/playwright.config.ts --debug',
        'test:report': 'npx playwright show-report',
        'validate:specs': 'node scripts/validate-spec.mjs --all',
        'validate:spec': 'node scripts/validate-spec.mjs',
        'api:auth': 'node scripts/api-probe.mjs auth --json',
        'api:probe': 'node scripts/api-probe.mjs probe',
        'api:smoke': 'node scripts/api-probe.mjs smoke --json',
      },
      dependencies: {
        'ouroboros-tester': `^${this.getPackageVersion()}`,
      },
      devDependencies: {
        '@playwright/test': '^1.50.0',
        '@types/node': '^22.0.0',
        typescript: '^5.7.0',
      },
    };

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`${green}  ✓ Created package.json${reset}`);
  }

  private createOuroborosConfig(
    targetDir: string,
    baseUrl: string,
    projectName: string,
    auth?: boolean,
  ): void {
    const configDir = path.join(targetDir, '.ouroboros');
    this.ensureDir(configDir);

    const configPath = path.join(configDir, 'config.json');
    if (!fs.existsSync(configPath)) {
      const templatePath = path.join(this.packageRoot, 'templates', 'config.template.json');
      const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
      template.project.name = projectName;
      template.project.baseUrl = baseUrl;
      template.auth.required = !!auth;
      if (auth) {
        template.auth.loginUrl = baseUrl + '/login';
      }
      fs.writeFileSync(configPath, JSON.stringify(template, null, 2) + '\n');
      console.log(`${green}  ✓ Created .ouroboros/config.json${reset}`);
    }

    const scopePath = path.join(configDir, 'testing-scope.md');
    if (!fs.existsSync(scopePath)) {
      const scopeTemplate = path.join(this.packageRoot, 'templates', 'testing-scope.md');
      if (fs.existsSync(scopeTemplate)) {
        fs.copyFileSync(scopeTemplate, scopePath);
      } else {
        fs.writeFileSync(
          scopePath,
          '# Testing Scope\n\n## What to test\n\n## What not to test\n',
        );
      }
      console.log(`${green}  ✓ Created .ouroboros/testing-scope.md${reset}`);
    }
  }

  private createTsConfig(targetDir: string): void {
    const tsconfigPath = path.join(targetDir, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      const tsconfig = {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          types: ['node'],
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          declaration: false,
          outDir: './dist',
          rootDir: '.',
          paths: {
            'ouroboros-tester': ['./node_modules/ouroboros-tester/dist/index.d.ts'],
            'ouroboros-tester/*': ['./node_modules/ouroboros-tester/dist/*'],
          },
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      };
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
      console.log(`${green}  ✓ Created tsconfig.json${reset}`);
    }

    // for users who want to compile their domain code
    const buildTsconfigPath = path.join(targetDir, 'tsconfig.build.json');
    if (!fs.existsSync(buildTsconfigPath)) {
      const buildTsconfig = {
        extends: './tsconfig.json',
        compilerOptions: {
          rootDir: './src',
          outDir: './dist',
          declaration: true,
          declarationMap: true,
          sourceMap: true,
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist', 'src/tests'],
      };
      fs.writeFileSync(buildTsconfigPath, JSON.stringify(buildTsconfig, null, 2) + '\n');
      console.log(`${green}  ✓ Created tsconfig.build.json${reset}`);
    }
  }

  private copyFrameworkFiles(targetDir: string): void {
    this.copyDir(
      path.join(this.packageRoot, '.github', 'agents'),
      path.join(targetDir, '.github', 'agents'),
    );
    this.copyDir(
      path.join(this.packageRoot, '.github', 'prompts'),
      path.join(targetDir, '.github', 'prompts'),
    );
    this.copyDir(
      path.join(this.packageRoot, '.github', 'workflows'),
      path.join(targetDir, '.github', 'workflows'),
    );
    this.copyDir(
      path.join(this.packageRoot, '.github', 'instructions'),
      path.join(targetDir, '.github', 'instructions'),
    );
    console.log(`${green}  ✓ Copied .github/ (agents, prompts, workflows, instructions)${reset}`);

    const claudeSrc = path.join(this.packageRoot, '.claude', 'commands');
    if (fs.existsSync(claudeSrc)) {
      this.copyDir(claudeSrc, path.join(targetDir, '.claude', 'commands'));
      console.log(`${green}  ✓ Copied .claude/commands/${reset}`);
    }

    this.copyDir(
      path.join(this.packageRoot, 'scripts'),
      path.join(targetDir, 'scripts'),
    );
    console.log(`${green}  ✓ Copied scripts/ (api-probe, validators)${reset}`);
  }

  private scaffoldSrcStructure(targetDir: string, projectName: string): void {
    const dirs = [
      'src/docs',
      'src/pages',
      'src/tests/fixtures',
    ];
    for (const dir of dirs) {
      this.ensureDir(path.join(targetDir, dir));
    }

    const stateDest = path.join(targetDir, 'src', 'docs', 'STATE.md');
    if (!fs.existsSync(stateDest)) {
      const stateTemplate = path.join(this.packageRoot, 'templates', 'STATE.md');
      if (fs.existsSync(stateTemplate)) {
        let content = fs.readFileSync(stateTemplate, 'utf-8');
        content = content.replace(/\{project-name\}/g, projectName);
        fs.writeFileSync(stateDest, content);
      }
    }

    const domainTreeDest = path.join(targetDir, 'src', 'docs', 'DOMAIN-TREE.md');
    if (!fs.existsSync(domainTreeDest)) {
      const domainTreeTemplate = path.join(this.packageRoot, 'templates', 'DOMAIN-TREE.md');
      if (fs.existsSync(domainTreeTemplate)) {
        fs.copyFileSync(domainTreeTemplate, domainTreeDest);
      }
    }

    this.createPlaywrightConfig(targetDir);

    this.createAuthSetup(targetDir);

    console.log(`${green}  ✓ Scaffolded src/ structure${reset}`);
  }

  private createPlaywrightConfig(targetDir: string): void {
    const configPath = path.join(targetDir, 'src', 'tests', 'playwright.config.ts');
    if (fs.existsSync(configPath)) return;

    const content = `import { defineConfig, devices } from '@playwright/test';
import { loadConfig } from 'ouroboros-tester/utils/config';

const config = loadConfig();

export default defineConfig({
  testDir: '.',
  fullyParallel: config.testing?.parallel ?? true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : (config.testing?.retries ?? 1),
  workers: config.testing?.workers ?? undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: config.project.baseUrl,
    trace: config.testing?.traceOnFailure ? 'on-first-retry' : 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    ...(config.auth?.required
      ? [{ name: 'setup', testMatch: /auth\\.setup\\.ts/ }]
      : []),
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(config.auth?.required
          ? { storageState: config.auth.storageStatePath }
          : {}),
      },
      ...(config.auth?.required ? { dependencies: ['setup'] } : {}),
    },
  ],
});
`;
    fs.writeFileSync(configPath, content);
  }

  private createAuthSetup(targetDir: string): void {
    const setupPath = path.join(targetDir, 'src', 'tests', 'fixtures', 'auth.setup.ts');
    if (fs.existsSync(setupPath)) return;

    const content = `import { test as setup } from '@playwright/test';
import { loadConfig } from 'ouroboros-tester/utils/config';

const config = loadConfig();

setup('authenticate', async ({ page }) => {
  if (!config.auth?.required) {
    return;
  }

  const creds = config.auth.credentials?.default;
  if (!creds?.username || !creds?.password) {
    throw new Error('Auth credentials not configured in .ouroboros/config.json');
  }

  await page.goto(config.auth.loginUrl || config.project.baseUrl + '/login');

  // TODO: Replace with actual login form selectors after exploration
  await page.getByLabel(/username|email/i).fill(creds.username);
  await page.getByLabel(/password/i).fill(creds.password);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();

  await page.waitForURL('**/*', { timeout: 10000 });
  await page.context().storageState({ path: config.auth.storageStatePath });
});
`;
    fs.writeFileSync(setupPath, content);
  }

  private createProjectDocs(targetDir: string, projectName: string, baseUrl: string): void {
    const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
    if (!fs.existsSync(claudeMdPath)) {
      const content = `# CLAUDE.md

## Project Overview

**${projectName}** — Ouroboros Tester project targeting \`${baseUrl}\`.

This project uses the Ouroboros Tester framework for spec-driven AI test automation with Playwright.

## Commands

\`\`\`bash
# Tests
npm test               # Run Playwright tests (headless)
npm run test:headed    # Run with browser visible
npm run test:ui        # Playwright UI mode
npm run test:debug     # Step-through debugger
npm run test:report    # Open HTML report

# Validation
npm run validate:specs   # Validate all specs

# API & Auth
npm run api:auth         # Login and save storageState
npm run api:probe        # Probe an API endpoint
npm run api:smoke        # Full auth + API smoke test
\`\`\`

## Agent Pipeline

\`\`\`
/orb-explore <url> --name "<name>" [--auth]   → Explore and document page
/orb-verify <page-slug>                       → Verify spec accuracy
/orb-architect [--force]                       → Generate POM/fixtures/helpers
/orb-write-tests <page-slug>                  → Write test cases
/orb-run <url> --name "<name>"                → Full pipeline
/orb-status                                    → Show progress dashboard
\`\`\`

## Architecture

See the [Ouroboros Tester documentation](https://github.com/user/ouroboros-tester) for full architecture details.

### Key Files
- \`.ouroboros/config.json\` — Project configuration (gitignored)
- \`.ouroboros/testing-scope.md\` — What to test / skip
- \`src/docs/STATE.md\` — Progress tracking
- \`src/docs/\` — Generated specs (spec.md + impl.md per section)
- \`src/pages/\` — Generated page objects
- \`src/tests/\` — Generated test cases
- \`scripts/\` — API probe, validators
`;
      fs.writeFileSync(claudeMdPath, content);
    }

    const agentsMdPath = path.join(targetDir, 'AGENTS.md');
    if (!fs.existsSync(agentsMdPath)) {
      const sourceAgents = path.join(this.packageRoot, 'AGENTS.md');
      if (fs.existsSync(sourceAgents)) {
        fs.copyFileSync(sourceAgents, agentsMdPath);
      }
    }

    console.log(`${green}  ✓ Created project documentation${reset}`);
  }

  private createMcpConfig(targetDir: string): void {
    const mcpPath = path.join(targetDir, '.mcp.json');
    if (fs.existsSync(mcpPath)) {
      console.log(`${dim}  ⊘ .mcp.json already exists, skipping${reset}`);
      return;
    }

    const config = {
      mcpServers: {
        playwright: {
          command: 'npx',
          args: ['@playwright/mcp@latest'],
        },
      },
    };
    fs.writeFileSync(mcpPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`${green}  ✓ Created .mcp.json (Playwright MCP server)${reset}`);
  }

  private createGitignore(targetDir: string): void {
    const gitignorePath = path.join(targetDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) return;

    const content = `# Playwright (auth state, test results, reports)
playwright/*
test-results/
playwright-results/
playwright-report/
blob-report/

# Ouroboros config (contains credentials)
.ouroboros/config.json

# Node
node_modules/
dist/

# OS
.DS_Store
Thumbs.db

# Environment
.env
.playwright-mcp
`;
    fs.writeFileSync(gitignorePath, content);
    console.log(`${green}  ✓ Created .gitignore${reset}`);
  }

  private installDependencies(targetDir: string): void {
    console.log();
    console.log(`${cyan}  Installing dependencies...${reset}`);
    try {
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
      console.log(`${green}  ✓ Dependencies installed${reset}`);
    } catch {
      console.log(`${yellow}  ⚠ npm install failed — run it manually${reset}`);
    }

    console.log(`${cyan}  Installing Playwright browsers...${reset}`);
    try {
      execSync('npx playwright install chromium', { cwd: targetDir, stdio: 'inherit' });
      console.log(`${green}  ✓ Playwright browsers installed${reset}`);
    } catch {
      console.log(`${yellow}  ⚠ Playwright install failed — run 'npx playwright install' manually${reset}`);
    }
  }

  private printSuccess(targetDir: string, projectName: string): void {
    console.log();
    console.log(`${green}  ══════════════════════════════════════════${reset}`);
    console.log(`${green}  ✓ ${bold}${projectName}${reset}${green} initialized successfully!${reset}`);
    console.log(`${green}  ══════════════════════════════════════════${reset}`);
    console.log();
    console.log(`  ${dim}Next steps:${reset}`);

    const isCurrentDir = targetDir === process.cwd();
    if (!isCurrentDir) {
      console.log(`  ${cyan}1.${reset} cd ${path.relative(process.cwd(), targetDir)}`);
      console.log(`  ${cyan}2.${reset} Edit .ouroboros/config.json with your credentials`);
      console.log(`  ${cyan}3.${reset} Use /orb-explore to start documenting pages`);
    } else {
      console.log(`  ${cyan}1.${reset} Edit .ouroboros/config.json with your credentials`);
      console.log(`  ${cyan}2.${reset} Use /orb-explore to start documenting pages`);
    }
    console.log();
  }

  private copyDir(src: string, dest: string): void {
    if (!fs.existsSync(src)) return;
    this.ensureDir(dest);

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private getPackageVersion(): string {
    try {
      const pkgPath = path.join(this.packageRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version;
    } catch {
      return '1.0.0';
    }
  }
}
