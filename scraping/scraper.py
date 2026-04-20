#!/usr/bin/env python3
"""
Scraper for matferline.com/alumno — downloads all questions, answers, and images.
School: Barcelona / acceso code: barna

Discovers all tests from the student menu, maps question IDs to their tests,
and stores each question with a `tests` field for exact test reconstruction.
"""

import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE      = "https://matferline.com"
ROOT      = Path(__file__).parent.parent  # repo root (one level up from scraping/)
PICTURES  = ROOT / "pictures"
QUESTIONS = ROOT / "questions"
OUTPUT    = QUESTIONS / "questions.json"
TESTS_OUT = QUESTIONS / "tests.json"

HEADERS = {
    "User-Agent":       "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    "Accept":           "*/*",
    "Accept-Language":  "en-US,en;q=0.9",
    "Origin":           "https://matferline.com",
    "X-Requested-With": "XMLHttpRequest",
    "sec-ch-ua":        '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
}


# ─── Login flow ───────────────────────────────────────────────────────────────

def login(session: requests.Session) -> bool:
    # Step 1: establish PHP session on the acceso page
    r = session.get(f"{BASE}/acceso/index.php",
                    headers={"User-Agent": HEADERS["User-Agent"]}, timeout=20)
    print(f"[1] acceso page → {r.status_code}, PHPSESSID={session.cookies.get('PHPSESSID')}, SERVERID={session.cookies.get('SERVERID')}")

    # Step 2: school login (acceso=barna → Barcelona school)
    r = session.post(
        f"{BASE}/acceso/php_script/validar_ae.php",
        files={"acceso": (None, "barna")},
        headers={**HEADERS, "Referer": f"{BASE}/acceso/index.php"},
        timeout=20,
    )
    school_name = r.text.strip()
    print(f"[2] school login → {r.status_code}, response={school_name!r}")
    if r.status_code != 200 or not school_name or school_name.isdigit():
        print("[!] School login failed")
        return False

    # Step 3: student login
    r = session.post(
        f"{BASE}/alumno/php_script/validar_datos_alumno.php",
        files={"usuario": (None, "NIE"), "clave": (None, "NIE")},
        headers={**HEADERS, "Referer": f"{BASE}/alumno/"},
        timeout=20,
    )
    resp = r.text.strip()
    print(f"[3] student login → {r.status_code}, response={resp!r}")
    # Valid response is short CSV e.g. "ok,2,101"
    if len(resp) < 30 and not resp.startswith("<!"):
        print(f"[+] Logged in! Session data: {resp}")
        return True
    print("[!] Student login returned unexpected response")
    return False


# ─── Discover tests ───────────────────────────────────────────────────────────

def discover_tests(session: requests.Session) -> list[dict]:
    """
    Load the test menu page and extract all available tests.
    Returns list of: {"cditest": int, "name": str, "cdicurso": int,
                      "cdipermiso": int, "cdicategoria": int, "programa": str}
    """
    r = session.get(
        f"{BASE}/alumno/alumno_menu_infotest.php",
        headers={**HEADERS, "X-Requested-With": "", "Referer": f"{BASE}/alumno/"},
        timeout=20,
    )
    r.encoding = "iso-8859-1"
    print(f"[4] test menu → {r.status_code}")
    if r.status_code != 200:
        return []

    soup = BeautifulSoup(r.text, "html.parser")

    # Extract test names shown in UI (LI items starting with a 4-digit number)
    test_names = [
        li.get_text().strip().split("\n")[0].strip()
        for li in soup.find_all("li")
        if re.match(r"^\d{4}", li.get_text().strip())
    ]

    # Extract cargar_test_infotest() calls from onclick handlers
    # Signature: cargar_test_infotest(tipo_test, ayuda, cdicurso, cdipermiso, cdicategoria, cditest, programa, ...)
    tests = []
    seen_cditest = set()
    name_idx = 0
    for elem in soup.find_all(True, onclick=re.compile(r"cargar_test_infotest")):
        m = re.search(r"cargar_test_infotest\s*\(([^)]+)\)", elem["onclick"])
        if not m:
            continue
        args = [a.strip().strip("'\"") for a in m.group(1).split(",")]
        if len(args) < 7:
            continue
        cditest = int(args[5])
        if cditest in seen_cditest:
            continue
        seen_cditest.add(cditest)
        name = test_names[name_idx] if name_idx < len(test_names) else str(cditest)
        name_idx += 1
        tests.append({
            "cditest":      cditest,
            "name":         name,
            "cdicurso":     int(args[2]),
            "cdipermiso":   int(args[3]),
            "cdicategoria": int(args[4]),
            "programa":     args[6],
        })

    print(f"[+] Found {len(tests)} tests: {[t['name'] for t in tests]}")
    return tests


# ─── Get question IDs for one test ───────────────────────────────────────────

def get_test_question_ids(session: requests.Session, test: dict) -> list[str]:
    """POST to the test page with test metadata to extract its question ID list."""
    r = session.post(
        f"{BASE}/alumno/alumno_fullscreen_test_infotest.php",
        files={
            "tipo_test":    (None, "0"),
            "PA":           (None, "1"),
            "IP":           (None, "1"),
            "num_cursos":   (None, ""),
            "ayuda":        (None, "1"),
            "cdicurso":     (None, str(test["cdicurso"])),
            "cdipermiso":   (None, str(test["cdipermiso"])),
            "cdicategoria": (None, str(test["cdicategoria"])),
            "cditest":      (None, str(test["cditest"])),
            "programa":     (None, str(test["programa"])),
            "modo_vtest":   (None, "2"),
            "modo_ctest":   (None, "0"),
            "test_propio":  (None, "0"),
            "idioma":       (None, ""),
            "traducir":     (None, "0"),
        },
        headers={**HEADERS, "X-Requested-With": "",
                 "Referer": f"{BASE}/alumno/alumno_menu_infotest.php"},
        timeout=20,
    )
    r.encoding = "utf-8"
    m = re.search(r'inicializa\s*\(\s*["\']([0-9#]+)["\']', r.text)
    if m:
        return m.group(1).split("#")
    return []


# ─── Parse one question response ──────────────────────────────────────────────

def parse_response(raw: str) -> dict | None:
    """
    Response format:
      image_filename###question_html##answer1##answer2##answer3##[answer4|__]##explanation\t
    """
    raw = raw.strip()
    if not raw or raw in ("error", "error_acceso_concurrente", "File not found."):
        return None

    # Split on ### to get image vs rest
    parts_main = raw.split("###", 1)
    img_filename = parts_main[0].strip()
    rest = parts_main[1] if len(parts_main) > 1 else ""

    # Split rest on ##
    fields = rest.split("##")
    if len(fields) < 2:
        return None

    question_html = fields[0].strip()
    question_text = BeautifulSoup(question_html, "html.parser").get_text(" ", strip=True)

    # Last field is explanation (correct answer hint), tab-terminated
    explanation = fields[-1].strip().rstrip("\t").strip()
    answer_fields = fields[1:-1]  # everything between question and explanation

    # Build answers — skip "__" placeholders
    answers_raw = [a.strip() for a in answer_fields if a.strip() and a.strip() != "__"]

    # Determine correct answer by matching explanation text to answers
    correct_idx = find_correct_answer(answers_raw, explanation)

    answers = []
    for i, a in enumerate(answers_raw):
        answers.append({"text": a, "correct": (i == correct_idx)})

    return {
        "img_filename": img_filename,
        "question": question_text,
        "explanation": explanation,
        "answers": answers,
    }


def find_correct_answer(answers: list[str], explanation: str) -> int | None:
    """
    The explanation restates the question with the correct answer embedded.
    Find which answer has the most overlap with the explanation text.
    """
    if not answers or not explanation:
        return None

    explanation_lower = explanation.lower()

    best_idx = None
    best_score = 0

    for i, ans in enumerate(answers):
        # Strip HTML tags from answer
        ans_text = BeautifulSoup(ans, "html.parser").get_text(" ", strip=True)
        # Remove trailing punctuation for matching
        ans_clean = re.sub(r'[.,;:!?]+$', '', ans_text).strip().lower()
        if not ans_clean:
            continue
        # Score: count how many words from the answer appear in the explanation
        words = [w for w in re.split(r'\s+', ans_clean) if len(w) > 3]
        if not words:
            # Short answer — try direct substring
            score = 1 if ans_clean in explanation_lower else 0
        else:
            score = sum(1 for w in words if w in explanation_lower) / len(words)

        if score > best_score:
            best_score = score
            best_idx = i

    return best_idx if best_score > 0.3 else None


# ─── Image downloader ─────────────────────────────────────────────────────────

def download_image(session: requests.Session, filename: str) -> str | None:
    if not filename:
        return None
    PICTURES.mkdir(exist_ok=True)
    safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    dest = PICTURES / safe_name
    if dest.exists():
        return str(dest)
    url = f"{BASE}/panel/preguntas/adjuntos/thumb1/{filename}"
    try:
        r = session.get(url, timeout=15, stream=True)
        if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
            dest.write_bytes(r.content)
            return str(dest)
        print(f"    [!] Image {filename}: {r.status_code}")
    except Exception as e:
        print(f"    [!] Image error {filename}: {e}")
    return None


# ─── Fetch one question ───────────────────────────────────────────────────────

def fetch_question(session: requests.Session, qid: str) -> dict | None:
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


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    PICTURES.mkdir(exist_ok=True)
    QUESTIONS.mkdir(exist_ok=True)
    session = requests.Session()

    if not login(session):
        print("[!] Login failed — aborting")
        return

    # Step 1: discover all tests and build question → test mapping
    tests = discover_tests(session)
    if not tests:
        print("[!] Could not load test list — aborting")
        return

    # Step 2: for each test, fetch its question ID list
    print(f"\n[*] Fetching question IDs for {len(tests)} tests...\n")
    question_tests: dict[str, list[dict]] = {}  # qid → list of test dicts
    test_question_lists: list[dict] = []         # ordered test data for reconstruction

    for t in tests:
        qids = get_test_question_ids(session, t)
        test_question_lists.append({
            "cditest":    t["cditest"],
            "name":       t["name"],
            "question_ids": [int(q) for q in qids],
        })
        for qid in qids:
            if qid not in question_tests:
                question_tests[qid] = []
            question_tests[qid].append({"cditest": t["cditest"], "name": t["name"]})
        print(f"  cditest={t['cditest']} ({t['name']}): {len(qids)} questions")
        time.sleep(0.2)

    # Save the test→question mapping for reference
    TESTS_OUT.write_text(
        json.dumps(test_question_lists, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\n[+] Saved {len(test_question_lists)} tests → {TESTS_OUT}")

    # Step 3: merge with any existing questions.json to avoid re-fetching
    existing: dict[str, dict] = {}
    if OUTPUT.exists():
        for q in json.loads(OUTPUT.read_text(encoding="utf-8")):
            existing[str(q["id"])] = q

    # Step 4: determine which question IDs to fetch
    # Priority: all test question IDs (to support exact test reconstruction)
    # Also include any already-scraped questions not in tests
    all_test_qids = list(question_tests.keys())
    extra_qids = [qid for qid in existing if qid not in question_tests]
    all_qids = all_test_qids + extra_qids

    print(f"\n[*] Total unique question IDs to fetch: {len(all_qids)}")
    print(f"    In tests: {len(all_test_qids)}, Extra (already scraped): {len(extra_qids)}\n")

    questions = []
    consecutive_fails = 0
    fetched = 0
    cached = 0

    for i, qid in enumerate(all_qids, 1):
        in_tests = qid in question_tests
        prefix = f"  [{i:04d}/{len(all_qids)}] Q{qid}"

        # Use cached version if available and only missing test assignment
        if qid in existing:
            q_record = dict(existing[qid])
            q_record["tests"] = question_tests.get(qid, [])
            questions.append(q_record)
            cached += 1
            if i % 100 == 0:
                print(f"{prefix} ... cached")
            continue

        print(f"{prefix} ...", end=" ", flush=True)
        q = fetch_question(session, qid)

        if q is None:
            consecutive_fails += 1
            print("SKIP")
            if consecutive_fails >= 15:
                print("[*] 15 consecutive failures — stopping")
                break
            time.sleep(0.1)
            continue

        consecutive_fails = 0
        fetched += 1

        img_path = download_image(session, q["img_filename"])
        correct_count = sum(1 for a in q["answers"] if a["correct"])

        questions.append({
            "id":          int(qid),
            "question":    q["question"],
            "image":       img_path,
            "explanation": q["explanation"],
            "answers":     q["answers"],
            "tests":       question_tests.get(qid, []),
        })

        print(f"ok | {len(q['answers'])} ans | correct={'?' if correct_count == 0 else correct_count} | img={'yes' if img_path else 'no'} | tests={len(question_tests.get(qid,[]))}")
        time.sleep(0.2)

    # Add `tests` field to cached records that didn't have it
    for q in questions:
        if "tests" not in q:
            q["tests"] = question_tests.get(str(q["id"]), [])

    print(f"\n[+] Total questions: {len(questions)} (fetched={fetched}, cached={cached})")
    OUTPUT.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[+] Saved → {OUTPUT}")
    print(f"[+] Tests → {TESTS_OUT}")
    print(f"[+] Images → {PICTURES}/")


if __name__ == "__main__":
    main()
