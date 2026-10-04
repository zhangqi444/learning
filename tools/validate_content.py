#!/usr/bin/env python3
"""Validate the exported content tree. Fails loudly; exit 1 on any error."""
import json, os, sys, collections, hashlib, re
L='ABCD'; errs=[]; warns=[]; total=0

# ---- `why`: what a particular wrong choice actually is -----------------------
# The explanation tells her the right method; `why` tells her what the number she
# picked really was ("30 is 10 × 3, the area"). That is the most useful sentence
# on the page and the easiest to get quietly wrong, because it states arithmetic
# about one specific choice and nothing checks it. Three ways it goes wrong, all
# caught here: hung on the correct answer, so being right is explained as a
# mistake; naming a number that is not that choice, after the choices are
# reshuffled; and stating a sum that does not add up. The last is why the
# identity is re-evaluated rather than read — a `why` is only worth having if it
# is true, and she is ten and will believe it.
NUM=r'[-\u2212]?\d+(?:\.\d+)?'   # a typographic minus is part of the number too
IDENT=re.compile(rf'^\s*({NUM})\s+is\s+({NUM}(?:\s*[-+x×*/÷\u2212]\s*{NUM})+)', re.I)

def _value(text):
    m=re.search(NUM, str(text).replace(',',''))
    return float(m.group(0).replace('\u2212','-')) if m else None

def _eval(expr):
    e=expr.replace('×','*').replace('÷','/').replace('x','*').replace('−','-')
    if not re.fullmatch(r'[\d\s.+\-*/]+', e): return None
    try: return eval(e, {'__builtins__':{}}, {})       # digits and operators only, checked above
    except Exception: return None

# ---- a word question has to say what the word means -------------------------
# "RESOLUTE most nearly means" is a question about one word, and a miss on it
# teaches nothing at all unless the page then says what the word means. All 235
# of them do now.
#
# The rule that is NOT here is worth recording, because it was written first and
# it was wrong: that the explanation must contain the correct choice verbatim.
# The key is only ONE right synonym, and a good gloss is free to use another —
# "fortunate means favored by good luck" never says "lucky", and "immense means
# extremely large" never says "enormous". It fired on twenty perfectly correct
# explanations, and a check that fails on good content is worse than no check,
# because it teaches everyone to scroll past the output.
BLANK=re.compile(r'_{2,}')

def gloss_errors(it):
    # A Verbal item with no blank in it is a question about one word: "RESOLUTE
    # most nearly means", "A UTOPIA is", "In 'raised more capital,' CAPITAL
    # means". Sentence completions are the ones with the gap, and they are a
    # different thing — what teaches those is the clue in the sentence, not a
    # definition, so they are not covered here.
    # The same holds for a 汉字 question — 拼音, strokes, radical, meaning — which is why
    # docs/chinese.md § 4 extends this rule to zh-char and to nothing else in that half.
    if it.get('subject') not in ('VR', 'zh-char') or BLANK.search(str(it.get('prompt') or '')): return []
    if not str(it.get('explanation') or '').strip():
        return [f'{it["id"]}: a word question with no explanation — a miss here teaches nothing']
    return []

def why_errors(it):
    w=it.get('why')
    if not w: return []
    i=it['id']; out=[]
    if not isinstance(w, dict): return [f'{i}: why is not an object']
    for k, text in w.items():
        if k not in L: out.append(f'{i}: why key {k!r} is not a choice letter'); continue
        if k == it.get('correct'): out.append(f'{i}: why on {k}, which is the CORRECT answer')
        if k not in (it.get('choices') or {}): out.append(f'{i}: why on {k}, which has no choice'); continue
        if not str(text).strip(): out.append(f'{i}: why on {k} is blank'); continue
        want=_value((it['choices'])[k]); got=_value(text)
        if want is not None and got is not None and abs(want-got)>1e-9:
            out.append(f'{i}: why on {k} opens with {got:g}, but {k} is {want:g}')
        m=IDENT.match(str(text))
        if m:
            lhs=float(m.group(1).replace('\u2212','-')); rhs=_eval(m.group(2))
            if rhs is not None and abs(lhs-rhs)>1e-9:
                out.append(f'{i}: why on {k} says "{m.group(1)} is {m.group(2).strip()}", which is {rhs:g}')
    return out
