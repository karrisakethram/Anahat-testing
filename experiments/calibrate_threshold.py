"""
Calibrate the AASIST3 decision boundary on YOUR data.

    python experiments/calibrate_threshold.py --real data/eval/real --fake data/eval/fake

Put ~30+ files per class in the two folders, recorded/encoded the way the product will see
them (same mic, same MP3/Opus/phone codec). Use several TTS / voice-clone engines in fake/.
The script prints per-file scores, AUC, EER and the LOGIT_BIAS to put in backend/config.py.
"""
import argparse
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.preprocessing.audio import preprocess_audio          # noqa: E402
from backend.inference.asist_detector import detector             # noqa: E402

EXT = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}


def score_folder(folder):
    out = []
    for f in sorted(Path(folder).rglob("*")):
        if f.suffix.lower() not in EXT:
            continue
        try:
            audio, sr = preprocess_audio(str(f))
            r = detector.predict(audio, sample_rate=sr)
            if r["logit_diff"] is None:
                print(f"  skip (no speech): {f.name}")
                continue
            out.append((f.name, r["logit_diff"]))
        except Exception as e:
            print(f"  skip {f.name}: {e}")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--real", required=True)
    ap.add_argument("--fake", required=True)
    a = ap.parse_args()

    real = score_folder(a.real)
    fake = score_folder(a.fake)
    r = np.array([s for _, s in real])
    f = np.array([s for _, s in fake])

    print("\n--- per-file logit_diff (higher = more spoof-like) ---")
    for n, s in real:
        print(f"REAL  {s:8.2f}  {n}")
    for n, s in fake:
        print(f"FAKE  {s:8.2f}  {n}")

    print(f"\nreal: mean={r.mean():.2f} median={np.median(r):.2f} | fake: mean={f.mean():.2f} median={np.median(f):.2f}")
    if r.mean() > f.mean():
        print("!! Real scores HIGHER than fake -> class order is inverted for your data "
              "(or the input pipeline is wrong). Do not just shift the bias; investigate.")

    # AUC (prob. a random fake scores above a random real)
    auc = np.mean([(x > y) + 0.5 * (x == y) for x in f for y in r])
    ths = np.unique(np.concatenate([r, f]))
    best = None
    for t in ths:
        fpr = np.mean(r >= t)   # real flagged as spoof
        fnr = np.mean(f < t)    # fake missed
        gap = abs(fpr - fnr)
        if best is None or gap < best[0]:
            best = (gap, t, fpr, fnr)
    _, t, fpr, fnr = best
    print(f"\nAUC = {auc:.3f}   (0.5 = coin flip, >0.9 = usable)")
    print(f"EER threshold on logit_diff = {t:.2f}  (FPR {fpr:.1%}, FNR {fnr:.1%})")
    print(f"At the current bias (0.0): FPR {np.mean(r >= 0):.1%}, FNR {np.mean(f < 0):.1%}")
    print(f"\n=> set LOGIT_BIAS = {t:.2f} in backend/config.py")


if __name__ == "__main__":
    main()
