import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

const COLORS = { north: "#4CAF50", south: "#2196F3", east: "#FF9800", west: "#F44336" };
const TABS = ["📡 Live Monitor", "🗺️ Intersection", "🎮 Manual Input", "⚔️ AI vs Fixed", "📈 History", "📷 Video Upload"];
const API = "https://smart-traffic-signal-ai.onrender.com";

function TrafficLight({ isGreen }) {
  return (
    <div style={{ background: "#111", borderRadius: 4, padding: "4px 3px", display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: isGreen ? "#333" : "#F44336", boxShadow: isGreen ? "none" : "0 0 8px #F44336" }} />
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF9800", opacity: 0.2 }} />
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: isGreen ? "#4CAF50" : "#333", boxShadow: isGreen ? "0 0 8px #4CAF50" : "none" }} />
    </div>
  );
}

function Intersection({ activePhase, data }) {
  const isNS = activePhase === "North-South";
  return (
    <div style={{ position: "relative", width: 300, height: 300, margin: "0 auto" }}>
      <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", width: 60, height: "100%", background: "#2a2a2a", borderLeft: "2px solid #444", borderRight: "2px solid #444" }} />
      <div style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)", width: "100%", height: 60, background: "#2a2a2a", borderTop: "2px solid #444", borderBottom: "2px solid #444" }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 60, height: 60, background: "#333" }} />
      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translate(-80px,0)" }}><TrafficLight isGreen={isNS} /></div>
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translate(20px,0)" }}><TrafficLight isGreen={isNS} /></div>
      <div style={{ position: "absolute", left: 8, top: "50%", transform: "translate(0,-80px)" }}><TrafficLight isGreen={!isNS} /></div>
      <div style={{ position: "absolute", right: 8, top: "50%", transform: "translate(0,20px)" }}><TrafficLight isGreen={!isNS} /></div>
      <div style={{ position: "absolute", top: 2, left: "50%", transform: "translateX(-50%)", color: COLORS.north, fontSize: 11, fontWeight: "bold" }}>N ({data?.north || 0}🚗)</div>
      <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", color: COLORS.south, fontSize: 11, fontWeight: "bold" }}>S ({data?.south || 0}🚗)</div>
      <div style={{ position: "absolute", left: 2, top: "50%", transform: "translateY(-50%)", color: COLORS.west, fontSize: 11, fontWeight: "bold" }}>W ({data?.west || 0}🚗)</div>
      <div style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", color: COLORS.east, fontSize: 11, fontWeight: "bold" }}>E ({data?.east || 0}🚗)</div>
      {isNS && <div style={{ position: "absolute", left: "50%", top: 70, transform: "translateX(-50%)", fontSize: 16, animation: "moveDown 2s linear infinite" }}>🚗</div>}
      {!isNS && <div style={{ position: "absolute", top: "50%", left: 70, transform: "translateY(-50%)", fontSize: 16, animation: "moveRight 2s linear infinite" }}>🚗</div>}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);
  const [manualInput, setManualInput] = useState({ north: 10, south: 10, east: 10, west: 10 });
  const [manualResult, setManualResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiWaitTotal, setAiWaitTotal] = useState(0);
  const [fixedWaitTotal, setFixedWaitTotal] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [emergency, setEmergency] = useState(null);
  const [greenTime, setGreenTime] = useState(30);
  const [videoResult, setVideoResult] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const fileRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/status`);
        const d = await res.json();
        setLiveData(d);
        setStatus("Connected ✅");
        setHistory(prev => [...prev.slice(-20), { ...d, time: new Date().toLocaleTimeString() }]);
        setAiWaitTotal(prev => prev + d.waiting_time);
        setFixedWaitTotal(prev => prev + (d.north + d.south + d.east + d.west) * 0.8);
        setRounds(prev => prev + 1);
        setGreenTime(Math.round(10 + Math.max(d.north, d.south, d.east, d.west) * 0.5));
      } catch {
        setStatus("Reconnecting...");
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergency = (dir) => {
    setEmergency(dir);
    setTimeout(() => setEmergency(null), 5000);
  };

  const handleManualSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualInput)
      });
      setManualResult(await res.json());
    } catch {
      setManualResult({ error: "Backend waking up — wait 30 seconds and try again!" });
    }
    setLoading(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setVideoResult({ error: "Please upload a video under 10MB for best results. Try a short 10-15 second clip." });
      return;
    }

    setVideoLoading(true);
    setVideoResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API}/upload_video`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVideoResult(data);
    } catch (err) {
      setVideoResult({ error: `Analysis failed: ${err.message}. Try a smaller video or check your connection.` });
    }
    setVideoLoading(false);
  };

  const aiAvg = rounds > 0 ? (aiWaitTotal / rounds).toFixed(1) : 0;
  const fixedAvg = rounds > 0 ? (fixedWaitTotal / rounds).toFixed(1) : 0;
  const saved = rounds > 0 ? (((fixedWaitTotal - aiWaitTotal) / fixedWaitTotal) * 100).toFixed(1) : 0;
  const totalVehicles = liveData ? liveData.north + liveData.south + liveData.east + liveData.west : 0;
  const congestion = totalVehicles > 120 ? "🔴 High" : totalVehicles > 70 ? "🟡 Medium" : "🟢 Low";
  const bg = darkMode ? "#0f0f1a" : "#f0f0f0";
  const cardBg = darkMode ? "#1a1a2e" : "#ffffff";
  const textColor = darkMode ? "white" : "#111";

  const renderTab = () => {
    switch (activeTab) {
      case 0: return (
        <div>
          <h2 style={{ ...S.sectionTitle, color: "#4CAF50" }}>📡 Live AI Monitor</h2>
          <p style={{ color: status.includes("✅") ? "#4CAF50" : "#FF9800", fontSize: 13, margin: "0 0 12px" }}>Status: {status}</p>
          {emergency && (
            <div style={{ background: "#F44336", borderRadius: 8, padding: "12px 20px", marginBottom: 16, textAlign: "center", animation: "pulse 1s infinite" }}>
              🚨 <strong>EMERGENCY OVERRIDE!</strong> {emergency} lane cleared for emergency vehicle!
            </div>
          )}
          {liveData ? (<>
            <div style={S.cardRow}>
              {["north", "south", "east", "west"].map(dir => (
                <div key={dir} style={{ ...S.card, background: cardBg, borderTop: `4px solid ${COLORS[dir]}` }}>
                  <h3 style={{ color: COLORS[dir], textTransform: "capitalize", margin: 0 }}>{dir}</h3>
                  <h1 style={{ ...S.bigNum, color: textColor }}>{liveData[dir]}</h1>
                  <p style={S.label}>vehicles</p>
                </div>
              ))}
            </div>
            <div style={S.phaseBox}>
              <h2>🟢 Active Signal: <strong>{emergency ? emergency.toUpperCase() + " (EMERGENCY)" : liveData.active_phase}</strong></h2>
              <p>⏱ Dynamic Green Time: <strong>{greenTime}s</strong></p>
              <p>🚦 Congestion: <strong>{congestion}</strong></p>
              <p>🤖 AI Decisions Made: <strong>{rounds}</strong></p>
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ color: "#aaa", marginBottom: 8 }}>🚨 Simulate Emergency Vehicle:</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["North", "South", "East", "West"].map(dir => (
                  <button key={dir} onClick={() => handleEmergency(dir)}
                    style={{ padding: "8px 16px", background: "#F44336", border: "none", borderRadius: 6, color: "white", cursor: "pointer", fontWeight: "bold" }}>
                    🚨 {dir}
                  </button>
                ))}
              </div>
            </div>
          </>) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: "#FF9800", fontSize: 16 }}>⏳ {status}</p>
              <p style={{ color: "#aaa", fontSize: 13 }}>Backend waking up — usually takes 30-50 seconds on first load</p>
            </div>
          )}
        </div>
      );
      case 1: return (
        <div>
          <h2 style={{ ...S.sectionTitle, color: "#4CAF50" }}>🗺️ Live Intersection View</h2>
          <Intersection activePhase={liveData?.active_phase} data={liveData} />
          <p style={{ textAlign: "center", color: "#aaa", marginTop: 16 }}>
            Signal: <strong style={{ color: "#4CAF50" }}>{liveData?.active_phase || "Loading..."}</strong>
            {" | "} Green for: <strong style={{ color: "#FFD700" }}>{greenTime}s</strong>
            {" | "} {congestion}
          </p>
        </div>
      );
      case 2: return (
        <div>
          <h2 style={{ ...S.sectionTitle, color: "#4CAF50" }}>🎮 Manual Input</h2>
          <p style={{ color: "#aaa" }}>Enter vehicle counts → AI decides which signal turns green</p>
          <div style={S.cardRow}>
            {["north", "south", "east", "west"].map(dir => (
              <div key={dir} style={{ ...S.inputCard, background: cardBg }}>
                <label style={{ color: COLORS[dir], textTransform: "capitalize", fontWeight: "bold" }}>{dir}</label>
                <input type="number" min="0" max="100"
                  value={manualInput[dir]}
                  onChange={e => setManualInput({ ...manualInput, [dir]: parseInt(e.target.value) || 0 })}
                  style={{ ...S.input, background: bg, color: textColor }} />
              </div>
            ))}
          </div>
          <button onClick={handleManualSubmit} style={S.button} disabled={loading}>
            {loading ? "Analyzing..." : "🤖 Ask AI to Decide Signal"}
          </button>
          {manualResult && !manualResult.error && (
            <div style={{ ...S.phaseBox, marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, maxWidth: 600 }}>
              <div style={{ textAlign: "left" }}>
                <h2 style={{ margin: 0 }}>🟢 AI Decision: <strong>{manualResult.active_phase}</strong></h2>
                <p>⏱ Dynamic Green Time: <strong>{Math.round(10 + Math.max(manualInput.north, manualInput.south, manualInput.east, manualInput.west) * 0.5)}s</strong></p>
                <p>🚦 Predicted Wait: <strong>{manualResult.waiting_time}s</strong></p>
                <p style={{ color: "#aaa", fontSize: 13 }}>AI chose direction with highest congestion to clear first</p>
              </div>
              <div style={{ fontSize: 60 }}>
                {manualResult.active_phase === "North-South" ? "⬆️⬇️" : "⬅️➡️"}
              </div>
            </div>
          )}
          {manualResult?.error && (
            <div style={{ background: "#2a1a1a", border: "1px solid #F44336", borderRadius: 8, padding: 16, marginTop: 16 }}>
              <p style={{ color: "#F44336", margin: 0 }}>⚠️ {manualResult.error}</p>
            </div>
          )}
        </div>
      );
      case 3: return (
        <div>
          <h2 style={{ ...S.sectionTitle, color: "#4CAF50" }}>⚔️ AI vs Fixed Timer</h2>
          <div style={S.cardRow}>
            {[
              { label: "🤖 AI Control", val: aiAvg, color: "#4CAF50", sub: "avg wait time" },
              { label: "⏰ Fixed Timer", val: fixedAvg, color: "#F44336", sub: "avg wait time" },
              { label: "✅ AI Saves", val: `${saved}%`, color: "#FFD700", sub: "less waiting" },
            ].map(({ label, val, color, sub }) => (
              <div key={label} style={{ ...S.card, background: cardBg, borderTop: `4px solid ${color}`, minWidth: 160 }}>
                <h3 style={{ color }}>{label}</h3>
                <h1 style={{ ...S.bigNum, color: textColor }}>{val}</h1>
                <p style={S.label}>{sub}</p>
              </div>
            ))}
          </div>
          <div style={S.chartBox}>
            <BarChart width={500} height={250} data={[
              { name: "AI Control", wait: parseFloat(aiAvg) },
              { name: "Fixed Timer", wait: parseFloat(fixedAvg) },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
              <Bar dataKey="wait" fill="#4CAF50" />
            </BarChart>
          </div>
        </div>
      );
      case 4: return (
        <div>
          <h2 style={{ ...S.sectionTitle, color: "#4CAF50" }}>📈 Traffic History</h2>
          <div style={S.cardRow}>
            {[
              { label: "Total Vehicles", val: totalVehicles, color: "#4CAF50" },
              { label: "Congestion", val: congestion, color: "#2196F3" },
              { label: "Green Time", val: `${greenTime}s`, color: "#FF9800" },
              { label: "AI Decisions", val: rounds, color: "#9C27B0" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ ...S.card, background: cardBg, minWidth: 130 }}>
                <h3 style={{ color, margin: 0, fontSize: 13 }}>{label}</h3>
                <h1 style={{ fontSize: "1.8rem", margin: "6px 0", color: textColor }}>{val}</h1>
              </div>
            ))}
          </div>
          <div style={S.chartBox}>
            <LineChart width={650} height={280} data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#aaa" tick={{ fontSize: 10 }} />
              <YAxis stroke="#aaa" />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
              <Legend />
              {["north", "south", "east", "west"].map(dir => (
                <Line key={dir} type="monotone" dataKey={dir} stroke={COLORS[dir]} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </div>
        </div>
      );
      case 5: return (
        <div>
          <h2 style={{ ...S.sectionTitle, color: "#4CAF50" }}>📷 Upload Traffic Video</h2>
          <p style={{ color: "#aaa" }}>Upload a traffic video → AI analyzes traffic density → decides optimal signal</p>
          <div style={{ ...S.card, background: cardBg, padding: 30, textAlign: "center", border: "2px dashed #4CAF50", cursor: "pointer", borderRadius: 12 }}
            onClick={() => fileRef.current.click()}>
            <p style={{ fontSize: 48, margin: 0 }}>📁</p>
            <p style={{ color: "#4CAF50", fontWeight: "bold", fontSize: 16, margin: "8px 0 4px" }}>Click to upload traffic video</p>
            <p style={{ color: "#aaa", fontSize: 13, margin: 0 }}>Supports MP4, AVI, MOV — keep under 10MB</p>
            <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoUpload} />
          </div>
          {videoLoading && (
            <div style={{ textAlign: "center", marginTop: 20, padding: 20, background: cardBg, borderRadius: 10 }}>
              <p style={{ color: "#4CAF50", fontSize: 16, margin: 0 }}>🔍 Analyzing traffic density...</p>
              <p style={{ color: "#aaa", fontSize: 13, margin: "6px 0 0" }}>Please wait a moment</p>
            </div>
          )}
          {videoResult && !videoResult.error && (
            <div style={{ ...S.phaseBox, marginTop: 20 }}>
              <h2 style={{ margin: "0 0 16px" }}>✅ Analysis Complete!</h2>
              <div style={S.cardRow}>
                {["north", "south", "east", "west"].map(dir => (
                  <div key={dir} style={{ textAlign: "center" }}>
                    <p style={{ color: COLORS[dir], margin: 0, textTransform: "capitalize", fontWeight: "bold" }}>{dir}</p>
                    <h2 style={{ margin: "4px 0", color: textColor }}>{videoResult[dir] || 0}</h2>
                    <p style={{ color: "#aaa", fontSize: 12, margin: 0 }}>vehicles</p>
                  </div>
                ))}
              </div>
              <h3 style={{ margin: "16px 0 8px" }}>🟢 AI Decision: <strong>{videoResult.active_phase}</strong></h3>
              <p style={{ margin: "4px 0" }}>⏱ Dynamic Green Time: <strong>{videoResult.green_time}s</strong></p>
              <p style={{ margin: "4px 0", color: "#aaa", fontSize: 13 }}>Total vehicles: <strong style={{ color: textColor }}>{videoResult.total_vehicles}</strong></p>
            </div>
          )}
          {videoResult?.error && (
            <div style={{ background: "#2a1a1a", border: "1px solid #F44336", borderRadius: 8, padding: 16, marginTop: 16 }}>
              <p style={{ color: "#F44336", margin: 0 }}>⚠️ {videoResult.error}</p>
            </div>
          )}
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ ...S.container, background: bg, color: textColor }}>
      <style>{`
        @keyframes moveDown { 0% { top: 70px; opacity: 1; } 100% { top: 130px; opacity: 0; } }
        @keyframes moveRight { 0% { left: 70px; opacity: 1; } 100% { left: 130px; opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>
      <div style={{ ...S.header, background: darkMode ? "#0a0a14" : "#ffffff", borderBottom: `1px solid ${darkMode ? "#222" : "#ddd"}` }}>
        <h1 style={S.title}>🚦 Smart Traffic Signal Control System</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ ...S.subtitle, color: darkMode ? "#666" : "#999" }}>DQN RL + YOLOv8 + FastAPI</p>
          <button onClick={() => setDarkMode(!darkMode)}
            style={{ padding: "6px 14px", background: darkMode ? "#333" : "#eee", border: "none", borderRadius: 6, color: textColor, cursor: "pointer" }}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
      <div style={S.layout}>
        <div style={{ ...S.sidebar, background: darkMode ? "#0a0a14" : "#f5f5f5", borderRight: `1px solid ${darkMode ? "#222" : "#ddd"}` }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              style={{ ...S.tabBtn, color: activeTab === i ? "#4CAF50" : darkMode ? "#aaa" : "#555", background: activeTab === i ? (darkMode ? "#1a2e1a" : "#e8f5e9") : "transparent", border: `1px solid ${activeTab === i ? "#4CAF50" : darkMode ? "#333" : "#ddd"}` }}>
              {tab}
            </button>
          ))}
          <div style={{ ...S.miniStatus, background: darkMode ? "#111" : "#eee", border: `1px solid ${darkMode ? "#222" : "#ddd"}` }}>
            <p style={{ color: "#aaa", fontSize: 12, margin: "0 0 6px" }}>Live Status</p>
            <p style={{ color: status.includes("✅") ? "#4CAF50" : "#FF9800", fontSize: 12, margin: "4px 0" }}>{status}</p>
            <p style={{ color: "#4CAF50", fontSize: 13, margin: "4px 0" }}>🟢 {liveData?.active_phase || "Loading..."}</p>
            <p style={{ color: "#aaa", fontSize: 12, margin: "4px 0" }}>Wait: {liveData?.waiting_time || 0}s</p>
            <p style={{ color: "#aaa", fontSize: 12, margin: "4px 0" }}>Green: {greenTime}s</p>
            <p style={{ color: "#aaa", fontSize: 12, margin: "4px 0" }}>{congestion}</p>
          </div>
        </div>
        <div style={S.main}>{renderTab()}</div>
      </div>
    </div>
  );
}

const S = {
  container: { fontFamily: "Arial", minHeight: "100vh" },
  header: { padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { margin: 0, fontSize: "1.4rem", color: "#4CAF50" },
  subtitle: { margin: 0, fontSize: 13 },
  layout: { display: "flex", height: "calc(100vh - 56px)" },
  sidebar: { width: 200, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8 },
  tabBtn: { width: "100%", padding: "10px 12px", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 13 },
  miniStatus: { marginTop: "auto", padding: "12px", borderRadius: 8 },
  main: { flex: 1, padding: "24px", overflowY: "auto" },
  sectionTitle: { borderBottom: "1px solid #222", paddingBottom: 10, marginTop: 0 },
  cardRow: { display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" },
  card: { padding: "16px", borderRadius: "10px", textAlign: "center", minWidth: "110px" },
  bigNum: { fontSize: "2.2rem", margin: "5px 0" },
  label: { color: "#aaa", margin: 0, fontSize: 13 },
  phaseBox: { background: "#0f2a0f", border: "1px solid #4CAF50", borderRadius: "10px", padding: "20px", textAlign: "center", maxWidth: 500 },
  chartBox: { display: "flex", justifyContent: "center", marginTop: "10px" },
  inputCard: { padding: "15px", borderRadius: "10px", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" },
  input: { padding: "8px", borderRadius: "6px", border: "1px solid #4CAF50", fontSize: "1.2rem", width: "80px", textAlign: "center" },
  button: { display: "block", margin: "20px 0", padding: "12px 30px", background: "#4CAF50", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" },
};