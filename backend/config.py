# Audio configuration
SAMPLE_RATE = 16000  #16KHz
CHANNELS = 1

# Analysis configuration
CHUNK_DURATION = 3  # 3 sec window
CHUNK_OVERLAP = 1

# Initial prototype threshold
SPOOF_THRESHOLD = 0.75  #

# Temporal detection
REQUIRED_SPOOF_CHUNKS = 3   #abnormal window not to immediately trigger the strongest alert


#this file consists of the audio preproccessing before the wav2vec can see the audio the functions that are done is 
#1) load audio input.wav  input.wav ->librosa->mono->16KHz
#2) remove silence from the audio
#3) normalize audio between -1 and 1
#4) chunking the audio into 3 second chunks with 1 second overlap





# ---------------------------------------------------------------------------
# AASIST3 scoring (used by backend/inference/asist_detector.py)
# ---------------------------------------------------------------------------
WINDOW_SAMPLES = 64600          # what AASIST3 was trained on (~4.04 s @ 16 kHz)
MIN_AUDIO_SECONDS = 1.0         # shorter clips are rejected; anything longer is tiled to fit

# Score = logit_diff = logit[spoof] - logit[bonafide]   (class 0 = spoof, 1 = bonafide)
# probability = sigmoid((logit_diff - LOGIT_BIAS) / LOGIT_TEMPERATURE)
# LOGIT_BIAS moves the decision boundary. Derive it from YOUR data with
# experiments/calibrate_threshold.py instead of guessing.
LOGIT_TEMPERATURE = 6.0
LOGIT_BIAS = 0.0

# Windows quieter than this (RMS, waveform in [-1, 1]) are treated as non-speech and
# excluded from the average instead of being counted as "0.0 spoof".
VAD_RMS_THRESHOLD = 0.005

# Live streaming
LIVE_HOP_SECONDS = 1.0          # a new 4 s window is scored every hop
LIVE_ROLLING_WINDOWS = 5        # verdict = median of the last N speech windows
