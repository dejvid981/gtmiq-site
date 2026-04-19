const { test, expect } = require('@playwright/test');

// ============================================
// 2A. SECTION RENDERING
// ============================================
test.describe('Section Rendering', () => {
  test('all 12 sections render correctly @desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Nav
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();

    // Hero
    const hero = page.locator('section.hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('h1')).toContainText('Your Product Works');

    // Social Proof
    const socialProof = page.locator('.social-proof');
    await expect(socialProof).toBeVisible();
    for (const name of ['MasterBlox', 'Seedify', 'Bitget', 'Hacken']) {
      await expect(socialProof).toContainText(name);
    }

    // Problem
    const problem = page.locator('#problem');
    await expect(problem).toBeVisible();

    // Results
    const results = page.locator('#results');
    await expect(results).toBeVisible();

    // How It Works
    const howItWorks = page.locator('#how-it-works');
    await expect(howItWorks).toBeVisible();
    const steps = howItWorks.locator('.step');
    await expect(steps).toHaveCount(4);

    // Who This Is For
    const qualifier = page.locator('#qualifier');
    await expect(qualifier).toBeVisible();

    // Scorecard
    const scorecard = page.locator('#scorecard');
    await expect(scorecard).toBeVisible();
    await expect(page.locator('.scorecard-container')).toBeVisible();

    // Pricing
    const pricing = page.locator('#pricing');
    await expect(pricing).toBeVisible();
    await expect(pricing).toContainText('GTMiQ Sprint');
    await expect(pricing).toContainText('GTMiQ Retainer');

    // FAQ
    const faq = page.locator('#faq');
    await expect(faq).toBeVisible();
    const faqItems = faq.locator('.faq-item');
    await expect(faqItems).toHaveCount(6);

    // Bottom CTA
    const bottomCta = page.locator('section.bottom-cta');
    await expect(bottomCta).toBeVisible();

    // Footer
    const footer = page.locator('footer[role="contentinfo"]');
    await expect(footer).toBeVisible();
  });
});

// ============================================
// 2B. SCORECARD END-TO-END FLOW
// ============================================
test.describe('Scorecard Flow', () => {
  test('complete scorecard end-to-end @desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Scroll to scorecard
    await page.locator('#scorecard').scrollIntoViewIfNeeded();

    // Verify 10 progress dots
    const dots = page.locator('.progress-dot');
    await expect(dots).toHaveCount(10);

    // Answer all 10 questions by clicking first option each time
    for (let i = 0; i < 10; i++) {
      const options = page.locator('.scorecard-option');
      await expect(options.first()).toBeVisible({ timeout: 3000 });
      await options.first().click();
      // Wait for auto-advance (400ms) + rendering
      await page.waitForTimeout(600);
    }

    // Email gate should appear
    const emailGate = page.locator('.email-gate.active');
    await expect(emailGate).toBeVisible({ timeout: 3000 });

    // Test validation: click submit with empty email
    const submitBtn = page.locator('.email-gate button, .email-gate .scorecard-btn').first();
    await submitBtn.click();
    // Error should be shown
    const errorEl = page.locator('#emailError');
    await expect(errorEl).toBeVisible();

    // Fill in email and company
    await page.fill('#gateEmail', 'test@example.com');
    await page.fill('#gateCompany', 'TestCo');

    // Submit
    await submitBtn.click();

    // Results should display
    const resultsDisplay = page.locator('.scorecard-results.active');
    await expect(resultsDisplay).toBeVisible({ timeout: 3000 });

    // Verify score, grade, category bars
    await expect(page.locator('#finalScore')).toBeVisible();
    await expect(page.locator('#finalGrade')).toBeVisible();
    await expect(page.locator('.category-bar')).toHaveCount(10);

    // Verify action items exist
    await expect(page.locator('.action-items, .action-item')).not.toHaveCount(0);

    // Verify Cal.com CTA link in results
    const resultsCta = resultsDisplay.locator('a[href*="cal.com/david-mustac/gtmiq"]');
    await expect(resultsCta).toBeVisible();
  });
});

