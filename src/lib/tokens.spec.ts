import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

const css = readFileSync('src/routes/layout.css', 'utf8');

test('design tokens exist', () => {
	for (const t of [
		'--color-bg',
		'--color-panel',
		'--color-panel2',
		'--color-line',
		'--color-ink',
		'--color-dim',
		'--color-beat',
		'--color-sel',
		'--font-sans',
		'--font-mono',
		'--radius-panel',
		'--ease-snap'
	])
		expect(css).toContain(t);
});

const walk = (d: string): string[] =>
	readdirSync(d).flatMap((f) => {
		const p = join(d, f);
		return statSync(p).isDirectory() ? walk(p) : p.endsWith('.svelte') ? [p] : [];
	});

test('no raw hex colours in components', () => {
	for (const f of walk('src')) {
		expect(readFileSync(f, 'utf8'), f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
	}
});
