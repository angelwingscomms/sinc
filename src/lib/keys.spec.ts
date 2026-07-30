import { expect, test } from 'vitest';
import { match } from './keys.svelte';

test("match(' ', 'DIV', false, false) === 'play'", () =>
	expect(match(' ', 'DIV', false, false)).toBe('play'));

test("match('b', 'DIV', false, false) === 'mark'", () =>
	expect(match('b', 'DIV', false, false)).toBe('mark'));

test("match('b', 'INPUT', false, false) === null", () =>
	expect(match('b', 'INPUT', false, false)).toBeNull());

test("match('b', 'DIV', true, false) === null", () =>
	expect(match('b', 'DIV', true, false)).toBeNull());

test("match('z', 'DIV', false, true) === 'undo'", () =>
	expect(match('z', 'DIV', false, true)).toBe('undo'));

test("match('z', 'DIV', false, false) === null", () =>
	expect(match('z', 'DIV', false, false)).toBeNull());

test("match('b', 'DIV', false, true) === null", () =>
	expect(match('b', 'DIV', false, true)).toBeNull());

test("match('B', 'DIV', false, false) === 'mark'", () =>
	expect(match('B', 'DIV', false, false)).toBe('mark'));

test("match('q', 'DIV', false, false) === null", () =>
	expect(match('q', 'DIV', false, false)).toBeNull());
