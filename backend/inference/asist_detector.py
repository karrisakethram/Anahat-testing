import sys
from pathlib import Path

import numpy as np
import torch
import torchaudio

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from AASIST3.model import aasist3

from backend.config import (
    SAMPLE_RATE,
    WINDOW_SAMPLES,
    MIN_AUDIO_SECONDS,
    LOGIT_TEMPERATURE,
    LOGIT_BIAS,
    VAD_RMS_THRESHOLD,
    LIVE_HOP_SECONDS,
)

MODEL_NAME = "MTUCI/AASIST3"
WINDOW_SIZE = WINDOW_SAMPLES
STEP_SIZE = 3 * SAMPLE_RATE  # file analysis: 3 s hop (~1 s overlap)


def diff_to_probability(logit_diff: float) -> float:
    """Map (logit_spoof - logit_bonafide) to a spoof probability."""
    z = (logit_diff - LOGIT_BIAS) / LOGIT_TEMPERATURE
    return float(1.0 / (1.0 + np.exp(-z)))


def tile_to_length(audio: np.ndarray, length: int = WINDOW_SIZE) -> np.ndarray:
    """Repeat-pad / truncate to `length`. This is exactly what AASIST3 saw in training
    (apply_random_segment_extraction); zero-padding is out-of-distribution."""
    audio = np.asarray(audio, dtype=np.float32)
    if len(audio) >= length:
        return audio[:length]
    reps = length // len(audio) + 1
    return np.tile(audio, reps)[:length]


class VoiceSpoofDetector:

    def __init__(self):
        print("Loading AASIST3 voice detector...")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = aasist3.from_pretrained(MODEL_NAME).to(self.device)
        self.model.eval()
        self._resamplers = {}
        print(f"Device: {self.device}")
        print("Model loaded successfully.")

    # ------------------------------------------------------------------ utils
    def _prepare_audio(self, audio, sample_rate):
        if audio is None or len(audio) == 0:
            raise ValueError("Audio is empty.")

        audio = np.asarray(audio, dtype=np.float32)
        if audio.ndim > 1:
            audio = np.mean(audio, axis=0)

        if sample_rate != SAMPLE_RATE:
            if sample_rate not in self._resamplers:
                self._resamplers[sample_rate] = torchaudio.transforms.Resample(
                    orig_freq=sample_rate, new_freq=SAMPLE_RATE
                )
            with torch.no_grad():
                audio = self._resamplers[sample_rate](
                    torch.from_numpy(audio).unsqueeze(0)
                ).squeeze(0).numpy()

        return audio.astype(np.float32)

    # -------------------------------------------------------------- inference
    def _predict_window(self, audio):
        """Score ONE window of 16 kHz mono audio (any length; tiled to 64600)."""
        window = tile_to_length(audio)

        rms = float(np.sqrt(np.mean(window ** 2)))
        if rms < VAD_RMS_THRESHOLD:
            return {
                "prediction": "REAL",
                "spoof_probability": 0.0,
                "real_probability": 1.0,
                "logit_diff": None,
                "is_speech": False,
            }

        # No RMS scaling / clipping: the model peak-normalises internally, and scaling a
        # quiet signal up to RMS 0.1 then clipping at +-1 injects distortion.
        waveform = torch.from_numpy(window).unsqueeze(0).to(self.device)
        waveform = torchaudio.functional.preemphasis(waveform)  # same as training

        with torch.no_grad():
            output = self.model(waveform)
            if hasattr(output, "logits"):
                logits = output.logits
            elif isinstance(output, (tuple, list)):
                logits = output[0]
            else:
                logits = output

        # MTUCI/AASIST3 pretrained checkpoint: label 0 = bonafide (real), label 1 = spoof (fake).
        logit_real = logits[0, 0].item()
        logit_spoof = logits[0, 1].item()
        logit_diff = logit_spoof - logit_real

        spoof_probability = diff_to_probability(logit_diff)

        print(
            f"[AASIST3] rms={rms:.4f} logits=[{logit_spoof:.2f}, {logit_real:.2f}] "
            f"diff={logit_diff:.2f} spoof_prob={spoof_probability:.4f}"
        )

        return {
            "prediction": "SPOOF" if spoof_probability >= 0.5 else "REAL",
            "spoof_probability": round(spoof_probability, 4),
            "real_probability": round(1.0 - spoof_probability, 4),
            "logit_diff": round(logit_diff, 4),
            "is_speech": True,
        }

    def predict(self, audio, sample_rate=SAMPLE_RATE):
        audio = self._prepare_audio(audio, sample_rate)

        if len(audio) < int(MIN_AUDIO_SECONDS * SAMPLE_RATE):
            raise ValueError(f"At least {MIN_AUDIO_SECONDS:.0f} s of audio is required.")

        starts = list(range(0, max(len(audio) - WINDOW_SIZE, 0) + 1, STEP_SIZE))
        last_start = max(len(audio) - WINDOW_SIZE, 0)
        if starts[-1] != last_start:
            starts.append(last_start)  # make sure the tail is analysed

        results = []
        for index, start in enumerate(starts):
            result = self._predict_window(audio[start:start + WINDOW_SIZE])
            results.append({
                "window": index + 1,
                "start_seconds": round(start / SAMPLE_RATE, 2),
                **result,
            })

        speech = [r for r in results if r["is_speech"]]
        if not speech:
            return {
                "prediction": "REAL",
                "spoof_probability": 0.0,
                "real_probability": 1.0,
                "logit_diff": None,
                "windows_analyzed": len(results),
                "speech_windows": 0,
                "note": "No speech detected (audio below VAD threshold).",
                "windows": results,
            }

        # Aggregate in logit space with the median: robust to a single odd window,
        # unlike a mean of saturated probabilities.
        diff = float(np.median([r["logit_diff"] for r in speech]))
        spoof = diff_to_probability(diff)

        return {
            "prediction": "SPOOF" if spoof >= 0.5 else "REAL",
            "spoof_probability": round(spoof, 4),
            "real_probability": round(1.0 - spoof, 4),
            "logit_diff": round(diff, 4),
            "windows_analyzed": len(results),
            "speech_windows": len(speech),
            "spoof_window_ratio": round(
                sum(r["prediction"] == "SPOOF" for r in speech) / len(speech), 3
            ),
            "windows": results,
        }


