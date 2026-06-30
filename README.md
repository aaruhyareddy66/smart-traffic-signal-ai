# 🚦 Smart Traffic Signal Control System

An AI-powered traffic signal optimization system that replaces fixed-timer signals with a Reinforcement Learning agent. The system observes vehicle density on a 4-way intersection and dynamically decides which direction gets the green light, aiming to reduce average waiting time compared to traditional fixed-cycle signals.

**🔗 Live Demo:** [smart-traffic-signal-ai.vercel.app](https://smart-traffic-signal-ai.vercel.app)
**🔗 API:** [smart-traffic-signal-ai.onrender.com](https://smart-traffic-signal-ai.onrender.com)
**🔗 API Docs (Swagger):** [smart-traffic-signal-ai.onrender.com/docs](https://smart-traffic-signal-ai.onrender.com/docs)

> ⚠️ Backend is hosted on Render's free tier — it sleeps after 15 mins of inactivity, so the first request may take 30-50 seconds to wake up.

---

## 📌 Why this project

Most traffic signals run on fixed timers — 30 seconds green regardless of whether 2 cars or 40 cars are waiting. This wastes time at empty intersections and adds to congestion at busy ones. This project explores whether an RL agent that watches real-time vehicle counts can make smarter, faster decisions than a fixed schedule.

---

## 🧠 How it works

1. A custom OpenAI Gym-style environment simulates traffic flow across 4 directions (North, South, East, West)
2. A DQN agent (Stable-Baselines3) is trained to choose between North-South green or East-West green, learning to minimize total waiting time across ~20,000 timesteps
3. YOLOv8 can process uploaded traffic video to count actual vehicles per lane
4. FastAPI serves the trained model and streams live decisions over WebSocket
5. A React dashboard visualizes everything in real time — live monitor, intersection view, manual testing, and AI vs fixed-timer comparison

---

## 🛠️ Tech Stack

**AI / ML**
- Reinforcement Learning — Stable-Baselines3 (DQN)
- Computer Vision — YOLOv8 (Ultralytics)
- Custom Gymnasium environment

**Backend**
- FastAPI
- WebSockets for real-time streaming
- Python 3.13

**Frontend**
- React
- Recharts for data visualization
- WebSocket client for live updates

**Deployment**
- Backend → Render
- Frontend → Vercel
- Version control → GitHub

---

## ✨ Features

- **Live AI Monitor** — watch the AI make signal decisions on simulated traffic every 2 seconds
- **Visual Intersection** — animated 4-way intersection showing which signal is currently green
- **Manual Input Mode** — enter your own vehicle counts per lane and see what the AI decides, with a directional arrow indicator
- **AI vs Fixed Timer Comparison** — live chart comparing average waiting time under AI control vs a traditional fixed-timer baseline
- **Traffic History** — rolling chart of vehicle counts across all 4 directions over time
- **Video Upload** — upload a traffic video and let YOLOv8 detect and count vehicles, feeding directly into the signal decision
- **Emergency Override** — simulate an emergency vehicle on any lane and instantly override the signal
- **Dynamic Green Time** — green light duration scales with vehicle count instead of staying fixed
- **Dark / Light mode** toggle

---

## 📁 Project Structure
smart_traffic_ai/
├── sumo_config/          # SUMO intersection network and route definitions
├── rl_agent/
│   ├── traffic_env.py    # Custom Gym environment
│   ├── train.py          # DQN training script
│   └── models/           # Saved trained model
├── yolo_module/
│   └── detect.py         # YOLOv8 vehicle detection from video/webcam
├── backend/
│   └── main.py           # FastAPI server, WebSocket, /predict, /upload_video
├── frontend/
│   └── src/App.js        # React dashboard
└── requirements.txt
---

## 🚀 Running it locally

**1. Clone the repo**
```bash
git clone https://github.com/aaruhyareddy66/smart-traffic-signal-ai.git
cd smart-traffic-signal-ai
```

**2. Set up the backend**
```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

**3. Train the RL agent** (optional — a trained model is already included)
```bash
cd rl_agent
python train.py
```

**4. Run the backend**
```bash
cd ../backend
uvicorn main:app --reload --port 8000
```

**5. Run the frontend** (in a new terminal)
```bash
cd frontend
npm install
npm start
```

Visit `http://localhost:3000` — the dashboard should connect to the backend automatically.

---

## 📊 Results

The DQN agent's reward improved from around **-314** at the start of training to consistently positive values (60-200 range) by 20,000 timesteps, indicating it learned to favor the direction with heavier traffic rather than switching randomly.

In the AI vs Fixed Timer comparison view, the AI-controlled signal shows a measurable reduction in average waiting time compared to a flat fixed-timer baseline under the same simulated traffic load.

---

## 🔭 Possible next steps

- Replace the simplified Python traffic simulation with full SUMO-based physics for more realistic training
- Train on real intersection camera footage instead of simulated counts
- Extend to multiple connected intersections (corridor-level optimization)
- Add PPO as an alternative agent and compare against DQN

---

## 👤 Author

**Aaruhya Reddy**
GitHub: [@aaruhyareddy66](https://github.com/aaruhyareddy66)
