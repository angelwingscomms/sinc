export type act =
	| 'play'
	| 'mark'
	| 'clip'
	| 'in'
	| 'out'
	| 'prev'
	| 'next'
	| 'add'
	| 'snap'
	| 'undo'
	| 'redo'
	| 'del'
	| 'esc';

export const def: Record<act, string> = {
	play: ' ',
	mark: 'b',
	clip: 'c',
	in: 's',
	out: 'e',
	prev: 'ArrowLeft',
	next: 'ArrowRight',
	add: 'a',
	snap: 'n',
	undo: 'z',
	redo: 'y',
	del: 'Delete',
	esc: 'Escape'
};

const KEY = 'sinc_keys';

const saved = (): Partial<Record<act, string>> => {
	try {
		return JSON.parse(localStorage.getItem(KEY) ?? '{}');
	} catch {
		return {};
	}
};

export const binds = $state<Record<act, string>>({ ...def, ...saved() });

export function set_bind(a: act, k: string) {
	binds[a] = k;
	localStorage.setItem(KEY, JSON.stringify($state.snapshot(binds)));
}

export function reset_binds() {
	Object.assign(binds, def);
	localStorage.removeItem(KEY);
}

export function match(
	key: string,
	tag: string,
	editable: boolean,
	ctrl: boolean,
	b: Record<act, string> = def
): act | null {
	if (editable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return null;
	const found = (Object.keys(b) as act[]).find((a) => b[a].toLowerCase() === key.toLowerCase());
	if (!found) return null;
	if (ctrl) return found === 'undo' || found === 'redo' ? found : null;
	return found === 'undo' || found === 'redo' ? null : found;
}

export function from_event(e: KeyboardEvent) {
	const t = e.target as HTMLElement | null;
	return match(e.key, t?.tagName ?? '', !!t?.isContentEditable, e.ctrlKey || e.metaKey, binds);
}