# ---- a trap note has to be about its own question ----------------------------
# `misconceptions` never reaches the bundle — it is indexing for whoever is
# writing, not text for her — so nothing on screen ever contradicted it, and one
# note had drifted onto the wrong item unnoticed: M01-RC-021's read "accepts
# Amir's initial fear", and there is no Amir in that question, its choices, its
# explanation or its passage. It was describing some other question entirely.
#
# A note naming somebody who is not there is worse than a blank one, because the
# next person to write a `why` from it would author a sentence about a character
# the reader has never met. Proper nouns only: that is the part of a trap note
# that can be wrong in a way a machine can see.
PROPER = re.compile(r'\b[A-Z][a-z]{2,}\b')
NOT_A_NAME = set(
    'Stanine Strategy Which What Why How When Where The And But For From With Into Over Under '
    'Area Volume Perimeter Median Mean Mode Range Quadrant Adding Adds Multiply Multiplies '
    'Subtract Subtracts Divide Divides Counts Treats Reads Reverses Ignores Omits Confuses '
    'Assumes Applies Uses Monday Tuesday Wednesday Thursday Friday Saturday Sunday'.split())

def trap_errors(it, passages):
    tag = str(it.get('misconceptions') or '').strip()
    if not tag: return []
    names = {w for w in PROPER.findall(tag)} - NOT_A_NAME
    if not names: return []
    hay = (str(it.get('prompt') or '') + ' ' + ' '.join((it.get('choices') or {}).values()) + ' '
           + str(it.get('explanation') or '') + ' ' + passages.get(it.get('passage_id') or '', ''))
    absent = sorted(n for n in names if n not in hay)
    if not absent: return []
    return [f'{it["id"]}: misconceptions names {", ".join(absent)}, who appears nowhere in this question']

# ---- the teaching text is American, because the exam is ----------------------
# 142 British spellings across 73 items reached the prose a ten-year-old reads,
# almost all of them in `why` sentences written in one sitting: "litres",
# "centimetres", "per cent", "colour". Several items contradicted themselves —
# MA-W5-S2-Q12 said "liters" in its prompt and "litres" in the why underneath it.
# The ISEE is an American test and the prompts were already American; only the
# explanations drifted. Prompts and choices are NOT checked here: those are
# authored content that may quote a source.
BRITISH = [
    ('centimetres', 'centimeters'), ('centimetre', 'centimeter'),
    ('kilometres', 'kilometers'), ('kilometre', 'kilometer'),
    ('millimetres', 'millimeters'), ('millimetre', 'millimeter'),
    ('metres', 'meters'), ('metre', 'meter'),
    ('litres', 'liters'), ('litre', 'liter'),
    ('per cent', 'percent'), ('colours', 'colors'), ('coloured', 'colored'),
    ('colour', 'color'), ('favourable', 'favorable'), ('favour', 'favor'),
    ('neighbours', 'neighbors'), ('neighbour', 'neighbor'),
    ('practise', 'practice'), ('organised', 'organized'),
    ('recognised', 'recognized'), ('realised', 'realized'),
    ('apologise', 'apologize'), ('behaviour', 'behavior'),
    ('honour', 'honor'), ('labour', 'labor'), ('grey', 'gray'),
]
BRITISH_RE = [(re.compile(r'\b' + re.escape(b) + r'\b', re.I), b, a) for b, a in BRITISH]

