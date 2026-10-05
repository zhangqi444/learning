#!/usr/bin/env python3
"""The parts of docs/isee-item-spec.md a machine can check.

Imported by validate_content.py, which gates on them, and by the mock authoring
scripts, so an author sees the same failure the gate would and not a paraphrase
of it. Three things live here and nowhere else:

- the official answer-choice order. ERB, *What to Expect on the ISEE*: "answer
  choices on this test are arranged alphabetically, numerically, or by length of
  the answer" — one-word choices alphabetical, numbers ascending, phrases by
  length. A set the convention cannot reach (an algebraic expression, a mix of a
  number and a sentence) is left alone;
- the figure an item may carry (`figure`), the one schema that
  site/src/components/figure.jsx knows how to draw;
- the shape of a line-numbered passage (`lines: true`), which the passage view
  numbers line by line and whose questions may cite a line.

Which forms are held to the order rule is a list, not a flag on the item. A form
either follows the convention on every question or it does not: a child who has
met one shuffled set learns nothing from the rest being in order, and the
balanced-letter forms were shuffled on purpose and must not be half-converted.
The list grows as each form is rewritten to the spec.
"""
import hashlib, json, re
from fractions import Fraction
from math import gcd

L = 'ABCD'
OFFICIAL_FORMS = {'M01'}

# ---- reading a choice as a number ------------------------------------------------
# Enough of the ways a Lower Level answer is written to put a set in order:
# "235 cm", "$1.20", "45%", "68°", "3:45 p.m.", "2 1/2 cups", "7/12", "1,250",
# "12 square feet". A remainder ("7 R 3") or an expression ("6y + 18") is None.
_TIME = re.compile(r'^(\d{1,2}):(\d{2})\s*(?:([ap])\.?\s*m\.?)?$', re.I)
_MIXED = re.compile(r'^(-?\d+)\s+(\d+)/(\d+)$')
_FRAC = re.compile(r'^(-?\d+)/(\d+)$')
_TRAIL_WORD = re.compile(r'\s+[A-Za-z°²\.]+$')

def num(s):
    """The value of a choice written as a number, or None when it is not one."""
    t = str(s).strip().replace(',', '').replace('−', '-').replace(' ', ' ')
    t = re.sub(r'^\$\s*', '', t)
    t = re.sub(r'\s*(%|°)$', '', t)
    m = _TIME.match(t)
    if m:
        h, mi, ap = int(m.group(1)), int(m.group(2)), (m.group(3) or '').lower()
        if ap: h = h % 12 + (12 if ap == 'p' else 0)
        return Fraction(h * 60 + mi)
    # strip up to two trailing unit words ("square feet", "cm", "p.m." is handled above)
    for _ in range(2):
        v = _plain(t)
        if v is not None: return v
        t2 = _TRAIL_WORD.sub('', t)
        if t2 == t: break
        t = t2
    return _plain(t)

def _plain(t):
    t = t.strip()
    m = _MIXED.match(t)
    if m:
        w, a, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if b == 0: return None
        f = Fraction(a, b)
        return Fraction(w) + (f if w >= 0 and not t.startswith('-') else -f)
    m = _FRAC.match(t)
    if m:
        if int(m.group(2)) == 0: return None
        return Fraction(int(m.group(1)), int(m.group(2)))
    if re.fullmatch(r'-?\d+(\.\d+)?', t):
        return Fraction(t)
    return None

_WORD = re.compile(r"^[A-Za-z][A-Za-z'’-]*$")
_EXPR = re.compile(r'[A-Za-z]\s*[-+×x*/÷=<>]|[-+×*/÷=<>]\s*[A-Za-z]|\d\s*[A-Za-z]\b|\b[A-Za-z]\d|\(|\)|=|<|>|÷|×')

def kind_of(choices):
    """'number' | 'word' | 'phrase' | 'expression' for a set of four choice strings."""
    vals = [str(c).strip() for c in choices]
    if all(num(c) is not None for c in vals): return 'number'
    if all(_WORD.match(c) for c in vals): return 'word'
    # an expression, a coordinate pair, a remainder, a ratio: the convention cannot reach it
    if any(_EXPR.search(c) or re.search(r'\d', c) for c in vals): return 'expression'
    return 'phrase'

