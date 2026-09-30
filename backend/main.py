# from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# import os
# import tempfile
# import numpy as np

# from backend.preprocessing.audio import preprocess_audio, resample_audio
# from backend.inference.detector import detector
# from backend.risk.risk_engine import calculate_risk


# app = FastAPI(
#     title="Anahat API",
#     description="AI-powered voice cloning and spoof detection system",
#     version="1.0.0"
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#         "*",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.get("/")
# def root():
#     return {
#         "system": "Anahat",
#         "status": "online",
#         "message": "Voice spoof detection system is running."
#     }


# @app.get("/health")
# def health():
#     return {
#         "status": "healthy",
#         "detector": "loaded"
#     }


# @app.post("/analyze")
# async def analyze_audio(file: UploadFile = File(...)):

#     # Check that a file was provided
#     if not file.filename:
#         raise HTTPException(
#             status_code=400,
#             detail="No audio file provided."
#         )

#     # Supported formats
#     supported_formats = {
#         ".wav",
#         ".mp3",
#         ".flac",
#         ".ogg",
#         ".m4a"
#     }

#     extension = os.path.splitext(file.filename)[1].lower()

#     if extension not in supported_formats:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Unsupported audio format: {extension}"
#         )

#     temp_path = None

#     try:

#         # Save uploaded file temporarily
#         with tempfile.NamedTemporaryFile(
#             delete=False,
#             suffix=extension
#         ) as temp_file:

#             content = await file.read()

#             if not content:
#                 raise HTTPException(
#                     status_code=400,
#                     detail="Uploaded audio file is empty."
#                 )

#             temp_file.write(content)

#             temp_path = temp_file.name

#         # -----------------------------
#         # 1. AUDIO PREPROCESSING
#         # -----------------------------

#         audio = preprocess_audio(temp_path)

#         # -----------------------------
#         # 2. AI VOICE DETECTION
#         # -----------------------------

#         detection = detector.predict(audio)

#         # -----------------------------
#         # 3. RISK ASSESSMENT
#         # -----------------------------

#         risk = calculate_risk(
#             detection["spoof_probability"]
#         )

#         # -----------------------------
#         # 4. FINAL RESPONSE
#         # -----------------------------

#         return {
#             "filename": file.filename,

#             "prediction": detection["prediction"],

#             "spoof_probability": detection[
#                 "spoof_probability"
#             ],

#             "real_probability": detection[
#                 "real_probability"
#             ],

#             "risk_level": risk["risk_level"],

#             "recommendation": risk[
#                 "recommendation"
#             ],

#             "windows_analyzed": detection[
#                 "windows_analyzed"
#             ]
#         }

#     except HTTPException:
#         raise

#     except Exception as e:

#         raise HTTPException(
#             status_code=500,
#             detail=f"Audio analysis failed: {str(e)}"
#         )

#     finally:

#         # Remove temporary file
#         if temp_path and os.path.exists(temp_path):
#             os.remove(temp_path)


# @app.websocket("/ws/live")
# async def websocket_live_detection(websocket: WebSocket):
#     await websocket.accept()
#     audio_buffer = np.array([], dtype=np.float32)
#     client_sample_rate = 16000
    
#     # 4 seconds at client sample rate
#     WINDOW_SAMPLES = 4 * client_sample_rate
#     STRIDE_SAMPLES = 1 * client_sample_rate

#     # Window count state for live stream
#     window_count = 0

#     try:
#         while True:
#             message = await websocket.receive()
#             if "text" in message and message["text"]:
#                 try:
#                     import json
#                     text_data = json.loads(message["text"])
#                     if "sample_rate" in text_data and text_data["sample_rate"]:
#                         client_sample_rate = int(text_data["sample_rate"])
#                         WINDOW_SAMPLES = 4 * client_sample_rate
#                         STRIDE_SAMPLES = 1 * client_sample_rate
#                 except Exception:
#                     pass

