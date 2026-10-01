from collections import deque
import json
import os
import tempfile
import numpy as np

from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.preprocessing.audio import preprocess_audio
from backend.inference.asist_detector import detector, LiveAudioBuffer, diff_to_probability
from backend.risk.risk_engine import calculate_risk
from backend.config import LIVE_HOP_SECONDS, LIVE_ROLLING_WINDOWS, REQUIRED_SPOOF_CHUNKS


app = FastAPI(
    title="Anahat API",
    description="AI-powered voice cloning and spoof detection system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "system": "Anahat",
        "status": "online",
        "message": "Voice spoof detection system is running."
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "detector": "loaded"
    }


@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    # Check that a file was provided
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No audio file provided."
        )

    # Supported formats
    supported_formats = {
        ".wav",
        ".mp3",
        ".flac",
        ".ogg",
        ".m4a"
    }

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in supported_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {extension}"
        )

    temp_path = None

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp_file:

            content = await file.read()

            if not content:
                raise HTTPException(
                    status_code=400,
                    detail="Uploaded audio file is empty."
                )

            temp_file.write(content)
            temp_path = temp_file.name

        # 1. AUDIO PREPROCESSING
        audio = preprocess_audio(temp_path)

        # 2. AI VOICE DETECTION
        detection = detector.predict(audio)

        # 3. RISK ASSESSMENT
        risk = calculate_risk(
            detection["spoof_probability"]
        )

        # 4. FINAL RESPONSE
        return {
            "filename": file.filename,
            "prediction": detection["prediction"],
            "spoof_probability": detection["spoof_probability"],
            "real_probability": detection["real_probability"],
            "risk_level": risk["risk_level"],
            "recommendation": risk["recommendation"],
            "windows_analyzed": detection["windows_analyzed"]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Audio analysis failed: {str(e)}"
        )

    finally:
        # Remove temporary file
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@app.websocket("/ws/live")
async def websocket_live_detection(websocket: WebSocket):
    await websocket.accept()

    client_sample_rate = 16000
    frame_index = 0

    # One buffer per connection (a module-level buffer is shared between clients).
    live_buffer = LiveAudioBuffer(detector)
    recent_diffs = deque(maxlen=LIVE_ROLLING_WINDOWS)  # logit diffs of speech windows
    consecutive_spoof = 0

    try:
        while True:
            message = await websocket.receive()

            if message.get("type") == "websocket.disconnect":
                break

            if message.get("text"):
                try:
                    cfg = json.loads(message["text"])
                    if cfg.get("sample_rate"):
                        client_sample_rate = int(cfg["sample_rate"])
                except Exception:
                    pass

            elif message.get("bytes"):
                chunk = np.frombuffer(message["bytes"], dtype=np.float32)
                if len(chunk) == 0:
                    continue

                for prediction in live_buffer.add_audio(chunk, sample_rate=client_sample_rate):
                    frame_index += 1
                    instant_prob = float(prediction["spoof_probability"])

                    if prediction["is_speech"]:
                        recent_diffs.append(prediction["logit_diff"])
                        consecutive_spoof = (
                            consecutive_spoof + 1 if instant_prob >= 0.5 else 0
                        )

                    # Rolling verdict = median of the last N speech windows.
                    if recent_diffs:
                        rolling_prob = diff_to_probability(float(np.median(recent_diffs)))
                    else:
                        rolling_prob = 0.0

                    # Do not raise the top alert on a single/short run of spoof windows.
                    if consecutive_spoof < REQUIRED_SPOOF_CHUNKS:
                        rolling_prob = min(rolling_prob, 0.8499)

                    risk = calculate_risk(rolling_prob)

                    start_sec = int((frame_index - 1) * LIVE_HOP_SECONDS)
                    end_sec = start_sec + 4
                    timestamp_label = (
                        f"{start_sec // 60:02d}:{start_sec % 60:02d} - "
                        f"{end_sec // 60:02d}:{end_sec % 60:02d}"
                    )

                    await websocket.send_json({
                        "status": "success",
                        "frame_index": frame_index,
                        "timestamp_label": timestamp_label,
                        "is_speech": prediction["is_speech"],
                        "instant_spoof_probability": round(instant_prob, 4),
                        "instant_real_probability": round(1.0 - instant_prob, 4),
                        "spoof_probability": round(rolling_prob, 4),
                        "real_probability": round(1.0 - rolling_prob, 4),
                        "prediction": "SPOOF" if rolling_prob >= 0.5 else "REAL",
                        "risk_level": risk["risk_level"],
                        "recommendation": risk["recommendation"],
                        "sample_rate_hz": 16000,
                        "format": "FLOAT32_PCM",
                        "windows_analyzed": frame_index,
                    })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        import traceback
        print("\n========== LIVE WEBSOCKET ERROR ==========")
        print(str(e))
        traceback.print_exc()
        print("==========================================\n")
        try:
            await websocket.send_json({"status": "error", "message": str(e)})
        except Exception:
            pass
        try:
            await websocket.close()
        except Exception:
            pass
