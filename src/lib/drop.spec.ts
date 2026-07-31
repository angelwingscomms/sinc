import { expect, test } from 'vitest';
import { drop_pos } from './drop';

test('head snaps to 100', () => expect(drop_pos(103, 30, [100, 400], 4, true)).toBe(100));

test('outside tolerance returns want', () =>
	expect(drop_pos(103, 30, [100, 400], 1, true)).toBe(103));

test('tail snaps to 370', () => expect(drop_pos(371, 30, [100, 400], 4, true)).toBe(370));

test('snap off returns want clamped', () => expect(drop_pos(103, 30, [100], 4, false)).toBe(103));

test('never negative with snap on', () => expect(drop_pos(-40, 30, [0], 4, true)).toBe(0));
