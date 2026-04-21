#!/usr/bin/env python3
"""
Verifies and fixes correct answers for all questions that belong to a test,
using the server's authoritative answer key (obtener_CTA_num_fallos.php).

For each test:
  1. POST to alumno_fullscreen_test_infotest.php to establish the session test context
  2. POST to obtener_CTA_num_fallos.php → returns "a#b#c#..." (one letter per question)
     where a=answer[0], b=answer[1], c=answer[2]
  3. Map positions back to questions and update questions.json

Bank questions (tests: []) are not covered by this approach and keep the heuristic result.
"""

import json
import re
import time
from pathlib import Path

import requests

BASE    = "https://matferline.com"
OUTPUT  = Path(__file__).parent.parent / "public" / "questions" / "questions.json"

HEADERS = {
    "User-Agent":         "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    "Accept":             "*/*",
    "Accept-Language":    "en-US,en;q=0.9",
    "Origin":             "https://matferline.com",
    "X-Requested-With":   "XMLHttpRequest",
    "sec-ch-ua":          '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "sec-ch-ua-mobile":   "?0",
    "sec-ch-ua-platform": '"macOS"',
}

# All 34 tests with their metadata (from discover_tests in scraper.py)
TESTS = [
    {"cditest": 76,  "name": "5031", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 77,  "name": "5031", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 78,  "name": "5032", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 79,  "name": "5032", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 80,  "name": "5033", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 81,  "name": "5033", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 82,  "name": "5034", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 83,  "name": "5034", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 84,  "name": "5035", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 85,  "name": "5035", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 86,  "name": "5036", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 87,  "name": "5036", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 88,  "name": "5037", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 89,  "name": "5037", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 217, "name": "5038", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 227, "name": "5038", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 261, "name": "5039", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 267, "name": "5039", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 273, "name": "5040", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 280, "name": "5040", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 293, "name": "5041", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 320, "name": "5041", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 341, "name": "5042", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 343, "name": "5042", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 373, "name": "5043", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 385, "name": "5043", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 594, "name": "5044", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 606, "name": "5044", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 607, "name": "5045", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 611, "name": "5045", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 627, "name": "5046", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 650, "name": "5046", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 670, "name": "5047", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
    {"cditest": 740, "name": "5047", "cdicurso": 1, "cdipermiso": 2, "cdicategoria": 3, "programa": "101"},
]

LETTER_TO_IDX = {"a": 0, "b": 1, "c": 2, "d": 3}


def login(session: requests.Session) -> bool:
    session.get(f"{BASE}/acceso/index.php",
                headers={"User-Agent": HEADERS["User-Agent"]}, timeout=20)
    r = session.post(
        f"{BASE}/acceso/php_script/validar_ae.php",
        files={"acceso": (None, "barna")},
        headers={**HEADERS, "Referer": f"{BASE}/acceso/index.php"}, timeout=20)
    if r.status_code != 200 or not r.text.strip() or r.text.strip().isdigit():
        print(f"[!] School login failed: {r.text.strip()!r}")
        return False

    r = session.post(
        f"{BASE}/alumno/php_script/validar_datos_alumno.php",
        files={"usuario": (None, "Z1246219S"), "clave": (None, "Z1246219S")},
        headers={**HEADERS, "Referer": f"{BASE}/alumno/"}, timeout=20)
    resp = r.text.strip()
    if resp.isdigit():
        print(f"[!] Student login failed: {resp!r}")
        return False
    print(f"[+] Logged in: {resp}")
    return True


def load_test(session: requests.Session, t: dict) -> list[int] | None:
    """Load a test into the session and return its question ID list."""
    r = session.post(
        f"{BASE}/alumno/alumno_fullscreen_test_infotest.php",
        files={
            "tipo_test":    (None, "0"),
            "PA":           (None, "1"),
            "IP":           (None, "1"),
            "num_cursos":   (None, ""),
            "ayuda":        (None, "1"),
            "cdicurso":     (None, str(t["cdicurso"])),
            "cdipermiso":   (None, str(t["cdipermiso"])),
            "cdicategoria": (None, str(t["cdicategoria"])),
            "cditest":      (None, str(t["cditest"])),
            "programa":     (None, str(t["programa"])),
            "modo_vtest":   (None, "2"),
            "modo_ctest":   (None, "0"),
            "test_propio":  (None, "0"),
            "idioma":       (None, ""),
            "traducir":     (None, "0"),
        },
        headers={**HEADERS, "X-Requested-With": "",
                 "Referer": f"{BASE}/alumno/alumno_menu_infotest.php"},
        timeout=20)
    r.encoding = "utf-8"
    m = re.search(r'inicializa\s*\(\s*["\']([0-9#]+)["\']', r.text)
    if not m:
        return None
    return [int(x) for x in m.group(1).split("#")]


def prefetch_questions(session: requests.Session, qids: list[int]) -> None:
    """Fetch all questions in the test so the server populates $_SESSION['CTA']."""
    for qid in qids:
        session.post(
            f"{BASE}/alumno/php_script/obtener_pregunta_fullscreen.php",
            files={"cdipregunta": (None, str(qid)), "identificacion": (None, "FV"), "tipo_test": (None, "0")},
            headers={**HEADERS, "Referer": f"{BASE}/alumno/alumno_fullscreen_test_infotest.php"},
            timeout=20)
        time.sleep(0.1)


def get_correct_answers(session: requests.Session, cdipermiso: int) -> list[int] | None:
    """
    Returns a list of correct answer indices (0-based) for the currently loaded test.
    Server returns e.g. "b#a#c#a#b#...#a*2" → split on * → split on # → map to indices.
    """
    r = session.post(
        f"{BASE}/alumno/php_script/obtener_CTA_num_fallos.php",
        files={"cdipermiso": (None, str(cdipermiso))},
        headers={**HEADERS, "Referer": f"{BASE}/alumno/alumno_fullscreen_test_infotest.php"},
        timeout=20)
    r.encoding = "utf-8"
    raw = r.text.strip()
    if not raw or raw.isdigit():
        return None
    # Format: "b#a#c#...*num_fallos"
    cta_part = raw.split("*")[0]
    letters = cta_part.split("#")
    indices = []
    for l in letters:
        l = l.strip().lower()
        if l not in LETTER_TO_IDX:
            return None
        indices.append(LETTER_TO_IDX[l])
    return indices


def main():
    questions: list[dict] = json.loads(OUTPUT.read_text(encoding="utf-8"))
    by_id = {q["id"]: q for q in questions}

    session = requests.Session()
    if not login(session):
        return

    total_fixed = 0
    total_confirmed = 0
    mismatches: list[dict] = []

    print(f"\n[*] Verifying correct answers for {len(TESTS)} tests...\n")

    for t in TESTS:
        print(f"  cditest={t['cditest']} ({t['name']}) ...", end=" ", flush=True)

        qids = load_test(session, t)
        if not qids:
            print("FAILED (could not load test)")
            time.sleep(0.5)
            continue

        # Fetch all questions so the server populates $_SESSION['CTA']
        prefetch_questions(session, qids)

        correct_indices = get_correct_answers(session, t["cdipermiso"])
        if not correct_indices:
            print("FAILED (could not get CTA)")
            time.sleep(0.5)
            continue

        if len(correct_indices) != len(qids):
            print(f"MISMATCH (qids={len(qids)} vs cta={len(correct_indices)})")
            time.sleep(0.5)
            continue

        fixed_this = 0
        for qid, correct_idx in zip(qids, correct_indices):
            q = by_id.get(qid)
            if not q:
                continue
            if correct_idx >= len(q["answers"]):
                continue  # server returned an out-of-range index

            current_correct = next((i for i, a in enumerate(q["answers"]) if a["correct"]), None)

            if current_correct == correct_idx:
                total_confirmed += 1
            else:
                mismatches.append({
                    "id": qid,
                    "cditest": t["cditest"],
                    "question": q["question"][:80],
                    "was": current_correct,
                    "correct": correct_idx,
                    "answers": [a["text"][:60] for a in q["answers"]],
                })
                # Apply fix
                for i, a in enumerate(q["answers"]):
                    a["correct"] = (i == correct_idx)
                fixed_this += 1
                total_fixed += 1

        print(f"ok | confirmed={len(qids) - fixed_this} fixed={fixed_this}")
        time.sleep(0.3)

    print(f"\n[+] Total confirmed correct: {total_confirmed}")
    print(f"[+] Total fixed: {total_fixed}")

    if mismatches:
        print(f"\n[!] Questions that were wrong (now fixed):")
        for m in mismatches:
            was_text = m["answers"][m["was"]] if m["was"] is not None else "none"
            correct_text = m["answers"][m["correct"]]
            print(f"    Q{m['id']} (cditest={m['cditest']})")
            print(f"      Q: {m['question']}")
            print(f"      WAS:   [{m['was']}] {was_text}")
            print(f"      FIXED: [{m['correct']}] {correct_text}")

    OUTPUT.write_text(json.dumps(list(by_id.values()), ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[+] Saved → {OUTPUT}")


if __name__ == "__main__":
    main()
