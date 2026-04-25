import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import logo from "./logo.png";

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function playSound() {
  if (typeof window === "undefined") return;

  const audio = new Audio("/sounds/alert.mp3");
  audio.volume = 0.8;
  audio.play().catch(() => {});

  if (navigator.vibrate) {
    navigator.vibrate(200);
  }
}

const statusLabel = {
  aguardando: "Aguardando",
  "a caminho": "A caminho",
  chegou: "Chegou",
  retirado: "Retirado",
  atrasado: "Atrasado",
};

function badgeStyle(status) {
  const map = {
    aguardando: { background: "#e5e7eb", color: "#111827" },
    "a caminho": { background: "#dbeafe", color: "#1d4ed8" },
    chegou: { background: "#fef3c7", color: "#92400e" },
    retirado: { background: "#dcfce7", color: "#166534" },
    atrasado: { background: "#fee2e2", color: "#b91c1c" },
  };

  return {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    ...(map[status] || map.aguardando),
  };
}

function cardStyle() {
  return {
    background: "#fff",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
    border: "1px solid #e5e7eb",
  };
}

function buttonStyle(primary = true) {
  return {
    padding: "12px 16px",
    borderRadius: 14,
    border: primary ? "none" : "1px solid #d1d5db",
    background: primary ? "#0f172a" : "#fff",
    color: primary ? "#fff" : "#111827",
    fontWeight: 700,
    cursor: "pointer",
  };
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState("pais");
  const [selectedId, setSelectedId] = useState("");
  const [responsible, setResponsible] = useState("");
  const [plate, setPlate] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setStudents(data);
    });

    return () => unsubscribe();
  }, []);

  const selectedStudent = students.find((s) => s.id === selectedId);

  const metrics = useMemo(() => {
    return {
      total: students.length,
      caminho: students.filter((s) => s.status === "a caminho").length,
      chegou: students.filter((s) => s.status === "chegou").length,
      retirado: students.filter((s) => s.status === "retirado").length,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = schoolSearch.trim().toLowerCase();

    if (!q) return students;

    return students.filter((s) => {
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.className || "").toLowerCase().includes(q) ||
        (s.pickupBy || "").toLowerCase().includes(q) ||
        (s.plate || "").toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q)
      );
    });
  }, [students, schoolSearch]);

  async function updateStudent(id, updates) {
    const studentRef = doc(db, "students", id);

    await updateDoc(studentRef, {
      ...updates,
      time: nowTime(),
    });
  }

  async function handleImComing(student) {
    await updateStudent(student.id, {
      status: "a caminho",
      pickupBy: responsible || student.pickupBy || "Responsável a caminho",
      plate: plate || student.plate || "",
      alert: true,
    });

    playSound();
  }

  async function markArrived(id) {
    await updateStudent(id, {
      status: "chegou",
      alert: false,
    });

    playSound();
  }

  async function markPickedUp(id) {
    await updateStudent(id, {
      status: "retirado",
      alert: false,
    });

    playSound();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fff7fb 0%, #eef6ff 100%)",
        fontFamily: "Arial, sans-serif",
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: 20 }}>
        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src={logo}
              alt="BuscaFácil"
              style={{
                width: 82,
                height: 82,
                objectFit: "contain",
                borderRadius: 18,
                background: "#fff",
              }}
            />

            <div>
              <h1 style={{ margin: 0, fontSize: 38 }}>BuscaFácil</h1>
              <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 16 }}>
                Transporte escolar com segurança e tranquilidade
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={buttonStyle(tab === "pais")} onClick={() => setTab("pais")}>
              Área dos pais
            </button>
            <button style={buttonStyle(tab === "escola")} onClick={() => setTab("escola")}>
              Painel da escola
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Alunos monitorados</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{metrics.total}</div>
          </div>

          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>A caminho</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{metrics.caminho}</div>
          </div>

          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Chegaram</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{metrics.chegou}</div>
          </div>

          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Retirados</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{metrics.retirado}</div>
          </div>
        </div>

        {tab === "pais" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 20,
            }}
          >
            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Área dos pais</h2>
              <p style={{ color: "#475569" }}>
                Avise a escola que está a caminho.
              </p>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
                  Aluno
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="">Selecione o aluno</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} • {student.className || "Turma não informada"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
                  Quem vai buscar
                </label>
                <input
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Ex.: Pai, mãe, avó ou van"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
                  Placa do veículo ou van
                </label>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="ABC-1234 ou ABC1D23"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                onClick={() => {
                  if (!selectedStudent) {
                    alert("Selecione um aluno.");
                    return;
                  }

                  handleImComing(selectedStudent);
                }}
                style={{
                  ...buttonStyle(true),
                  width: "100%",
                  marginTop: 20,
                  minHeight: 72,
                  fontSize: 18,
                }}
              >
                🚗 Estou chegando
              </button>
            </div>

            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Resumo do aluno</h2>

              {selectedStudent ? (
                <>
                  <p><strong>Nome:</strong> {selectedStudent.name}</p>
                  <p><strong>Turma:</strong> {selectedStudent.className || "—"}</p>
                  <p><strong>Código:</strong> {selectedStudent.code || "—"}</p>
                  <p><strong>Responsável:</strong> {selectedStudent.pickupBy || "—"}</p>
                  <p><strong>Placa:</strong> {selectedStudent.plate || "—"}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span style={badgeStyle(selectedStudent.status)}>
                      {statusLabel[selectedStudent.status] || selectedStudent.status || "—"}
                    </span>
                  </p>
                  <p><strong>Atualizado às:</strong> {selectedStudent.time || "—"}</p>
                </>
              ) : (
                <p style={{ color: "#64748b" }}>Selecione um aluno para ver o resumo.</p>
              )}
            </div>
          </div>
        ) : (
          <div style={cardStyle()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Painel da escola</h2>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  Acompanhe em tempo real quem está a caminho, chegou ou já foi retirado.
                </p>
              </div>

              <input
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                placeholder="Buscar aluno, turma, responsável ou placa"
                style={{
                  width: 340,
                  maxWidth: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  style={{
                    border: student.alert ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    borderRadius: 18,
                    padding: 16,
                    background: student.alert ? "#eef6ff" : "#fff",
                    display: "grid",
                    gap: 12,
                    boxShadow: student.alert
                      ? "0 12px 30px rgba(37,99,235,0.18)"
                      : "none",
                  }}
                >
                  {student.alert && (
                    <div style={{ color: "#2563eb", fontWeight: 800, fontSize: 15 }}>
                      🚗 Chegando agora! Atenção na portaria.
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>
                        {student.name}
                      </div>
                      <div style={{ color: "#64748b", marginTop: 4 }}>
                        {student.className || "Turma não informada"} • {student.code || "Sem código"}
                      </div>
                    </div>

                    <span style={badgeStyle(student.status)}>
                      {statusLabel[student.status] || student.status || "—"}
                    </span>
                  </div>

                  <div style={{ color: "#334155" }}>
                    <strong>Responsável:</strong> {student.pickupBy || "—"}
                  </div>

                  <div style={{ color: "#334155" }}>
                    <strong>Parentesco:</strong> {student.relationship || "—"}
                  </div>

                  <div style={{ color: "#334155" }}>
                    <strong>Placa:</strong> {student.plate || "—"}
                  </div>

                  <div style={{ color: "#334155" }}>
                    <strong>Atualizado às:</strong> {student.time || "—"}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button style={buttonStyle(false)} onClick={() => markArrived(student.id)}>
                      Marcar chegada
                    </button>

                    <button style={buttonStyle(true)} onClick={() => markPickedUp(student.id)}>
                      Confirmar retirada
                    </button>
                  </div>
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <div style={{ color: "#64748b", textAlign: "center", padding: 20 }}>
                  Nenhum aluno encontrado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