def in_official_order(choices):
    """Whether four choices (in A–D order) follow the convention. Expressions always pass."""
    vals = [str(c).strip() for c in choices]
    k = kind_of(vals)
    if k == 'number':
        ns = [num(c) for c in vals]
        return all(a < b for a, b in zip(ns, ns[1:]))
    if k == 'word':
        return vals == sorted(vals, key=lambda w: w.lower())
    if k == 'phrase':
        ls = [len(c) for c in vals]
        return all(a <= b for a, b in zip(ls, ls[1:]))
    return True

def order_errors(it):
    """Order, simplification and format-cue rules for the forms held to the spec."""
    i = it['id']; ch = it.get('choices') or {}
    if sorted(ch) != list(L): return []
    vals = [str(ch[k]).strip() for k in L]
    out = []
    # numeric duplicates are wrong on every form: 2/4 beside 1/2 is one answer twice
    ns = [num(v) for v in vals]
    if all(n is not None for n in ns) and len(set(ns)) < 4:
        out.append(f'{i}: two choices are the same number written differently ({", ".join(vals)})')
    if it.get('form') not in OFFICIAL_FORMS: return out
    k = kind_of(vals)
    if not in_official_order(vals):
        how = {'number': 'ascending', 'word': 'alphabetical', 'phrase': 'shortest to longest'}[k]
        out.append(f'{i}: choices are not in the official order ({how}): {" | ".join(vals)}')
    for v in vals:
        m = _FRAC.match(v) or _MIXED.match(v)
        if m:
            a, b = (int(m.group(2)), int(m.group(3))) if len(m.groups()) == 3 else (int(m.group(1)), int(m.group(2)))
            if gcd(abs(a), b) != 1 or (len(m.groups()) == 3 and a >= b):
                out.append(f'{i}: "{v}" is not in lowest terms — a printed paper never shows an unsimplified fraction')
    if k == 'number':
        dec = [v for v in vals if '.' in v]
        if len(dec) == 1 and dec[0] == str(ch[it.get('correct', '')]).strip():
            out.append(f'{i}: the key is the only decimal among whole numbers — a format cue that answers the question')
    return out

# ---- figures ----------------------------------------------------------------------
# The schema site/src/components/figure.jsx draws. Adding a type means adding it in
# both places, and the test that renders one of each (test_features.cjs).
FIGURES = {
    'table':      {'req': ['head', 'rows'], 'opt': ['caption']},
    'bar':        {'req': ['bars'], 'opt': ['title', 'x', 'y', 'step', 'max']},
    'line':       {'req': ['points'], 'opt': ['title', 'x', 'y', 'step', 'max']},
    'pictograph': {'req': ['rows', 'unit'], 'opt': ['title']},
    'numberline': {'req': ['min', 'max', 'step'], 'opt': ['points', 'labelEvery']},
    'grid':       {'req': ['xmax', 'ymax'], 'opt': ['points', 'polygon', 'quadrants', 'title']},
    'polygon':    {'req': ['points'], 'opt': ['labels', 'right', 'grid', 'shade', 'title']},
    'venn':       {'req': ['left', 'right'], 'opt': ['counts', 'items', 'outside', 'title']},
    'spinner':    {'req': ['sectors'], 'opt': ['title']},
    'clock':      {'req': ['h', 'm'], 'opt': ['title']},
    'shaded':     {'req': ['shape', 'parts', 'shaded'], 'opt': ['cols', 'title']},
    'cubes':      {'req': ['w', 'd', 'h'], 'opt': ['title']},
}
_NUMT = (int, float)

def _is_num(v): return isinstance(v, _NUMT) and not isinstance(v, bool)
def _label_ok(v): return isinstance(v, str) and 0 < len(v) <= 28 and '<' not in v