#             elif "bytes" in message and message["bytes"]:
#                 chunk_bytes = message["bytes"]
#                 chunk_samples = np.frombuffer(chunk_bytes, dtype=np.float32)
#                 audio_buffer = np.concatenate((audio_buffer, chunk_samples))

#                 # Bound max buffer to 10 seconds to avoid memory issues
#                 if len(audio_buffer) > 10 * client_sample_rate:
#                     audio_buffer = audio_buffer[-10 * client_sample_rate:]

#                 while len(audio_buffer) >= WINDOW_SAMPLES:
#                     raw_window = audio_buffer[:WINDOW_SAMPLES]
#                     window_count += 1
                    
#                     # Explicitly resample (upsample/downsample) raw window Float32 array to 16 kHz NumPy array
#                     resampled_16k_window = resample_audio(raw_window, orig_sr=client_sample_rate, target_sr=16000)

#                     # Normalize amplitude
#                     max_amp = np.max(np.abs(resampled_16k_window))
#                     if max_amp > 0:
#                         norm_window = resampled_16k_window / max_amp
#                     else:
#                         norm_window = resampled_16k_window

#                     # Raw, uninfluenced single-window inference
#                     pred = detector._predict_window(norm_window)
#                     fake_prob = float(pred["fake_probability"])
#                     real_prob = float(pred["real_probability"])

#                     risk = calculate_risk(fake_prob)

#                     # Calculate 4-second timeframe label (stride = 1s)
#                     start_sec = (window_count - 1) * 1
#                     end_sec = start_sec + 4
#                     timestamp_label = f"{start_sec // 60:02d}:{start_sec % 60:02d} - {end_sec // 60:02d}:{end_sec % 60:02d}"

#                     await websocket.send_json({
#                         "status": "success",
#                         "frame_index": window_count,
#                         "timestamp_label": timestamp_label,
#                         "instant_spoof_probability": round(fake_prob, 4),
#                         "instant_real_probability": round(real_prob, 4),
#                         "spoof_probability": round(fake_prob, 4),
#                         "real_probability": round(real_prob, 4),
#                         "prediction": "SPOOF" if fake_prob >= 0.50 else "REAL",
#                         "risk_level": risk["risk_level"],
#                         "recommendation": risk["recommendation"],
#                         "sample_rate_hz": 16000,
#                         "format": "FLOAT32_PCM",
#                         "windows_analyzed": window_count,
#                     })

#                     audio_buffer = audio_buffer[STRIDE_SAMPLES:]

#     except WebSocketDisconnect:
#         pass
#     except Exception as e:
#         try:
#             await websocket.close()
#         except Exception:
#             pass


from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import os
import tempfile
import json
import numpy as np

from backend.inference import detector, live_buffer
from backend.risk.risk_engine import calculate_risk
from backend.preprocessing.audio import preprocess_audio


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
        "*"
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
        "detector": "loaded",
        "model": "MTUCI/AASIST3"
    }


@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No audio file provided."
        )

    supported_formats = {
        ".wav",
        ".mp3",
        ".flac",
        ".ogg",
        ".m4a"
    }

    extension = os.path.splitext(
        file.filename
    )[1].lower()

    if extension not in supported_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format: {extension}"
        )

    temp_path = None

    try:

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

        # --------------------------------
        # AUDIO PREPROCESSING
        # --------------------------------

        # preprocess_audio should return:
        # audio: numpy array
        # sample_rate: original sample rate
        audio, sample_rate = preprocess_audio(
            temp_path
        )

        # --------------------------------
        # AASIST3 DETECTION
        # --------------------------------

        detection = detector.predict(
            audio,
            sample_rate=sample_rate
        )

        # --------------------------------
        # RISK ASSESSMENT
        # --------------------------------

        risk = calculate_risk(
            detection["spoof_probability"]
        )

        # --------------------------------
        # FINAL RESPONSE
        # --------------------------------

        return {
            "filename": file.filename,

            "prediction": detection["prediction"],

            "spoof_probability": detection[
                "spoof_probability"
            ],

            "real_probability": detection[
                "real_probability"
            ],

            "risk_level": risk[
                "risk_level"
            ],

            "recommendation": risk[
                "recommendation"
            ],

            "windows_analyzed": detection[
                "windows_analyzed"
            ],

            "windows": detection[
                "windows"
            ]
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Audio analysis failed: {str(e)}"
        )

    finally:

        if temp_path and os.path.exists(
            temp_path
        ):
            os.remove(temp_path)


