// Ouroboros Tester — Public API
// Framework exports for domain test automation with Playwright

export { BasePage } from './base/page.js';
export type { BasePageOptions } from './base/page.js';

export { TableComponent } from './components/table.component.js';
export { FormComponent } from './components/form.component.js';
export { ModalComponent } from './components/modal.component.js';
export { NavigationComponent } from './components/navigation.component.js';
export { ToastComponent } from './components/toast.component.js';

export { createBaseFixtures } from './fixtures/base.fixture.js';
export { DataManager } from './fixtures/data.fixture.js';
export type { TrackedEntity } from './fixtures/data.fixture.js';

export { APIHelper } from './helpers/api.helper.js';
export { AssertionHelper } from './helpers/assertions.helper.js';

export { loadConfig } from './utils/config.js';
export type { OuroborosConfig } from './utils/config.js';