class LiveAudioBuffer:
    """One instance PER websocket connection.

    Audio is buffered at the client's native rate and each 4 s window is resampled
    as a whole. (Resampling every 100 ms chunk separately creates discontinuities
    at chunk borders that look like synthesis artefacts to the model.)"""

    def __init__(self, detector):
        self.detector = detector
        self.sample_rate = SAMPLE_RATE
        self.buffer = np.array([], dtype=np.float32)

    def reset(self):
        self.buffer = np.array([], dtype=np.float32)

    def add_audio(self, audio, sample_rate=SAMPLE_RATE):
        if audio is None or len(audio) == 0:
            return []

        if sample_rate != self.sample_rate:
            self.reset()
            self.sample_rate = sample_rate

        self.buffer = np.concatenate([self.buffer, np.asarray(audio, dtype=np.float32)])

        win = int(round(WINDOW_SIZE * self.sample_rate / SAMPLE_RATE))
        hop = int(round(LIVE_HOP_SECONDS * self.sample_rate))

        # If inference is slower than real time, drop the backlog instead of lagging.
        if len(self.buffer) > win + 5 * hop:
            self.buffer = self.buffer[-(win + hop):]

        predictions = []
        while len(self.buffer) >= win:
            window = self.detector._prepare_audio(self.buffer[:win], self.sample_rate)
            predictions.append(self.detector._predict_window(window))
            self.buffer = self.buffer[hop:]

        return predictions


detector = VoiceSpoofDetector()
live_buffer = LiveAudioBuffer(detector)  # kept for backwards compatibility
