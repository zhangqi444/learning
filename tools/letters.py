#!/usr/bin/env python3
"""Where a choice is named by its letter. Imported by validate_content.py and audit.py.

Kept in one file because the first version of this check lived in two places at
two different strengths: the validator passed at zero while audit.py's narrower
pattern printed a reassuring 52, and between them 129 references in 82 items were
invisible. One definition, two callers.
"""
import re

# `why` is keyed by letter and that is fine: the runner looks the key up against
# the choice she actually picked, so a reshuffle carries it along. Prose cannot be
# looked up. `tools/build_weeks.py` re-randomises every item's options before a
# bank ships, so "B and C are unsupported" was written against an order that no
# longer exists — and three items were found with the reasons attached to the
# wrong choices outright, one of them explaining the CORRECT answer as a mistake.
# The letters are not even doing work: name the value and the sentence is true
# under any order.
#
# The first version of this check looked only for "choice B", "B and C" and
# "B is wrong", passed at zero, and missed 129 references in 82 items — "A
# divides by 2", "C subtracts 4", "A, B, and D have no evidence", "A–C misread".
# A check that reports clean over most of the thing it is checking is worse than
# no check, so the forms are enumerated properly here and the awkward one is
# handled: `A` is also an article, so it needs a following verb, while a bare B, C
# or D in front of a lowercase word is already a giveaway. What rescues the real
# labels is the word before — "Store A is $1.50 each", "Car B gives 210 ÷ 7",
# "point C lands on (7, 7)" are names the question gave, not choices.
_L = '[ABCD]'
LETTER_FORMS = [
    re.compile(rf'\b(?:choice|option|answer)s?\s+{_L}\b'),
    re.compile(rf'\b{_L}\s+(?:and|or|,)\s+{_L}\b'),
    re.compile(rf'\b{_L}\s+(?:is|are)\s+(?:wrong|incorrect|true|correct)'),
    re.compile(r'\bthe (?:last|first|second|third|fourth) choice\b'),
    re.compile(rf'(?<![A-Za-z]){_L}\s*[–—-]\s*[BCD](?![A-Za-z])'),   # "A–C misread"
    re.compile(rf'(?<![A-Za-z]){_L}\s*,\s*(?:and\s+)?{_L}(?![A-Za-z])'),        # "A, B, and D"
    re.compile(r'(?<![A-Za-z])[BCD]\s+[a-z]{2,}'),                              # "C subtracts 4"
    re.compile(r'(?<![A-Za-z])A\s+(?:is|are|was|were|adds?|subtracts?|multiplies|divides?|uses?|'
               r'gives?|takes?|keeps?|drops?|swaps?|counts?|miscounts?|treats?|reads?|rounds?|'
               r'misses|mis-scales|halves|doubles?|reverses?|repeats?|stops?|ignores?|assumes?|'
               r'converts?|finds?|makes?|reflects?|captures?|contradicts?|concerns?|lacks?|'
               r'opposes?|misreads?|misstates?|overgeneralizes|understates?|overstates?|denies|'
               r'names?|comes?|does|do|follows?|appears?|occurs?|happens?|turns?|may|never|still|'
               r'have|has|picks?|reports?|changes?|confuses?|wrongly|preserves?|runs?|lands?|'
               r'ends?|helps?|permits?|reduces?)(?![a-z])'),
]
# The plural matters: "In triangle ABC ... angles A and B" is the question's own
# labelling, and the first version of this list had only the singular, so it
# refused a correct explanation about a triangle's vertices. A label list that
# rejects good content teaches people to work around the check.
NAMED = re.compile(r'(?:[A-Z][a-z]+|point|vertex|vertice|angle|line|segment|side|figure|shape|'
                   r'column|row|graph|label|range|section|part|team|group|city|town|station|'
                   r'route|path|plan|box|bag|jar|tank|store|shop|car|train|bus|machine|pump|'
                   r'school|class|farm|garden|brand|set|crew|boat|store)s?\s+$')

def _labelled(text):
    """Letters the text has already established as the question's own labels.

    "In triangle ABC, angles A and B total 102" excuses "angles A and B" by the
    word in front of it — and then leaves "B total" looking like a bare letter
    doing something. Once a letter has been introduced as a label it stays one
    for the rest of the field. The cost of this is narrow and worth saying: a
    field that legitimately labels "point C" and ALSO means choice C when it says
    "C subtracts 4" would slip through. Between the two readings the label is far
    likelier, and refusing correct content is the worse failure.
    """
    out=set()
    for pat in LETTER_FORMS:
        for m in pat.finditer(text):
            if NAMED.search(text[:m.start()]):
                out.update(re.findall(r'[ABCD]', m.group(0)))
    return out

def letter_errors(it):
    out=[]
    fields=[('explanation', it.get('explanation')), ('misconceptions', it.get('misconceptions'))]
    fields += [(f'why.{k}', v) for k, v in (it.get('why') or {}).items()]
    for name, text in fields:
        t=str(text or '')
        labels=_labelled(t)
        for pat in LETTER_FORMS:
            for m in pat.finditer(t):
                if NAMED.search(t[:m.start()]): continue          # a name the question gave
                seen=set(re.findall(r'[ABCD]', m.group(0)))
                if seen and seen <= labels: continue              # already established as labels
                out.append(f'{it["id"]}: {name} names a choice by letter ("{m.group(0)}") — name the value')
                break
            else: continue
            break
    return out


# ---- what the detector must and must not flag ---------------------------------
# The forms below are the ones that were actually found in this bank, and the
# labels are the ones that actually appear in its questions. Both halves matter
# equally: this check was rewritten twice, once because it missed 129 real
# references and once because it refused a correct explanation about a triangle's
# vertices, and neither mistake was visible from reading the patterns. The
# validator runs this before it looks at any content, so a change to the regexes
# fails here rather than somewhere in the middle of 1,510 items.
CASES = [
    # (text, should_be_flagged)
    ('choice B is the area.', True),
    ('the last choice repeats it.', True),
    ('B is wrong because the area is 30.', True),
    ('A, B, and D have no evidence.', True),
    ('A\u2013C misread the function.', True),
    ('C subtracts 4 instead of dividing.', True),
    ('A divides by 2 as if two sides counted.', True),
    ('In triangle ABC, angles A and B total 102\u00b0.', False),
    ('Store A is $1.50 each and Car B gives 30.', False),
    ('point C lands on (7, 7).', False),
    ("Set A's range is 12 and Set B's is 19.", False),
    ('Boat A travels 16 mph and Boat B 14 mph.', False),
    ('Crew A packs 12 an hour and Crew B packs 11.', False),
]

def self_test():
    out=[]
    for text, want in CASES:
        got = bool(letter_errors({'id': 'self-test', 'explanation': text}))
        if got != want:
            verb = 'flagged' if got else 'passed'
            out.append(f'letters.py self-test: {verb} {text!r}, which it should not have')
    return out
