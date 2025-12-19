# E2E Testing with Playwright

This directory contains end-to-end (E2E) tests for the Mafia Night frontend using **Playwright**.

## Why Playwright?

✅ **Best for NixOS** - Works seamlessly with Nix flakes
✅ **Fast execution** - Parallel test running
✅ **Auto-waiting** - No manual waits needed
✅ **Cross-browser** - Chromium, Firefox, WebKit
✅ **Modern** - Built for 2020s web apps (Next.js, React)
✅ **Great DX** - UI mode, trace viewer, debugging tools

## Setup (NixOS)

The Playwright setup is **fully integrated with your Nix flake**:

1. **Browsers are provided by Nix** (no npm download)
2. **Environment variables are auto-configured** via `shellHook`
3. **direnv loads everything automatically**

```bash
# Reload direnv (if needed)
direnv allow

# Verify Playwright is available
npm run test:e2e -- --version
```

## Running Tests

### Basic Commands

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with browser visible
npm run test:e2e:headed

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Show test report (after running tests)
npm run test:e2e:report
```

### Advanced Commands

```bash
# Run specific test file
npx playwright test e2e/roles-gallery.spec.ts

# Run tests matching a pattern
npx playwright test --grep "should display"

# Run only failed tests
npx playwright test --last-failed

# Run tests with specific browser
npx playwright test --project=chromium

# Generate code (record interactions)
npx playwright codegen http://localhost:3000
```

## Test Structure

```
e2e/
├── README.md                  # This file
├── roles-gallery.spec.ts      # Tests for /roles page
├── role-detail.spec.ts        # Tests for /role/[slug] page
└── utils/
    └── test-helpers.ts        # Shared utilities
```

## Writing Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-page');

    // Playwright auto-waits for elements
    await expect(page.locator('h1')).toHaveText('Hello');

    // Click and navigate
    await page.click('button');
    await expect(page).toHaveURL('/next-page');
  });
});
```

### Using Test Helpers

```typescript
import { waitForPageLoad, mockApiRoute } from './utils/test-helpers';

test('should handle API', async ({ page }) => {
  // Mock API response
  await mockApiRoute(page, '**/api/roles', mockRoles);

  await page.goto('/roles');
  await waitForPageLoad(page);

  // Test with mocked data
  await expect(page.locator('h1')).toBeVisible();
});
```

## Best Practices

### ✅ DO

- Use `await expect()` for assertions (auto-retry)
- Use `page.locator()` instead of `$` selectors
- Use semantic selectors (`role`, `text`, `label`)
- Use `test.describe()` to group related tests
- Mock API calls for faster, more reliable tests
- Take screenshots on failure (automatic)

### ❌ DON'T

- Don't use `waitForTimeout()` - use `waitFor*()` methods
- Don't hardcode viewport sizes - use `devices`
- Don't share state between tests - keep them isolated
- Don't test implementation details - test user behavior
- Don't ignore flaky tests - fix them

## Debugging

### Visual Debugging

```bash
# Run with UI mode (best for debugging)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run with Playwright Inspector
npm run test:e2e:debug
```

### Trace Viewer

When a test fails, a trace is automatically recorded:

```bash
# View trace for failed test
npx playwright show-trace test-results/*/trace.zip
```

### Screenshots & Videos

- **Screenshots**: Taken automatically on failure
- **Videos**: Recorded on failure
- Location: `test-results/` directory

## CI/CD Integration

The tests are designed to run in CI with:

- **Parallel execution** disabled in CI (sequential)
- **Retries** enabled (2 retries on CI)
- **HTML reporter** for test results
- **Screenshots & traces** on failure

Example GitHub Actions workflow:

```yaml
- name: Run E2E tests
  run: |
    cd frontend
    npm run test:e2e
  env:
    CI: true

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: frontend/playwright-report/
```

## Test Coverage

### Current Test Suites

1. **Roles Gallery** (`roles-gallery.spec.ts`)
   - Page layout and structure
   - API integration
   - Loading and error states
   - Navigation
   - Responsive design
   - Accessibility

2. **Role Detail** (`role-detail.spec.ts`)
   - Individual role page
   - 3D card rendering
   - Navigation between roles
   - API error handling
   - Keyboard navigation

### Adding New Tests

1. Create new spec file: `e2e/my-feature.spec.ts`
2. Import test utilities from `./utils/test-helpers`
3. Follow existing patterns (see current specs)
4. Run and verify: `npm run test:e2e:ui`

## Troubleshooting

### Browser not found / Executable doesn't exist

If you see: `Executable doesn't exist at /nix/store/.../chromium...`

**Solution:**
```bash
# 1. Reload your direnv environment
cd .. && cd -
# Or: direnv allow

# 2. Verify environment variable is set
echo $PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
# Should show: /nix/store/.../chromium/bin/chromium

# 3. If still not set, manually export (temporary):
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(which chromium || which google-chrome-stable)"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 4. Verify browser works:
$PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH --version
```

### Tests failing locally but passing in CI

```bash
# Run in CI mode locally:
CI=true npm run test:e2e
```

### Slow tests

```bash
# Run tests in parallel (default):
npx playwright test --workers=4

# Profile test execution:
npx playwright test --trace on
```

### Port already in use

The test config starts `npm run dev` automatically. If port 3001 is busy:

```bash
# Kill existing dev server:
pkill -f "next dev"

# Or change port in playwright.config.ts
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)

## NixOS-Specific Notes

This setup uses **system-installed browsers** from Nix instead of npm-downloaded ones:

- Chromium comes from `chromium` package in `flake.nix`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` points to system Chromium
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` prevents npm from downloading browsers
- This ensures browsers work correctly on NixOS

### After Updating flake.nix

If you modify the flake, reload your environment:

```bash
# Exit and re-enter the directory (direnv will reload automatically)
cd .. && cd -

# Or manually reload direnv
direnv allow
```

### Adding More Browsers

To test on Firefox or WebKit, add them to `flake.nix`:

```nix
# Add to buildInputs in flake.nix:
firefox           # For Firefox tests
# webkit not available on NixOS Linux (macOS only)
```

Then set the environment variable:

```nix
# Add to shellHook in flake.nix:
export PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH="${pkgs.firefox}/bin/firefox"
```
