#!/usr/bin/env python3
"""Rebuild src/data/ifi-limerick.json from the IFI timetable web app.

IFI's timetable page (https://islamicfoundation.ie/timetable/) is a Flutter
web app. Each city's yearly table is compiled into main.dart.js: a "normal"
table (shared constants) and a "leap" table (a literal map). This script
pulls both out for Limerick.

Usage:
  curl -sSL -A "Mozilla/5.0" https://islamicfoundation.ie/timetable/main.dart.js -o main.dart.js
  python3 tools/extract_ifi_tables.py main.dart.js src/data/ifi-limerick.json

The constant names (dwU, aXi) are minified and change whenever IFI rebuilds
their app. Find the new ones by searching main.dart.js for
`case"limerick":s=B.xxx` (normal table) and `case"limerick":s=$.yyy()` (leap
table), then pass them with --normal and --leap.
"""
import argparse, json, re, sys


def resolve_consts(js: str, root: str):
    defs = {}
    for line in js.splitlines():
        m = re.match(r'^B\.([A-Za-z0-9_$]+)=(.*)$', line)
        if m and m.group(1) not in defs:
            defs[m.group(1)] = m.group(2)
    cache = {}

    def ev(name):
        if name in cache:
            return cache[name]
        e = defs[name]
        if e.startswith('{'):
            v = json.loads(e)
        elif e.startswith('A.a(s(['):
            inner = e[len('A.a(s(['):e.rindex(']),')]
            v = [ev(x[2:]) if x.startswith('B.') else int(x) for x in inner.split(',')]
        elif e.startswith('new A.n('):
            m = re.match(r'new A\.n\(B\.([A-Za-z0-9_$]+),\[(.*)\],t\.', e)
            keys = ev(m.group(1))
            vals = [ev(x[2:]) for x in m.group(2).split(',')]
            v = {k: vals[keys[k]] for k in sorted(keys, key=lambda k: keys[k])}
        else:
            raise ValueError(f'{name}: {e[:80]}')
        cache[name] = v
        return v

    return ev(root)


def parse_lazy_literal(js: str, name: str):
    i = js.index(f'"{name}",')
    i = js.index('return ', i) + 7
    tok = re.compile(r'A\.m\(\[|A\.a\(\[|\],[a-z]\)|\],[a-z],[a-z]\)|"\d+"|\d+|,|\]')
    pos, stack = i, []
    while True:
        m = tok.match(js, pos)
        if not m:
            raise ValueError(js[pos:pos + 60])
        t, pos = m.group(), m.end()
        if t in ('A.m([', 'A.a(['):
            stack.append([])
        elif t == ',':
            continue
        elif t.startswith(']'):
            lst = stack.pop()
            v = dict(zip(lst[0::2], lst[1::2])) if t.count(',') == 2 else lst
            if not stack:
                return v
            stack[-1].append(v)
        elif t.startswith('"'):
            stack[-1].append(t.strip('"'))
        else:
            stack[-1].append(int(t))


def to_minutes(table):
    return [[[h * 60 + m for h, m in table[str(mo)][str(d)]] for d in range(1, len(table[str(mo)]) + 1)]
            for mo in range(1, 13)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('js')
    ap.add_argument('out')
    ap.add_argument('--normal', default='dwU', help='B.<name> for the Limerick normal-year table')
    ap.add_argument('--leap', default='aXi', help='$.<name>() for the Limerick leap-year table')
    a = ap.parse_args()
    js = open(a.js, encoding='utf-8').read()
    normal = resolve_consts(js, a.normal)
    leap = parse_lazy_literal(js, a.leap)
    with open(a.out, encoding='utf-8') as f:
        source = json.load(f).get('_source', '')
    out = {'_source': source, 'normal': to_minutes(normal), 'leap': to_minutes(leap)}
    json.dump(out, open(a.out, 'w'), separators=(',', ':'))
    print('normal days:', sum(len(m) for m in out['normal']), 'leap days:', sum(len(m) for m in out['leap']))


if __name__ == '__main__':
    sys.exit(main())
