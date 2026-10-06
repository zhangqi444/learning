#!/usr/bin/env python3
"""Where each question sits on a paper's PDF, so the paper's page can show a missed
question cut out of the family's own copy (site/src/components/paper-question.jsx).

    python3 tools/paper_boxes.py paper.pdf --sections VR=4-6,QR=8-11,RC=13-17,MA=19-21
    python3 tools/paper_boxes.py paper.pdf --sections … --into result.json

`--sections` names the PDF pages (from 1) each section's questions are on. The first
form prints, per section, a box for every question — [page, x0, y0, x1, y1], fractions
of the page, y from the top — and under `ctx` the figure or passage a question refers
to: the shape of `where`/`ctx` in content/offline_mocks.json. `--into` writes the box
of each missed question into that result.json's notes instead (tools/paper_link.py),
for a paper a parent added. Positions only: nothing of the paper's text is kept.

Read off the PDF's text layer (tools/pdf_text.mjs), so a scanned PDF without one gives
nothing. The rules, from the Princeton Review paper's layout of two columns a page:
- a question runs from just above its number — or from the figure above it, when that
  figure has words in it — to the end of its last choice;
- the last choice takes as much room as the gap between (C) and (D), so a fraction's
  denominator or a picture choice is inside it, and its own run-on lines are added;
- the edges follow the question's own text, never into the column rule, the next
  column, or the grey page edge;
- "Questions 4–6 refer to …" gives its figure to every question of the group, and a
  reading passage under "Questions 16–20" goes with each of its questions.
Look at the boxes before trusting them: cut them out of the rendered pages and check.
"""
import argparse, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOP, BOT = 0.105, 0.852          # below a page's section header band, above "Go on to the next page"
NUM = re.compile(r'^(\d{1,2})\.$')
LABEL = re.compile(r'^\(?([A-E])\)$|^\(([A-E])\)')   # '(D)', or '(' and 'D)' split in two


def r4(v): return round(v, 4)


def label(i):
    m = LABEL.match(i['s'].strip())
    return (m.group(1) or m.group(2)) if m else None


