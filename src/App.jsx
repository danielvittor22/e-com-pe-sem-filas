import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, getDocs, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const defaultConfig = {
  schoolLat: "-23.55052",
  schoolLng: "-46.633308",
  schoolRadiusMeters: "150",
  adminPin: "1234",
};

const defaultChecklist = {
  config_done: false,
  team_done: false,
  test_done: false,
  export_done: false,
};

const punchTypes = [
  { value: "entrada", label: "Entrada" },
  { value: "saida_intervalo", label: "Saída intervalo" },
  { value: "volta_intervalo", label: "Volta intervalo" },
  { value: "saida", label: "Saída" },
];

function cardStyle() {
  return { background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #e2e8f0" };
}

function buttonStyle(primary = true) {
  return {
    padding: "10px 14px",
    borderRadius: 10,
    border: primary ? "none" : "1px solid #cbd5e1",
    background: primary ? "#0f172a" : "#fff",
    color: primary ? "#fff" : "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
  };
}

function inputStyle() {
  return { padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", boxSizing: "border-box", width: "100%" };
}

function toRad(v) { return (v * Math.PI) / 180; }

function distanceInMeters(origin, current) {
  const R = 6371000;
  const dLat = toRad(current.lat - origin.lat);
  const dLng = toRad(current.lng - origin.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(origin.lat)) * Math.cos(toRad(current.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [punchType, setPunchType] = useState("entrada");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState("");
  const [pin, setPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState(defaultConfig);
  const [checklist, setChecklist] = useState(defaultChecklist);

  useEffect(() => {
    const saved = localStorage.getItem("ponto_escola_config");
    if (saved) {
      try {
        setConfig({ ...defaultConfig, ...JSON.parse(saved) });
      } catch {
        setConfig(defaultConfig);
      }
    }

    const savedChecklist = localStorage.getItem("ponto_escola_checklist");
    if (savedChecklist) {
      try {
        setChecklist({ ...defaultChecklist, ...JSON.parse(savedChecklist) });
      } catch {
        setChecklist(defaultChecklist);
      }
    }
  }, []);

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
      setEmployees(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setLoadError("");
    }, (error) => setLoadError(error?.message || "Erro ao carregar funcionários."));

    const unsubRecords = onSnapshot(collection(db, "timeRecords"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      data.sort((a, b) => (b.createdAt?.toDate?.()?.getTime?.() || 0) - (a.createdAt?.toDate?.()?.getTime?.() || 0));
      setRecords(data);
      setLoadError("");
    }, (error) => setLoadError(error?.message || "Erro ao carregar marcações."));

    return () => { unsubEmployees(); unsubRecords(); };
  }, []);

  useEffect(() => {
    if (!employeeId && employees.length > 0) setEmployeeId(employees[0].id);
  }, [employeeId, employees]);

  const todayRecords = useMemo(() => {
    const today = new Date().toLocaleDateString("pt-BR");
    return records.filter((record) => record.createdAt?.toDate?.()?.toLocaleDateString("pt-BR") === today);
  }, [records]);

  const schoolCenter = {
    lat: Number(config.schoolLat),
    lng: Number(config.schoolLng),
  };
  const schoolRadiusMeters = Number(config.schoolRadiusMeters);

  async function getCurrentLocation() {
    if (!navigator.geolocation) throw new Error("Geolocalização não disponível neste dispositivo.");
    setLoadingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }));
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } finally { setLoadingLocation(false); }
  }

  async function registerPunch() {
    setMessage("");
    const employee = employees.find((item) => item.id === employeeId);
    if (!employee) return setMessage("Selecione um funcionário.");
    if (!Number.isFinite(schoolCenter.lat) || !Number.isFinite(schoolCenter.lng) || !Number.isFinite(schoolRadiusMeters)) {
      return setMessage("Configuração de escola inválida. Ajuste latitude, longitude e raio.");
    }

    try {
      const location = await getCurrentLocation();
      const distance = distanceInMeters(schoolCenter, location);
      if (distance > schoolRadiusMeters) return setMessage(`Fora da escola (${distance}m). Ponto não liberado.`);
      await addDoc(collection(db, "timeRecords"), { employeeId: employee.id, employeeName: employee.name, type: punchType, location, distance, createdAt: serverTimestamp() });
      setMessage(`Ponto registrado com sucesso (${distance}m da escola).`);
    } catch (error) { setMessage(error?.message || "Não foi possível registrar o ponto."); }
  }

  function saveConfig() {
    localStorage.setItem("ponto_escola_config", JSON.stringify(config));
    setMessage("Configurações salvas neste navegador.");
  }

  function updateChecklistItem(key) {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    localStorage.setItem("ponto_escola_checklist", JSON.stringify(next));
  }

  function checklistProgress() {
    const total = Object.keys(checklist).length;
    const done = Object.values(checklist).filter(Boolean).length;
    return `${done}/${total}`;
  }

  async function seedDefaultEmployees() {
    setSeeding(true); setMessage("");
    try {
      const snapshot = await getDocs(collection(db, "employees"));
      if (!snapshot.empty) return setMessage("Já existem funcionários cadastrados.");
      const defaults = ["Ana Souza", "Bruno Lima", "Carla Mendes", "Daniel Rocha", "Elisa Martins", "Felipe Nunes", "Gisele Alves", "Hugo Pereira"];
      await Promise.all(defaults.map((name) => addDoc(collection(db, "employees"), { name, role: "Equipe", active: true, createdAt: serverTimestamp() })));
      setMessage("8 funcionários padrão cadastrados com sucesso.");
    } catch (error) { setMessage(error?.message || "Erro ao cadastrar funcionários padrão."); }
    finally { setSeeding(false); }
  }

  async function addEmployee() {
    if (!newEmployeeName.trim()) return setMessage("Informe o nome do funcionário.");
    try {
      await addDoc(collection(db, "employees"), { name: newEmployeeName.trim(), role: newEmployeeRole.trim() || "Equipe", active: true, createdAt: serverTimestamp() });
      setNewEmployeeName(""); setNewEmployeeRole(""); setMessage("Funcionário cadastrado com sucesso.");
    } catch (error) { setMessage(error?.message || "Erro ao cadastrar funcionário."); }
  }

  function exportMonthlyReport() {
    const month = new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "-");
    const rows = records
      .filter((record) => {
        const date = record.createdAt?.toDate?.();
        const now = new Date();
        return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .map((record) => [record.employeeName, record.type, formatDate(record.createdAt?.toDate?.()), record.distance ?? ""]);
    if (rows.length === 0) return setMessage("Sem registros neste mês para exportar.");
    downloadCsv(`relatorio-ponto-${month}.csv`, [["Funcionário", "Tipo", "Data/Hora", "Distância(m)"], ...rows]);
    setMessage("Relatório mensal exportado em CSV.");
  }

  function unlockAdmin() {
    if (pin === config.adminPin) {
      setIsAdmin(true);
      setPin("");
      setMessage("Acesso administrativo liberado.");
      return;
    }
    setMessage("PIN administrativo inválido.");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20 }}>
        <div style={{ ...cardStyle(), marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>Ponto Escola</h1>
          <p style={{ margin: "6px 0 0", color: "#475569" }}>Aplicativo de ponto com configuração manual da escola</p>
        </div>

        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Registrar ponto</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} style={inputStyle()}>
              {employees.length === 0 && <option value="">Nenhum funcionário cadastrado</option>}
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
            <select value={punchType} onChange={(e) => setPunchType(e.target.value)} style={inputStyle()}>
              {punchTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button disabled={loadingLocation} onClick={registerPunch} style={{ ...buttonStyle(true), opacity: loadingLocation ? 0.6 : 1 }}>
              {loadingLocation ? "Validando localização..." : "Bater ponto"}
            </button>
            <button disabled={seeding} onClick={seedDefaultEmployees} style={{ ...buttonStyle(false), opacity: seeding ? 0.6 : 1 }}>
              {seeding ? "Cadastrando..." : "Cadastrar 8 funcionários padrão"}
            </button>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Acesso administrativo</h2>
          {!isAdmin ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN administrativo" style={{ ...inputStyle(), maxWidth: 240 }} />
              <button onClick={unlockAdmin} style={buttonStyle(true)}>Entrar no administrativo</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <h3 style={{ margin: 0 }}>Painel administrativo</h3>
                <button onClick={exportMonthlyReport} style={buttonStyle(false)}>Exportar relatório mensal (CSV)</button>
              </div>

              <div style={{ ...cardStyle(), marginTop: 12 }}>
                <h4 style={{ marginTop: 0 }}>Checklist de implantação manual ({checklistProgress()})</h4>
                <div style={{ display: "grid", gap: 8 }}>
                  <label><input type="checkbox" checked={checklist.config_done} onChange={() => updateChecklistItem("config_done")} /> Configurar latitude, longitude, raio e PIN</label>
                  <label><input type="checkbox" checked={checklist.team_done} onChange={() => updateChecklistItem("team_done")} /> Cadastrar os funcionários da escola</label>
                  <label><input type="checkbox" checked={checklist.test_done} onChange={() => updateChecklistItem("test_done")} /> Testar batida de ponto dentro da escola</label>
                  <label><input type="checkbox" checked={checklist.export_done} onChange={() => updateChecklistItem("export_done")} /> Exportar primeiro relatório CSV do mês</label>
                </div>
              </div>

              <div style={{ ...cardStyle(), marginTop: 12 }}>
                <h4 style={{ marginTop: 0 }}>Configuração manual</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  <input value={config.schoolLat} onChange={(e) => setConfig((prev) => ({ ...prev, schoolLat: e.target.value }))} placeholder="Latitude da escola" style={inputStyle()} />
                  <input value={config.schoolLng} onChange={(e) => setConfig((prev) => ({ ...prev, schoolLng: e.target.value }))} placeholder="Longitude da escola" style={inputStyle()} />
                  <input value={config.schoolRadiusMeters} onChange={(e) => setConfig((prev) => ({ ...prev, schoolRadiusMeters: e.target.value }))} placeholder="Raio em metros" style={inputStyle()} />
                  <input value={config.adminPin} onChange={(e) => setConfig((prev) => ({ ...prev, adminPin: e.target.value }))} placeholder="PIN admin" style={inputStyle()} />
                </div>
                <button onClick={saveConfig} style={{ ...buttonStyle(true), marginTop: 10 }}>Salvar configurações</button>
              </div>

              <div style={{ ...cardStyle(), marginTop: 12 }}>
                <h4 style={{ marginTop: 0 }}>Cadastrar funcionário</h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 10 }}>
                  <input value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} placeholder="Nome completo" style={inputStyle()} />
                  <input value={newEmployeeRole} onChange={(e) => setNewEmployeeRole(e.target.value)} placeholder="Cargo" style={inputStyle()} />
                  <button onClick={addEmployee} style={buttonStyle(true)}>Adicionar</button>
                </div>
              </div>

              <p><strong>Funcionários cadastrados:</strong> {employees.length} | <strong>Com ponto hoje:</strong> {new Set(todayRecords.map((r) => r.employeeId)).size}</p>
              <div style={{ display: "grid", gap: 8 }}>
                {records.slice(0, 12).map((record) => (
                  <div key={record.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
                    <strong>{record.employeeName}</strong> • {record.type} • {formatDate(record.createdAt?.toDate?.())}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {message && <p style={{ marginTop: 12, fontWeight: 700 }}>{message}</p>}
        {loadError && <p style={{ marginTop: 4, color: "#b91c1c", fontWeight: 700 }}>Erro: {loadError}</p>}
      </div>
    </div>
  );
}
