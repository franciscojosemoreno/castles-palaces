#!/usr/bin/env python3
"""
Apply GYG currency fixes from gyg-fixes.json to the castle data files.

Usage: python3 gyg-apply-fixes.py [path-to-gyg-fixes.json]

Reads the JSON file produced by the browser audit script (gyg-browser-audit.js),
applies price_from patches to each affected castle file, and reports what changed.
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

FIXES_FILE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("gyg-fixes.json")

if not FIXES_FILE.exists():
    print(f"ERROR: {FIXES_FILE} not found.")
    print("Run the browser audit first (gyg-browser-audit.js from Chrome DevTools on getyourguide.com).")
    sys.exit(1)

report = json.loads(FIXES_FILE.read_text())
fixes  = report.get("fixes", [])

print(f"Loaded {len(fixes)} fixes from {FIXES_FILE}")
print(f"Browser audit summary: {json.dumps(report.get('summary', {}), indent=2)}\n")

# Group fixes by file for efficient patching
file_patches = defaultdict(list)
for fix in fixes:
    file_patches[fix["file"]].append(fix)

applied = 0
errors  = []

for filepath, patches in file_patches.items():
    fpath = Path(filepath)
    if not fpath.exists():
        errors.append(f"FILE NOT FOUND: {filepath}")
        continue

    data = json.loads(fpath.read_text())
    price_curr = data.get("price_currency", "")
    changed = False

    for patch in patches:
        tid      = str(patch["tour_id"])
        old_p    = patch["old_price"]
        new_p    = patch["new_price"]

        for tour in data.get("gyg_featured_tours", []):
            if str(tour.get("tour_id", "")) == tid:
                current = tour.get("price_from")
                if current is not None and abs(float(current) - old_p) / max(float(current), old_p) < 0.03:
                    tour["price_from"] = new_p
                    changed = True
                    applied += 1
                    print(f"  FIXED: {patch['castle']} t{tid}: {old_p} → {new_p} EUR")
                else:
                    print(f"  SKIP:  {patch['castle']} t{tid}: stored={current} (expected {old_p}) — already changed?")
                break

        # Also fix price_adult if it's EUR-priced and has the same wrong value
        if price_curr == "EUR":
            pa = data.get("price_adult")
            if pa is not None:
                fpa = float(pa)
                if abs(fpa - old_p) / max(fpa, old_p) < 0.03:
                    data["price_adult"] = new_p
                    changed = True
                    print(f"    → also fixed price_adult: {old_p} → {new_p}")

    if changed:
        fpath.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

print(f"\n=== COMPLETE ===")
print(f"  Fixes applied: {applied}")
print(f"  Files changed: {len(file_patches)}")
if errors:
    print(f"  ERRORS ({len(errors)}):")
    for e in errors:
        print(f"    {e}")

if report.get("manual_review"):
    print(f"\nManual review items ({len(report['manual_review'])}):")
    for item in report["manual_review"]:
        print(f"  [{item.get('castle', '?')}] t{item['tour_id']}: stored={item['stored']}, GYG EUR={item['gyg_eur']} ({item.get('note','')})")