def spelling_errors(it):
    out = []
    fields = [('explanation', it.get('explanation')), ('misconceptions', it.get('misconceptions'))]
    fields += [(f'why.{k}', v) for k, v in (it.get('why') or {}).items()]
    for name, text in fields:
        t = str(text or '')
        for rx, b, a in BRITISH_RE:
            if rx.search(t):
                out.append(f'{it["id"]}: {name} spells "{b}" — this is an American exam, write "{a}"')
                break
    return out

# ---- every wrong choice gets answered, in every bank ---------------------------
# 1,510 of 1,510 now, so this is an error rather than a count. It was a mock-only
# rule for one commit, while the mock was at 508 of 508 and the practice banks
# still had 134 items short; both are done, and a rule that applies everywhere is
# the one worth holding.
#
# Why it is worth holding at all: the explanation can only ever describe the
# correct route. Told "perimeter = 2(10+3) = 26" after picking 30, she still does
# not learn that 30 was the area. The `why` is the only thing on the page that
# speaks to the answer she actually gave, and it is shown on the runner's reveal,
# again on the score card, and in the mock's missed-questions list. A question
# that arrives without one is a miss that teaches her nothing, and the moment to
# write it is while the question is being written.
def why_zh_errors(it):
    # The Chinese half carries its explanation and its `why` in both languages
    # (the owner's ask: all of it in two languages). The second language has to
    # answer the same wrong choices as the first — a gap there is a wrong choice
    # that is told what it was in one language and nothing in the other.
    z=it.get('why_zh')
    if z is None and not it.get('explanation_zh'): return []
    i=it['id']; out=[]
    if not str(it.get('explanation_zh') or '').strip(): out.append(f'{i}: why_zh without explanation_zh')
    if not isinstance(z, dict): return out+[f'{i}: why_zh is not an object']
    if set(z)!=set(it.get('why') or {}): out.append(f'{i}: why_zh answers {sorted(z)} but why answers {sorted(it.get("why") or {})}')
    for k,v in z.items():
        if k==it.get('correct'): out.append(f'{i}: why_zh on {k}, which is the CORRECT answer')
        if not str(v or '').strip(): out.append(f'{i}: why_zh on {k} is blank')
    return out
def why_gap_errors(it):
    w = it.get('why') or {}
    gaps = [l for l in it.get('choices', {}) if l != it.get('correct') and not str(w.get(l) or '').strip()]
    if not gaps: return []
    return [f'{it["id"]}: no why for {", ".join(sorted(gaps))} — that choice is never told what it was']

# ---- the Chinese half is in two languages, by construction --------------------
# The owner's decision, 1 October 2026: the Chinese half reads as Chinese, with
# English behind one toggle in the header, and a page is never two languages at
# once — so every field a page prints has to exist in both, or the English page
# shows Chinese in the middle of a sentence and nothing says so. The first rule
# here (`why_zh` keyed like `why`) fired only when a twin was present, which
# left the gap it was written for: an item with no twin at all passed. These
# rules are unconditional for everything under content/chinese/.
#
# Two kinds of field. A LABEL — a title, a section name, a page reference, a
# skill's name — is chrome once it is on the page, so its English twin may not
# carry Chinese and its Chinese side may not carry an English word: the page
# shows one language and the suite asserts it. TEXT — a prompt, a gloss, an
# explanation, a note — quotes the material, so "口 on the left" is right in
# English and only has to be present and non-blank.
CJK=re.compile(r'[㐀-鿿　-〿＀-￯]')
LATIN_WORD=re.compile(r'[A-Za-z]{2,}')
ZH_DAYS=['星期一','星期二','星期三','星期四','星期五']   # mirrors ZH_DAYS in site/src/lib/content.js
_s=lambda v: str(v or '').strip()

def label_script_errors(where, key, zh, en):
    out=[]
    if en and CJK.search(en): out.append(f'{where}: {key} English twin carries Chinese ({en!r}) — a label in English mode is English')
    if zh and LATIN_WORD.search(zh): out.append(f'{where}: {key} Chinese side carries an English word ({zh!r}) — a label in Chinese mode is Chinese')
    return out

