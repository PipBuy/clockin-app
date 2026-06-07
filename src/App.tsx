import { useState, useEffect, useRef } from "react";

const ADMIN_PIN = "1234";

const INITIAL_EMPLOYEES = [
  { id: 1, name: "Pip Buy", role: "Manager", color: "#FF6B6B", initials: "PB", photo: null },
  { id: 2, name: "Sona Chuob", role: "Assistant Manager", color: "#4ECDC4", initials: "SC", photo: null },
  { id: 3, name: "Chan Phea", role: "Supervisor", color: "#FFE66D", initials: "CP", photo: null },
];

function Avatar({ emp, size = 64 }) {
  if (emp.photo) {
    return (
      <img src={emp.photo} alt={emp.name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
          border: `3px solid ${emp.color}`, boxShadow: `0 4px 20px ${emp.color}55`, flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${emp.color}, ${emp.color}99)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, color: "#fff",
      fontFamily: "'DM Mono', monospace",
      boxShadow: `0 4px 20px ${emp.color}55`,
      border: `3px solid ${emp.color}`, flexShrink: 0,
    }}>
      {emp.initials}
    </div>
  );
}

const APP_URL = "https://adorable-marigold-a32ebf.netlify.app";

function QRCodeSVG({ size = 150 }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(APP_URL)}&bgcolor=ffffff&color=1a1a2e&margin=2`;
  return (
    <img src={qrUrl} alt="Scan to open Clock In app"
      width={size} height={size}
      style={{ display: "block", borderRadius: 8 }} />
  );
}

const rankMedal = ["🥇", "🥈", "🥉"];
const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

export default function App() {
  const [view, setView] = useState("kiosk");
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [employees, setEmployees] = useState(
    INITIAL_EMPLOYEES.map(e => ({ ...e, clockedIn: false, lastAction: null, log: [], clockInTime: null }))
  );
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [toast, setToast] = useState(null);
  const [time, setTime] = useState(new Date());
  const [filterEmp, setFilterEmp] = useState("all");
  const fileInputRef = useRef(null);
  const [uploadingFor, setUploadingFor] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  // Sorted list of clocked-in employees by clock-in time (earliest = rank 1)
  const clockedInRanked = employees
    .filter(e => e.clockedIn && e.clockInTime)
    .sort((a, b) => a.clockInTime - b.clockInTime);

  const handleClockAction = (empId) => {
    const now = new Date();
    setEmployees(prev => prev.map(e => {
      if (e.id !== empId) return e;
      const action = e.clockedIn ? "out" : "in";
      showToast(`${e.name} clocked ${action}!`, true);
      return {
        ...e,
        clockedIn: !e.clockedIn,
        clockInTime: action === "in" ? now : null,
        lastAction: { type: action, time: now },
        log: [...e.log, { type: action, time: now }],
      };
    }));
    setTimeout(() => { setView("kiosk"); setSelectedEmp(null); }, 1500);
  };

  const handlePhotoUpload = (empId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setEmployees(prev => prev.map(emp =>
        emp.id === empId ? { ...emp, photo: e.target.result } : emp
      ));
      showToast("Photo updated!");
    };
    reader.readAsDataURL(file);
  };

  const fmt = (d) => d ? `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "—";
  const fmtTime = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDate = (d) => d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  const allLogs = employees.flatMap(e => e.log.map(l => ({ ...l, emp: e }))).sort((a, b) => b.time - a.time);
  const filteredLogs = filterEmp === "all" ? allLogs : allLogs.filter(l => l.emp.id === parseInt(filterEmp));

  const styles = {
    app: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d1b2a 100%)",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 20, boxSizing: "border-box", position: "relative", overflow: "hidden",
    },
    card: {
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(20px)",
      borderRadius: 24,
      border: "1px solid rgba(255,255,255,0.1)",
      padding: 28,
      width: "100%",
      maxWidth: 480,
      boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
    },
    clockBtn: (isClockedIn) => ({
      background: isClockedIn
        ? "linear-gradient(135deg, #FF6B6B, #ee5a24)"
        : "linear-gradient(135deg, #4ECDC4, #1abc9c)",
      color: "#fff", border: "none", borderRadius: 16,
      padding: "18px 24px", fontWeight: 800, fontSize: 18,
      cursor: "pointer", width: "100%", marginTop: 16,
      fontFamily: "'DM Sans', sans-serif",
      boxShadow: isClockedIn ? "0 8px 24px #FF6B6B55" : "0 8px 24px #4ECDC455",
    }),
    pinBtn: (v) => ({
      background: v === "⌫" ? "rgba(255,100,100,0.2)" : v === "✓" ? "rgba(78,205,196,0.2)" : "rgba(255,255,255,0.08)",
      color: v === "✓" ? "#4ECDC4" : "#fff",
      border: `1px solid ${v === "✓" ? "#4ECDC455" : "rgba(255,255,255,0.1)"}`,
      borderRadius: 12, padding: "16px", fontWeight: 700, fontSize: 20,
      cursor: "pointer", fontFamily: "'DM Mono', monospace",
    }),
    toast: (ok) => ({
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: ok ? "#4ECDC4" : "#FF6B6B",
      color: "#fff", borderRadius: 50, padding: "10px 24px",
      fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      zIndex: 999, whiteSpace: "nowrap",
    }),
  };

  const deco = (
    <>
      <div style={{ position: "fixed", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #4ECDC422, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #FF6B6B18, transparent 70%)", pointerEvents: "none" }} />
    </>
  );

  // ── KIOSK ──
  if (view === "kiosk") return (
    <div style={styles.app}>
      {deco}
      {toast && <div style={styles.toast(toast.ok)}>{toast.msg}</div>}
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>{fmtDate(time)}</div>
          <div style={{ color: "#fff", fontSize: 44, fontWeight: 800, fontFamily: "'DM Mono', monospace", letterSpacing: -2 }}>{fmtTime(time)}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Scan QR or tap your name</div>
        </div>

        {/* QR */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ background: "white", padding: 10, borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            <QRCodeSVG size={130} />
          </div>
        </div>

        {/* Arrival ranking */}
        {clockedInRanked.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
              Today's Arrival Order
            </div>
            {clockedInRanked.map((emp, idx) => (
              <div key={emp.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 12, marginBottom: 6,
                background: `${rankColors[idx] || "#fff"}11`,
                border: `1.5px solid ${rankColors[idx] || "#fff"}44`,
              }}>
                <div style={{ fontSize: 22, width: 30, textAlign: "center" }}>{rankMedal[idx] || `#${idx+1}`}</div>
                <Avatar emp={emp} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{emp.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{emp.role}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: rankColors[idx] || "#fff", fontWeight: 700, fontSize: 12 }}>#{idx + 1}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                    {emp.clockInTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Employee tap cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {employees.map(emp => (
            <div key={emp.id}
              onClick={() => { setSelectedEmp(emp); setView("employee"); }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                padding: "14px 6px", borderRadius: 14, cursor: "pointer",
                background: emp.clockedIn ? `${emp.color}18` : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${emp.clockedIn ? emp.color : "rgba(255,255,255,0.08)"}`,
                transition: "all 0.2s",
              }}>
              <Avatar emp={emp} size={50} />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{emp.name.split(" ")[0]}</div>
                <div style={{ color: emp.clockedIn ? emp.color : "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600 }}>
                  {emp.clockedIn ? "● IN" : "○ OUT"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setView("admin-login")}
          style={{ background: "transparent", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 20px", cursor: "pointer", width: "100%", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
          🔒 Admin
        </button>
      </div>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;700&display=swap" rel="stylesheet" />
    </div>
  );

  // ── EMPLOYEE CLOCK IN/OUT ──
  if (view === "employee" && selectedEmp) {
    const emp = employees.find(e => e.id === selectedEmp.id);
    const rank = clockedInRanked.findIndex(e => e.id === emp.id);
    return (
      <div style={styles.app}>
        {deco}
        {toast && <div style={styles.toast(toast.ok)}>{toast.msg}</div>}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => { if (e.target.files[0]) handlePhotoUpload(emp.id, e.target.files[0]); }} />
        <div style={styles.card}>
          <button onClick={() => { setView("kiosk"); setSelectedEmp(null); }}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", marginBottom: 16, fontSize: 14 }}>
            ← Back
          </button>
          <div style={{ textAlign: "center" }}>
            {/* Avatar with upload button */}
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar emp={emp} size={100} />
              <button onClick={() => { setUploadingFor(emp.id); fileInputRef.current.click(); }}
                style={{
                  position: "absolute", bottom: 2, right: 2,
                  background: "#1a1a3e", border: `2px solid ${emp.color}`,
                  borderRadius: "50%", width: 28, height: 28,
                  cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff",
                }}>📷</button>
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 6 }}>Tap 📷 to add photo</div>

            <div style={{ color: "#fff", fontSize: 24, fontWeight: 800, marginTop: 10 }}>{emp.name}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{emp.role}</div>

            {/* Rank badge if clocked in */}
            {emp.clockedIn && rank >= 0 && (
              <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: `${rankColors[rank] || "#fff"}22`, border: `1px solid ${rankColors[rank] || "#fff"}55`, borderRadius: 50, padding: "6px 16px" }}>
                <span style={{ fontSize: 18 }}>{rankMedal[rank] || `#${rank+1}`}</span>
                <span style={{ color: rankColors[rank] || "#fff", fontWeight: 700, fontSize: 13 }}>Arrived #{rank + 1} today</span>
              </div>
            )}

            <div style={{ marginTop: 10, display: "inline-block", background: emp.clockedIn ? "#4ECDC422" : "rgba(255,255,255,0.06)", color: emp.clockedIn ? "#4ECDC4" : "rgba(255,255,255,0.5)", borderRadius: 50, padding: "6px 16px", fontSize: 13, fontWeight: 700, border: `1px solid ${emp.clockedIn ? "#4ECDC455" : "transparent"}` }}>
              {emp.clockedIn ? "● Currently Clocked In" : "○ Currently Clocked Out"}
            </div>
            {emp.lastAction && (
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 8 }}>
                Last: clocked {emp.lastAction.type} at {fmt(emp.lastAction.time)}
              </div>
            )}
          </div>
          <button onClick={() => handleClockAction(emp.id)} style={styles.clockBtn(emp.clockedIn)}>
            {emp.clockedIn ? "🔴 Clock Out" : "🟢 Clock In"}
          </button>
        </div>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </div>
    );
  }

  // ── ADMIN LOGIN ──
  if (view === "admin-login") {
    const handlePin = (v) => {
      if (v === "⌫") { setPin(p => p.slice(0, -1)); setPinError(false); return; }
      if (v === "✓") {
        if (pin === ADMIN_PIN) { setView("admin"); setPin(""); setPinError(false); }
        else { setPinError(true); setPin(""); }
        return;
      }
      if (pin.length < 4) setPin(p => p + v);
    };
    return (
      <div style={styles.app}>
        {deco}
        <div style={styles.card}>
          <button onClick={() => { setView("kiosk"); setPin(""); setPinError(false); }}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", marginBottom: 16, fontSize: 14 }}>
            ← Back
          </button>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
            <h2 style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 800 }}>Admin Access</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", margin: "6px 0 0", fontSize: 13 }}>Enter your 4-digit PIN</p>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < pin.length ? "#4ECDC4" : "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.2)", transition: "all 0.2s" }} />
            ))}
          </div>
          {pinError && <div style={{ color: "#FF6B6B", textAlign: "center", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>Incorrect PIN. Try again.</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map(v => (
              <button key={v} onClick={() => handlePin(v)} style={styles.pinBtn(v)}>{v}</button>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", textAlign: "center", fontSize: 11, marginTop: 16 }}>Default PIN: 1234</p>
        </div>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </div>
    );
  }

  // ── ADMIN DASHBOARD ──
  if (view === "admin") return (
    <div style={{ ...styles.app, justifyContent: "flex-start", paddingTop: 40 }}>
      {deco}
      <div style={{ ...styles.card, maxWidth: 600 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 800 }}>Admin Dashboard</h2>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>{fmtDate(time)}</div>
          </div>
          <button onClick={() => setView("kiosk")}
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>
            ← Kiosk
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          <div style={{ background: "rgba(78,205,196,0.1)", border: "1px solid #4ECDC433", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <div style={{ color: "#4ECDC4", fontSize: 32, fontWeight: 800 }}>{employees.filter(e => e.clockedIn).length}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Clocked In</div>
          </div>
          <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid #FF6B6B33", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <div style={{ color: "#FF6B6B", fontSize: 32, fontWeight: 800 }}>{employees.filter(e => !e.clockedIn).length}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Clocked Out</div>
          </div>
        </div>

        {/* Arrival ranking */}
        {clockedInRanked.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Arrival Ranking</div>
            {clockedInRanked.map((emp, idx) => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: `${rankColors[idx] || "#fff"}11`, border: `1px solid ${rankColors[idx] || "#fff"}33`, marginBottom: 8 }}>
                <div style={{ fontSize: 24, width: 32, textAlign: "center" }}>{rankMedal[idx] || `#${idx+1}`}</div>
                <Avatar emp={emp} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{emp.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{emp.role}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: rankColors[idx], fontWeight: 800, fontSize: 15 }}>#{idx + 1}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                    {emp.clockInTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Employee status */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>All Employees</div>
          {employees.map(emp => (
            <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8 }}>
              <Avatar emp={emp} size={42} />
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{emp.name}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{emp.role}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: emp.clockedIn ? "#4ECDC4" : "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: 13 }}>
                  {emp.clockedIn ? "● IN" : "○ OUT"}
                </div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                  {emp.lastAction ? fmt(emp.lastAction.time).split(" ")[1] : "No activity"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Log */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Activity Log</div>
            <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
              style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
              <option value="all">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          {filteredLogs.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: 24 }}>No activity recorded yet.</div>
          ) : (
            filteredLogs.slice(0, 20).map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: 6 }}>
                <Avatar emp={l.emp} size={32} />
                <div style={{ flex: 1 }}>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{l.emp.name}</span>
                  <span style={{ color: l.type === "in" ? "#4ECDC4" : "#FF6B6B", fontWeight: 700, fontSize: 13 }}> clocked {l.type}</span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{fmt(l.time)}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;700&display=swap" rel="stylesheet" />
    </div>
  );

  return null;
}
