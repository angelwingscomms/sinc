import { expect, test } from 'vitest';
import { tc, conv_fr, sec_to_fr, snap, clean_fps } from './time';

test('tc(0, 30) === 00:00:00:00', () => expect(tc(0, 30)).toBe('00:00:00:00'));

test('tc(30, 30) === 00:00:01:00', () => expect(tc(30, 30)).toBe('00:00:01:00'));

test('tc(3599*30+29, 30) === 00:59:59:29', () =>
	expect(tc(3599 * 30 + 29, 30)).toBe('00:59:59:29'));

test('tc(108000, 30) === 01:00:00:00', () => expect(tc(108000, 30)).toBe('01:00:00:00'));

test('tc(-5, 30) === 00:00:00:00', () => expect(tc(-5, 30)).toBe('00:00:00:00'));

test('conv_fr(24, 24, 30) === 30', () => expect(conv_fr(24, 24, 30)).toBe(30));

test('conv_fr(7, 30, 30) === 7', () => expect(conv_fr(7, 30, 30)).toBe(7));

test('sec_to_fr(1.4833, 30) === 44', () => expect(sec_to_fr(1.4833, 30)).toBe(44));

test('snap(100, [96, 140], 8) === 96', () => expect(snap(100, [96, 140], 8)).toBe(96));

test('snap(100, [80, 140], 8) === 100', () => expect(snap(100, [80, 140], 8)).toBe(100));

test('snap(100, [92, 108], 8) === 92', () => expect(snap(100, [92, 108], 8)).toBe(92));

test('snap(5, [], 8) === 5', () => expect(snap(5, [], 8)).toBe(5));

test('clean_fps(29.9683) === 29.97', () => expect(clean_fps(29.9683)).toBe(29.97));

test('clean_fps(30.0004) === 30', () => expect(clean_fps(30.0004)).toBe(30));

test('clean_fps(12.5) === 12.5', () => expect(clean_fps(12.5)).toBe(12.5));
