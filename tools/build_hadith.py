#!/usr/bin/env python3
"""Builds src/data/hadith.json from the open hadith corpus (fawazahmed0/hadith-api,
a dump of Sunnah.com) and the selection in tools/hadith-selection.json.

Usage: python3 -I tools/build_hadith.py <dir with ara-*.json / eng-*.json> [--review]

Each selection entry names a collection, a distinctive Arabic phrase (or a
number), a category and an optional English override. The script finds the
shortest hadith containing the phrase, extracts the Prophet's words (the
quoted matn), takes the translation and the grading from the corpus, and
writes the result. With --review it prints every entry for checking.
"""
import json, re, sys, unicodedata

COLL = {
    'bukhari': ('Sahih al-Bukhari', 'bukhari'),
    'muslim': ('Sahih Muslim', 'muslim'),
    'tirmidhi': ("Jami' at-Tirmidhi", 'tirmidhi'),
    'abudawud': ('Sunan Abi Dawud', 'abudawud'),
    'nasai': ("Sunan an-Nasa'i", 'nasai'),
    'ibnmajah': ('Sunan Ibn Majah', 'ibnmajah'),
}
TASHKEEL = re.compile(r'[ؐ-ًؚ-ٰٟۖ-ۭـ]')
SAW = re.compile(r'\s*' + r'[\u064B-\u065F\u0670]*'.join('صلى الله عليه وسلم').replace(' ', r'\s+') + r'[\u064B-\u065F\u0670]*\s*')

PUNCT = re.compile(r'[\u200f\u200e\u202a-\u202e،؛:؟.,"\'()\[\]«»\-]')

def norm(s):
    s = TASHKEEL.sub('', s)
    s = PUNCT.sub(' ', s)
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا').replace('ة', 'ه').replace('ى', 'ي').replace('ؤ', 'و').replace('ئ', 'ي')
    return re.sub(r'\s+', ' ', s).strip()

def load(d, name):
    with open(f'{d}/{name}.json', encoding='utf-8') as f:
        return json.load(f)['hadiths']

def sunnah_number(coll, h):
    n = h.get('arabicnumber') if coll == 'muslim' else h.get('hadithnumber')
    try:
        return int(float(n))
    except (TypeError, ValueError):
        return None

def muslim_suspects(ara):
    """Sahih Muslim's Sunnah.com (Abdul Baqi) numbers rise through the book;
    the corpus has a few runs with wrong values. Flag records whose number
    falls well below the running maximum."""
    bad, running = set(), 0
    for h in ara:
        n = sunnah_number('muslim', h)
        if n is None:
            continue
        if n < running - 60:
            bad.add(h['hadithnumber'])
        else:
            running = max(running, n)
    return bad

def norm_map(s):
    """Normalised text plus, for each normalised char, its index in the original."""
    out, idx = [], []
    prev_space = True
    for i, ch in enumerate(s):
        if TASHKEEL.match(ch):
            continue
        if PUNCT.match(ch) or ch.isspace():
            if not prev_space:
                out.append(' '); idx.append(i)
            prev_space = True
            continue
        ch = {'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي'}.get(ch, ch)
        out.append(ch); idx.append(i)
        prev_space = False
    return ''.join(out), idx

def cut(text, start, end):
    """The exact corpus text from the first occurrence of `start` (normalised)
    to the end of the following occurrence of `end`."""
    n, idx = norm_map(text)
    a = n.find(norm(start))
    if a < 0:
        raise ValueError(f'start not found: {start}')
    b = n.find(norm(end), a)
    if b < 0:
        raise ValueError(f'end not found: {end}')
    b_end = b + len(norm(end)) - 1
    return re.sub(r'\s+', ' ', text[idx[a]:idx[b_end] + 1]).strip()