def pair_errors(obj, key, where, label=False):
    """`key` and `key_en`, both present and non-blank — the shape title/title_en uses."""
    zh=_s(obj.get(key)); en=_s(obj.get(key+'_en')); out=[]
    if not zh: out.append(f'{where}: {key} is missing')
    if not en: out.append(f'{where}: {key}_en is missing — the English page would print Chinese here')
    return out+(label_script_errors(where, key, zh, en) if label else [])

def both_errors(obj, key, where, label=False, required=True):
    """`key` as {zh, en}, both non-blank — the shape rule/note/explanation use."""
    v=obj.get(key)
    if v is None and not required: return []
    if not isinstance(v, dict): return [f'{where}: {key} must be {{zh, en}}, not {type(v).__name__}']
    zh=_s(v.get('zh')); en=_s(v.get('en')); out=[]
    if not zh: out.append(f'{where}: {key}.zh is missing')
    if not en: out.append(f'{where}: {key}.en is missing — the English page would print Chinese here')
    return out+(label_script_errors(where, key, zh, en) if label else [])

ZH_SKILLS_FILE='content/chinese/skills.json'
ZH_SKILLS=json.load(open(ZH_SKILLS_FILE)).get('skills',{}) if os.path.exists(ZH_SKILLS_FILE) else {}
def zh_item_errors(it):
    """A Chinese bank item: the prompt's English, the explanation's Chinese, a `why_zh`
    for every `why`, and a skill the page can name in either language."""
    if not str(it.get('subject') or '').startswith('zh-'): return []
    i=it['id']; out=[]
    if not _s(it.get('prompt_en')): out.append(f'{i}: no prompt_en — the English page would ask the question in Chinese')
    if not _s(it.get('explanation_zh')): out.append(f'{i}: no explanation_zh — a miss would be explained in English on the Chinese page')
    if it.get('why_zh') is None and it.get('why'): out.append(f'{i}: why without why_zh — a wrong choice is told what it was in one language only')
    sk=it.get('skill')
    if sk and sk not in ZH_SKILLS: out.append(f'{i}: skill {sk!r} has no name in {ZH_SKILLS_FILE} — the page would print the id')
    return out
for _sk,_v in ZH_SKILLS.items(): errs+=both_errors({'name':_v}, 'name', f'{ZH_SKILLS_FILE} {_sk}', label=True)

# ---- prose may not name a choice by its letter -------------------------------
# See tools/letters.py for the forms and why each one is there.
from letters import letter_errors, self_test

errs += self_test()          # the detector is checked before the content is
# ISEE's banks and, beside them rather than inside them, the Chinese ones
# (docs/chinese.md § 4). One list, so a bank cannot land somewhere this never looks.
BANK_DIRS=['content/question-banks','content/chinese/question-banks']
def bank_files():
    return [f'{d}/{f}' for d in BANK_DIRS if os.path.isdir(d) for f in sorted(os.listdir(d)) if f.endswith('.json')]
pass_ids=set(); passage_text={}
for f in os.listdir('content/passages'):
    for p in json.load(open(f'content/passages/{f}'))['items']:
        pass_ids.add(p['id'])
        passage_text[p['id']]=str(p.get('text') or '')
        if not p.get('text') or len(str(p['text']))<100: errs.append(f'{p["id"]}: passage text missing/short')

