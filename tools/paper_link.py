#!/usr/bin/env python3
"""Turn a marked paper's results into an import link.

    python3 tools/paper_link.py result.json

result.json:
    {"form": "TPR", "sat": "2026-10-04", "by": "Dad",
     "scores": {"VR": 24, "QR": 28, "RC": 21, "MA": 17},
     "missed": {"VR": [5, 7], "QR": [12], "RC": [17], "MA": [3]},
     "tags":   {"QR": {"12": "Data reasoning"}}}

`form` is a paper the site ships (content/offline_mocks.json) or one a parent added on
the Mock exams page — its id is on its page's address, /mock/P…, and it is checked
against the ISEE Lower Level layout. `tags` files a missed question under one of the
practice bank's skills, so review can ask about it; a paper the site ships already
has its own map, and Verbal is filed by position.

The paper is a published book, so nothing of its questions or key goes in: only the
number right per section and the question numbers circled as missed. This checks
them against the paper's own sections in content/offline_mocks.json, warns where
the circled count disagrees with the score, and prints
https://learning.sheilazhang.org/#/import/<payload>. Opened on her signed-in
device, the link previews the results and, on Add, puts them in her record — the
missed numbers become review anchors (site/src/lib/engine.js, recordOfflineMisses).
"""
import base64, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://learning.sheilazhang.org/"

def main(path):
    r = json.loads(Path(path).read_text())
    forms = {f["id"]: f for f in json.loads((ROOT / "content" / "offline_mocks.json").read_text())["forms"]}
    f = forms.get(r.get("form"))
    if not f and re.fullmatch(r"P[0-9A-Z]+", r.get("form", "")):
        # A paper a parent added lives in her record, not here; check it against the
        # layout it was most likely added with, and say so.
        print("note: a paper added on the site; checked against the ISEE Lower Level layout (34/38/25/30)", file=sys.stderr)
        f = {"id": r["form"], "sections": [{"id": "VR", "name": "Verbal Reasoning", "n": 34}, {"id": "QR", "name": "Quantitative Reasoning", "n": 38},
                                          {"id": "RC", "name": "Reading Comprehension", "n": 25}, {"id": "MA", "name": "Mathematics Achievement", "n": 30}]}
    if not f: sys.exit(f"no paper {r.get('form')!r}; the site ships: {', '.join(forms)} — or give the id of one added on the site (P…)")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r.get("sat", "")): sys.exit("sat must be YYYY-MM-DD")
    secs = {s["id"]: s for s in f["sections"] if s.get("n")}
    for k, v in (r.get("scores") or {}).items():
        if k not in secs or not isinstance(v, int) or not 0 <= v <= secs[k]["n"]: sys.exit(f"score {k}={v!r} is not 0–{secs.get(k, {}).get('n')}")
    for k, v in (r.get("missed") or {}).items():
        if k not in secs or not all(isinstance(x, int) and 1 <= x <= secs[k]["n"] for x in v): sys.exit(f"missed {k} has numbers outside 1–{secs.get(k, {}).get('n')}")
        sc = (r.get("scores") or {}).get(k)
        if sc is not None and secs[k]["n"] - sc != len(set(v)):
            print(f"warning: {secs[k]['name']} lists {len(set(v))} missed, but {sc} right of {secs[k]['n']} leaves {secs[k]['n'] - sc}", file=sys.stderr)
    # The skills a miss can be filed under are the practice bank's own (lib/engine.js,
    # paperSkillOptions): Verbal's two parts, and every `skill` a bank item carries.
    sub = {"QR": "qr", "MA": "ma", "RC": "rc"}
    bank = {k: set() for k in sub}
    for fp in sorted((ROOT / "content" / "question-banks").glob("*.json")):
        if fp.name.startswith("mock-"): continue
        for it in json.loads(fp.read_text())["items"]:
            for k, v in sub.items():
                if fp.name.startswith(v + "-") and it.get("skill"): bank[k].add(it["skill"])
    bank["VR"] = {"Synonyms", "Sentence completion"}
    for k, m in (r.get("tags") or {}).items():
        if k not in secs: sys.exit(f"tags name a section the paper does not have: {k}")
        for n, sk in m.items():
            if not str(n).isdigit() or not 1 <= int(n) <= secs[k]["n"]: sys.exit(f"tags {k} has no question {n}")
            if sk not in bank[k]: sys.exit(f"tags {k} {n}: {sk!r} is not one of the practice bank's skills for that section")
    payload = {"paper": {k: r[k] for k in ("form", "sat", "scores", "missed", "tags", "by") if k in r}}
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()
    print(SITE + "#/import/" + base64.urlsafe_b64encode(raw).decode().rstrip("="))

if __name__ == "__main__":
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
