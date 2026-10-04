#!/usr/bin/env python3
"""Turn a review JSON file into what the site and Drive need.

    python3 tools/review_link.py review.json            # prints the import link
    python3 tools/review_link.py review.json --doc      # prints the Google-Doc text instead

A review is feedback on one essay, or on a whole plan week or month; a week or
month review can also carry follow-up actions for named weeks. The format is
docs/review.md. This checks it against content/essay.json (week ids, rubric
dimensions) so a typo cannot reach her, then base64url-encodes it into
https://learning.sheilazhang.org/#/import/<payload>.
"""
import base64, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://learning.sheilazhang.org/"


def load_content():
    essay = json.loads((ROOT / "content" / "essay.json").read_text())
    mocks = json.loads((ROOT / "content" / "mock_essays.json").read_text()) if (ROOT / "content" / "mock_essays.json").exists() else {}
    weeks = set(essay["weeks"].keys())
    dims = [d["name"] for d in essay["rubric"]["dimensions"]]
    forms = set()
    for k, v in (mocks.items() if isinstance(mocks, dict) else []):
        if isinstance(v, dict) and "id" in v: forms.add(v["id"])
        elif isinstance(v, list): forms.update(x.get("id") for x in v if isinstance(x, dict))
    forms |= {"DGN", "M01", "M02", "M03"}
    # A Chinese review targets one homework note by date, and may speak to the
    # exercise items the site cannot mark by rule (docs/review.md, docs/chinese.md § 8).
    zh_sets, zh_items = set(), {"read", "tell"}
    hw = ROOT / "content" / "chinese" / "homework"
    if hw.is_dir():
        for f in sorted(hw.glob("*.json")):
            n = json.loads(f.read_text()); zh_sets.add(n.get("set"))
    for f in sorted((ROOT / "content" / "chinese" / "lessons").glob("*.json")) if (ROOT / "content" / "chinese" / "lessons").exists() else []:
        zh_sets.add(json.loads(f.read_text()).get("id"))   # a lesson practised without a note is reviewed under its id
    exd = ROOT / "content" / "chinese" / "exercises"
    if exd.is_dir():
        for f in sorted(exd.glob("*.json")):
            for ex in json.loads(f.read_text()).get("exercises", []):
                zh_items.add(ex.get("id"))
                for it in ex.get("items", []) + (ex.get("fills") or {}).get("items", []): zh_items.add(it.get("id"))
    return weeks, dims, forms, zh_sets, zh_items


