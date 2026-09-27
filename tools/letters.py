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
NAMED = re.compile(r'(?:[A-Z][a-z]+|point|vertex|angle|line|segment|side|figure|shape|column|row|'
                   r'graph|label|range|section|part|team|group|city|town|station|route|path|plan|'
                   r'box|bag|jar|tank|store|shop|car|train|bus|machine|pump|school|class|farm|'
                   r'garden|brand|set)\s+$')

def letter_errors(it):
    out=[]
    fields=[('explanation', it.get('explanation')), ('misconceptions', it.get('misconceptions'))]
    fields += [(f'why.{k}', v) for k, v in (it.get('why') or {}).items()]
    for name, text in fields:
        t=str(text or '')
        for pat in LETTER_FORMS:
            for m in pat.finditer(t):
                if NAMED.search(t[:m.start()]): continue      # a name the question gave
                out.append(f'{it["id"]}: {name} names a choice by letter ("{m.group(0)}") — name the value')
                break
            else: continue
            break
    return out
