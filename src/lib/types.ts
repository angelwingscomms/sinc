export type src = {
	i: string;
	n: string;
	k: 'v' | 'a' | 'p';
	d: number;
	f: number;
	w: number;
	h: number;
};

export type clip = {
	i: string;
	s: string;
	a: number;
	b: number;
};

export type track = {
	i: string;
	k: 'v' | 'a';
	n: string;
	m: 0 | 1;
	h: 0 | 1;
};

export type marker = {
	p: number;
	g: string;
};

export type item = {
	i: string;
	c: string;
	t: string;
	p: number;
	l: number;
};

export type proj = {
	f: number;
	w: number;
	h: number;
	r: src[];
	c: clip[];
	t: track[];
	m: marker[];
	x: item[];
};