// ============================================
// 2C. FAQ ACCORDION
// ============================================
test.describe('FAQ Accordion', () => {
  test('FAQ toggles work with aria-expanded @desktop', async ({ page }) => {
    await page.goto('/');
    const faqSection = page.locator('#faq');
    await faqSection.scrollIntoViewIfNeeded();

    const faqItems = faqSection.locator('.faq-item');
    const firstBtn = faqItems.nth(0).locator('.faq-question');
    const secondBtn = faqItems.nth(1).locator('.faq-question');

    // Click first FAQ — should open
    await firstBtn.click();
    await expect(faqItems.nth(0)).toHaveClass(/open/);
    await expect(firstBtn).toHaveAttribute('aria-expanded', 'true');

    // Click second FAQ — first should close, second opens
    await secondBtn.click();
    await expect(faqItems.nth(0)).not.toHaveClass(/open/);
    await expect(faqItems.nth(1)).toHaveClass(/open/);
    await expect(firstBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(secondBtn).toHaveAttribute('aria-expanded', 'true');

    // Click second FAQ again — it closes
    await secondBtn.click();
    await expect(faqItems.nth(1)).not.toHaveClass(/open/);
    await expect(secondBtn).toHaveAttribute('aria-expanded', 'false');
  });
});

// ============================================
// 2D. MOBILE RESPONSIVE (375px)
// ============================================
test.describe('Mobile Responsive @Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger menu and responsive layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Nav links should be hidden on mobile
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).not.toBeVisible();

    // Mobile menu button should be visible
    const hamburger = page.locator('.mobile-menu, #mobileMenuBtn');
    await expect(hamburger).toBeVisible();

    // Click hamburger — nav opens
    await hamburger.click();
    await expect(navLinks).toHaveClass(/open/);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    // Click hamburger again — nav closes
    await hamburger.click();
    await expect(navLinks).not.toHaveClass(/open/);
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Verify grids stack to single column
    // Pricing grid
    const pricingGrid = page.locator('.pricing-grid');
    if (await pricingGrid.count() > 0) {
      const gridCols = await pricingGrid.evaluate(el => getComputedStyle(el).gridTemplateColumns);
      // Should be single column (one value, not two)
      const colCount = gridCols.split(/\s+/).filter(v => v !== '').length;
      expect(colCount).toBe(1);
    }

    // Qualifier grid
    const qualGrid = page.locator('.qualifier-grid');
    if (await qualGrid.count() > 0) {
      await qualGrid.scrollIntoViewIfNeeded();
      const gridCols = await qualGrid.evaluate(el => getComputedStyle(el).gridTemplateColumns);
      const colCount = gridCols.split(/\s+/).filter(v => v !== '').length;
      expect(colCount).toBe(1);
    }
  });
});

// ============================================
// 2E. CAL.COM LINKS (7 links)
// ============================================
test.describe('Cal.com Links', () => {
  test('exactly 7 Cal.com links all pointing to correct URL @desktop', async ({ page }) => {
    await page.goto('/');
    const calLinks = page.locator('a[href*="cal.com/david-mustac/gtmiq"]');
    await expect(calLinks).toHaveCount(7);

    // Verify all point to exact URL
    const hrefs = await calLinks.evaluateAll(els => els.map(el => el.getAttribute('href')));
    for (const href of hrefs) {
      expect(href).toBe('https://cal.com/david-mustac/gtmiq');
    }
  });
});

// ============================================
// 2F. FORMSUBMIT ENDPOINT
// ============================================
test.describe('FormSubmit Endpoint', () => {
  test('FormSubmit posts to dejvid814@gmail.com @desktop', async ({ page }) => {
    const content = await page.goto('/').then(() => page.content());
    expect(content).toContain('formsubmit.co/ajax/dejvid814@gmail.com');
  });
});

// ============================================
// 2G. EXTERNAL LINKS SECURITY
// ============================================
test.describe('External Links Security', () => {
  test('all target="_blank" links have rel="noopener noreferrer" @desktop', async ({ page }) => {
    await page.goto('/');
    const blankLinks = page.locator('a[target="_blank"]');
    const count = await blankLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const rel = await blankLinks.nth(i).getAttribute('rel');
      const href = await blankLinks.nth(i).getAttribute('href');
      expect(rel, `Link to ${href} missing rel="noopener noreferrer"`).toBe('noopener noreferrer');
    }
  });
});

// ============================================
// 2H. ARIA ATTRIBUTES
// ============================================
test.describe('ARIA Attributes', () => {
  test('accessibility attributes are present @desktop', async ({ page }) => {
    await page.goto('/');

    // FAQ buttons have aria-expanded
    const faqBtns = page.locator('.faq-question');
    const faqCount = await faqBtns.count();
    expect(faqCount).toBe(6);
    for (let i = 0; i < faqCount; i++) {
      await expect(faqBtns.nth(i)).toHaveAttribute('aria-expanded');
    }

    // Mobile menu button has aria-expanded and aria-label
    const mobileBtn = page.locator('#mobileMenuBtn');
    await expect(mobileBtn).toHaveAttribute('aria-expanded');
    await expect(mobileBtn).toHaveAttribute('aria-label');

    // Email/company inputs have aria-label
    const emailInput = page.locator('#gateEmail');
    await expect(emailInput).toHaveAttribute('aria-label');
    const companyInput = page.locator('#gateCompany');
    await expect(companyInput).toHaveAttribute('aria-label');

    // Skip navigation link exists
    const skipLink = page.locator('.skip-link, a[href="#main"]');
    await expect(skipLink).toHaveCount(1);
  });
});

// ============================================
// 2I. NO JS CONSOLE ERRORS
// ============================================
test.describe('Console Errors', () => {
  test('no JS console errors on page load and interaction @desktop', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Interact with key elements
    await page.locator('#faq').scrollIntoViewIfNeeded();
    const firstFaq = page.locator('.faq-question').first();
    if (await firstFaq.isVisible()) await firstFaq.click();

    await page.locator('#scorecard').scrollIntoViewIfNeeded();

    expect(errors, `Console errors found: ${errors.join(', ')}`).toHaveLength(0);
  });
});

// ============================================
// 2J. SCREENSHOTS
// ============================================
test.describe('Screenshots', () => {
  test('desktop full-page screenshot', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Trigger all animations
    await page.evaluate(() => {
      document.querySelectorAll('.fade-up, .animate-in').forEach(el => el.classList.add('visible'));
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-desktop.png', fullPage: true });
    await context.close();
  });

  test('mobile full-page screenshot', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      document.querySelectorAll('.fade-up, .animate-in').forEach(el => el.classList.add('visible'));
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-mobile.png', fullPage: true });
    await context.close();
  });
});