def figure_errors(it):
    f = it.get('figure')
    if f is None: return []
    i = it['id']
    if not isinstance(f, dict) or f.get('type') not in FIGURES:
        return [f'{i}: figure.type must be one of {", ".join(sorted(FIGURES))}']
    t = f['type']; spec = FIGURES[t]; out = []
    extra = set(f) - set(spec['req']) - set(spec['opt']) - {'type'}
    if extra: out.append(f'{i}: figure has keys {sorted(extra)} that a {t} does not take')
    for k in spec['req']:
        if k not in f: out.append(f'{i}: figure ({t}) is missing {k}')
    if out: return out
    def rows_ok(rows, name, lo, hi):
        if not isinstance(rows, list) or not lo <= len(rows) <= hi:
            out.append(f'{i}: figure.{name} must be a list of {lo}–{hi} entries'); return False
        return True
    if t == 'table':
        head, rows = f['head'], f['rows']
        if not (isinstance(head, list) and 2 <= len(head) <= 5 and all(_label_ok(h) for h in head)):
            out.append(f'{i}: figure.head must be 2–5 short strings')
        elif rows_ok(rows, 'rows', 1, 8):
            for r in rows:
                if not (isinstance(r, list) and len(r) == len(head) and all(_label_ok(c) for c in r)):
                    out.append(f'{i}: every figure.rows entry needs {len(head)} short strings'); break
    elif t in ('bar', 'line'):
        key = 'bars' if t == 'bar' else 'points'
        if rows_ok(f[key], key, 2, 8):
            for b in f[key]:
                if not (isinstance(b, dict) and _label_ok(b.get('label')) and _is_num(b.get('value')) and b['value'] >= 0):
                    out.append(f'{i}: each figure.{key} entry is {{label, value>=0}}'); break
        if 'step' in f and not (_is_num(f['step']) and f['step'] > 0): out.append(f'{i}: figure.step must be a positive number')
        if 'max' in f and not (_is_num(f['max']) and f['max'] > 0): out.append(f'{i}: figure.max must be a positive number')
    elif t == 'pictograph':
        if not _label_ok(f['unit']): out.append(f'{i}: figure.unit is the legend, e.g. "= 4 books"')
        if rows_ok(f['rows'], 'rows', 2, 8):
            for r in f['rows']:
                c = r.get('count') if isinstance(r, dict) else None
                if not (isinstance(r, dict) and _label_ok(r.get('label')) and _is_num(c) and 0 <= c <= 12 and (c * 2) == int(c * 2)):
                    out.append(f'{i}: each figure.rows entry is {{label, count}} with count in halves, at most 12'); break
    elif t == 'numberline':
        mn, mx, st = f['min'], f['max'], f['step']
        if not (all(_is_num(v) for v in (mn, mx, st)) and mx > mn and st > 0 and (mx - mn) / st <= 40):
            out.append(f'{i}: figure numberline needs min < max and a step giving at most 40 ticks')
        for p in f.get('points', []):
            if not (isinstance(p, dict) and _is_num(p.get('at')) and _label_ok(p.get('label', 'P'))):
                out.append(f'{i}: each numberline point is {{at, label}}'); break
    elif t == 'grid':
        if not (isinstance(f['xmax'], int) and isinstance(f['ymax'], int) and 2 <= f['xmax'] <= 12 and 2 <= f['ymax'] <= 12):
            out.append(f'{i}: figure grid xmax/ymax are whole numbers 2–12')
        if f.get('quadrants', 1) not in (1, 4): out.append(f'{i}: figure.quadrants is 1 or 4')
        for p in f.get('points', []):
            if not (isinstance(p, dict) and _is_num(p.get('x')) and _is_num(p.get('y')) and _label_ok(p.get('label', 'P'))):
                out.append(f'{i}: each grid point is {{x, y, label}}'); break
        if 'polygon' in f and not (isinstance(f['polygon'], list) and 3 <= len(f['polygon']) <= 8 and all(isinstance(q, list) and len(q) == 2 and all(_is_num(v) for v in q) for q in f['polygon'])):
            out.append(f'{i}: figure.polygon is a list of 3–8 [x, y] pairs')
    elif t == 'polygon':
        pts = f['points']
        if not (isinstance(pts, list) and 3 <= len(pts) <= 10 and all(isinstance(q, list) and len(q) == 2 and all(_is_num(v) for v in q) for q in pts)):
            out.append(f'{i}: figure.points is a list of 3–10 [x, y] pairs')
        for lb in f.get('labels', []):
            if not (isinstance(lb, dict) and isinstance(lb.get('side'), int) and _label_ok(lb.get('text'))):
                out.append(f'{i}: each polygon label is {{side, text}}'); break
        if 'right' in f and not (isinstance(f['right'], list) and all(isinstance(v, int) for v in f['right'])):
            out.append(f'{i}: figure.right lists vertex numbers that get a right-angle mark')
    elif t == 'venn':
        if not (_label_ok(f['left']) and _label_ok(f['right'])): out.append(f'{i}: figure.left/right are the circle labels')
        if 'counts' in f:
            c = f['counts']
            if not (isinstance(c, dict) and set(c) <= {'left', 'right', 'both', 'outside'} and all(isinstance(v, int) and v >= 0 for v in c.values())):
                out.append(f'{i}: figure.counts is {{left, right, both, outside}} whole numbers')
        if 'items' in f:
            c = f['items']
            if not (isinstance(c, dict) and set(c) <= {'left', 'right', 'both', 'outside'} and all(isinstance(v, list) and len(v) <= 6 and all(_label_ok(s) for s in v) for v in c.values())):
                out.append(f'{i}: figure.items is {{left, right, both, outside}} lists of short strings')
        if 'counts' not in f and 'items' not in f: out.append(f'{i}: a venn needs counts or items')
    elif t == 'spinner':
        if rows_ok(f['sectors'], 'sectors', 2, 8):
            for s in f['sectors']:
                if not (isinstance(s, dict) and _label_ok(s.get('label')) and _is_num(s.get('size', 1)) and s.get('size', 1) > 0):
                    out.append(f'{i}: each spinner sector is {{label, size}}'); break
    elif t == 'clock':
        if not (isinstance(f['h'], int) and 1 <= f['h'] <= 12 and isinstance(f['m'], int) and 0 <= f['m'] <= 59):
            out.append(f'{i}: figure clock h is 1–12 and m is 0–59')
    elif t == 'shaded':
        if f['shape'] not in ('bar', 'circle', 'grid'): out.append(f'{i}: figure.shape is bar, circle or grid')
        if not (isinstance(f['parts'], int) and isinstance(f['shaded'], int) and 2 <= f['parts'] <= 24 and 0 <= f['shaded'] <= f['parts']):
            out.append(f'{i}: figure shaded needs 2–24 parts and shaded <= parts')
        if 'cols' in f and not (isinstance(f['cols'], int) and 1 <= f['cols'] <= 12): out.append(f'{i}: figure.cols is 1–12')
    elif t == 'cubes':
        if not all(isinstance(f[k], int) and 1 <= f[k] <= 6 for k in ('w', 'd', 'h')):
            out.append(f'{i}: figure cubes w, d, h are whole numbers 1–6')
    if 'title' in f and not _label_ok(f['title']): out.append(f'{i}: figure.title is a short string')
    if 'caption' in f and not _label_ok(f['caption']): out.append(f'{i}: figure.caption is a short string')
    return out