@app.websocket("/ws/live")
async def websocket_live_detection(
    websocket: WebSocket
):

    await websocket.accept()

    client_sample_rate = 16000
    frame_index = 0

    # Reset the global live buffer for this connection.
    live_buffer.buffer = np.array(
        [],
        dtype=np.float32
    )

    try:

        while True:

            message = await websocket.receive()

            # --------------------------------
            # CLIENT CONFIGURATION
            # --------------------------------

            if (
                "text" in message
                and message["text"]
            ):

                try:

                    text_data = json.loads(
                        message["text"]
                    )

                    if (
                        "sample_rate" in text_data
                        and text_data["sample_rate"]
                    ):

                        client_sample_rate = int(
                            text_data["sample_rate"]
                        )

                except Exception:
                    pass

            # --------------------------------
            # AUDIO CHUNK
            # --------------------------------

            elif (
                "bytes" in message
                and message["bytes"]
            ):

                chunk_bytes = message["bytes"]

                chunk = np.frombuffer(
                    chunk_bytes,
                    dtype=np.float32
                )

                if len(chunk) == 0:
                    continue

                print(
                    "[AUDIO]",
                    "samples=", len(chunk),
                    "min=", float(np.min(chunk)),
                    "max=", float(np.max(chunk)),
                    "mean=", float(np.mean(chunk)),
                    "rms=", float(np.sqrt(np.mean(chunk ** 2)))
                )
                # --------------------------------
                # LIVE BUFFER + AASIST3
                # --------------------------------

                predictions = live_buffer.add_audio(
                    chunk,
                    sample_rate=client_sample_rate
                )

                # --------------------------------
                # SEND PREDICTIONS
                # --------------------------------

                for prediction in predictions:

                    frame_index += 1

                    fake_prob = float(
                        prediction[
                            "spoof_probability"
                        ]
                    )

                    real_prob = float(
                        prediction[
                            "real_probability"
                        ]
                    )

                    risk = calculate_risk(
                        fake_prob
                    )

                    start_sec = (
                        frame_index - 1
                    )

                    end_sec = start_sec + 4

                    timestamp_label = (
                        f"{start_sec // 60:02d}:"
                        f"{start_sec % 60:02d} - "
                        f"{end_sec // 60:02d}:"
                        f"{end_sec % 60:02d}"
                    )

                    await websocket.send_json({

                        "status": "success",

                        "frame_index": frame_index,

                        "timestamp_label":
                            timestamp_label,

                        "instant_spoof_probability":
                            round(fake_prob, 4),

                        "instant_real_probability":
                            round(real_prob, 4),

                        "spoof_probability":
                            round(fake_prob, 4),

                        "real_probability":
                            round(real_prob, 4),

                        "prediction":
                            prediction["prediction"],

                        "risk_level":
                            risk["risk_level"],

                        "recommendation":
                            risk["recommendation"],

                        "sample_rate_hz":
                            16000,

                        "format":
                            "FLOAT32_PCM",

                        "windows_analyzed":
                            frame_index
                    })

    except Exception as e:

        import traceback

        print("\n========== LIVE WEBSOCKET ERROR ==========")
        print(str(e))
        traceback.print_exc()
        print("==========================================\n")

        try:
            await websocket.send_json({
                "status": "error",
                "message": str(e)
            })
        except Exception:
            pass

        try:
            await websocket.close()
        except Exception:
            pass
    finally:

        # Clear buffer when client disconnects.
        live_buffer.buffer = np.array(
            [],
            dtype=np.float32
        )