def matn(text):
    """The Prophet's words: the text between the first and the last quote
    markers; if there is no usable quote, everything after the chain."""
    t = text.replace('‏', '')
    parts = t.split('"')
    if len(parts) == 2 and len(norm(parts[1])) >= 12:
        return re.sub(r'\s+', ' ', parts[1]).strip(' .\u200f')
    if len(parts) >= 3:
        inner = '"'.join(parts[1:-1]).strip()
        if len(norm(inner)) >= 12:
            return re.sub(r'\s+', ' ', inner).strip(' .‏')
    m = list(SAW.finditer(t))
    if m:
        return re.sub(r'\s+', ' ', t[m[0].end():]).strip(' .‏')
    return re.sub(r'\s+', ' ', t).strip()

def grade(coll, h):
    if coll in ('bukhari', 'muslim'):
        return 'Sahih'
    for g in h.get('grades', []):
        if g.get('name') == 'Al-Albani':
            return g['grade']
    for g in h.get('grades', []):
        return f"{g['grade']} ({g['name']})"
    return ''

def main():
    d = sys.argv[1]
    review = '--review' in sys.argv
    sel = json.load(open('tools/hadith-selection.json', encoding='utf-8'))
    cache = {}
    out, problems = [], []
    for s in sel:
        coll = s['collection']
        if coll not in cache:
            ara = load(d, f'ara-{coll}')
            eng = {h['hadithnumber']: h for h in load(d, f'eng-{coll}')}
            cache[coll] = (ara, eng)
        ara, eng = cache[coll]
        hit = None
        if 'number' in s:
            cands = [h for h in ara if sunnah_number(coll, h) == s['number']]
        else:
            key = norm(s['phrase'])
            cands = [h for h in ara if key in norm(h['text'])]
        if not cands:
            problems.append(f"NOT FOUND {coll} {s.get('number') or s.get('phrase')}")
            continue
        hit = min(cands, key=lambda h: len(h['text']))
        n = s.get('ref_number') or sunnah_number(coll, hit)
        if coll == 'muslim' and not s.get('ref_number'):
            if 'suspects' not in cache[coll][1]:
                cache[coll][1]['suspects'] = muslim_suspects(ara)
            if hit['hadithnumber'] in cache[coll][1]['suspects'] or sunnah_number(coll, hit) is None:
                problems.append(f"MUSLIM NUMBER SUSPECT for {s.get('phrase') or s.get('number')}: corpus says {hit.get('arabicnumber')} (book {hit['reference']['book']} hadith {hit['reference']['hadith']}); add ref_number")
                continue
        e = eng.get(hit['hadithnumber'], {})
        try:
            ar = cut(hit['text'], s['from'], s['to']) if 'from' in s else matn(hit['text'])
        except ValueError as err:
            problems.append(f"CUT {coll} {s.get('number') or s.get('phrase')}: {err}")
            continue
        en = s.get('en') or re.sub(r'\s+', ' ', e.get('text', '')).strip()
        g = grade(coll, hit)
        if 'da' in g.lower().replace('hasan', '') and 'sahih' not in g.lower():
            problems.append(f"WEAK {coll} {n}: {g}")
            continue
        name, slug = COLL[coll]
        item = {
            'id': f'{slug}-{n}' + (f"-{s['suffix']}" if s.get('suffix') else ''),
            'category': s['category'],
            'ar': ar, 'en': en,
            'ref': f'{name} {n}' + (f" · {s['also']}" if s.get('also') else ''),
            'grade': g, 'url': f'https://sunnah.com/{slug}:{n}',
        }
        if s.get('topic'): item['topic'] = s['topic']
        out.append(item)
        if review:
            print(f"\n[{s['category']}] {item['ref']} · {g} · ar {len(ar)} chars\n{ar}\n{en}")
    ids = [o['id'] for o in out]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup: problems.append('DUPLICATE IDS ' + ', '.join(sorted(dup)))
    for p in problems: print('!!', p, file=sys.stderr)
    if not review:
        with open('src/data/hadith.json', 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
        print(f'wrote {len(out)} hadith to src/data/hadith.json', file=sys.stderr)
    return 1 if problems else 0

if __name__ == '__main__':
    sys.exit(main())
