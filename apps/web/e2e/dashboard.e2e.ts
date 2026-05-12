import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:4001'

/**
 * Dashboard E2E tests — these require a seeded test database.
 * Set TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD env vars to run.
 */

async function loginAs(page: any, email: string, password: string) {
  await page.goto(`${BASE}/en/login`)
  await page.getByRole('textbox', { name: /email/i }).fill(email)
  await page.getByRole('textbox', { name: /password/i }).fill(password)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await page.waitForURL(/dashboard|admin|teacher|student/, { timeout: 10000 })
}

test.describe('Admin Dashboard', () => {
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires TEST_ADMIN_EMAIL env var')

  test('admin can navigate to Users page', async ({ page }) => {
    await loginAs(page, process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!)
    await page.goto(`${BASE}/en/admin/users`)
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible({ timeout: 10000 })
  })

  test('admin can navigate to Analytics page', async ({ page }) => {
    await loginAs(page, process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!)
    await page.goto(`${BASE}/en/admin/analytics`)
    await expect(page.getByText(/overview|analytics/i)).toBeVisible({ timeout: 10000 })
  })

  test('admin can navigate to Tickets page', async ({ page }) => {
    await loginAs(page, process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!)
    await page.goto(`${BASE}/en/admin/tickets`)
    await expect(page.getByText(/ticket/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Public pages', () => {
  test('home page loads without crash', async ({ page }) => {
    const response = await page.goto(`${BASE}/en`)
    expect(response?.status()).toBeLessThan(500)
  })

  test('login page has correct title', async ({ page }) => {
    await page.goto(`${BASE}/en/login`)
    expect(await page.title()).toMatch(/EduCore/)
  })
})