# ---- line-numbered passages ----------------------------------------------------------
# `lines: true` on a passage means its text is authored line by line: `\n` ends a
# line, a blank line ends a paragraph, and the page numbers every line from 1
# the way the ISEE booklet does. site/src/pages/runner.jsx (`Passage`) splits the
# text exactly as passage_lines() does here, so a question that says "line 14"
# names the same words on the screen as in this check.
MARKUP = re.compile(r'\[(?:¶|S)\d+\]')
LINE_MAX, LINE_MIN = 72, 18
WORDS_LO, WORDS_HI = 190, 340

def passage_lines(text):
    """[(line_no, text, paragraph_no)] for a numbered passage."""
    out = []; n = 0
    for pi, para in enumerate([p for p in re.split(r'\n\s*\n', str(text).strip()) if p.strip()]):
        for line in para.split('\n'):
            n += 1; out.append((n, line.strip(), pi))
    return out

def passage_errors(p):
    i = p.get('id', '?'); text = str(p.get('text') or ''); out = []
    if MARKUP.search(text):
        out.append(f'{i}: passage text carries authoring markup ([¶n]/[Sn]) that the page would print')
    official = p.get('form') in OFFICIAL_FORMS
    if official and not p.get('lines'):
        out.append(f'{i}: a {p.get("form")} passage is line-numbered (lines: true) — the spec cites lines')
    if official:
        w = len(re.findall(r"[A-Za-z0-9'’-]+", text))
        if not WORDS_LO <= w <= WORDS_HI: out.append(f'{i}: {w} words — the Lower Level band is {WORDS_LO}–{WORDS_HI}')
    if p.get('lines'):
        ls = passage_lines(text)
        if not 8 <= len(ls) <= 60: out.append(f'{i}: {len(ls)} lines — a numbered passage runs 8–60')
        paras = {}
        for n, t, pi in ls: paras.setdefault(pi, []).append((n, t))
        for pi, rows in paras.items():
            for k, (n, t) in enumerate(rows):
                if not t: out.append(f'{i}: line {n} is blank inside a paragraph'); continue
                if len(t) > LINE_MAX: out.append(f'{i}: line {n} is {len(t)} characters — break it, the booklet column holds about {LINE_MAX - 20}')
                if k < len(rows) - 1 and len(t) < LINE_MIN: out.append(f'{i}: line {n} is only {len(t)} characters mid-paragraph — fill the line')
    return out

