#!/usr/bin/env python3
"""Generate site/content/bundle.json from the repo content banks."""
import glob, json, re, os
BANKS={'vr':['vr-september.json','vr-weeks5-8.json'],'qr':['qr-september.json','qr-weeks5-8.json'],
       'ma':['ma-september.json','ma-weeks5-8.json'],'rc':['rc-september.json','rc-weeks5-8.json']}
# A week's work doubled after it was planned (the owner, 5 October 2026: "did you double
# the volume of each work for me? … you must do it now"): the added questions live in
# their own `-plus` bank and are marked `x`, so the site gives them sittings of their own
# after the week's first ones and a sitting she has already done keeps exactly its
# questions (src/lib/content.js, setsFor).
PLUS={sub:f'{sub}-weeks5-8-plus.json' for sub in BANKS}
# The sub-skill of each question written before sub-skills were named, kept beside the
# banks rather than in them so those questions (and their content hashes) are untouched.
SUBSKILLS=json.load(open('content/subskills.json'))['items'] if os.path.exists('content/subskills.json') else {}
out={'version':'2026.09.01','subjects':{},'passages':{}}
for sub,files in BANKS.items():
    items=[]
    for f in files+([PLUS[sub]] if os.path.exists(f'content/question-banks/{PLUS[sub]}') else []):
        for it in json.load(open(f'content/question-banks/{f}'))['items']:
            m=re.match(r'(W[1-8])', str(it.get('form','')))
            q={'id':it['id'],'w':m.group(1) if m else 'W1','sk':it.get('skill',''),
                'd':it.get('difficulty',''),'q':it['prompt'],
                'c':[it['choices'][k] for k in 'ABCD'],'k':it['correct'],
                'e':it.get('explanation',''),'p':it.get('passage_id','')}
            # `why` names what a particular WRONG choice did, which the shared
            # explanation cannot: it tells her the right method, never what she
            # actually did. Only carried when authored, so the bundle does not
            # grow an empty key on 1,300 questions.
            if it.get('why'): q['y']=it['why']
            # The picture a question is read off (tools/itemspec.py FIGURES;
            # drawn by site/src/components/figure.jsx). Carried only when authored.
            if it.get('figure'): q['f']=it['figure']
            # The fine-grained sub-skill, where an author named one: a skill's page lists
            # its questions under these, so what is covered can be read off at a glance.
            if it.get('subskill') or SUBSKILLS.get(it['id']): q['ss']=it.get('subskill') or SUBSKILLS[it['id']]
            # The word a phrase completion turns on ("Since arguing with the referee was futile,
            # the coach ____"), where its author named one: its choices are what happened next,
            # not words, so the word bank (site/src/lib/vocab.js) could not read it off them.
            if it.get('word'): q['vw']=it['word']
            if f==PLUS[sub]: q['x']=1
            items.append(q)
    items.sort(key=lambda i:(int(i['w'][1:]), i['id']))
    out['subjects'][sub]=items
# `l` marks a passage authored line by line (tools/itemspec.py, passage_lines):
# the page numbers its lines the way the ISEE booklet does, and its questions
# may say "line 14". A passage without it prints as paragraphs, as before.
def passage_out(p):
    o={'t':p.get('title',''),'x':p['text']}
    if p.get('lines'): o['l']=True
    return o
for f in ['rc-september-passages.json','rc-weeks5-8-passages.json']+(['rc-weeks5-8-plus-passages.json'] if os.path.exists('content/passages/rc-weeks5-8-plus-passages.json') else []):
    for p in json.load(open(f'content/passages/{f}'))['items']:
        out['passages'][p['id']]=passage_out(p)
out['weeks']=[{'w':'W1','label':'Aug 31 – Sep 6'},{'w':'W2','label':'Sep 7 – 13'},
 {'w':'W3','label':'Sep 14 – 20'},{'w':'W4','label':'Sep 28 – Oct 4'},
 {'w':'W5','label':'Oct 5 – 11'},{'w':'W6','label':'Oct 12 – 18'},
 {'w':'W7','label':'Nov 9 – 15'},{'w':'W8','label':'Nov 16 – 22'}]
out['starts']={'W1':'2026-08-31','W2':'2026-09-07','W3':'2026-09-14','W4':'2026-09-28',
 'W5':'2026-10-05','W6':'2026-10-12','W7':'2026-11-09','W8':'2026-11-16'}
out['breaks']=[{'label':'Sep 21 – 27','what':'Split baseline mock'},
 {'label':'Oct 19 – 25','what':'Mock 1'},{'label':'Oct 26 – Nov 1','what':'Correction and retest'},
 {'label':'Nov 2 – 8','what':'Mock 2'}]
