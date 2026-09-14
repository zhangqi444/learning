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
BANKS='content/question-banks'
pass_ids=set()
for f in os.listdir('content/passages'):
    for p in json.load(open(f'content/passages/{f}'))['items']:
        pass_ids.add(p['id'])
        if not p.get('text') or len(str(p['text']))<100: errs.append(f'{p["id"]}: passage text missing/short')

seen=set()
for f in sorted(os.listdir(BANKS)):
    d=json.load(open(f'{BANKS}/{f}'))
    for it in d['items']:
        total+=1; i=it['id']
        if i in seen: errs.append(f'{i}: duplicate id')
        seen.add(i)
        for k in ('schema_version','content_version','subject','prompt','choices','correct','source','content_hash'):
            if k not in it or it[k] in (None,''): errs.append(f'{i}: missing {k}')
        ch=it.get('choices',{})
        if sorted(ch)!=list(L): errs.append(f'{i}: choices not A-D')
        if any(v is None or str(v).strip()=='' for v in ch.values()): errs.append(f'{i}: blank choice')
        if len({str(v).strip() for v in ch.values()})!=4: errs.append(f'{i}: duplicate choice values')
        if it.get('correct') not in L: errs.append(f'{i}: correct={it.get("correct")!r}')
        if it.get('passage_id') and it['passage_id'] not in pass_ids: errs.append(f'{i}: unknown passage {it["passage_id"]}')
        h=hashlib.sha256(json.dumps({k:v for k,v in it.items() if k!='content_hash'},sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()[:16]
        if h!=it['content_hash']: errs.append(f'{i}: content_hash mismatch')
        if not it.get('explanation'): warns.append(f'{i}: no explanation')
        errs += why_errors(it)

# answer-position sanity per bank/form
for f in sorted(os.listdir(BANKS)):
    d=json.load(open(f'{BANKS}/{f}'))
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
print(f'warnings: {len(warns)}  (items without explanation)')
print(f'ERRORS: {len(errs)}')
for e in errs[:20]: print('  !',e)
sys.exit(1 if errs else 0)
