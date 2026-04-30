import type { Page } from '@playwright/test';

/**
 * Open a named Flowbite tab.
 * @param page Playwright page.
 * @param name Visible tab name.
 */
export async function openTab(page: Page, name: string): Promise<void> {
	await page.getByRole('tab', { name }).click({ force: true });
}

/**
 * Update a range input and dispatch the events Svelte listens for.
 * @param page Playwright page.
 * @param selector Selector that resolves to an input[type=range].
 * @param value Desired numeric value.
 */
export async function setRangeValue(page: Page, selector: string, value: number): Promise<void> {
	await page.locator(selector).evaluate((element, nextValue) => {
		const input = element as HTMLInputElement;
		input.value = String(nextValue);
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
	}, value);
}
