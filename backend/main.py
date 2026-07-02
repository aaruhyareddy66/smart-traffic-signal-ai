from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import random
import json
import sys
import os
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy load RL model
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            from stable_baselines3 import DQN
            _model = DQN.load(os.path.join(
                os.path.dirname(__file__), "..", "rl_agent", "models", "traffic_dqn"
            ))
            print("✅ RL Model loaded")
        except Exception as e:
            print(f"⚠️ Model not found: {e}")
            _model = "unavailable"
    return _model if _model != "unavailable" else None

def get_signal_decision(vehicle_counts):
    ns_total = vehicle_counts[0] + vehicle_counts[1]
    ew_total = vehicle_counts[2] + vehicle_counts[3]
    return 0 if ns_total >= ew_total else 1

def build_response(counts, action=None):
    if action is None:
        action = get_signal_decision(counts)
    max_count = max(counts)
    return {
        "north": counts[0],
        "south": counts[1],
        "east": counts[2],
        "west": counts[3],
        "active_phase": "North-South" if action == 0 else "East-West",
        "action": action,
        "waiting_time": round(sum(counts) * 0.5, 2),
        "green_time": round(10 + max_count * 0.5)
    }

class TrafficInput(BaseModel):
    north: int
    south: int
    east: int
    west: int

@app.get("/")
def root():
    return {"message": "Smart Traffic API Running!"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/status")
def get_status():
    counts = [random.randint(5, 40) for _ in range(4)]
    return build_response(counts)

@app.post("/predict")
def predict(data: TrafficInput):
    counts = [data.north, data.south, data.east, data.west]
    action = get_signal_decision(counts)
    return build_response(counts, action)

@app.post("/upload_video")
async def upload_video(file: UploadFile = File(...)):
    try:
        # Read file to get size (no heavy processing needed)
        content = await file.read()
        file_size_mb = len(content) / (1024 * 1024)

        # Smart simulation based on file size
        # Larger video = more frames = more vehicles detected
        base_count = int(file_size_mb * 3.5)
        base_count = max(5, min(base_count, 45))

        # Realistic variation per lane
        counts = [
            base_count + random.randint(-3, 8),
            base_count + random.randint(-5, 6),
            base_count + random.randint(-2, 10),
            base_count + random.randint(-4, 7),
        ]
        counts = [max(1, c) for c in counts]

        action = get_signal_decision(counts)
        max_count = max(counts)
        green_time = round(10 + max_count * 0.5)

        return {
            "north": counts[0],
            "south": counts[1],
            "east": counts[2],
            "west": counts[3],
            "active_phase": "North-South" if action == 0 else "East-West",
            "action": action,
            "green_time": green_time,
            "total_vehicles": sum(counts),
            "file_size_mb": round(file_size_mb, 2)
        }
    except Exception as e:
        return {"error": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    step = 0
    try:
        while True:
            # Realistic traffic simulation with patterns
            hour_factor = (step % 24)
            if 7 <= hour_factor <= 9 or 17 <= hour_factor <= 19:
                # Rush hour — higher counts
                base = random.randint(25, 45)
            elif 0 <= hour_factor <= 5:
                # Night — lower counts
                base = random.randint(2, 15)
            else:
                base = random.randint(10, 30)

            counts = [
                base + random.randint(-5, 10),
                base + random.randint(-3, 8),
                base + random.randint(-6, 12),
                base + random.randint(-4, 9),
            ]
            counts = [max(1, c) for c in counts]
            action = get_signal_decision(counts)
            max_count = max(counts)

            data = {
                "north": counts[0],
                "south": counts[1],
                "east": counts[2],
                "west": counts[3],
                "active_phase": "North-South" if action == 0 else "East-West",
                "action": action,
                "waiting_time": round(sum(counts) * 0.5, 2),
                "green_time": round(10 + max_count * 0.5)
            }
            await websocket.send_text(json.dumps(data))
            step += 1
            await asyncio.sleep(2)
    except Exception:
        pass