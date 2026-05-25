/**
 * DermaAI Frontend Application
 * Pakistan Dermatology Initiative
 */

const API = "";

// ─── PST Clock ────────────────────────────────────────────────────────────────
function updateClock() {
  const pst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const time = pst.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const date = pst.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const el = document.getElementById("pst-clock");
  if (el) el.innerHTML = `<strong>${time} (PST)</strong><br><small>${date}</small>`;
}
setInterval(updateClock, 1000);
updateClock();

// ─── Navigation ───────────────────────────────────────────────────────────────
document.querySelectorAll(".nav-item").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const page = el.dataset.page;
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    el.classList.add("active");
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(`page-${page}`).classList.add("active");
    if (page === "doctors") loadDoctors();
    if (page === "history") loadFullHistory();
  });
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch(`${API}/api/dashboard/stats`);
    const data = await res.json();
    document.getElementById("stat-total").textContent = data.totalAnalyses;
    document.getElementById("stat-high-risk").textContent = data.highRiskCases;
    document.getElementById("stat-doctors").textContent = data.doctorsOnline;
    document.getElementById("stat-patients").textContent = data.totalPatients;

    renderPieChart(data.conditionDistribution || []);
    renderHistoryTable(data.recentActivity || []);
  } catch (err) { console.error("Failed to load stats:", err); }
}

// ─── Risk Progress Chart ──────────────────────────────────────────────────────
let riskChart = null;
function renderRiskChart(riskData) {
  const ctx = document.getElementById("risk-chart").getContext("2d");
  if (riskChart) riskChart.destroy();
  riskChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: riskData.map(d => d.month),
      datasets: [{ label: "Risk Score", data: riskData.map(d => d.riskScore),
        borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,.1)", tension: 0.4, fill: true, pointRadius: 3 }]
    },
    options: {
      responsive: true, plugins: { legend: { labels: { color: "#6e7681" } } },
      scales: {
        x: { ticks: { color: "#6e7681", font: { size: 10 } }, grid: { color: "#21262d" } },
        y: { min: 0, max: 100, ticks: { color: "#6e7681" }, grid: { color: "#21262d" } }
      }
    }
  });
}

let pieChart = null;
function renderPieChart(dist) {
  const ctx = document.getElementById("pie-chart").getContext("2d");
  if (pieChart) pieChart.destroy();
  if (!dist.length) dist = [
    { condition: "Melanoma", count: 38, color: "#ef4444" },
    { condition: "Basal Cell Carcinoma", count: 28, color: "#f97316" },
    { condition: "Benign Keratosis", count: 22, color: "#22c55e" },
    { condition: "Nevus", count: 12, color: "#3b82f6" },
  ];
  pieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: dist.map(d => d.condition),
      datasets: [{ data: dist.map(d => d.count), backgroundColor: dist.map(d => d.color), borderWidth: 0 }]
    },
    options: {
      responsive: true, plugins: {
        legend: { labels: { color: "#9ca3af", font: { size: 10 }, padding: 10 } }
      }
    }
  });
}

// Default risk chart
renderRiskChart([
  { month: "May 2024", riskScore: 45 }, { month: "Jul 2024", riskScore: 52 },
  { month: "Sep 2024", riskScore: 61 }, { month: "Nov 2024", riskScore: 70 },
  { month: "Jan 2025", riskScore: 79 }, { month: "Mar 2025", riskScore: 88 },
]);