CITE = re.compile(r'\blines?\s+(\d+)(?:\s*[–—-]\s*(\d+))?', re.I)
QUOTE = re.compile(r'[“"]([^”"]{2,60})[”"]')

def citation_errors(it, passage):
    """A stem that cites a line must cite one that exists, and a quoted word must be on it."""
    if not passage or not passage.get('lines'): return []
    i = it['id']; prompt = str(it.get('prompt') or ''); out = []
    ls = passage_lines(passage.get('text') or ''); n = len(ls)
    cited = []
    for m in CITE.finditer(prompt):
        a = int(m.group(1)); b = int(m.group(2) or a)
        if not (1 <= a <= b <= n): out.append(f'{i}: cites line{"s" if b > a else ""} {a}{"–" + str(b) if b > a else ""} of a {n}-line passage')
        else: cited.append((a, b))
    for q in QUOTE.findall(prompt):
        if not cited: continue
        hay = ' '.join(t for a, b in cited for (ln, t, _) in ls if a <= ln <= b).lower()
        needle = re.sub(r'[^a-z0-9\' ]', '', q.lower()).strip()
        if needle and needle not in re.sub(r'[^a-z0-9\' ]', '', hay):
            out.append(f'{i}: quotes "{q}" but it is not on the cited line(s)')
    return out

def content_hash(it):
    return hashlib.sha256(json.dumps({k: v for k, v in it.items() if k != 'content_hash'}, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()[:16]

def break_lines(text, width=56):
    """Author's helper: wrap each paragraph of plain prose into booklet-width lines."""
    paras = [p.strip() for p in re.split(r'\n\s*\n|\n', text.strip()) if p.strip()]
    out = []
    for p in paras:
        line, lines = '', []
        for w in p.split():
            if line and len(line) + 1 + len(w) > width: lines.append(line); line = w
            else: line = (line + ' ' + w).strip()
        if line: lines.append(line)
        out.append('\n'.join(lines))
    return '\n\n'.join(out)

if __name__ == '__main__':
    # a smoke test of the parser and the order rule
    assert num('235 cm') == 235 and num('$1.20') == Fraction('1.2') and num('3:45 p.m.') == 15 * 60 + 45
    assert num('2 1/2 cups') == Fraction(5, 2) and num('7/12') == Fraction(7, 12) and num('6y + 18') is None
    assert kind_of(['calm', 'hidden', 'ordinary', 'uncertain']) == 'word' and in_official_order(['calm', 'hidden', 'ordinary', 'uncertain'])
    assert kind_of(['6y + 18', '6y + 3', '9y', '18y']) == 'expression'
    assert not in_official_order(['50', '110', '55', '44']) and in_official_order(['44', '50', '55', '110'])
    print('itemspec ok')
