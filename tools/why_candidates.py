#!/usr/bin/env python3
"""Where can a `why` be written without inventing anything?

`why` tells her what the number she picked actually was — "30 is 10 × 3, the
area". That is only worth saying when it is TRUE, so this looks for an exact
arithmetic identity between a wrong choice and the numbers already in the
question (plus the right answer, because "you doubled it" is a real mistake).
It proposes the identity and nothing else: the sentence is still written by a
person, because naming the *mistake* is a judgement and only the arithmetic is
mechanical.

The important output is the third bucket. About a quarter of the bank has
distractors that are simply plausible neighbours — 10, 8 and 7 against a correct
9 — with no story behind them. Those should keep no `why` at all rather than
acquire an invented one, and this is how you tell which they are.

    python3 tools/why_candidates.py            # the summary
    python3 tools/why_candidates.py --list     # every writable item
    python3 tools/why_candidates.py MA-SEP-031 # one item, in detail
"""
import json, glob, os, re, sys, itertools, collections

NUM = re.compile(r'\d+(?:\.\d+)?')

def nums(s):
    return [float(x) for x in NUM.findall(str(s).replace(',', ''))]

def val(choice):
    """The value of a choice, but ONLY when the choice is a single plain number.

    A fraction, a ratio, a coordinate or a range holds more than one number, and
    taking the first of them finds identities that are arithmetic about the
    numerator and nonsense about the answer — "2/3 is 5 − 3" was the first thing
    this tool said before this guard existed. Units and currency are fine; more
    than one number is not.
    """
    s = str(choice)
    if '/' in s or ':' in s or '–' in s or ' to ' in s:
        return None
    n = nums(s)
    return n[0] if len(n) == 1 else None

def identities(target, pool):
    """Every exact way to reach `target` from `pool` with one simple step."""
    out = []
    for a, b in itertools.permutations(pool, 2):
        for r, sym in ((a * b, '×'), (a + b, '+'), (a - b, '−'), (a / b if b else None, '÷')):
            if r is not None and abs(r - target) < 1e-9:
                out.append(f'{a:g} {sym} {b:g}')
    for a in pool:
        for r, sym in ((a * a, f'{a:g} × {a:g}'), (a * 4, f'{a:g} × 4'), (a * 2, f'{a:g} × 2'), (a / 2, f'{a:g} ÷ 2')):
            if abs(r - target) < 1e-9:
                out.append(sym)
    return list(dict.fromkeys(out))

def items():
    for f in sorted(glob.glob('content/question-banks/*.json')):
        if os.path.basename(f) == 'mock.json':
            continue
        for it in json.load(open(f))['items']:
            yield it

def analyse(it):
    ch, k = it.get('choices') or {}, it.get('correct')
    cv = val(ch.get(k, ''))
    if cv is None:
        return None
    pool = nums(it.get('prompt')) + [cv]
    if len(pool) < 2:
        return None
    rows = []
    for letter, text in ch.items():
        if letter == k:
            continue
        t = val(text)
        rows.append((letter, text, [] if t is None else identities(t, pool)))
    return rows

def main():
    args = [a for a in sys.argv[1:]]
    one = next((a for a in args if not a.startswith('--')), None)
    listing = '--list' in args
    tot = writable = partial = none = authored = 0
    by_skill = collections.Counter()
    for it in items():
        if it.get('subject') not in ('QR', 'MA'):
            continue
        if one and it['id'] != one:
            continue
        rows = analyse(it)
        if rows is None:
            continue
        if one:
            print(f"{it['id']}  [{it.get('skill','')}]  {it.get('misconceptions') or 'no tag'}")
            print(f"  {it['prompt']}")
            print(f"  correct {it['correct']} = {it['choices'][it['correct']]}   {it.get('explanation','')}")
            for letter, text, ids in rows:
                print(f"    {letter} = {text:<10} {' | '.join(ids) or '(no exact identity — leave this one alone)'}")
            if it.get('why'):
                print(f"  already authored: {json.dumps(it['why'], ensure_ascii=False)[:160]}")
            return 0
        tot += 1
        if it.get('why'):
            authored += 1
            continue
        hit = sum(1 for _, _, ids in rows if ids)
        if hit == len(rows):
            writable += 1
            by_skill[it.get('skill', '?')] += 1
            if listing:
                print(f"{it['id']}  {it.get('skill','')}")
        elif hit:
            partial += 1
        else:
            none += 1
    if one:
        print(f'{one}: not found, or not a numeric QR/MA item')
        return 1
    print(f'numeric QR/MA items      {tot}')
    print(f'  already authored       {authored}')
    print(f'  every distractor known  {writable}   <- write these first')
    print(f'  some distractors known  {partial}')
    print(f'  nothing derivable       {none}   <- leave blank; a guess here is a lie told confidently')
    print()
    print('skills with the most fully writable items:')
    for s, n in by_skill.most_common(8):
        print(f'  {n:3d}  {s}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
