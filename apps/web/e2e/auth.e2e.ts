import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:4001'

test.describe('Authentication', () => {
  test('login page renders', async ({ page }) => {
    await page.goto(`${BASE}/en/login`)
    await expect(page).toHaveTitle(/EduCore/)
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE}/en/login`)
    await page.getByRole('textbox', { name: /email/i }).fill('nobody@test.com')
    await page.getByRole('textbox', { name: /password/i }).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page.getByText(/invalid|incorrect|unauthorized/i)).toBeVisible({ timeout: 5000 })
  })

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto(`${BASE}/en/admin`)
    await expect(page).toHaveURL(/login/)
  })

  test('redirects unauthenticated user from student dashboard to login', async ({ page }) => {
    await page.goto(`${BASE}/en/student`)
    await expect(page).toHaveURL(/login/)
  })
})