# ---- Session 1 precision review (VR), essay programme, mocks, calendar ----
out['precision']=json.load(open('content/precision.json'))
out['essay']=json.load(open('content/essay.json'))
# One file per form (the owner's ask, 4 October 2026: a paper is a file, so a rework
# replaces one file and its diff reads as one paper), and the passages the same way.
mock_bank=[i for f in sorted(glob.glob('content/question-banks/mock-*.json')) for i in json.load(open(f))['items']]
mock_essays=json.load(open('content/mock_essays.json'))
for f in sorted(glob.glob('content/passages/mock-*-passages.json')):
    for p in json.load(open(f))['items']:
        out['passages'][p['id']]=passage_out(p)
FORMS=[('DGN','Split diagnostic','Baseline, split across two sittings: Part A = VR + QR, Part B = RC + MA + Essay','Sep 21 – 27','2026-09-21','DIAGNOSTIC',True),
       ('M01','Mock 1','Full length, one sitting, after the first four-week cycle','Oct 19 – 25','2026-10-19','MOCK 1',False),
       ('M02','Mock 2','Full length, one sitting, after the second four-week cycle','Nov 2 – 8','2026-11-02','MOCK 2',False),
       ('M03','Mock 3','Final readiness rehearsal in the last days before the real test','Nov 23 – 29','2026-11-23','MOCK 3',False)]
SECTIONS=[('VR','Verbal Reasoning',34,20),('QR','Quantitative Reasoning',38,35),('RC','Reading Comprehension',25,25),('MA','Mathematics Achievement',30,30)]
out['mocks']=[]; out['mockItems']={}
for fid,name,blurb,label,start,ekey,split in FORMS:
    secs=[]; out['mockItems'][fid]={}
    for sid,sname,n,mins in SECTIONS:
        its=[i for i in mock_bank if i['form']==fid and i['subject']==sid]
        its.sort(key=lambda i:i['id'])
        assert len(its)==n,(fid,sid,len(its))
        out['mockItems'][fid][sid]=[{**{'id':i['id'],'sk':i.get('skill',''),'d':i.get('difficulty',''),'q':i['prompt'],
            'c':[i['choices'][k] for k in 'ABCD'],'k':i['correct'],'e':i.get('explanation',''),'p':i.get('passage_id','')},
            **({'y':i['why']} if i.get('why') else {}), **({'f':i['figure']} if i.get('figure') else {})} for i in its]
        secs.append({'id':sid,'name':sname,'n':n,'min':mins,'part':'A' if sid in ('VR','QR') else 'B'})
    secs.insert(2,{'id':'BREAK1','name':'Break','min':10,'part':'A'})
    secs.append({'id':'BREAK2','name':'Break','min':10,'part':'B'})
    secs.append({'id':'ESSAY','name':'Essay','min':30,'part':'B','prompt':mock_essays[ekey]})
    out['mocks'].append({'id':fid,'name':name,'blurb':blurb,'label':label,'start':start,'split':split,'sections':secs})
# A paper sat offline: its structure, its source and a question→skill map, never
# its questions or key — it is a published, copyrighted book, and this repository
# is public. It sits in a key of its own rather than in `mocks` because it has no
# questions to run; the engine reads it on purpose where it counts (mockBand,
# recordOfflineMisses), since the owner ruled on 4 October 2026 that it does.
# The question→skill map a paper carries (`skills`) is data the page uses; a
# `_note` beside it is for the next author and is stripped like every other.
def _strip_note_keys(o):
    if isinstance(o,dict): return {k:_strip_note_keys(v) for k,v in o.items() if not k.endswith('_note')}
    if isinstance(o,list): return [_strip_note_keys(v) for v in o]
    return o
out['offlineMocks']=_strip_note_keys(json.load(open('content/offline_mocks.json'))['forms'])
for f in out['offlineMocks']:
    assert f['id'] not in {x[0] for x in FORMS},f['id']
    assert [(s['id'],s['n'],s['min']) for s in f['sections']]==[(a,n,m) for a,_,n,m in SECTIONS],f['id']
