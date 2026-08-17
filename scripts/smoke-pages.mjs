import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const artifactRoot = resolve('dist/personal-website/browser');
const basePath = '/';
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function axeSummary(violations) {
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.nodes
          .slice(0, 4)
          .map(
            (node) =>
              `${node.target.join(' ')}: ${node.failureSummary?.replaceAll('\n', ' ') ?? 'failed'}`,
          )
          .join(', ')})`,
    )
    .join('; ');
}

async function artifactPathFor(requestUrl) {
  const url = new URL(requestUrl ?? '/', 'http://127.0.0.1');
  if (url.pathname === basePath.slice(0, -1) || url.pathname === basePath) {
    return resolve(artifactRoot, 'index.html');
  }
  if (!url.pathname.startsWith(basePath)) {
    return null;
  }

  const relativePath = decodeURIComponent(url.pathname.slice(basePath.length));
  const candidate = resolve(artifactRoot, relativePath);
  const rootPrefix = `${artifactRoot}${sep}`;
  if (candidate !== artifactRoot && !candidate.startsWith(rootPrefix)) {
    return null;
  }

  try {
    const details = await stat(candidate);
    if (details.isFile()) {
      return candidate;
    }
    if (details.isDirectory()) {
      const directoryIndex = resolve(candidate, 'index.html');
      return (await stat(directoryIndex)).isFile() ? directoryIndex : null;
    }
    return null;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  try {
    const path = await artifactPathFor(request.url);
    if (!path) {
      response.writeHead(404).end('Not found');
      return;
    }

    const body = await readFile(path);
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': contentTypes[extname(path)] ?? 'application/octet-stream',
    });
    response.end(body);
  } catch (error) {
    response.writeHead(500).end(error instanceof Error ? error.message : 'Server error');
  }
});

await new Promise((ready, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', ready);
});

const address = server.address();
assert(address && typeof address === 'object', 'The smoke server did not start.');
const origin = `http://127.0.0.1:${address.port}${basePath}`;

