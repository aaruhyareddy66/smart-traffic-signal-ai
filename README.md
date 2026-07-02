# 🚦 Smart Traffic Signal Control System

An AI-powered traffic signal optimization system that dynamically controls a 4-way intersection using Reinforcement Learning. Instead of fixed timers, the system observes real-time vehicle density per lane and decides which direction gets the green light — reducing average waiting time compared to traditional fixed-cycle signals.

**🔗 Live Demo:** [smart-traffic-signal-ai.vercel.app](https://smart-traffic-signal-ai.vercel.app)
**🔗 API:** [smart-traffic-signal-ai.onrender.com](https://smart-traffic-signal-ai.onrender.com)
**🔗 API Docs:** [smart-traffic-signal-ai.onrender.com/docs](https://smart-traffic-signal-ai.onrender.com/docs)

> ⚠️ Backend hosted on Render free tier — first load may take 30-50 seconds to wake up. All subsequent requests are instant.

---

## 📌 Why this project

Traditional traffic signals run on fixed timers — 30 seconds green regardless of whether 2 cars or 40 cars are waiting. This wastes time at empty intersections and creates unnecessary congestion at busy ones. This project replaces fixed timers with a Reinforcement Learning agent that observes real-time vehicle counts and makes smarter, dynamic decisions — similar to what modern smart city systems do.

---

## 🧠 How it works

1. A custom OpenAI Gym-style environment simulates a 4-way intersection with realistic traffic patterns including rush-hour cycles
2. A DQN agent (Stable-Baselines3) is trained over 20,000 timesteps to minimize total waiting time across all lanes — reward improved from -314 to consistently positive values
3. YOLOv8 (Ultralytics) was built and tested locally for actual vehicle detection from traffic video files and webcam feed
4. Due to free hosting memory limits (512MB), the deployed backend uses a smart traffic density simulation instead of running YOLOv8 on the server — a deliberate engineering tradeoff to keep the system stable and responsive
5. FastAPI serves real-time traffic decisions via HTTP polling every 2 seconds
6. React dashboard shows live data, intersection animation, manual testing, performance comparison, and video upload analysis

---

## ✨ Features

- **📡 Live AI Monitor** — real-time vehicle counts per lane with AI signal decisions updating every 2 seconds, including rush-hour simulation patterns
- **🗺️ Intersection View** — animated 4-way intersection with working traffic lights and car animations switching based on AI decisions
- **🎮 Manual Input** — enter your own vehicle counts per lane → AI instantly decides which signal turns green → directional arrow shows the result
- **⚔️ AI vs Fixed Timer** — live bar chart comparing average waiting time under AI control vs traditional fixed-timer baseline, proving AI saves time
- **📈 Traffic History** — rolling line chart of all 4 lane counts over time with congestion scoring (Low / Medium / High)
- **📷 Video Upload** — upload a traffic video → system analyzes traffic density → AI decides optimal signal with dynamic green time
- **🚨 Emergency Override** — simulate an emergency vehicle on any lane and instantly override the current signal
- **⏱️ Dynamic Green Time** — green light duration scales automatically with vehicle count (formula: 10 + max_count × 0.5 seconds)
- **🌙 Dark / Light mode** toggle

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Reinforcement Learning | Stable-Baselines3 (DQN), Custom Gymnasium environment |
| Computer Vision | YOLOv8 (Ultralytics) — built and tested locally for vehicle detection |
| Traffic Simulation | Python-based simulation with rush-hour patterns |
| Backend | FastAPI, Python, Uvicorn |
| Frontend | React, Recharts |
| Deployment | Render (backend) + Vercel (frontend) |
| Monitoring | UptimeRobot (keeps backend alive) |
| Version Control | GitHub |

---

## 📊 RL Training Results

Trained for 20,000 timesteps on a custom Gymnasium environment:

| Metric | Start | End |
|---|---|---|
| Episode reward mean | -314 | +53 to +198 |
| Exploration rate | 0.525 | 0.05 |
| Training time | — | ~15 mins (CPU) |

The agent learned to favor the direction with heavier traffic rather than alternating randomly — exactly the behavior we want from a smart signal system.

---

## 🖥️ Project Structure
smart_traffic_ai/
├── sumo_config/
│   ├── intersection.nod.xml   # SUMO node definitions
│   ├── intersection.edg.xml   # SUMO edge definitions
│   ├── intersection.net.xml   # Generated SUMO network
│   ├── routes.xml             # Vehicle flow definitions
│   └── simulation.sumocfg     # SUMO config file
├── rl_agent/
│   ├── traffic_env.py         # Custom Gymnasium environment
│   ├── train.py               # DQN training script
│   └── models/
│       └── traffic_dqn.zip    # Saved trained model
├── yolo_module/
│   └── detect.py              # YOLOv8 vehicle detection (local use)
├── backend/
│   └── main.py                # FastAPI — /health /status /predict /upload_video
├── frontend/
│   └── src/
│       └── App.js             # React dashboard (6 tabs)
└── requirements.txt

---

## 🚀 Running Locally

**1. Clone the repo**
```bash
git clone https://github.com/aaruhyareddy66/smart-traffic-signal-ai.git
cd smart-traffic-signal-ai
```

**2. Set up Python environment**
```bash
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn python-multipart numpy pydantic
pip install stable-baselines3 gymnasium
pip install ultralytics opencv-python
```

**3. Train the RL agent** (optional — pre-trained model already included)
```bash
cd rl_agent
python train.py
```

**4. Test YOLOv8 locally** (optional)
```bash
cd yolo_module
python detect.py
```

**5. Run the backend**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**6. Run the frontend**
```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` — dashboard connects to backend automatically.

---

## ⚙️ Engineering Decisions

**Why not run YOLOv8 on the server?**
YOLOv8 requires ~1.5GB RAM to load. Render's free tier provides 512MB. Running it on the server caused consistent crashes and 8+ minute response times. The solution: YOLOv8 runs locally during development and testing; the deployed backend uses a smart simulation based on video file characteristics for stable, fast responses. This is a deliberate tradeoff between feature completeness and system reliability — a real engineering decision.

**Why polling instead of WebSockets?**
Render's free tier doesn't reliably maintain persistent WebSocket connections — they drop after 30-60 seconds with no warning. HTTP polling every 2 seconds gives identical user experience with far better reliability on free hosting.

**Why Python simulation instead of SUMO?**
SUMO was installed (portable zip) and configured, but TraCI connection consistently failed due to admin restrictions on the college laptop blocking the SUMO binary from binding to ports. The Python simulation replicates the same RL training environment with rush-hour patterns.

---

## 🔭 What I'd do next

- Full SUMO integration for physics-accurate traffic simulation
- Real-time webcam feed → YOLOv8 → live signal decisions in production
- Multi-intersection corridor-level optimization
- Compare DQN vs PPO agent performance
- GPU deployment for real-time YOLOv8 inference

---

## 👤 Author

**Aaruhya Reddy**
GitHub: [@aaruhyareddy66](https://github.com/aaruhyareddy66)
Live Demo: [smart-traffic-signal-ai.vercel.app](https://smart-traffic-signal-ai.vercel.app)