// ─── History Table ─────────────────────────────────────────────────────────────
function riskBadge(level) {
  const cls = level === "High" ? "high" : level === "Medium" ? "medium" : "low";
  return `<span class="risk-badge ${cls}">${level}</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

let allAnalyses = [];
function renderHistoryTable(data, search = "") {
  allAnalyses = data;
  const tbody = document.getElementById("history-tbody");
  const filtered = search ? data.filter(a => a.patientName?.toLowerCase().includes(search.toLowerCase()) || a.patientId?.toLowerCase().includes(search.toLowerCase())) : data;
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No analyses yet. Upload your first image above.</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.slice(0, 8).map(a => `
    <tr>
      <td style="color:#a78bfa;font-family:monospace">${a.patientId}</td>
      <td>${a.patientName}</td>
      <td>${a.prediction}</td>
      <td>${riskBadge(a.riskLevel)}</td>
      <td>${a.confidenceScore?.toFixed(1)}%</td>
      <td>${formatDate(a.createdAt)}</td>
    </tr>`).join("");
}

document.getElementById("history-search")?.addEventListener("input", (e) => {
  renderHistoryTable(allAnalyses, e.target.value);
});

// ─── Image Upload & Analysis ──────────────────────────────────────────────────
const uploadZone = document.getElementById("upload-zone");
const fileInput = document.getElementById("file-input");
const previewContainer = document.getElementById("preview-container");
const previewImg = document.getElementById("preview-img");
const btnAnalyze = document.getElementById("btn-analyze");
let uploadedB64 = null;

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedB64 = e.target.result.split(",")[1];
    previewImg.src = e.target.result;
    uploadZone.style.display = "none";
    previewContainer.style.display = "block";
    btnAnalyze.disabled = !document.getElementById("patient-name").value;
  };
  reader.readAsDataURL(file);
}

uploadZone?.addEventListener("click", () => fileInput.click());
uploadZone?.addEventListener("dragover", (e) => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
uploadZone?.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
uploadZone?.addEventListener("drop", (e) => { e.preventDefault(); uploadZone.classList.remove("drag-over"); const f = e.dataTransfer.files[0]; if (f) handleFile(f); });
fileInput?.addEventListener("change", (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });
document.getElementById("patient-name")?.addEventListener("input", (e) => {
  if (btnAnalyze) btnAnalyze.disabled = !e.target.value || !uploadedB64;
});
document.getElementById("btn-remove-img")?.addEventListener("click", () => {
  uploadedB64 = null; previewContainer.style.display = "none"; uploadZone.style.display = "block";
  if (btnAnalyze) btnAnalyze.disabled = true;
  document.getElementById("analysis-result").style.display = "none";
});

btnAnalyze?.addEventListener("click", async () => {
  if (!uploadedB64 || !document.getElementById("patient-name").value) return;
  btnAnalyze.disabled = true;
  btnAnalyze.textContent = "Analyzing...";
  try {
    const res = await fetch(`${API}/api/analyses/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: document.getElementById("patient-name").value,
        conditionDetails: document.getElementById("clinical-notes").value,
        imageData: uploadedB64,
      })
    });
    const result = await res.json();
    showResult(result);
    if (result.riskProgressData) renderRiskChart(result.riskProgressData);
    loadStats();
  } catch (err) {
    console.error("Analysis failed:", err);
    alert("Analysis failed. Please try again.");
  } finally {
    btnAnalyze.disabled = false;
    btnAnalyze.textContent = "Run AI Analysis";
  }
});

