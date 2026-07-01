from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import random
import json
import sys
import os
import shutil
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from stable_baselines3 import DQN
    model_available = True
except:
    model_available = False
    DQN = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy load model only when needed
_model = None
model_loaded = False

def get_model():
    global _model, model_loaded
    if _model is None and model_available:
        try:
            _model = DQN.load(os.path.join(os.path.dirname(__file__), "..", "rl_agent", "models", "traffic_dqn"))
            model_loaded = True
            print("✅ Model loaded successfully!")
        except:
            model_loaded = False
            print("⚠️ Model not found, using rule-based decisions")
    return _model

def get_signal_decision(vehicle_counts):
    model = get_model()
    if model is not None:
        obs = np.array(vehicle_counts + [0], dtype=np.float32)
        action, _ = model.predict(obs)
        return int(action)
    ns_total = vehicle_counts[0] + vehicle_counts[1]
    ew_total = vehicle_counts[2] + vehicle_counts[3]
    return 0 if ns_total >= ew_total else 1

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
    action = get_signal_decision(counts)
    return {
        "north": counts[0],
        "south": counts[1],
        "east": counts[2],
        "west": counts[3],
        "active_phase": "North-South" if action == 0 else "East-West",
        "action": action,
        "waiting_time": round(sum(counts) * 0.5, 2)
    }

@app.post("/predict")
def predict(data: TrafficInput):
    counts = [data.north, data.south, data.east, data.west]
    ns_total = data.north + data.south
    ew_total = data.east + data.west
    action = 0 if ns_total >= ew_total else 1
    return {
        "north": data.north,
        "south": data.south,
        "east": data.east,
        "west": data.west,
        "active_phase": "North-South" if action == 0 else "East-West",
        "action": action,
        "waiting_time": round(sum(counts) * 0.5, 2)
    }

@app.post("/upload_video")
async def upload_video(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        import gc
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "yolo_module")))
        from detect import count_from_video
        count = count_from_video(temp_path)

        gc.collect()

        if os.path.exists(temp_path):
            os.remove(temp_path)

        counts = [count, max(0, count-5), max(0, count-10), max(0, count-3)]
        ns_total = counts[0] + counts[1]
        ew_total = counts[2] + counts[3]
        action = 0 if ns_total >= ew_total else 1
        max_count = max(counts)
        green_time = round(10 + max_count * 0.5)
        return {
            "north": counts[0], "south": counts[1],
            "east": counts[2], "west": counts[3],
            "active_phase": "North-South" if action == 0 else "East-West",
            "green_time": green_time,
            "total_vehicles": count
        }
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return {"error": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            counts = [random.randint(5, 40) for _ in range(4)]
            action = get_signal_decision(counts)
            data = {
                "north": counts[0],
                "south": counts[1],
                "east": counts[2],
                "west": counts[3],
                "active_phase": "North-South" if action == 0 else "East-West",
                "action": action,
                "waiting_time": round(sum(counts) * 0.5, 2)
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(2)
    except:
        pass