def boxes(items, sections):
    out = {}
    for sec, pages in sections.items():
        where, ctx = {}, {}
        for p in pages:
            its = [i for i in items if i['p'] == p and TOP - 0.01 < i['y'] < BOT]
            if not its: continue
            W = next(i['W'] for i in items if i['p'] == p)
            halves = [(0.0, 0.5, 'L'), (0.5, 1.0, 'R')] if W > 900 else [(0.0, 1.0, 'L')]   # a spread, or one page
            for h0, h1, side in halves:
                hits = [i for i in its if h0 <= i['x'] < h1]
                nums = [(int(NUM.match(i['s'].strip()).group(1)), i) for i in hits if NUM.match(i['s'].strip())]
                edge_lo, edge_hi = (h0 + 0.02, h1 - 0.004) if side == 'L' else (h0 + 0.004, h1 - 0.016)
                clusters = []
                for x in sorted(i['x'] for _, i in nums):
                    if clusters and x - clusters[-1][-1] < 0.03: clusters[-1].append(x)
                    else: clusters.append([x])
                mins = [min(c) for c in clusters]
                # a column holds every item that starts between its own numbers and the next column's
                ranges = [((h0 if k == 0 else mins[k] - 0.02), (mins[k + 1] - 0.02 if k + 1 < len(mins) else h1)) for k in range(len(mins))]
                colitems = [[i for i in hits if lo <= i['x'] < hi] for lo, hi in ranges]
                caps = [(min(i['x'] for i in colitems[k + 1]) - 0.004) if k + 1 < len(mins) else edge_hi for k in range(len(mins))]

                def box(block, k, y0, y1):
                    bx0 = max(ranges[k][0], edge_lo, min(i['x'] for i in block) - 0.0025)
                    bx1 = min(caps[k], max(i['x'] + i['w'] for i in block) + 0.006)
                    return [p, r4(bx0), r4(y0), r4(bx1), r4(y1)]

                for k in range(len(mins)):
                    col = sorted(colitems[k], key=lambda i: i['y'])
                    qs = sorted([(n, i) for n, i in nums if ranges[k][0] <= i['x'] < ranges[k][1]], key=lambda t: t[1]['y'])
                    prev_bottom = TOP
                    for j, (n, ni) in enumerate(qs):
                        nxt_y = qs[j + 1][1]['y'] if j + 1 < len(qs) else BOT
                        own = [i for i in col if ni['y'] - 0.003 <= i['y'] < nxt_y - 0.010]
                        labels = {}
                        for i in own:
                            L = label(i)
                            if L and L not in labels: labels[L] = i
                        if labels:
                            D = labels[max(labels)]
                            before = chr(ord(max(labels)) - 1)
                            spacing = D['y'] - labels[before]['y'] if before in labels else 0.019
                            bottom = D['y'] + max(spacing * 0.92, D['h'])
                            line = [i for i in own if abs(i['y'] - D['y']) < 0.004 and i['x'] > D['x'] + 0.005]
                            tx = min((i['x'] for i in line), default=None)
                            if tx is not None:             # the last choice's own run-on lines
                                end = D['y'] + D['h']
                                for i in sorted(own, key=lambda i: i['y']):
                                    if i['y'] > D['y'] + 0.004 and abs(i['x'] - tx) < 0.006 and i['y'] - end < 0.012:
                                        end = i['y'] + i['h']; bottom = max(bottom, end)
                        else:
                            bottom = max((i['y'] + i['h'] for i in own), default=ni['y'] + 0.05)
                        bottom = min(bottom, nxt_y - 0.012 if j + 1 < len(qs) else BOT)
                        # between the question above and this one: a figure or an intro with words in
                        # it belongs to this question; bare graphics are the tail of the one above
                        between = [i for i in col if prev_bottom <= i['y'] < ni['y'] - 0.003]
                        top = max(prev_bottom, min(i['y'] for i in between) - 0.025) if between else ni['y'] - 0.012
                        block = between + [i for i in own if i['y'] < bottom]
                        where[n] = box(block, k, top, min(bottom + 0.004, BOT))
                        prev_bottom = bottom + 0.002
                    for i in col:      # "Questions a–b refer to …": the figure goes with every question of the group
                        m = re.match(r'^Questions? (\d+)[–-](\d+)', i['s'].strip())
                        if not m or 'refer' not in i['s']: continue
                        a, b = int(m.group(1)), int(m.group(2))
                        first = next((t for nn, t in qs if nn == a), None)
                        if first is None: continue
                        region = [t for t in col if i['y'] - 0.002 <= t['y'] < first['y'] - 0.004]
                        bx = box(region, k, i['y'] - 0.008, first['y'] - 0.006)
                        for q in range(a + 1, b + 1): ctx[q] = bx
                for i in hits:          # a reading passage: the whole book page under its "Questions a–b" line
                    m = re.match(r'^Questions (\d+)[–-](\d+)$', i['s'].strip())
                    if not m: continue
                    a, b = int(m.group(1)), int(m.group(2))
                    body = [t for t in hits if t['y'] >= i['y'] - 0.002]
                    x0 = max(edge_lo, min(t['x'] for t in body) - 0.004)
                    x1 = min(edge_hi, max(t['x'] + t['w'] for t in body) + 0.006)
                    y1 = max(t['y'] + t['h'] for t in body) + 0.006
                    for q in range(a, b + 1): ctx[q] = [p, r4(x0), r4(i['y'] - 0.008), r4(x1), r4(min(y1, BOT))]
        n_max = max(where) if where else 0
        out[sec] = {'where': [where.get(n) for n in range(1, n_max + 1)], 'ctx': {str(k): v for k, v in sorted(ctx.items())}}
        missing = [n for n in range(1, n_max + 1) if n not in where]
        print(f"{sec}: {len(where)} questions{', none for ' + str(missing) if missing else ''}, {len(ctx)} with a figure or passage", file=sys.stderr)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('pdf')
    ap.add_argument('--sections', required=True, help='VR=4-6,QR=8-11,… — the PDF pages, from 1, of each section')
    ap.add_argument('--into', help="a result.json for tools/paper_link.py: each missed question's box goes into its note")
    a = ap.parse_args()
    sections = {}
    for part in a.sections.split(','):
        sec, rng = part.split('=')
        lo, _, hi = rng.partition('-')
        sections[sec.strip()] = list(range(int(lo), int(hi or lo) + 1))
    text = subprocess.run(['node', str(ROOT / 'tools' / 'pdf_text.mjs'), a.pdf], check=True, capture_output=True, text=True).stdout
    out = boxes(json.loads(text)['items'], sections)
    if not a.into:
        print(json.dumps(out, separators=(',', ':')))
        return
    r = json.loads(Path(a.into).read_text())
    notes = r.setdefault('notes', {})
    for sec, nums in (r.get('missed') or {}).items():
        for n in nums:
            q = ((out.get(sec) or {}).get('where') or [])[n - 1:n]
            if not q or not q[0]: print(f"warning: no box for {sec} {n}", file=sys.stderr); continue
            note = notes.setdefault(sec, {}).setdefault(str(n), {})
            note['where'] = q[0]
            c = (out.get(sec) or {}).get('ctx', {}).get(str(n))
            if c: note['ctx'] = c
    Path(a.into).write_text(json.dumps(r, ensure_ascii=False, indent=1) + '\n')
    print(f"boxes written into {a.into}", file=sys.stderr)


if __name__ == '__main__':
    main()
