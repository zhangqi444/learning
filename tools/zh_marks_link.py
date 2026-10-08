#!/usr/bin/env python3
"""Turn the marks on a photographed workbook into an import link.

    python3 tools/zh_marks_link.py marks.json
    python3 tools/zh_marks_link.py --keys L06       # every markable item of a lesson, with its key

marks.json:
    {"lesson": "L06", "by": "Claude, asked by Dad",
     "marks": {"zx:L06-D2-03": {"zx:L06-D2-03-1": true, "zx:L06-D2-03-2": false},
               "zb:L06-D2":    {"zc:L06-01": {"ok": true, "pick": "B"}, "zc:L06-02": {"ok": false, "pick": "A"}}},
     "review": { ... optional: a Chinese review in docs/review.md's shape, for the free writing ... }}

`marks` names exercises and four-choice blocks of the lesson's own file
(content/chinese/exercises/<lesson>.json) and, under each, the items she did on
the pages photographed: true or false, and for a block item the letter she chose.
Items she did not do are left out, not marked wrong. Every id is checked against
the file, and each mark against the key there, so a mark that contradicts a pick
the key settles is caught here rather than on her page.

Prints https://learning.sheilazhang.org/#/import/<payload>. Opened on her
signed-in device, the link previews each exercise's score and, on Add, puts the
marks in her record (site/src/lib/zhwork.js).
"""
import base64, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://learning.sheilazhang.org/"
ZH = ROOT / "content" / "chinese"


def lesson_items(lesson):
    """{exercise or block id: {item id: key}} for the lesson — None as the key of an item marked by eye (write, free)."""
    ex = json.loads((ZH / "exercises" / f"{lesson}.json").read_text())
    bank = {}
    for f in ("zh-word.json", "zh-char.json"):
        for it in json.loads((ZH / "question-banks" / f).read_text())["items"]:
            bank[it["id"]] = it["correct"]
    out = {}
    for b in ex.get("blocks", []):
        out[b["id"]] = {i: bank.get(i) for i in b["items"]}
    for e in ex.get("exercises", []):
        items = list(e.get("items", [])) + list((e.get("fills") or {}).get("items", []))
        out[e["id"]] = {it["id"]: it.get("key") if e["type"] not in ("write", "free") else None for it in items}
    return out, ex


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--keys":
        items, ex = lesson_items(sys.argv[2])
        for e in ex.get("blocks", []) + ex.get("exercises", []):
            print(f"{e['id']}  {e.get('day')} p.{e.get('page')} ex {e.get('ex')} {e.get('type', 'block')}  {e.get('title')}")
            for i, k in items[e["id"]].items():
                print(f"    {i}  key {json.dumps(k, ensure_ascii=False)}")
        return
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    r = json.loads(Path(sys.argv[1]).read_text())
    lesson = r.get("lesson")
    if not (ZH / "exercises" / f"{lesson}.json").exists():
        sys.exit(f"no exercises file for lesson {lesson!r}")
    items, _ = lesson_items(lesson)
    n = 0
    for xid, marks in (r.get("marks") or {}).items():
        if xid not in items:
            sys.exit(f"{xid} is not an exercise or block of {lesson}")
        for iid, m in marks.items():
            if iid not in items[xid]:
                sys.exit(f"{iid} is not in {xid}")
            ok = m if isinstance(m, bool) else (m.get("ok") if isinstance(m, dict) else None)
            if not isinstance(ok, bool):
                sys.exit(f"{iid}: the mark must be true or false (or {{ok, pick}})")
            pick = m.get("pick") if isinstance(m, dict) else None
            if pick is not None and pick not in list("ABCD"):
                sys.exit(f"{iid}: pick must be a letter A–D")
            key = items[xid][iid]
            if xid.startswith("zb:") and pick is not None and (pick == key) != ok:
                sys.exit(f"{iid}: marked {'right' if ok else 'wrong'} but she chose {pick} and the key is {key}")
            n += 1
    if not n and not r.get("review"):
        sys.exit("nothing is marked")
    payload = {"zhwork": {k: r[k] for k in ("lesson", "by", "marks", "review") if k in r}}
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()
    print(f"{n} items marked", file=sys.stderr)
    print(SITE + "#/import/" + base64.urlsafe_b64encode(raw).decode().rstrip("="))


if __name__ == "__main__":
    main()
