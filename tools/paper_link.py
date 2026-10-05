#!/usr/bin/env python3
"""Turn a marked paper's results into an import link.

    python3 tools/paper_link.py result.json

result.json:
    {"form": "TPR", "sat": "2026-10-04", "by": "Dad",
     "scores": {"VR": 24, "QR": 28, "RC": 21, "MA": 17},
     "missed": {"VR": [5, 7], "QR": [12], "RC": [17], "MA": [3]}}

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
    if not f: sys.exit(f"no paper {r.get('form')!r}; listed: {', '.join(forms)}")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r.get("sat", "")): sys.exit("sat must be YYYY-MM-DD")
    secs = {s["id"]: s for s in f["sections"] if s.get("n")}
    for k, v in (r.get("scores") or {}).items():
        if k not in secs or not isinstance(v, int) or not 0 <= v <= secs[k]["n"]: sys.exit(f"score {k}={v!r} is not 0–{secs.get(k, {}).get('n')}")
    for k, v in (r.get("missed") or {}).items():
        if k not in secs or not all(isinstance(x, int) and 1 <= x <= secs[k]["n"] for x in v): sys.exit(f"missed {k} has numbers outside 1–{secs.get(k, {}).get('n')}")
        sc = (r.get("scores") or {}).get(k)
        if sc is not None and secs[k]["n"] - sc != len(set(v)):
            print(f"warning: {secs[k]['name']} lists {len(set(v))} missed, but {sc} right of {secs[k]['n']} leaves {secs[k]['n'] - sc}", file=sys.stderr)
    payload = {"paper": {k: r[k] for k in ("form", "sat", "scores", "missed", "by") if k in r}}
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()
    print(SITE + "#/import/" + base64.urlsafe_b64encode(raw).decode().rstrip("="))

if __name__ == "__main__":
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