function showResult(r) {
  const el = document.getElementById("analysis-result");
  const isHigh = r.riskLevel === "High";
  el.className = `result-box ${isHigh ? "high-risk" : "low-risk"}`;
  el.innerHTML = `
    <div class="result-label">AI Analysis Result</div>
    <div class="result-prediction ${isHigh ? "high" : "low"}">${r.prediction}</div>
    ${riskBadge(r.riskLevel)}
    <div class="result-meta">
      <div><span>Confidence</span><br><strong>${r.confidenceScore?.toFixed(1)}%</strong></div>
      <div><span>ABCDE</span><br><strong>${r.abcdeScore}</strong></div>
      <div><span>Lesion Area</span><br><strong>${r.lesionArea}</strong></div>
      <div><span>Report ID</span><br><strong style="font-family:monospace;font-size:10px">${r.reportId}</strong></div>
    </div>
    <div style="margin-top:10px;font-size:12px;color:var(--text-muted)">${r.recommendations}</div>
    ${r.explainableAiReasons?.length ? `<div style="margin-top:10px"><strong style="font-size:12px">Explainable AI:</strong><ul style="margin-top:6px;padding-left:16px">${r.explainableAiReasons.map(x => `<li style="font-size:11px;color:var(--text-muted)">${x}</li>`).join("")}</ul></div>` : ""}
    ${isHigh ? `<div style="margin-top:12px;padding:10px;background:rgba(239,68,68,.15);border-radius:8px;font-size:12px;color:#fca5a5">🔔 Emergency Alert: High-risk case detected! On-call team notified.</div>` : ""}
  `;
  el.style.display = "block";
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const btnSend = document.getElementById("btn-send");

function addChatMsg(role, content) {
  const empty = chatMessages.querySelector(".chat-empty");
  if (empty) empty.remove();
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  div.textContent = content;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChat() {
  const msg = chatInput.value.trim();
  if (!msg) return;
  chatInput.value = "";
  addChatMsg("user", msg);
  try {
    const res = await fetch(`${API}/api/chat/message`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    addChatMsg("assistant", data.response);
  } catch { addChatMsg("assistant", "Sorry, I couldn't process that. Please try again."); }
}

btnSend?.addEventListener("click", sendChat);
chatInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });

// ─── Doctors ──────────────────────────────────────────────────────────────────
let currentCity = "All";
async function loadDoctors(city = currentCity) {
  currentCity = city;
  const grid = document.getElementById("doctors-grid");
  grid.innerHTML = "<p style='color:var(--text-muted);padding:20px'>Loading doctors...</p>";
  const url = city === "All" ? `/api/doctors` : `/api/doctors?city=${city}`;
  const res = await fetch(url);
  const doctors = await res.json();
  if (!doctors.length) { grid.innerHTML = "<p style='color:var(--text-muted);padding:20px'>No doctors found for this city.</p>"; return; }
  grid.innerHTML = doctors.map((d, i) => {
    const initials = d.name.split(" ").slice(1, 3).map(n => n[0]).join("");
    const colors = ["#7c3aed","#2563eb","#059669","#dc2626","#db2777","#d97706"];
    const stars = "★".repeat(Math.floor(d.rating)) + (d.rating % 1 >= 0.5 ? "★" : "");
    return `
    <div class="doctor-card">
      <div class="doctor-header">
        <div class="doctor-avatar" style="background:linear-gradient(135deg,${colors[i%colors.length]},${colors[(i+2)%colors.length]})">
          ${initials}${d.isOnline ? '<div class="online-dot"></div>' : ''}
        </div>
        <div>
          <div class="doctor-name">${d.name}</div>
          <div class="doctor-specialty">${d.specialty}</div>
          <div class="stars">${stars} ${d.rating.toFixed(1)}</div>
        </div>
      </div>
      <div class="doctor-detail">🏥 ${d.hospital}</div>
      <div class="doctor-detail">📍 ${d.city}, Pakistan • ${d.experience} yrs exp</div>
      ${d.phone ? `<div class="doctor-detail">📞 ${d.phone}</div>` : ""}
      ${d.bio ? `<div class="doctor-detail" style="margin-top:8px">${d.bio}</div>` : ""}
      <div class="doctor-actions">
        <button onclick="alert('Message feature coming soon!')">💬 Message</button>
        <button onclick="alert('Call request sent!')">📞 Call</button>
        <button onclick="alert('Appointment booked!')">📅 Appt</button>
      </div>
    </div>`;
  }).join("");
}

document.getElementById("city-filter")?.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadDoctors(btn.dataset.city);
  });
});

// ─── Full History Page ─────────────────────────────────────────────────────────
let fullHistoryData = [];
async function loadFullHistory(search = "") {
  const url = search ? `/api/analyses?search=${encodeURIComponent(search)}` : "/api/analyses";
  const res = await fetch(url);
  fullHistoryData = await res.json();
  renderFullHistory(fullHistoryData);
}

function renderFullHistory(data) {
  const tbody = document.getElementById("full-history-tbody");
  if (!data.length) { tbody.innerHTML = `<tr><td colspan="8" class="empty-row">No analyses found.</td></tr>`; return; }
  tbody.innerHTML = data.map(a => `
    <tr>
      <td style="color:#a78bfa;font-family:monospace">${a.patientId}</td>
      <td>${a.patientName}</td>
      <td>${a.age ?? "—"}</td>
      <td>${a.gender ?? "—"}</td>
      <td>${a.prediction}</td>
      <td>${riskBadge(a.riskLevel)}</td>
      <td>${a.confidenceScore?.toFixed(1)}%</td>
      <td>${formatDate(a.createdAt)}</td>
    </tr>`).join("");
}

document.getElementById("full-history-search")?.addEventListener("input", (e) => {
  loadFullHistory(e.target.value);
});

// ─── Init ──────────────────────────────────────────────────────────────────────
loadStats();
