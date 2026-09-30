import os

import numpy as np
import librosa

from backend.config import (
    SAMPLE_RATE,
    CHUNK_DURATION,
    CHUNK_OVERLAP,
)


SUPPORTED_AUDIO_FORMATS = {
    ".wav",
    ".mp3",
    ".flac",
    ".ogg",
    ".m4a",
}


def validate_audio_file(file_path: str) -> None:
    """
    Validate that the supplied audio format is supported.
    """

    extension = os.path.splitext(file_path)[1].lower()

    if extension not in SUPPORTED_AUDIO_FORMATS:
        supported = ", ".join(sorted(SUPPORTED_AUDIO_FORMATS))

        raise ValueError(
            f"Unsupported audio format: {extension}. "
            f"Supported formats: {supported}"
        )


def load_audio(file_path: str) -> np.ndarray:
    """
    Load an audio file and convert it into the format
    required by the AI pipeline.

    Supported examples:
        WAV
        MP3
        FLAC
        OGG
        M4A

    Output:
        Mono waveform at 16 kHz.
    """

    validate_audio_file(file_path)

    audio, _ = librosa.load(
        file_path,
        sr=SAMPLE_RATE,
        mono=True,
    )

    return audio.astype(np.float32)


def resample_audio(audio: np.ndarray, orig_sr: int, target_sr: int = SAMPLE_RATE) -> np.ndarray:
    """
    Explicitly upsample or downsample audio array from orig_sr to target_sr (default: 16000 Hz).
    """
    if len(audio) == 0 or orig_sr == target_sr:
        return audio.astype(np.float32)

    resampled = librosa.resample(
        y=audio.astype(np.float32),
        orig_sr=orig_sr,
        target_sr=target_sr
    )

    return resampled.astype(np.float32)


def normalize_audio(audio: np.ndarray) -> np.ndarray:
    """
    Normalize waveform amplitude.
    """
    if len(audio) == 0:
        return audio

    max_amplitude = np.max(np.abs(audio))

    if max_amplitude == 0:
        return audio

    return audio / max_amplitude


def remove_silence(audio: np.ndarray) -> np.ndarray:
    """
    Remove leading and trailing silence.
    """
    if len(audio) == 0:
        return audio

    trimmed_audio, _ = librosa.effects.trim(
        audio,
        top_db=30,
    )

    return trimmed_audio


def preprocess_audio(file_path: str) -> np.ndarray:
    """
    Complete audio preprocessing pipeline.

    File
      ↓
    Format validation
      ↓
    Decode WAV/MP3/etc. & resample to 16 kHz Mono NumPy Float32 array on disk reading
      ↓
    Silence trimming
      ↓
    Normalization
      ↓
    AI-ready waveform
    """

    audio = load_audio(file_path)

    audio = remove_silence(audio)

    audio = normalize_audio(audio)

    return audio, SAMPLE_RATE


def create_chunks(audio: np.ndarray) -> list[np.ndarray]:
    """
    Split audio into overlapping chunks.

    Default:
        Chunk duration = 3 seconds
        Overlap = 1 second
    """

    chunk_size = int(CHUNK_DURATION * SAMPLE_RATE)
    overlap_size = int(CHUNK_OVERLAP * SAMPLE_RATE)

    step_size = chunk_size - overlap_size

    chunks = []

    if len(audio) == 0:
        return chunks

    if len(audio) <= chunk_size:
        chunks.append(audio)
        return chunks

    for start in range(0, len(audio) - chunk_size + 1, step_size):

        end = start + chunk_size

        chunk = audio[start:end]

        chunks.append(chunk)

    remaining_start = len(audio) - chunk_size

    if remaining_start > 0:

        last_chunk = audio[remaining_start:]

        if not np.array_equal(last_chunk, chunks[-1]):
            chunks.append(last_chunk)

    return chunks