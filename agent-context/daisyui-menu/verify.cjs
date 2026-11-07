const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.MENU_TEST_URL || 'http://localhost:4300';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const scenario of [
      { width: 320, height: 568, path: '/' },
      { width: 390, height: 844, path: '/szukaj' },
      { width: 768, height: 1024, path: '/prywatnosc' },
      { width: 390, height: 250, path: '/prywatnosc' },
      { width: 390, height: 844, path: '/', reducedMotion: 'reduce' },
    ]) {
      const { width, height, path, reducedMotion = 'no-preference' } = scenario;
      const page = await browser.newPage({
        viewport: { width, height },
        isMobile: true,
        hasTouch: true,
        reducedMotion,
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base + path);
      await page.getByRole('button', { name: 'Odrzuć opcjonalne', exact: true }).click();
      const trigger = page.getByRole('button', { name: 'Menu serwisu', exact: true });
      const panel = page.locator('#portal-menu-drawer section');
      const checked = () => page.locator('#portal-menu-toggle').isChecked();
      async function record() {
        await page.evaluate(() => {
          window.menuFrames = [];
          window.menuRecording = true;
          function sample() {
            const side = document.querySelector('#portal-menu-drawer');
            const panel = side.querySelector('section');
            window.menuFrames.push({
              x: panel.getBoundingClientRect().x,
              scroll: side.scrollLeft,
              pageScroll: window.scrollX,
              opacity: getComputedStyle(side).opacity,
            });
            if (window.menuRecording) requestAnimationFrame(sample);
          }
          requestAnimationFrame(sample);
        });
      }
      async function frames() {
        return page.evaluate(() => {
          window.menuRecording = false;
          return window.menuFrames;
        });
      }
      for (let round = 0; round < 3; round++) {
        await record();
        await trigger.click();
        await wait(450);
        assert(await checked());
        const opening = await frames();
        assert(opening.length > 5);
        assert(
          opening.every((f) => f.scroll === 0 && f.pageScroll === 0),
          'Horizontal scroll during opening',
        );
        assert(
          opening.every((f, i) => !i || f.x <= opening[i - 1].x + 0.1),
          'Opening moved backwards',
        );
        assert(
          Math.abs(opening.at(-1).x - (width - Math.min(width * 0.86, 360))) < 1,
          JSON.stringify({ scenario, opening }),
        );
        if (reducedMotion !== 'reduce')
          assert(
            opening.some((f) => f.x > opening.at(-1).x + 30 && f.x < width - 20),
            'Opening skipped intermediate frames',
          );
        assert.equal(
          await page.evaluate(() => document.activeElement.getAttribute('aria-label')),
          'Zamknij menu',
          JSON.stringify({
            scenario,
            round,
            active: await page.evaluate(() => document.activeElement.outerHTML.slice(0, 150)),
          }),
        );
        assert(await page.locator('.drawer-content').evaluate((el) => el.inert));
        assert.equal(
          await page.evaluate(() => getComputedStyle(document.documentElement).overflowY),
          'hidden',
        );
        await page.keyboard.press('Shift+Tab');
        assert.equal(
          await page.evaluate(() => document.activeElement.textContent.trim()),
          'Ustawienia cookies',
        );
        await page.keyboard.press('Tab');
        assert.equal(
          await page.evaluate(() => document.activeElement.getAttribute('aria-label')),
          'Zamknij menu',
        );
        await record();
        if (round === 0) await page.keyboard.press('Escape');
        else if (round === 1)
          await page.getByRole('button', { name: 'Zamknij menu', exact: true }).click();
        else await page.mouse.click(2, Math.min(height - 2, 100));
        await wait(500);
        const closing = await frames();
        assert.equal(await checked(), false);
        assert(
          closing.every((f, i) => !i || f.x >= closing[i - 1].x - 0.1),
          'Closing moved backwards',
        );
        if (reducedMotion !== 'reduce')
          assert(
            closing.some((f) => f.x > closing[0].x + 30 && f.x < width - 20),
            'Closing skipped intermediate frames',
          );
        assert(await trigger.evaluate((el) => el === document.activeElement));
        assert.equal(await page.locator('.drawer-content').evaluate((el) => el.inert), false);
        assert.equal(
          await page.evaluate(() =>
            document.documentElement.classList.contains('portal-menu-open'),
          ),
          false,
        );
      }
      // Reverse a running closing transition and ensure the panel remains usable.
      await trigger.click();
      await wait(60);
      await page.keyboard.press('Escape');
      await wait(50);
      await trigger.click();
      await wait(450);
      assert(await checked());
      assert(Math.abs((await panel.boundingBox()).x - (width - Math.min(width * 0.86, 360))) < 1);
      await page.keyboard.press('Escape');
      await wait(500);
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${width}×${height} ${path} ${reducedMotion}: opening/closing frames, focus, inert, repeated and rapid toggles`,
      );
      await page.close();
    }
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await mobile.goto(base + '/prywatnosc');
    await mobile.getByRole('button', { name: 'Odrzuć opcjonalne', exact: true }).click();
    const mobileTrigger = mobile.getByRole('button', { name: 'Menu serwisu', exact: true });
    const drawer = mobile.locator('#portal-menu-drawer');
    await mobileTrigger.click();
    await drawer.getByRole('link', { name: 'Mapa', exact: true }).click();
    await mobile.waitForURL(base + '/');
    assert.equal(await mobile.locator('#portal-menu-toggle').isChecked(), false);
    await mobile.goBack();
    await mobile.waitForURL(base + '/prywatnosc');
    await mobile.goForward();
    await mobile.waitForURL(base + '/');
    await mobileTrigger.click();
    await drawer.getByRole('link', { name: 'Szukaj', exact: true }).click();
    await mobile.waitForURL(base + '/szukaj');
    await mobileTrigger.click();
    await drawer.getByRole('button', { name: 'Ustawienia cookies', exact: true }).click();
    const settings = mobile.getByRole('dialog', { name: 'Ustawienia prywatności', exact: true });
    await settings.waitFor({ state: 'visible' });
    assert(await settings.evaluate((el) => el.contains(document.activeElement)));
    assert.equal(await mobile.locator('.drawer-content').evaluate((el) => el.inert), false);
    await settings.getByRole('button', { name: 'Zamknij bez zmian', exact: true }).click();
    assert(await mobileTrigger.evaluate((el) => el === document.activeElement));
    await mobile.goto(base + '/miejsca/bazylika-sw-antoniego-padewskiego');
    await mobileTrigger.click();
    await mobile
      .getByRole('dialog', { name: 'Menu serwisu', exact: true })
      .waitFor({ state: 'visible' });
    await mobile.keyboard.press('Escape');
    await wait(500);
    await mobileTrigger.click();
    await mobile.setViewportSize({ width: 1280, height: 720 });
    await wait(450);
    assert.equal(await mobile.locator('#portal-menu-toggle').isChecked(), false);
    assert.equal(await mobile.locator('.drawer-content').evaluate((el) => el.inert), false);
    console.log('PASS navigation: privacy, map, search, Back/Forward, settings focus, resize');
    await mobile.close();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/prywatnosc');
    await page.getByRole('button', { name: 'Odrzuć opcjonalne', exact: true }).click();
    const trigger = page.getByRole('button', { name: 'Menu serwisu', exact: true });
    const popup = page.locator('#portal-menu-dropdown');
    for (let round = 0; round < 3; round++) {
      await trigger.click();
      await wait(300);
      assert(await popup.evaluate((el) => el.matches(':popover-open')));
      const buttonRect = await trigger.boundingBox(),
        popupRect = await popup.boundingBox();
      assert(
        Math.abs(popupRect.x + popupRect.width - buttonRect.x - buttonRect.width) < 2,
        'Dropdown right alignment',
      );
      assert(popupRect.y >= buttonRect.y + buttonRect.height, 'Dropdown below trigger');
      assert.equal(await popup.getByRole('link', { name: 'Szukaj', exact: true }).count(), 0);
      if (round === 0) await page.keyboard.press('Escape');
      else if (round === 1) await trigger.click();
      else await page.mouse.click(5, 150);
      await wait(300);
      assert.equal(await popup.evaluate((el) => el.matches(':popover-open')), false);
    }
    console.log('PASS desktop: anchor alignment, Escape, trigger toggle and outside click');
    await page.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
