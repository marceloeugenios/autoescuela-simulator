#!/usr/bin/env python3
"""
Generate an MP3 audio study file from questions.json.

By default includes only text-only questions (~149).
Use --all to include image questions too (image context is lost in audio).

Resumes automatically from where it left off if interrupted.

Usage:
    pip install edge-tts
    python3 scraping/generate_audio.py
    python3 scraping/generate_audio.py --all
    python3 scraping/generate_audio.py --pause 10 --output gym.mp3
"""

import json
import asyncio
import subprocess
import argparse
import time
from pathlib import Path

import edge_tts

VOICE = "es-ES-AlvaroNeural"
THINK_PAUSE = 8   # seconds to think after question is read
GAP_PAUSE = 2     # seconds between questions
PARTS_DIR = Path(__file__).parent.parent / "audio_parts"


async def tts(text: str, path: Path, voice: str, retries: int = 5) -> None:
    for attempt in range(retries):
        try:
            await edge_tts.Communicate(text, voice=voice).save(str(path))
            return
        except Exception as e:
            if attempt == retries - 1:
                raise
            wait = 2 ** attempt
            print(f"\n  ⚠ TTS error ({e}), retrying in {wait}s...", flush=True)
            await asyncio.sleep(wait)


def make_silence(seconds: float, path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", f"anullsrc=r=24000:cl=mono",
            "-t", str(seconds),
            "-acodec", "libmp3lame", "-q:a", "4",
            str(path),
        ],
        check=True,
        capture_output=True,
    )


async def main() -> None:
    parser = argparse.ArgumentParser(description="Generate audio study MP3 from questions.json")
    parser.add_argument("--all", action="store_true", help="Include image questions (image context is lost)")
    parser.add_argument("--voice", default=VOICE, help=f"Edge TTS voice (default: {VOICE})")
    parser.add_argument("--pause", type=int, default=THINK_PAUSE, help=f"Thinking pause in seconds (default: {THINK_PAUSE})")
    parser.add_argument("--output", default="study_audio.mp3", help="Output MP3 file (default: study_audio.mp3)")
    args = parser.parse_args()

    src = Path(__file__).parent.parent / "public" / "questions" / "questions.json"
    questions = json.loads(src.read_text())

    if not args.all:
        questions = [q for q in questions if not q["image"]]
        print(f"Text-only questions: {len(questions)} (use --all to include image questions)")
    else:
        print(f"All questions: {len(questions)} (image questions included without visual context)")

    print(f"Voice: {args.voice} | Thinking pause: {args.pause}s | Output: {args.output}\n")

    PARTS_DIR.mkdir(exist_ok=True)

    think_sil = PARTS_DIR / f"silence_think_{args.pause}s.mp3"
    gap_sil = PARTS_DIR / f"silence_gap_{GAP_PAUSE}s.mp3"

    if not think_sil.exists():
        print("Generating silence files...")
        make_silence(args.pause, think_sil)
    if not gap_sil.exists():
        make_silence(GAP_PAUSE, gap_sil)

    parts: list[Path] = []
    skipped = 0
    letters = ["A", "B", "C", "D"]

    for i, q in enumerate(questions):
        q_file = PARTS_DIR / f"{i:04d}_q_{q['id']}_opts.mp3"
        a_file = PARTS_DIR / f"{i:04d}_a_{q['id']}_opts.mp3"

        cached = q_file.exists() and a_file.exists()
        if not cached:
            print(f"  [{i + 1}/{len(questions)}] #{q['id']}", end="\r", flush=True)

            opts = "  ".join(f"{letters[j]}: {a['text']}" for j, a in enumerate(q["answers"]))
            question_with_opts = f"{q['question']}  {opts}"

            correct_idx = next(j for j, a in enumerate(q["answers"]) if a["correct"])
            correct_letter = letters[correct_idx]
            correct_text = q["answers"][correct_idx]["text"]
            answer_text = f"La respuesta correcta es la {correct_letter}: {correct_text}. {q['explanation']}"

            await tts(question_with_opts, q_file, args.voice)
            await tts(answer_text, a_file, args.voice)
            await asyncio.sleep(0.3)  # small pause to avoid rate limiting
        else:
            skipped += 1

        parts += [q_file, think_sil, a_file, gap_sil]

    if skipped:
        print(f"\n  (skipped {skipped} already-generated questions)")

    print(f"\nMerging {len(parts)} segments into {args.output}...")

    listfile = PARTS_DIR / "list.txt"
    listfile.write_text("\n".join(f"file '{p.resolve()}'" for p in parts))

    subprocess.run(
        [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(listfile),
            "-acodec", "libmp3lame", "-q:a", "4",
            args.output,
        ],
        check=True,
    )

    print(f"Done! → {args.output}")
    print(f"\nIntermediate files kept in {PARTS_DIR}/ — delete them to regenerate from scratch.")


if __name__ == "__main__":
    asyncio.run(main())