seen=set()
for f in bank_files():
    d=json.load(open(f))
    for it in d['items']:
        total+=1; i=it['id']
        if i in seen: errs.append(f'{i}: duplicate id')
        seen.add(i)
        for k in ('schema_version','content_version','subject','prompt','choices','correct','source','content_hash'):
            if k not in it or it[k] in (None,''): errs.append(f'{i}: missing {k}')
        ch=it.get('choices',{})
        if sorted(ch)!=list(L): errs.append(f'{i}: choices not A-D')
        if any(v is None or str(v).strip()=='' for v in ch.values()): errs.append(f'{i}: blank choice')
        # A choice stored as a JSON number is rendered by the app, not by the author:
        # 2.5 reaches the page as "2.5" and 4.0 as "4". Twenty-one QR items shipped that
        # way, and on the worst of them — cost per ounce of a $3.60 box — the key rendered
        # "0.3" while a distractor rendered "0.03", so the answer was the only choice with
        # one decimal place. A number that means money has to carry its own $ and its own
        # two decimals, and the only way to guarantee that is to store the string the
        # author intended.
        if any(not isinstance(v, str) for v in ch.values()): errs.append(f'{i}: choice values must be strings, not JSON numbers — the app renders them verbatim')
        if len({str(v).strip() for v in ch.values()})!=4: errs.append(f'{i}: duplicate choice values')
        if it.get('correct') not in L: errs.append(f'{i}: correct={it.get("correct")!r}')
        if it.get('passage_id') and it['passage_id'] not in pass_ids: errs.append(f'{i}: unknown passage {it["passage_id"]}')
        h=hashlib.sha256(json.dumps({k:v for k,v in it.items() if k!='content_hash'},sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()[:16]
        if h!=it['content_hash']: errs.append(f'{i}: content_hash mismatch')
        # Every one of the 1350 items explains itself now, so this is an error
        # rather than a warning. It was a warning while 182 items had nothing,
        # which is the only state a warning is any use in: a count nobody can get
        # to zero is a number people learn to read past. At zero it becomes a
        # line worth holding — a question with no explanation is a miss that
        # teaches her nothing, and the moment to write one is while the question
        # is being written.
        if not str(it.get('explanation') or '').strip(): errs.append(f'{i}: no explanation — a miss on this teaches nothing')
        errs += why_errors(it)
        errs += gloss_errors(it)
        errs += letter_errors(it)
        errs += why_gap_errors(it)
        errs += why_zh_errors(it)
        errs += zh_item_errors(it)
        errs += trap_errors(it, passage_text)
        errs += spelling_errors(it)

# ---- the workbook's closed exercises (content/chinese/exercises) -------------
# Not four-choice, so none of the rules above fit them; each type has its own
# shape and its own way of being wrong, checked here: a key that is not a
# permutation of its pieces, a pair pointing past the right-hand column, a slot
# key past the options, a sort key past the groups — and a miss with nothing to
# say, in either language, which is the one failure every item in this repo
# shares.
EXDIR='content/chinese/exercises'
def ex_errors(ex):
    out=[]; i=ex.get('id','?'); t=ex.get('type')
    # The heading, the weekday and the note are what the workbook card and the
    # exercise page print around the items; each in both languages, the heading
    # in one script per side (the book itself prints English under each heading).
    out+=pair_errors(ex, 'title', i, label=True)
    if ex.get('day') not in ZH_DAYS: out.append(f'{i}: day {ex.get("day")!r} is not one of {ZH_DAYS}')
    out+=both_errors(ex, 'note', i, required=False)
    if ex.get('fills'): out+=both_errors(ex['fills'], 'given', i, required=False)
    def need_expl(it):
        e=it.get('explanation')
        if not isinstance(e,dict) or not str(e.get('zh') or '').strip() or not str(e.get('en') or '').strip(): out.append(f"{it.get('id',i)}: a miss here would teach nothing — explanation needs zh and en")
    if t=='tf':
        for it in ex.get('items',[]):
            if not isinstance(it.get('key'),bool): out.append(f"{it.get('id',i)}: tf key must be true/false")
            need_expl(it)
    elif t=='order':
        for it in ex.get('items',[]):
            n=len(it.get('pieces',[]))
            if sorted(it.get('key',[]))!=list(range(n)): out.append(f"{it.get('id',i)}: order key is not a permutation of its {n} pieces")
            need_expl(it)
    elif t=='slots':
        n=len(ex.get('options',[]))
        for it in ex.get('items',[]):
            if not (isinstance(it.get('key'),int) and 0<=it['key']<n): out.append(f"{it.get('id',i)}: slot key {it.get('key')} is not one of {n} options")
            need_expl(it)
    elif t=='match':
        L=ex.get('left',[]); Rr=ex.get('right',[]); pairs=ex.get('pairs',[])
        if sorted(p[0] for p in pairs)!=list(range(len(L))) or sorted(p[1] for p in pairs)!=list(range(len(Rr))): out.append(f'{i}: pairs do not cover left and right exactly once each')
        for it in ex.get('items',[]):
            if not (isinstance(it.get('key'),int) and 0<=it['key']<len(Rr)): out.append(f"{it.get('id',i)}: match key past the right-hand column")
            need_expl(it)
        f=ex.get('fills')
        if f:
            for it in f.get('items',[]):
                if it.get('key') not in f.get('options',[]): out.append(f"{it.get('id',i)}: fill key {it.get('key')!r} is not among the options")
                need_expl(it)
    elif t=='sort':
        n=len(ex.get('groups',[]))
        for it in ex.get('items',[]):
            if not (isinstance(it.get('key'),int) and 0<=it['key']<n): out.append(f"{it.get('id',i)}: sort key past the groups")
            need_expl(it)
    elif t=='write':
        for it in ex.get('items',[]):
            k=it.get('key','')
            if not (isinstance(k,str) and len(k)==1 and '\u4e00'<=k<='\u9fff'): out.append(f"{it.get('id',i)}: write key must be one CJK character, got {k!r}")
            elif not os.path.exists(f'content/chinese/strokes/{k}.json'): out.append(f"{it.get('id',i)}: no stroke data for {k} — nothing to judge the writing against")
            need_expl(it)
    elif t=='free':
        for it in ex.get('items',[]):
            if not str(it.get('prompt') or '').strip() or not str(it.get('prompt_en') or '').strip(): out.append(f"{it.get('id',i)}: free item needs prompt and prompt_en")
            # grid paper: how many words and how many 米字格 cells each; an optional
            # character to write first, judged by stroke, which needs stroke data
            for k,hi in (('blanks',8),('cells',40)):
                if k in it and not (isinstance(it[k],int) and 1<=it[k]<=hi): out.append(f"{it.get('id',i)}: {k} must be an integer from 1 to {hi}")
            if 'key' in it and (not isinstance(it['key'],str) or len(it['key'])!=1): out.append(f"{it.get('id',i)}: key must be one character")
            elif 'key' in it and not os.path.exists(f"content/chinese/strokes/{it['key']}.json"): out.append(f"{it.get('id',i)}: no stroke data for {it['key']} in content/chinese/strokes/")
            # grid paper: how many words and how many 米字格 cells each; an optional
            # character to write first, judged by stroke, which needs stroke data
            for k,hi in (('blanks',8),('cells',40)):
                if k in it and not (isinstance(it[k],int) and 1<=it[k]<=hi): out.append(f"{it.get('id',i)}: {k} must be an integer from 1 to {hi}")
            if 'key' in it and (not isinstance(it['key'],str) or len(it['key'])!=1): out.append(f"{it.get('id',i)}: key must be one character")
            elif 'key' in it and not os.path.exists(f"content/chinese/strokes/{it['key']}.json"): out.append(f"{it.get('id',i)}: no stroke data for {it['key']} in content/chinese/strokes/")
    elif t=='read':
        if not str(ex.get('text') or '').strip(): out.append(f'{i}: read needs text to read')
    elif t=='speak':
        q=ex.get('question')
        if not isinstance(q,dict) or not q.get('zh') or not q.get('en'): out.append(f'{i}: speak needs a question in zh and en')
    else: out.append(f'{i}: unknown exercise type {t!r}')
    for it in ex.get('items',[])+(ex.get('fills') or {}).get('items',[]):
        if not it.get('id'): out.append(f'{i}: an item without an id')
        elif it['id'] in seen: out.append(f"{it['id']}: duplicate id")
        else: seen.add(it['id'])
    return out
HWDIR='content/chinese/homework'
# The four-choice blocks of a homework note name bank items by id; a block that
# names an item twice, or one that does not exist, would be a sitting with a
# hole in it. Checked against the Chinese banks loaded above.
_zh_ids={it['id'] for f in bank_files() if '/chinese/' in f for it in json.load(open(f))['items']}
if os.path.isdir(HWDIR):
    for f in sorted(os.listdir(HWDIR)):
        if not f.endswith('.json'): continue
        for t in json.load(open(f'{HWDIR}/{f}')).get('tasks',[]):
            # What the task card prints: its heading line and where in the book
            # it is, each in both languages; the rule under the dictation and the
            # reading as {zh, en}. A scope_note is internal and never printed.
            w=f'{f} {t.get("kind","?")}'
            errs+=pair_errors(t, 'what', w, label=True)
            errs+=pair_errors(t, 'pages', w, label=True)
            if t.get('kind') in ('read_aloud','dictation'): errs+=both_errors(t, 'rule', w)
            if t.get('kind')=='workbook':
                    for e in t.get('on_paper',[]) or []: errs+=pair_errors(e, 'what', f'{w} on_paper')
            if t.get('kind')=='dictation':
                # The section headings over the word list: the key is the book's
                # own heading, so the English twin sits in a map beside the list.
                sec_en=t.get('sections_en') or {}
                for sec in (t.get('words') or {}):
                    errs+=pair_errors({'title':sec,'title_en':sec_en.get(sec)}, 'title', f'{w} section {sec!r}', label=True)
            if t.get('blocks'): errs.append(f"{f}: a homework note no longer carries blocks — they live in content/chinese/exercises/<lesson>.json beside the exercises")
if os.path.isdir(HWDIR):
    for f in sorted(os.listdir(HWDIR)):
        if not f.endswith('.json'): continue
        for t in json.load(open(f'{HWDIR}/{f}')).get('tasks',[]):
            if t.get('kind')!='dictation': continue
            for sec in (t.get('words') or {}).values():
                for w in sec:
                    for ch in w:
                        if '\u4e00'<=ch<='\u9fff' and not os.path.exists(f'content/chinese/strokes/{ch}.json'): errs.append(f'{f}: dictation word {w} has no stroke data for {ch}')
if os.path.isdir(EXDIR):
    for f in sorted(os.listdir(EXDIR)):
        if not f.endswith('.json'): continue
        d=json.load(open(f'{EXDIR}/{f}'))
        for ex in d.get('exercises',[]):
            total+=1; errs+=ex_errors(ex)
# The four-choice blocks of a lesson's workbook live in its exercises file, one
# per weekday that has one, and name bank items by id; a block that names an id
# the banks do not hold, or the same item twice, is a sitting that cannot be sat.
_used_block_items={}
if os.path.isdir(EXDIR):
    for f in sorted(os.listdir(EXDIR)):
        if not f.endswith('.json'): continue
        d=json.load(open(f'{EXDIR}/{f}'))
        for b in d.get('blocks',[]) or []:
            w=f"{EXDIR}/{f} block {b.get('id','?')}"
            for k in ('id','day','page','ex','title','title_en','items'):
                if not b.get(k): errs.append(f"{w}: missing {k}")
            errs+=pair_errors(b, 'title', w, label=True)
            if b.get('day') not in ZH_DAYS: errs.append(f"{w}: day {b.get('day')!r} is not one of {ZH_DAYS}")
            if not str(b.get('id','')).startswith(f"zb:{d.get('lesson')}-"): errs.append(f"{w}: id must start with zb:{d.get('lesson')}-")
            for i in b.get('items',[]) or []:
                if i not in _zh_ids: errs.append(f"{w}: names {i}, which is not in a Chinese bank")
                if i in _used_block_items: errs.append(f"{w}: {i} is also in {_used_block_items[i]}")
                _used_block_items[i]=b.get('id')
# The lesson page: its title, where each section is in the book, a gloss on
# every 生字 and the reading's title — every one of them printed, so every one
# of them in both languages. The section `where` is a label (it is the card's
# subtitle); a gloss is text.
LESSONDIR='content/chinese/lessons'
if os.path.isdir(LESSONDIR):
    for f in sorted(os.listdir(LESSONDIR)):
        if not f.endswith('.json'): continue
        l=json.load(open(f'{LESSONDIR}/{f}')); w=f'{LESSONDIR}/{f}'
        errs+=pair_errors(l, 'title', w, label=True)
        for sec in ('课文','生字','词语','句子','句型','读一读','用一用','阅读'):
            if isinstance(l.get(sec), dict) and 'where' in l[sec]: errs+=both_errors(l[sec], 'where', f'{w} {sec}', label=True)
        for z in (l.get('生字') or {}).get('items',[]): errs+=both_errors(z, 'gloss', f'{w} 生字 {z.get("zi","?")}')
        if isinstance(l.get('阅读'), dict) and l['阅读'].get('title'): errs+=pair_errors(l['阅读'], 'title', f'{w} 阅读', label=True)
# Internal notes. A key ending in _note is a note to the next author: plain
# English (or the teacher's own words), one language, never printed —
# site/make_bundle.py strips every such key before the browser sees the file,
# and test_chinese.cjs fails a page that carries one's text. So a _note must be
# a non-blank string (or a list of them), and a bare `note` holding a string is
# a mistake: a `note` is {zh, en} and printed (exercises), or it is a _note and not.
def internal_note_errors(o, where):
    out=[]
    if isinstance(o, dict):
        for k,v in o.items():
            if k.endswith('_note'):
                # one string, or the lines of one (the teacher's note is kept line by line)
                ok=(isinstance(v,str) and v.strip()) or (isinstance(v,list) and v and all(isinstance(x,str) and x.strip() for x in v))
                if not ok: out.append(f'{where}: {k} must be a non-blank string, or a list of them — an internal note has one reader, the next author')
            elif k=='note' and isinstance(v,str):
                out.append(f'{where}: `note` is a plain string — a printed note is {{zh, en}}; an internal one ends in _note')
            else: out+=internal_note_errors(v, f'{where}/{k}')
    elif isinstance(o, list):
        for i,v in enumerate(o): out+=internal_note_errors(v, f'{where}[{i}]')
    return out
for _d,_sub,_fs in os.walk('content/chinese'):
    if 'strokes' in _d: continue
    for _f in sorted(_fs):
        if _f.endswith('.json'): errs+=internal_note_errors(json.load(open(f'{_d}/{_f}')), f'{_d}/{_f}')
# The manifest's two lines on the home card.
MANIFEST='content/chinese/manifest.json'
if os.path.exists(MANIFEST):
    m=json.load(open(MANIFEST))
    for k in ('volume','edition'): errs+=pair_errors(m, k, MANIFEST, label=True)

# answer-position sanity per bank/form
for f in bank_files():
    d=json.load(open(f))
    g=collections.defaultdict(list)
    for it in d['items']: g[(it.get('form') or '-', it['subject'])].append(it['correct'])
    for k,v in g.items():
        s=''.join(v)
        if len(s)<8: continue
        st=L.index(s[0]); exp=''.join(L[(st+i)%4] for i in range(len(s)))
        cyc=sum(a==b for a,b in zip(s,exp))/len(s)
        if cyc>0.60: errs.append(f'{d["bank"]} {k}: answer positions still {100*cyc:.0f}% cyclic')

print(f'items validated: {total}')
print(f'passages: {len(pass_ids)}')
print(f'warnings: {len(warns)}')
print(f'ERRORS: {len(errs)}')
for e in errs[:20]: print('  !',e)
sys.exit(1 if errs else 0)