def check(r):
    weeks, dims, forms, zh_sets, zh_items = load_content()
    errs = []
    t = r.get("target") or {}
    kind = t.get("kind")
    if kind == "zh":
        if t.get("set") not in zh_sets: errs.append(f"target.set must be the date of a homework note, or a lesson id: {sorted(zh_sets)}")
        items = r.get("items", [])
        if not isinstance(items, list): errs.append("items must be a list of {id, ok, note}")
        elif len(items) > 20: errs.append("at most twenty item notes")
        else:
            for i, it in enumerate(items):
                if not isinstance(it, dict): errs.append(f"items[{i}] must be an object"); continue
                if it.get("id") not in zh_items: errs.append(f"items[{i}].id {it.get('id')!r} is not an exercise item, 'read' or 'tell'")
                if it.get("ok") not in (True, False, None): errs.append(f"items[{i}].ok must be true, false or null")
                if not str(it.get("note", "")).strip(): errs.append(f"items[{i}] needs a note to Sheila")
                for k in ("passage", "heard"):
                    if k in it and (not isinstance(it[k], str) or not it[k].strip() or len(it[k]) > 600): errs.append(f"items[{i}].{k} must be a non-blank string of at most 600 characters")
                if "heard" in it and "passage" not in it: errs.append(f"items[{i}]: heard without passage — the site has no text to compare it against")
        if r.get("rubric"): errs.append("a Chinese review has no rubric")
    elif kind in ("essay", "week"):
        if t.get("wk") not in weeks: errs.append(f"target.wk must be one of {sorted(weeks)}")
    elif kind == "mock":
        if t.get("form") not in forms: errs.append(f"target.form must be one of {sorted(forms)}")
    elif kind == "month":
        if not re.fullmatch(r"\d{4}-\d{2}", str(t.get("m", ""))): errs.append("target.m must be YYYY-MM")
    else:
        errs.append("target.kind must be 'essay'/'week' (with wk), 'mock' (with form), 'month' (with m) or 'zh' (with set)")
    if not str(r.get("summary", "")).strip(): errs.append("summary is required")
    if not str(r.get("reviewer", "")).strip(): errs.append("reviewer is required, e.g. 'Claude, asked by Dad'")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T[\d:.]+Z?", str(r.get("at", ""))): errs.append("at must be an ISO timestamp, e.g. 2026-09-05T18:00:00Z")
    for k in ("strengths", "suggestions"):
        if not isinstance(r.get(k, []), list): errs.append(f"{k} must be a list of sentences")
    if len(r.get("suggestions", [])) > 3: errs.append("at most three suggestions — she is ten")
    if not r.get("strengths"): errs.append("name at least one strength before any suggestion")
    acts = r.get("actions", [])
    if not isinstance(acts, list): errs.append("actions must be a list")
    elif len(acts) > 8: errs.append("at most eight follow-up actions")
    else:
        for i, a in enumerate(acts):
            if not isinstance(a, dict) or not str(a.get("text", "")).strip():
                errs.append(f"actions[{i}] needs a text"); continue
            wk = a.get("wk") or (t.get("wk") if kind == "week" else None)
            if wk not in weeks: errs.append(f"actions[{i}].wk must be one of {sorted(weeks)}")
    if kind in ("week", "month") and r.get("rubric"): errs.append("a week or month review has no rubric; rate dimensions on an essay review")
    for k, v in (r.get("rubric") or {}).items():
        if k not in dims: errs.append(f"rubric '{k}' is not a dimension; use {dims}")
        elif not (isinstance(v, int) and 1 <= v <= 4): errs.append(f"rubric '{k}' must be 1–4")
    return errs


def link(r):
    raw = json.dumps(r, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return SITE + "#/import/" + base64.urlsafe_b64encode(raw).decode().rstrip("=")


def doc(r):
    t = r["target"]
    what = {"essay": lambda: f"Essay {t['wk']}", "week": lambda: f"week {t['wk']}",
            "month": lambda: f"month {t['m']}", "mock": lambda: f"Mock {t.get('form')} essay",
            "zh": lambda: f"Chinese homework of {t.get('set')}"}[t["kind"]]()
    lines = [f"Review of Sheila's {what}", f"By {r['reviewer']} · {r['at'][:10]}"]
    if r.get("source"): lines.append(f"Read from {r['source']}")
    lines += ["", r["summary"], ""]
    if r.get("strengths"): lines += ["What worked"] + [f"• {s}" for s in r["strengths"]] + [""]
    if r.get("suggestions"): lines += ["Try this"] + [f"{i + 1}. {s}" for i, s in enumerate(r["suggestions"])] + [""]
    if r.get("next"): lines += [f"For next week: {r['next']}", ""]
    if r.get("rubric"): lines += ["Rubric (1–4)"] + [f"• {k}: {v}" for k, v in r["rubric"].items()] + [""]
    if r.get("actions"):
        lines += ["On the checklist"] + [f"• [{a.get('wk') or t.get('wk')}] {a['text']}" for a in r["actions"]] + [""]
    lines += ["Open it on the site: " + link(r)]
    return "\n".join(lines)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    r = json.loads(Path(sys.argv[1]).read_text())
    errs = check(r)
    if errs:
        sys.exit("review.json is not right yet:\n  - " + "\n  - ".join(errs))
    print(doc(r) if "--doc" in sys.argv else link(r))
