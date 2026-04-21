#!/usr/bin/env python3
"""
Re-fetches the 186 questions that have no correct answer marked and
updates questions.json in place.

Strategy: same explanation-vs-answer matching as scraper.py but with
NO threshold cutoff — always picks the best-scoring answer rather than
returning None, because any guess is better than leaving all answers wrong.
"""

import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE     = "https://matferline.com"
ROOT     = Path(__file__).parent.parent
OUTPUT   = ROOT / "public" / "questions" / "questions.json"

BROKEN_IDS = {
    9475, 9476, 9482, 9488, 9495, 9502, 9508, 9510, 9518, 9520, 9521, 9544,
    9570, 9591, 9593, 9594, 9599, 4742, 9613, 9617, 9622, 9625, 9627, 9635,
    9654, 9657, 9658, 9659, 9660, 9678, 9680, 9685, 9689, 9699, 9700, 9702,
    9704, 9706, 9720, 9721, 9722, 9724, 9733, 9741, 26875, 27122, 27123,
    27128, 27286, 27290, 27288, 28122, 28280, 28562, 28583, 28773, 28776,
    28687, 30147, 30226, 38640, 38963, 38966, 39532, 40352, 40353, 4730,
    4725, 4743, 4719, 4760, 19751, 4739, 5885, 4758, 19753, 20017, 20679,
    20687, 23618, 23619, 23727, 9759, 9779, 9781, 9788, 9789, 9801, 9802,
    9804, 9811, 9813, 9815, 9824, 9825, 9827, 9829, 9838, 9840, 9841, 9842,
    9846, 9847, 9860, 9865, 9866, 9872, 9880, 9883, 9890, 9892, 9895, 9896,
    9903, 9908, 9921, 9927, 9930, 9933, 9940, 9954, 9955, 9957, 9968, 9973,
    9979, 9980, 9981, 9984, 9988, 9996, 9999, 10006, 10009, 10013, 10027,
    10029, 10039, 10041, 10054, 10057, 10067, 10088, 10099, 10107, 10118,
    10127, 10191, 10204, 10208, 10209, 10212, 10217, 10225, 10227, 10228,
    10232, 10238, 10260, 10272, 10282, 10292, 10302, 10317, 10318, 10319,
    10321, 10351, 10358, 10363, 10368, 10394, 10400, 10423, 10427, 10428,
    10443, 10444, 10461, 10462, 10478, 10490, 10493, 10494, 10495, 10499,
}

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


def login(session: requests.Session) -> bool:
    r = session.get(f"{BASE}/acceso/index.php",
                    headers={"User-Agent": HEADERS["User-Agent"]}, timeout=20)
    print(f"[1] acceso → {r.status_code}")

    r = session.post(
        f"{BASE}/acceso/php_script/validar_ae.php",
        files={"acceso": (None, "barna")},
        headers={**HEADERS, "Referer": f"{BASE}/acceso/index.php"},
        timeout=20,
    )
    print(f"[2] school → {r.status_code}, {r.text.strip()!r}")
    if r.status_code != 200 or not r.text.strip() or r.text.strip().isdigit():
        return False

    r = session.post(
        f"{BASE}/alumno/php_script/validar_datos_alumno.php",
        files={"usuario": (None, "Z1246219S"), "clave": (None, "Z1246219S")},
        headers={**HEADERS, "Referer": f"{BASE}/alumno/"},
        timeout=20,
    )
    resp = r.text.strip()
    print(f"[3] student → {r.status_code}, {resp!r}")
    if len(resp) < 30 and not resp.startswith("<!"):
        print(f"[+] Logged in: {resp}")
        return True
    print("[!] Login failed")
    return False


def find_correct_answer_aggressive(answers: list[str], explanation: str) -> int:
    """
    Always returns an index — picks the answer with the highest word-overlap
    score against the explanation, with no threshold cutoff.
    Falls back to index 0 if nothing matches at all.
    """
    if not answers:
        return 0
    if not explanation:
        return 0

    explanation_lower = explanation.lower()
    best_idx = 0
    best_score = -1.0

    for i, ans in enumerate(answers):
        ans_text = BeautifulSoup(ans, "html.parser").get_text(" ", strip=True)
        ans_clean = re.sub(r'[.,;:!?]+$', '', ans_text).strip().lower()
        if not ans_clean:
            continue
        words = [w for w in re.split(r'\s+', ans_clean) if len(w) > 3]
        if not words:
            score = 1.0 if ans_clean in explanation_lower else 0.0
        else:
            score = sum(1 for w in words if w in explanation_lower) / len(words)
        if score > best_score:
            best_score = score
            best_idx = i

    return best_idx


def parse_response(raw: str) -> dict | None:
    raw = raw.strip()
    if not raw or raw in ("error", "error_acceso_concurrente", "File not found."):
        return None

    parts_main = raw.split("###", 1)
    rest = parts_main[1] if len(parts_main) > 1 else ""

    fields = rest.split("##")
    if len(fields) < 2:
        return None

    question_html = fields[0].strip()
    question_text = BeautifulSoup(question_html, "html.parser").get_text(" ", strip=True)
    explanation = fields[-1].strip().rstrip("\t").strip()
    answer_fields = fields[1:-1]
    answers_raw = [a.strip() for a in answer_fields if a.strip() and a.strip() != "__"]

    correct_idx = find_correct_answer_aggressive(answers_raw, explanation)

    answers = [{"text": a, "correct": (i == correct_idx)} for i, a in enumerate(answers_raw)]
    return {"question": question_text, "explanation": explanation, "answers": answers}


def fetch_question(session: requests.Session, qid: int) -> dict | None:
    r = session.post(
        f"{BASE}/alumno/php_script/obtener_pregunta_fullscreen.php",
        files={
            "cdipregunta":    (None, str(qid)),
            "identificacion": (None, "FV"),
            "tipo_test":      (None, "0"),
        },
        headers={**HEADERS,
                 "Referer": f"{BASE}/alumno/alumno_fullscreen_test_infotest.php"},
        timeout=20,
    )
    if r.status_code != 200:
        return None
    r.encoding = "utf-8"
    return parse_response(r.text)


def main():
    if not OUTPUT.exists():
        print(f"[!] {OUTPUT} not found — run scraper.py first")
        return

    questions: list[dict] = json.loads(OUTPUT.read_text(encoding="utf-8"))
    by_id = {q["id"]: q for q in questions}

    session = requests.Session()
    if not login(session):
        print("[!] Login failed")
        return

    ids = sorted(BROKEN_IDS)
    print(f"\n[*] Re-fetching {len(ids)} questions with no correct answer...\n")

    fixed = 0
    failed = 0

    for i, qid in enumerate(ids, 1):
        print(f"  [{i:03d}/{len(ids)}] Q{qid} ...", end=" ", flush=True)
        q = fetch_question(session, qid)
        if q is None:
            print("FAILED")
            failed += 1
            time.sleep(0.3)
            continue

        correct_idx = next((j for j, a in enumerate(q["answers"]) if a["correct"]), None)
        print(f"ok | correct={correct_idx} | {q['answers'][correct_idx]['text'][:60] if correct_idx is not None else '?'!r}")

        if qid in by_id:
            by_id[qid]["answers"] = q["answers"]
        else:
            print(f"    [!] Q{qid} not in existing questions.json — skipping")

        fixed += 1
        time.sleep(0.2)

    OUTPUT.write_text(json.dumps(list(by_id.values()), ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[+] Done — fixed={fixed}, failed={failed}")
    print(f"[+] Saved → {OUTPUT}")


if __name__ == "__main__":
    main()
