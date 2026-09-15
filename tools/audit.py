#!/usr/bin/env python3
"""Quality audit of the question banks. Reports; never gates.

This used to read an `authoring/` directory that was never committed, so it has
crashed on `python3 tools/audit.py` for every clone since the day it landed. The
checks were worth keeping — none of them is in validate_content.py, which asks
whether an item is *well formed* rather than whether it is *a good question* — so
they are pointed at `content/question-banks/` instead.

Nothing here fails a build. Every one of these needs a person to look: a length
tell wants an author to lengthen a distractor, not a script to reject the item.
"""
import json, glob, os, re, collections

L = 'ABCD'
# The real paper, from AGENTS.md's level block: ISEE Lower Level.
REAL = {'VR': 34, 'QR': 38, 'RC': 25, 'MA': 30}
STOP = {'the', 'a', 'an', 'of', 'is', 'are', 'to', 'in', 'and', 'what', 'how', 'many', 'much'}
NO_ANSWER = re.compile(r'not enough information|cannot be determined', re.I)

def load():
    practice, mock = [], []
    for f in sorted(glob.glob('content/question-banks/*.json')):
        for it in json.load(open(f))['items']:
            (mock if os.path.basename(f) == 'mock.json' else practice).append(it)
    return practice, mock

def norm(s):
    s = re.sub(r'[^a-z0-9 ]', ' ', str(s).lower())
    return ' '.join(w for w in s.split() if w not in STOP)

practice, mock = load()
items = practice + mock
print(f'practice {len(practice)} · mock {len(mock)} · {len(items)} items\n')

# --- 1. does the practice match the paper she is actually sitting? ------------
print('1. subject balance, practice bank against the real paper')
tot, rtot = len(practice), sum(REAL.values())
counts = collections.Counter(i.get('subject') for i in practice)
for s in ('VR', 'QR', 'RC', 'MA'):
    here, there = 100 * counts[s] / tot, 100 * REAL[s] / rtot
    flag = '  <-- thin' if here < there - 5 else ('  <-- heavy' if here > there + 5 else '')
    print(f'   {s}  {counts[s]:>4} items  {here:>4.0f}%   paper {there:>3.0f}%{flag}')
print('   Reading is the one to watch: passages are expensive to write, so it is\n'
      '   the subject that quietly ends up thin. The reading shelf is the other\n'
      '   half of the answer to that — see docs/design.md.\n')

# --- 2. can she score above chance without reading the question? --------------
print('2. length tell — can she score above chance without reading the question?')
print('   "longest" counts a gap of any size; "by a mile" counts 16 characters or')
print('   more, which is the only gap an eye picks up across four options. Chasing')
print('   the first number down is padding for its own sake — a key one character')
print('   longer than a distractor teaches nobody anything. The second is the one')
print('   to keep at zero.')
for s in ('VR', 'QR', 'RC', 'MA'):
    rows = [i for i in items if i.get('subject') == s]
    if not rows:
        continue
    lo = sh = wide = 0
    for i in rows:
        ln = [len(str(i['choices'][k])) for k in L]
        ki = L.index(i['correct'])
        k, rest = ln[ki], [v for j, v in enumerate(ln) if j != ki]
        if k == max(ln) and ln.count(max(ln)) == 1: lo += 1
        if k == min(ln) and ln.count(min(ln)) == 1: sh += 1
        # "There is not enough information to tell" is a real ISEE option and is
        # always going to be a sentence among numbers. It reads as a mile-wide
        # tell and is not one: the bank offers it four times and it is the answer
        # once, which is chance, so a child who always picked it would gain
        # nothing. Length flags it; the strategy does not pay.
        if k - max(rest) > 15 and not NO_ANSWER.search(str(i['choices'][L[ki]])): wide += 1
    mark = '  <-- a child could learn this' if wide else ''
    print(f'   {s}  longest {lo/len(rows):>4.0%}   shortest {sh/len(rows):>4.0%}   by a mile {wide:>3}{mark}')
print('   Numbers make all of this meaningless for QR and MA.\n')

# --- 3. the same question twice ----------------------------------------------
print('3. repeated stems')
seen = collections.defaultdict(list)
for i in items:
    seen[norm(i['prompt'])].append(i)
frames = dups = 0
same_answer = []
for k, group in seen.items():
    if len(group) < 2 or not k:
        continue
    if any(g.get('passage_id') for g in group):
        frames += 1                      # "what is the passage mainly about" — a frame, not a repeat
        continue
    dups += 1
    keys = {str(g['choices'][g['correct']]).strip().lower() for g in group}
    if len(keys) == 1:
        same_answer.append((k, [g['id'] for g in group]))
print(f'   {frames} passage-bound frames, which repeat legitimately across different passages')
print(f'   {dups} stems asked more than once outside a passage')
print(f'   {len(same_answer)} of those are the SAME question with the same answer:')
for k, ids in same_answer[:10]:
    print(f'      {", ".join(ids)}  ({k[:48]})')
print('   The rest are one word tested twice with different choices, which is\n'
      '   deliberate rather than a fault — "most nearly" depends on what is offered.\n')

# --- 4. explanations that name a letter ---------------------------------------
PAT = re.compile(r'\b(?:choice|option|answer)s?\s+[ABCD]\b'
                 r'|\b[ABCD]\s+(?:and|or|,)\s+[ABCD]\b'
                 r'|\b[ABCD]\s+is\s+(?:wrong|incorrect|true|correct)'
                 r'|\bthe (?:last|first|second|third|fourth) choice\b')
hits = [(i['id'], PAT.search(i['explanation']).group(0)) for i in items
        if i.get('explanation') and PAT.search(i['explanation'])]
print(f'4. explanations that name a choice by letter or position: {len(hits)}')
for i, m in hits[:6]:
    print(f'      {i}: "{m}"')
print('   Harmless while the choices render in a fixed order, and the first thing\n'
      '   to break if they are ever shuffled. Naming the value reads better anyway.')
