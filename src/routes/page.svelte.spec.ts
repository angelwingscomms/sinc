import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import Page from './+page.svelte';

test('shell has all four regions', async () => {
	const s = render(Page);
	for (const r of ['topbar', 'library', 'stage', 'timeline'])
		await expect
			.element(s.baseElement.querySelector(`[data-r="${r}"]`) as HTMLElement)
			.toBeInTheDocument();
});
