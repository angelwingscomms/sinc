import { expect, test } from 'vitest';
import { fit } from './fit';

test('320x240 source into 1920x1080 frame gives scale 4.5, dx 240, dy 0', () => {
	const r = fit(320, 240, 1920, 1080);
	expect(r.s).toBe(4.5);
	expect(r.dx).toBe(240);
	expect(r.dy).toBe(0);
});