let browser;
try {
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(origin).origin,
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${origin}#/start`, { waitUntil: 'domcontentloaded' });
  await page.locator('.boot-screen').waitFor({ state: 'visible' });
  assert(
    (await page.locator('.boot-screen .patteros-wordmark').innerText()) === 'PatterOS',
    'The boot screen did not preserve the mixed case PatterOS wordmark.',
  );
  await page.locator('.boot-screen').waitFor({ state: 'detached', timeout: 3_000 });
  await page.locator('#window-start').waitFor({ state: 'visible' });
  assert(
    (await page.locator('.boot-screen').count()) === 0,
    'The automatic boot did not reveal the desktop.',
  );
  assert(
    (await page.locator('app-desktop-shortcut').count()) === 10,
    'The ten-app desktop did not mount after boot.',
  );
  const signalField = page.getByTestId('signal-field');
  assert(
    (await signalField.getAttribute('aria-hidden')) === 'true',
    'The interactive background is not hidden from assistive technology.',
  );
  await page.locator('.desktop-stage').dispatchEvent('pointermove', {
    clientX: 1_320,
    clientY: 760,
    pointerType: 'mouse',
  });
  await page.waitForFunction(
    () => document.querySelector('.desktop-stage')?.style.getPropertyValue('--signal-x') !== '',
  );
  const signalPosition = await page
    .locator('.desktop-stage')
    .evaluate((element) => element.style.getPropertyValue('--signal-x'));
  await page.locator('.desktop-stage').dispatchEvent('pointerleave', { pointerType: 'mouse' });
  assert(
    (await page
      .locator('.desktop-stage')
      .evaluate((element) => element.style.getPropertyValue('--signal-x'))) === signalPosition,
    'The desktop spotlight reset after the pointer left the workspace.',
  );
  await page.locator('.desktop-stage').dispatchEvent('pointerdown', {
    button: 0,
    clientX: 1_320,
    clientY: 760,
    pointerType: 'mouse',
  });
  assert(
    (await page.locator('.desktop-stage__signal-ripple').count()) === 1,
    'A blank desktop click did not create a signal ripple.',
  );
  await page.locator('#window-start button').first().dispatchEvent('pointerdown', {
    button: 0,
    clientX: 500,
    clientY: 200,
    pointerType: 'mouse',
  });
  assert(
    (await page.locator('.desktop-stage__signal-ripple').count()) === 1,
    'A window control incorrectly created a desktop signal ripple.',
  );

  await page.getByRole('button', { name: 'Take the quick tour' }).click();
  await page.locator('#window-impact').waitFor({ state: 'visible' });
  const tourBar = page.getByRole('complementary', { name: 'Quick portfolio tour' });
  await tourBar.getByText('Work Log', { exact: true }).waitFor();
  await tourBar.getByRole('button', { name: 'Next' }).click();
  await page.locator('#window-systems').waitFor({ state: 'visible' });
  await tourBar.getByText('System Explorer', { exact: true }).waitFor();
  await tourBar.getByRole('button', { name: 'End quick tour' }).click();
  await tourBar.waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Open Start Here', exact: true }).click();

  await page.keyboard.press('Control+K');
  const launcherClose = page.getByRole('button', { name: 'Close application launcher' });
  await launcherClose.waitFor({ state: 'visible' });
  const launcherStatusAlignment = await page.evaluate(() => {
    const dot = document.querySelector('.launcher__availability .status-dot');
    const label = document.querySelector('.launcher__availability > span:last-child');
    if (!(dot instanceof HTMLElement) || !(label instanceof HTMLElement)) return null;

    const dotBounds = dot.getBoundingClientRect();
    const labelBounds = label.getBoundingClientRect();
    return Math.abs(
      dotBounds.top + dotBounds.height / 2 - (labelBounds.top + labelBounds.height / 2),
    );
  });
  assert(
    launcherStatusAlignment !== null && launcherStatusAlignment <= 2,
    'The launcher status dot is not vertically aligned with its label.',
  );
  await launcherClose.click();
  await page.waitForFunction(() => document.activeElement?.id === 'taskbar-launcher');
  assert(
    (await page.evaluate(() => document.activeElement?.id)) === 'taskbar-launcher',
    'The launcher X did not close the menu and return focus to its trigger.',
  );

  const viewports = [
    { width: 320, height: 800 },
    { width: 375, height: 667 },
    { width: 640, height: 900 },
    { width: 768, height: 900 },
    { width: 1024, height: 700 },
    { width: 1181, height: 700 },
    { width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.boot-screen').waitFor({ state: 'visible' });
    await page.locator('.boot-screen').waitFor({ state: 'detached', timeout: 3_000 });
    await page.locator('#window-start').waitFor({ state: 'visible' });
    await page.waitForTimeout(350);
    await page.waitForFunction(
      (expectedCompact) =>
        document.querySelector('#window-start')?.classList.contains('cdk-drag-disabled') ===
        expectedCompact,
      viewport.width <= 1180,
    );
    assert(
      (await page.locator('app-desktop-shortcut').count()) === 10,
      `${viewport.width}x${viewport.height}: expected exactly ten desktop shortcuts.`,
    );

    if (viewport.width === 320) {
      const bootHandoff = await page.evaluate(() => {
        const titlebar = document.querySelector('.window-frame__titlebar')?.getBoundingClientRect();
        const eyebrow = document.querySelector('.start-panel .eyebrow')?.getBoundingClientRect();
        return {
          contentClearsTitlebar: Boolean(titlebar && eyebrow && eyebrow.top >= titlebar.bottom),
          scrollY: window.scrollY,
        };
      });
      assert(bootHandoff.scrollY === 0, 'Mobile boot moved the document away from the top.');
      assert(
        bootHandoff.contentClearsTitlebar,
        'Mobile boot left Start Here content beneath the sticky title bar.',
      );
    }

    const layout = await page.evaluate(() => {
      const visibleSmallTargets = [...document.querySelectorAll('button, a[href]')]
        .filter((element) => {
          const bounds = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const inViewport =
            bounds.bottom > 0 &&
            bounds.right > 0 &&
            bounds.top < innerHeight &&
            bounds.left < innerWidth;
          return (
            inViewport &&
            bounds.width > 0 &&
            bounds.height > 0 &&
            style.visibility !== 'hidden' &&
            (bounds.width < 44 || bounds.height < 44)
          );
        })
        .map((element) => ({
          height: Math.round(element.getBoundingClientRect().height),
          label: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 40),
          width: Math.round(element.getBoundingClientRect().width),
        }));

      return {
        compact: document.querySelector('#window-start')?.classList.contains('cdk-drag-disabled'),
        documentWidth: document.documentElement.scrollWidth,
        h1Count: document.querySelectorAll('h1').length,
        maximizeVisible:
          getComputedStyle(document.querySelector('.window-frame__control--maximize')).display !==
          'none',
        moveVisible:
          getComputedStyle(document.querySelector('.window-frame__control--reposition')).display !==
          'none',
        viewportWidth: document.documentElement.clientWidth,
        visibleSmallTargets,
      };
    });

    assert(
      layout.documentWidth <= layout.viewportWidth + 1,
      `${viewport.width}x${viewport.height}: horizontal document overflow detected.`,
    );
    assert(layout.h1Count === 1, `${viewport.width}x${viewport.height}: expected exactly one h1.`);
    assert(
      layout.compact === viewport.width <= 1180,
      `${viewport.width}x${viewport.height}: incorrect responsive window mode.`,
    );
    assert(
      layout.maximizeVisible === viewport.width > 1180,
      `${viewport.width}x${viewport.height}: maximize availability does not match window mode.`,
    );
    assert(
      layout.moveVisible === viewport.width > 1180,
      `${viewport.width}x${viewport.height}: move controls do not match window mode.`,
    );
    if (viewport.width <= 840) {
      assert(
        layout.visibleSmallTargets.length === 0,
        `${viewport.width}x${viewport.height}: touch targets below 44px: ${JSON.stringify(layout.visibleSmallTargets)}`,
      );
    }

    if (viewport.width === 320) {
      await page.getByRole('button', { name: 'Open application launcher' }).click();
      const mobileLauncher = await page.locator('#launcher-menu').evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const close = element.querySelector('.launcher__close')?.getBoundingClientRect();
        return {
          bottom: bounds.bottom,
          closeHeight: close?.height ?? 0,
          closeWidth: close?.width ?? 0,
          left: bounds.left,
          right: bounds.right,
          viewportHeight: innerHeight,
          viewportWidth: innerWidth,
        };
      });
      assert(
        mobileLauncher.left >= 0 &&
          mobileLauncher.right <= mobileLauncher.viewportWidth + 1 &&
          mobileLauncher.bottom <= mobileLauncher.viewportHeight + 1,
        'The mobile launcher escaped the viewport.',
      );
      assert(
        mobileLauncher.closeHeight >= 44 && mobileLauncher.closeWidth >= 44,
        'The launcher X is smaller than 44px on mobile.',
      );
      const launcherAccessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      assert(
        launcherAccessibility.violations.length === 0,
        `320x800 launcher axe violations: ${axeSummary(launcherAccessibility.violations)}`,
      );
      await page.getByRole('button', { name: 'Close application launcher' }).click();
    }

    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    assert(
      accessibility.violations.length === 0,
      `${viewport.width}x${viewport.height}: axe violations: ${axeSummary(accessibility.violations)}`,
    );
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => localStorage.removeItem('patteros.window-layout.v3'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.boot-screen').waitFor({ state: 'visible' });
  await page.locator('.boot-screen').waitFor({ state: 'detached', timeout: 3_000 });
  await page.locator('#window-start .window-frame__control--tools').click();
  await page.locator('#window-start .window-frame__preset').selectOption('wide');
  await page.getByRole('button', { name: /Open Builds/ }).click();
  await page.locator('#window-builds').waitFor({ state: 'visible' });
  await page.locator('#window-builds .window-frame__control--tools').click();
  await page.locator('#window-builds .window-frame__preset').selectOption('cozy');
  await page.getByRole('button', { name: 'Close Builds' }).click();
  const preferredDesktopLayout = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('patteros.window-layout.v3') ?? 'null'),
  );
  await page.setViewportSize({ width: 320, height: 800 });
  await page.waitForFunction(() =>
    document.querySelector('#window-start')?.classList.contains('cdk-drag-disabled'),
  );
  await page.waitForTimeout(100);
  const compactStoredLayout = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('patteros.window-layout.v3') ?? 'null'),
  );
  assert(
    JSON.stringify(compactStoredLayout?.windows?.start?.size) ===
      JSON.stringify(preferredDesktopLayout?.windows?.start?.size),
    'Compact mode overwrote the saved size of an open desktop window.',
  );
  assert(
    JSON.stringify(compactStoredLayout?.windows?.builds?.size) ===
      JSON.stringify(preferredDesktopLayout?.windows?.builds?.size),
    'Compact mode overwrote the saved size of a closed desktop window.',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(
    () => !document.querySelector('#window-start')?.classList.contains('cdk-drag-disabled'),
  );
  await page.waitForTimeout(100);
  const restoredDesktopLayout = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('patteros.window-layout.v3') ?? 'null'),
  );
  assert(
    JSON.stringify(restoredDesktopLayout?.windows?.start?.size) ===
      JSON.stringify(preferredDesktopLayout?.windows?.start?.size),
    'The open window preference changed after returning to desktop mode.',
  );
  assert(
    JSON.stringify(restoredDesktopLayout?.windows?.builds?.size) ===
      JSON.stringify(preferredDesktopLayout?.windows?.builds?.size),
    'The closed window preference changed after returning to desktop mode.',
  );
  await page.getByRole('button', { name: /Open Builds/ }).click();
  await page.locator('#window-builds').waitFor({ state: 'visible' });
  await page.waitForTimeout(350);
  const restoredBuildsBounds = await page.locator('#window-builds').boundingBox();
  assert(
    restoredBuildsBounds &&
      Math.abs(restoredBuildsBounds.width - preferredDesktopLayout.windows.builds.size.width) <= 1,
    'The closed window did not reopen at its preferred desktop width.',
  );

  await page.goto(`${origin}#/impact`, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert(page.url().endsWith('#/impact'), 'The Impact deep link did not survive a reload.');
  await page.locator('#window-impact').waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: 'Results from real systems.' }).waitFor();
  assert(
    (await page.locator('.release-history__years button').count()) === 4,
    'The Work Log year picker is incomplete.',
  );
  await page.getByRole('button', { name: '2024', exact: true }).click();
  await page.getByRole('heading', { name: 'Made a flaky test suite trustworthy.' }).waitFor();
  const reliabilityNote = page
    .locator('.release-note')
    .filter({ hasText: 'Made a flaky test suite trustworthy.' });
  await reliabilityNote.getByText('Open the changelog').click();
  await reliabilityNote.getByText('A more trustworthy suite meant failures').waitFor();

  await page.goto(`${origin}#/start`, { waitUntil: 'domcontentloaded' });
  await page.locator('#window-start').waitFor({ state: 'visible' });
  await page.locator('#window-start').focus();
  const startWindow = page.locator('#window-start');
  await startWindow.locator('.window-frame__control--tools').click();
  await startWindow.locator('.window-frame__preset').selectOption('cozy');
  const resizeHandle = startWindow.locator('.window-frame__resize-handle');
  const resizeBox = await resizeHandle.boundingBox();
  assert(resizeBox, 'The pointer resize handle is not visible on desktop.');
  const widthBeforePointerResize = await startWindow.evaluate((element) =>
    Number.parseFloat(element.style.getPropertyValue('--window-width')),
  );
  await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    resizeBox.x + resizeBox.width / 2 + 48,
    resizeBox.y + resizeBox.height / 2 + 32,
  );
  await page.mouse.up();
  const widthAfterPointerResize = await startWindow.evaluate((element) =>
    Number.parseFloat(element.style.getPropertyValue('--window-width')),
  );
  assert(
    widthAfterPointerResize > widthBeforePointerResize,
    'Dragging the resize handle did not make the window wider.',
  );
  await resizeHandle.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(
    (previousWidth) =>
      Number.parseFloat(
        document.querySelector('#window-start')?.style.getPropertyValue('--window-width') ?? '0',
      ) > previousWidth,
    widthAfterPointerResize,
  );
  const widthAfterKeyboardResize = await startWindow.evaluate((element) =>
    Number.parseFloat(element.style.getPropertyValue('--window-width')),
  );
  assert(
    widthAfterKeyboardResize > widthAfterPointerResize,
    'The keyboard resize handle did not make the window wider.',
  );
  const storedLayout = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('patteros.window-layout.v3') ?? 'null'),
  );
  assert(storedLayout?.version === 3, 'The saved window layout does not use schema version 3.');
  assert(
    storedLayout?.windows?.start?.size?.width === widthAfterKeyboardResize,
    'The resized window width was not saved locally.',
  );

  await startWindow.locator('.window-frame__control--tools').click();
  await startWindow.getByRole('button', { name: 'Copy a link to Start Here' }).click();
  await page.locator('.os-toast').waitFor({ state: 'visible' });
  assert(
    (await page.locator('.os-toast').innerText()).includes('Link copied: Start'),
    'Copy link did not provide visible confirmation.',
  );
  assert(
    (await page.evaluate(() => navigator.clipboard.readText())).endsWith('#/start'),
    'The copied window URL is not the stable Start route.',
  );

  const browserTimezone = await page.evaluate(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const clockLabel = await page.locator('time').getAttribute('aria-label');
  assert(
    Boolean(clockLabel?.includes(browserTimezone)),
    'The taskbar clock does not name the viewer timezone.',
  );

  await page.getByRole('button', { name: 'Switch to Night Shift' }).click();
  await page.waitForFunction(() => document.documentElement.dataset['theme'] === 'night');
  await page.waitForTimeout(350);
  assert(
    (await page.locator('html').getAttribute('data-theme')) === 'night',
    'Night Shift did not apply to the document.',
  );
  const nightAccessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  assert(
    nightAccessibility.violations.length === 0,
    `Night Shift axe violations: ${axeSummary(nightAccessibility.violations)}`,
  );
  await page.getByRole('button', { name: 'Switch to Day Shift' }).click();
  await page.waitForFunction(() => document.documentElement.dataset['theme'] === 'day');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#window-start').waitFor({ state: 'visible' });
  assert(
    (await page
      .locator('#window-start')
      .evaluate((element) =>
        Number.parseFloat(element.style.getPropertyValue('--window-width')),
      )) === widthAfterKeyboardResize,
    'The resized width did not survive a reload.',
  );

  const initialWindowX = await page
    .locator('#window-start')
    .evaluate((element) => element.style.getPropertyValue('--window-x'));
  await startWindow.locator('.window-frame__control--tools').click();
  await startWindow.getByRole('button', { name: 'Reposition Start Here without dragging' }).click();
  await page.waitForFunction(
    (previousX) =>
      document.querySelector('#window-start')?.style.getPropertyValue('--window-x') !== previousX,
    initialWindowX,
  );
  assert(
    (await page
      .locator('#window-start')
      .evaluate((element) => element.style.getPropertyValue('--window-x'))) !== initialWindowX,
    'The click based window movement control did not move the window.',
  );
  await page.keyboard.press('Control+K');
  await page.locator('#launcher-app-start').waitFor({ state: 'visible' });
  assert(
    (await page.evaluate(() => document.activeElement?.id)) === 'launcher-app-start',
    'The launcher did not focus its first app.',
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(50);
  assert(
    (await page.evaluate(() => document.activeElement?.id)) === 'taskbar-launcher',
    'Closing the launcher did not return focus to its trigger.',
  );

  await page
    .getByRole('region', { name: 'Start Here' })
    .getByRole('button', { name: 'Minimize Start Here' })
    .click();
  await page.locator('#window-start').waitFor({ state: 'hidden' });
  assert(
    await page
      .locator('#window-start')
      .evaluate(
        (element) => element.hasAttribute('hidden') && getComputedStyle(element).display === 'none',
      ),
    'Minimize did not remove the active window from visual flow.',
  );
  await page
    .getByRole('contentinfo', { name: 'PatterOS taskbar' })
    .getByRole('button', { name: 'Restore Start Here' })
    .click();
  await page.locator('#window-start').waitFor({ state: 'visible' });

  await page.goto(`${origin}#/settings`, { waitUntil: 'domcontentloaded' });
  await page.locator('#window-settings').waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: 'Set up your view.' }).waitFor();
  await page.getByRole('button', { name: 'High Contrast' }).click();
  await page.waitForFunction(() => document.documentElement.dataset['theme'] === 'contrast');
  assert(
    (await page.locator('html').getAttribute('data-theme')) === 'contrast',
    'High Contrast did not apply to the document.',
  );
  await page.getByRole('checkbox', { name: /Comfortable reading/ }).check();
  await page.waitForFunction(() => document.body.classList.contains('reading-mode'));
  assert(
    await page.locator('body').evaluate((element) => element.classList.contains('reading-mode')),
    'Comfortable Reading did not apply to the document.',
  );
  const readingLayout = await page
    .locator('.window-frame:not([hidden])')
    .evaluateAll((windows) => ({
      disabled: windows.every((window) => window.classList.contains('cdk-drag-disabled')),
      positions: windows.map((window) => getComputedStyle(window).position),
      rectangles: windows.map((window) => {
        const bounds = window.getBoundingClientRect();
        return { bottom: bounds.bottom, top: bounds.top };
      }),
    }));
  assert(readingLayout.disabled, 'Comfortable Reading did not disable window dragging.');
  assert(
    readingLayout.positions.every((position) => position === 'relative'),
    'Comfortable Reading did not switch windows to document flow.',
  );
  for (let index = 1; index < readingLayout.rectangles.length; index += 1) {
    assert(
      readingLayout.rectangles[index].top >= readingLayout.rectangles[index - 1].bottom,
      'Comfortable Reading left two windows overlapping.',
    );
  }
  const contrastAccessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  assert(
    contrastAccessibility.violations.length === 0,
    `High Contrast and Comfortable Reading axe violations: ${axeSummary(contrastAccessibility.violations)}`,
  );
  await page.evaluate(() => localStorage.setItem('patteros.arcade.snake.all-time', '9'));
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear saved data' }).click();
  await page.waitForFunction(
    () =>
      document.documentElement.dataset['theme'] === 'day' &&
      !document.body.classList.contains('reading-mode'),
  );
  assert(
    (await page.locator('html').getAttribute('data-theme')) === 'day' &&
      !(await page
        .locator('body')
        .evaluate((element) => element.classList.contains('reading-mode'))),
    'Clearing local settings did not restore the default display.',
  );
  assert(
    await page.evaluate(() => localStorage.getItem('patteros.arcade.snake.all-time') === null),
    'Clearing saved data did not remove the arcade score key.',
  );

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${origin}#/systems`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Follow a change from screen to release.' }).waitFor();
  await page.getByRole('button', { name: 'Services' }).click();
  await page.getByRole('heading', { name: 'Clear boundaries, boring failure modes' }).waitFor();

  await page.goto(`${origin}#/github`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Public code, without leaving the desktop.' }).waitFor();
  const githubProfileLink = page.getByRole('link', { name: /Open profile/ });
  assert(
    (await githubProfileLink.getAttribute('rel')) === 'noopener noreferrer',
    'The live GitHub window has an unsafe external profile link.',
  );

  await page.goto(`${origin}#/arcade`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'PatterOS Arcade', exact: true }).waitFor();
  const arcadeWindowSize = await page.locator('#window-arcade').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height };
  });
  assert(
    arcadeWindowSize.width >= 1_000 && arcadeWindowSize.height >= 700,
    'The arcade did not open at a legible desktop size.',
  );
  await page.getByRole('button', { name: /^Play Snake\./ }).click();
  await page.getByRole('heading', { name: 'Snake', exact: true }).waitFor();
  assert(
    await page.locator('.arcade').evaluate((element) => {
      const labelId = element.getAttribute('aria-labelledby');
      return Boolean(labelId && document.getElementById(labelId));
    }),
    'The active arcade view has a broken accessible name reference.',
  );
  const snake = page.locator('.snake-game');
  await snake.getByRole('button', { name: 'Move down', exact: true }).focus();
  await page.keyboard.press('Enter');
  await snake.locator('.snake-board[data-status="running"]').waitFor();
  await snake.locator('.snake-board[data-direction="down"]').waitFor({ timeout: 1_500 });
  const snakeHeadBeforeMinimize = await snake
    .locator('.snake-cell[data-kind="head"]')
    .evaluate((element) => [...(element.parentElement?.children ?? [])].indexOf(element));
  await page
    .getByRole('contentinfo', { name: 'PatterOS taskbar' })
    .getByRole('button', { name: 'Minimize PatterOS Arcade' })
    .click();
  await page.waitForFunction(
    () => document.querySelector('.snake-board')?.getAttribute('data-status') === 'paused',
  );
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  assert(
    (await snake
      .locator('.snake-cell[data-kind="head"]')
      .evaluate((element) => [...(element.parentElement?.children ?? [])].indexOf(element))) ===
      snakeHeadBeforeMinimize,
    'Snake kept moving after its window was minimized.',
  );
  await page
    .getByRole('contentinfo', { name: 'PatterOS taskbar' })
    .getByRole('button', { name: 'Restore PatterOS Arcade' })
    .click();
  await snake.locator('.game-actions').getByRole('button', { name: 'Resume', exact: true }).click();
  await snake.locator('.snake-board[data-status="running"]').waitFor();
  await snake.getByRole('button', { name: 'Pause', exact: true }).click();
  await snake.locator('.snake-board[data-status="paused"]').waitFor();
  await snake.locator('.board-message').getByRole('button', { name: 'Resume' }).click();
  await snake.locator('.snake-board[data-status="running"]').waitFor();
  await snake.getByRole('button', { name: 'Restart', exact: true }).click();
  assert(
    (await snake.locator('.scoreboard strong').first().innerText()) === '0',
    'Restarting Snake did not reset its score.',
  );

  await page.getByRole('button', { name: 'All games' }).click();
  await page.getByRole('button', { name: /^Play Memory Match\./ }).click();
  await page.getByRole('heading', { name: 'Memory Match', exact: true }).waitFor();
  const memory = page.locator('.memory-game');
  await memory.getByRole('button', { name: 'Start', exact: true }).click();
  await memory.locator('.memory-board[data-status="running"]').waitFor();
  const memoryCards = memory.locator('.memory-card');
  await memoryCards.nth(0).click();
  await page.waitForFunction(
    () => document.querySelector('.memory-card')?.getAttribute('aria-pressed') === 'true',
  );
  assert(
    (await memoryCards.nth(0).getAttribute('aria-pressed')) === 'true',
    'Memory Match did not reveal the first selected card.',
  );
  await memoryCards.nth(1).click();
  await page.waitForFunction(
    () => document.querySelector('.memory-game .scoreboard strong')?.textContent?.trim() === '1',
  );
  assert(
    (await memory.locator('.scoreboard strong').first().innerText()) === '1',
    'Memory Match did not count a completed turn.',
  );
  await page.waitForTimeout(700);
  await memory.getByRole('button', { name: 'Pause', exact: true }).click();
  await memory.locator('.memory-board[data-status="paused"]').waitFor();
  await memory.locator('.board-message').getByRole('button', { name: 'Resume' }).click();
  await memory.locator('.memory-board[data-status="running"]').waitFor();
  await memory.getByRole('button', { name: 'Restart', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('.memory-game .scoreboard strong')?.textContent?.trim() === '0',
  );
  assert(
    (await memory.locator('.scoreboard strong').first().innerText()) === '0',
    'Restarting Memory Match did not reset its turn count.',
  );

  await page.getByRole('button', { name: 'All games' }).click();
  await page.getByRole('button', { name: /^Play Tic Tac Toe\./ }).click();
  const ticTacToe = page.locator('.ttt');
  await ticTacToe.getByRole('button', { name: 'Choose square 1' }).click();
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('.ttt__board button')].filter((button) =>
        button.textContent?.trim(),
      ).length >= 2,
  );
  assert(
    (
      await ticTacToe
        .locator('.ttt__board button')
        .evaluateAll((buttons) =>
          buttons
            .filter((button) => button.textContent?.trim())
            .map((button) => button.textContent?.trim()),
        )
    ).length >= 2,
    'Tic Tac Toe did not answer the player move.',
  );

  await page.getByRole('button', { name: 'All games' }).click();
  await page.getByRole('button', { name: /^Play Minesweeper\./ }).click();
  const minesweeper = page.locator('.mines');
  await minesweeper.getByRole('button', { name: 'Reveal cell 1', exact: true }).click();
  assert(
    (await minesweeper.locator('.mines__cell--mine').count()) === 0,
    'Minesweeper did not keep the first move safe.',
  );
  await minesweeper.getByRole('button', { name: 'New board' }).click();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedBootStarted = Date.now();
  await page.goto(`${origin}#/start`, { waitUntil: 'domcontentloaded' });
  await page.locator('#window-start').waitFor({ state: 'visible', timeout: 1_000 });
  assert(
    Date.now() - reducedBootStarted < 1_000,
    'Reduced motion did not shorten the boot sequence.',
  );
  assert(
    (await page
      .locator('#window-start')
      .evaluate((element) => getComputedStyle(element).animationDuration)) === '1e-05s',
    'The system reduced motion preference did not suppress interface animation.',
  );
  assert(
    (await signalField.evaluate((element) => getComputedStyle(element, '::before').display)) ===
      'none',
    'Reduced motion did not flatten the interactive background.',
  );

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' });
  assert(
    await page.evaluate(() => matchMedia('(forced-colors: active)').matches),
    'The forced colors test mode did not activate.',
  );
  assert(
    (await signalField.evaluate((element) => getComputedStyle(element).display)) === 'none',
    'Forced colors did not hide the decorative signal field.',
  );
  const forcedColorsAccessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  assert(
    forcedColorsAccessibility.violations.length === 0,
    `Forced colors axe violations: ${axeSummary(forcedColorsAccessibility.violations)}`,
  );

  await page.emulateMedia({ forcedColors: 'none' });
  await page.goto(`${origin}#/contact`, { waitUntil: 'domcontentloaded' });
  await page.locator('#window-contact').waitFor({ state: 'visible' });
  assert(
    await page.locator('a[target="_blank"]').evaluateAll((links) =>
      links.every((link) => {
        const values = new Set((link.getAttribute('rel') ?? '').split(/\s+/));
        return values.has('noopener') && values.has('noreferrer');
      }),
    ),
    'An external new tab link is missing noopener or noreferrer.',
  );

  const staticPages = [
    'case-studies/latency/',
    'case-studies/secure-delivery/',
    'evidence-brief.html',
  ];
  const staticViewports = [
    { width: 320, height: 800 },
    { width: 1440, height: 900 },
  ];
  for (const staticPage of staticPages) {
    for (const viewport of staticViewports) {
      await page.setViewportSize(viewport);
      const response = await page.goto(`${origin}${staticPage}`, {
        waitUntil: 'domcontentloaded',
      });
      assert(response?.ok(), `${staticPage}: expected a successful direct response.`);
      const staticLayout = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        h1Count: document.querySelectorAll('h1').length,
        viewportWidth: document.documentElement.clientWidth,
      }));
      assert(staticLayout.h1Count === 1, `${staticPage}: expected exactly one h1.`);
      assert(
        staticLayout.documentWidth <= staticLayout.viewportWidth + 1,
        `${staticPage}: horizontal document overflow detected at ${viewport.width}px.`,
      );
      if (viewport.width === 320) {
        const headerTargets = await page
          .locator('.site-bar a, .masthead__actions a, .masthead__actions button')
          .evaluateAll((targets) =>
            targets.map((target) => {
              const bounds = target.getBoundingClientRect();
              return { height: bounds.height, width: bounds.width };
            }),
          );
        assert(
          headerTargets.every((target) => target.height >= 44 && target.width >= 44),
          `${staticPage}: a primary mobile action is smaller than 44px.`,
        );
      }
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      assert(
        accessibility.violations.length === 0,
        `${staticPage} at ${viewport.width}px: axe violations: ${axeSummary(accessibility.violations)}`,
      );
    }

    await page.emulateMedia({ media: 'print' });
    const printState = await page.evaluate(() => ({
      footerVisible: document.querySelector('footer')
        ? getComputedStyle(document.querySelector('footer')).display !== 'none'
        : true,
      printActionsHidden: document.querySelector('.no-print')
        ? getComputedStyle(document.querySelector('.no-print')).display === 'none'
        : true,
    }));
    assert(
      printState.footerVisible && printState.printActionsHidden,
      `${staticPage}: printable output dropped its byline or kept screen-only controls.`,
    );
    await page.emulateMedia({ media: 'screen' });
  }

  assert(consoleErrors.length === 0, `Browser console errors: ${consoleErrors.join(' | ')}`);
  console.log(
    `PatterOS browser smoke passed across ${viewports.length} app viewports and ${staticPages.length} static pages.`,
  );
} finally {
  await browser?.close();
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()));
  });
}