out['calendar']=json.load(open('content/calendar.json'))
out['books']=json.load(open('content/books.json'))
out['aops']=json.load(open('content/aops.json'))
out['catcare']=json.load(open('content/catcare.json'))
out['learn']=json.load(open('content/learn.json'))
# ---- Chinese: a sibling key, and ISEE's keys do not move (docs/chinese.md § 4) ----
# `zh` sits next to `subjects` rather than inside it. readiness() walks ORDER and
# ORDER indexes `subjects`, so a fifth subject there would score Chinese homework
# into a number that means ISEE preparedness; a sibling key cannot. Items keep the
# bank's full shape, `why` included, so whatever reads them can tell a wrong choice
# what it actually was.
_ZH='content/chinese'
if os.path.isdir(_ZH):
    zh={'manifest':json.load(open(f'{_ZH}/manifest.json')),'lessons':{},'homework':{},'banks':{}}
    for _f in sorted(os.listdir(f'{_ZH}/lessons')):
        _l=json.load(open(f'{_ZH}/lessons/{_f}')); zh['lessons'][_l['id']]=_l
    for _f in sorted(os.listdir(f'{_ZH}/homework')):
        _hw=json.load(open(f'{_ZH}/homework/{_f}')); zh['homework'][_hw['set']]=_hw
    for _f in sorted(os.listdir(f'{_ZH}/question-banks')):
        _b=json.load(open(f'{_ZH}/question-banks/{_f}'))
        zh['banks'][_b['bank']]=[{'id':i['id'],'l':i.get('lesson',''),'sk':i.get('skill',''),'d':i.get('difficulty',''),
            'q':i['prompt'],'c':[i['choices'][k] for k in 'ABCD'],'k':i['correct'],'e':i.get('explanation',''),
            'src':i.get('source',''),**({'qe':i['prompt_en']} if i.get('prompt_en') else {}),**({'ez':i['explanation_zh']} if i.get('explanation_zh') else {}),**({'y':i['why']} if i.get('why') else {}),**({'yz':i['why_zh']} if i.get('why_zh') else {})} for i in _b['items']]
    # A name in each language for every skill the banks use, so a page never
    # prints the id (content/chinese/skills.json; the validator holds the two together).
    zh['skills']=json.load(open(f'{_ZH}/skills.json'))['skills'] if os.path.exists(f'{_ZH}/skills.json') else {}
    zh['exercises']={}
    if os.path.isdir(f'{_ZH}/exercises'):
        for _f in sorted(os.listdir(f'{_ZH}/exercises')):
            _e=json.load(open(f'{_ZH}/exercises/{_f}')); zh['exercises'][_e['lesson']]=_e
    # Reference stroke data for every character she is asked to write (Make Me a
    # Hanzi via hanzi-writer-data, Arphic Public License — the licence file sits
    # beside the data). Inline, so the quiz works offline and in the artifact.
    zh['strokes']={}
    if os.path.isdir(f'{_ZH}/strokes'):
        for _f in sorted(os.listdir(f'{_ZH}/strokes')):
            if _f.endswith('.json'): zh['strokes'][_f[:-5]]=json.load(open(f'{_ZH}/strokes/{_f}'))
    # Internal notes never reach the browser. A key ending in _note is a note to
    # the next author — where a page number was read from, why a question was
    # left out, how a list came to be in its order — and the owner found two of
    # them printed on the week's page (2 October 2026). Stripped here, a page
    # cannot print what it is never given; AGENTS.md § Content rules has the rule.
    def _strip_notes(o):
        if isinstance(o,dict): return {k:_strip_notes(v) for k,v in o.items() if not k.endswith('_note')}
        if isinstance(o,list): return [_strip_notes(v) for v in o]
        return o
    out['zh']=_strip_notes(zh)
import os as _os, datetime as _dt
if _os.path.exists('site/content/seed.json'):
    out['seed']=json.load(open('site/content/seed.json'))
# When each question entered the bank.
#
# Reading was one set of twelve a week until the 15th of September, when it
# doubled, and again on the 19th. Weeks she had already finished grew a second
# set overnight: the card went from 2/2 to 1/2, the new set said "Not started",
# and nothing anywhere said why. She reported it as a bug, which is the right
# reading of a number that changes on its own and offers no account of itself.
#
# The map is seeded from git — the first commit in which each id appears in the
# built bundle, which is exact rather than remembered — and maintained here: an
# id nobody has seen before is stamped with today. It is a side map rather than
# a field on the item so that no content_hash moves, and so the banks stay the
# authored truth with nothing generated mixed into them.
SINCE='content/since.json'
since=json.load(open(SINCE)) if _os.path.exists(SINCE) else {}
today=_dt.date.today().isoformat()
fresh=[i['id'] for s in out['subjects'].values() for i in s if i['id'] not in since]
for i in fresh: since[i]=today
known={i['id'] for s in out['subjects'].values() for i in s}
since={k:v for k,v in since.items() if k in known}   # a question removed from the bank leaves with it
json.dump(since,open(SINCE,'w'),ensure_ascii=False,indent=0,sort_keys=True)
out['since']=since
if fresh: print(f'  {len(fresh)} new question(s) stamped {today}')

os.makedirs('site/content',exist_ok=True)
json.dump(out,open('site/content/bundle.json','w'),ensure_ascii=False,separators=(',',':'))
n=sum(len(v) for v in out['subjects'].values())
print(f'bundle.json {os.path.getsize("site/content/bundle.json"):,} bytes · {n} items · {len(out["passages"])} passages')
