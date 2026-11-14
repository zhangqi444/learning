#!/usr/bin/env python3
"""One-off rework of Mock 3 to ERB Appendix A (14 November 2026). Run once; idempotent
guards refuse a second run.

ERB's *What to Expect on the ISEE — Lower Level* (© 2018 edition, Appendix A) gives the
real test's passages as 300 to 600 words and its Verbal section as 17 synonyms, 11
single-word completions and 6 phrase completions. Mock 3's passages sat at 328–332
words, the bottom of that range, and it had 5 phrase completions. Two fiction passages
(P04, P05) gain a paragraph each — fiction, because the three expository passages cite
their sources fact by fact and a new fact would need one — and every line citation after
the insertion moves down by the number of lines added. VR-029 becomes the sixth phrase
completion, first of the phrase group at the end of Part Two. Its key is not the longest
choice, so length gives nothing away.
"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from itemspec import passage_lines, content_hash, break_lines, in_official_order

PF = 'content/passages/mock-M03-passages.json'
QF = 'content/question-banks/mock-M03.json'
VER = '2026.11.14'

INSERT = {
    # passage id: (insert after this line number, new paragraph)
    'M03-RC-P04': (21, "There were smaller problems, too. One Sunday his face was completely dark, and I spent ten minutes asking him to turn on a lamp before I realized that his finger was covering the camera. Another week I could not hear him at all, because he had pressed the mute button, the one with a little microphone on it. Each time, he laughed, wrote the fix in his notebook, and tried again. My mother said he was a better student than I was, because he never once complained about his homework."),
    'M03-RC-P05': (24, "That night she could not stop thinking about the bridge. Had the raccoon jumped? Had someone carried him across? She tried drawing the next page herself on the back of an envelope, but her raccoon looked more like a potato with a tail, so she crumpled it up. Before bed she wiped the sketchbook's cover with a paper towel, because a little of the spotted banana had gotten on it, and she tucked the book into the front pocket of the strange backpack, where it would stay safe."),
}

CITE = re.compile(r'\b(lines?)\s+(\d+)(?:\s*(–|-|to)\s*(\d+))?')

def shift_cites(s, after, k):
    def f(m):
        a = int(m.group(2)); b = m.group(4)
        a2 = a + k if a > after else a
        if b is None: return f'{m.group(1)} {a2}'
        b = int(b); b2 = b + k if b > after else b
        return f'{m.group(1)} {a2}{m.group(3)}{b2}'
    return CITE.sub(f, s)

def main():
    P = json.load(open(PF)); Q = json.load(open(QF))
    byid = {p['id']: p for p in P['items']}
    for pid, (after, para) in INSERT.items():
        p = byid[pid]
        assert para.split()[0] not in p['text'].split('\n')[after] if after < len(passage_lines(p['text'])) else True
        assert 'potato with a tail' not in p['text'] and 'mute button' not in p['text'], 'already applied'
        if pid == 'M03-RC-P04':
            # "Finally" closed the troubles that the new paragraph goes on to list; "Soon" does not.
            assert p['text'].count('could finish. Finally he copied') == 1
            p['text'] = p['text'].replace('could finish. Finally he copied', 'could finish. Soon he copied')
        lines = passage_lines(p['text'])
        assert lines[after - 1][2] != lines[after][2], f'{pid}: line {after} must end a paragraph'
        new = break_lines(para).split('\n')
        k = len(new)
        paras = [p_ for p_ in re.split(r'\n\s*\n', p['text'].strip())]
        # paragraph index of line `after` is the one to insert behind
        pi = lines[after - 1][2]
        paras.insert(pi + 1, '\n'.join(new))
        p['text'] = '\n\n'.join(paras)
        p['content_version'] = VER
        for it in Q['items']:
            if it.get('passage_id') != pid: continue
            it['prompt'] = shift_cites(it['prompt'], after, k)
            it['explanation'] = shift_cites(it['explanation'], after, k)
            it['why'] = {L: shift_cites(t, after, k) for L, t in it['why'].items()}
            it['content_version'] = VER
        w = len(re.findall(r"[A-Za-z0-9'’-]+", p['text']))
        print(f'{pid}: +{k} lines after line {after}; {w} words')

    # VR-029: the sixth phrase completion
    v = next(i for i in Q['items'] if i['id'] == 'M03-VR-029')
    assert 'phrase' not in v['skill'], 'already applied'
    vals = {'had to plant their corn in neat rows': 'Had to plant their corn in neat rows says nothing about the bridge; because asks for something the closed bridge caused, and "had to" alone does not make a result.',
            'crossed the bridge every morning': 'Crossed the bridge every morning is just what they could not do: the bridge was closed all summer.',
            'sold their vegetables at the market in town': 'Sold their vegetables at the market in town is something farmers do anyway; it does not follow from the bridge being closed.',
            'had to drive an extra hour to reach town': None}
    ch = sorted(vals, key=len)
    assert in_official_order(ch)
    key = 'had to drive an extra hour to reach town'
    v.update({
        'skill': 'Sentence completion—phrase, cause clue', 'difficulty': 'M',
        'prompt': 'Because the only bridge over the river was closed for repairs all summer, the farmers on the far side ____.',
        'choices': {L: c for L, c in zip('ABCD', ch)}, 'correct': 'ABCD'[ch.index(key)],
        'explanation': 'Because gives the cause: the only bridge was closed. The ending must be what that closing made happen. With no bridge, the farmers had to go the long way round, an extra hour to reach town.',
        'misconceptions': 'picks an ending that is true of farmers but not caused by the closed bridge',
        'why': {'ABCD'[ch.index(c)]: t for c, t in vals.items() if t},
        'content_version': VER})
    for it in Q['items']:
        if it['content_version'] == VER: it['content_hash'] = content_hash(it)
    json.dump(P, open(PF, 'w'), indent=1, ensure_ascii=False); open(PF, 'a').write('\n')
    json.dump(Q, open(QF, 'w'), indent=1, ensure_ascii=False); open(QF, 'a').write('\n')

if __name__ == '__main__':
    main()
