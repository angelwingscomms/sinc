import { expect, test } from 'vitest';
import { nudge } from './nudge';

test('nudge(10, 20, a, 1, 99) === [11, 20]', () => {
	expect(nudge(10, 20, 'a', 1, 99)).toEqual([11, 20]);
});

test('nudge(19, 20, a, 5, 99) === [20, 20]', () => {
	expect(nudge(19, 20, 'a', 5, 99)).toEqual([20, 20]);
});

test('nudge(0, 20, a, -5, 99) === [0, 20]', () => {
	expect(nudge(0, 20, 'a', -5, 99)).toEqual([0, 20]);
});

test('nudge(10, 98, b, 5, 99) === [10, 99]', () => {
	expect(nudge(10, 98, 'b', 5, 99)).toEqual([10, 99]);
});

test('nudge(10, 10, b, -3, 99) === [10, 10]', () => {
	expect(nudge(10, 10, 'b', -3, 99)).toEqual([10, 10]);
});
