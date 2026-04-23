import { useMemo, useState } from "react";

const initialStudents = [
  {
    id: 1,
    name: "Gabriel Souza",
    className: "Maternal II",
    status: "aguardando",
    responsible: "Pai do Gabriel",
    plate: "",
    eta: "",
    updatedAt: "--:--",
  },
  {
    id: 2,
    name: "Helena Lima",
    className: "Jardim I",
    status: "a_caminho",
    responsible: "Mãe da Helena",
    plate: "BRA2E19",
    eta: "10 min",
    updatedAt: "17:05",
  },
  {
    id: 3,
    name: "Miguel Costa",
    className: "Jardim II",
    status: "retirado",
    responsible: "Van Escolar Sol",
    plate: "XYZ-1234",
    eta: "",
    updatedAt: "16:58",
  },
];

const statusLabel = {
  aguardando: "Aguardando",
  a_caminho: "A caminho",
  chegou: "Chegou",
  atrasado: "Atrasado",
  retirado: "Retirado",
};

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function badgeStyle(status) {
  const base = {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  };

  const map = {
    aguardando: { background: "#e5e7eb", color: "#111827" },
    a_caminho: { background: "#dbeafe", color: "#1d4ed8" },
    chegou: { background: "#fef3c7", color: "#92400e" },
    atrasado: { background: "#fee2e2", color: "#b91c1c" },
    retirado: { background: "#dcfce7", color: "#166534" },
  };

  return { ...base, ...(map[status] || map.aguardando) };
}

function cardStyle() {
  return {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
    border: "1px solid #e5e7eb",
  };
}

function buttonStyle(primary = true) {
  return {
    padding: "12px 16px",
    borderRadius: 12,
    border: primary ? "none" : "1px solid #d1d5db",
    background: primary ? "#0f172a" : "#fff",
    color: primary ? "#fff" : "#111827",
    fontWeight: 700,
    cursor: "pointer",
  };
}

export default function App() {
  const [students, setStudents] = useState(initialStudents);
  const [tab, setTab] = useState("pais");

  const [parentStudentId, setParentStudentId] = useState(initialStudents[0].id);
  const [parentResponsible, setParentResponsible] = useState("Pai do Gabriel");
  const [parentPlate, setParentPlate] = useState("");
  const [delayMinutes, setDelayMinutes] = useState("10 min");
  const [delayNote, setDelayNote] = useState("");

  const [schoolSearch, setSchoolSearch] = useState("");

  const selectedStudent = students.find((s) => s.id === parentStudentId);

  const metrics = useMemo(() => {
    return {
      total: students.length,
      aguardando: students.filter((s) => s.status === "aguardando").length,
      a_caminho: students.filter((s) => s.status === "a_caminho").length,
      chegou: students.filter((s) => s.status === "chegou").length,
      retirado: students.filter((s) => s.status === "retirado").length,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = schoolSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.responsible.toLowerCase().includes(q) ||
        (s.plate || "").toLowerCase().includes(q)
    );
  }, [students, schoolSearch]);

  function updateStudent(id, patch) {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, ...patch, updatedAt: nowTime() } : student
      )
    );
  }

  function handleImComing() {
    if (!selectedStudent) return;

    updateStudent(selectedStudent.id, {
      status: "a_caminho",
      responsible: parentResponsible || "Responsável",
      plate: parentPlate,
      eta: "Chegando agora",
    });

    alert("Aviso enviado para a escola.");
  }

  function handleDelay() {
    if (!selectedStudent) return;

    updateStudent(selectedStudent.id, {
      status: "atrasado",
      responsible: parentResponsible || "Responsável",
      plate: parentPlate,
      eta: delayMinutes,
    });

    alert(`Atraso informado${delayNote ? `: ${delayNote}` : "."}`);
  }

  function markArrived(id) {
    updateStudent(id, {
      status: "chegou",
    });
  }

  function markPickedUp(id) {
    updateStudent(id, {
      status: "retirado",
      eta: "",
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
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
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 36 }}>📲 Pé com Pé sem filas</h1>
            <p style={{ margin: "8px 0 0", color: "#475569" }}>
              App dos pais + painel da escola
            </p>
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
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{metrics.total}</div>
          </div>
          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>A caminho</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{metrics.a_caminho}</div>
          </div>
          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Chegaram</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{metrics.chegou}</div>
          </div>
          <div style={cardStyle()}>
            <div style={{ color: "#64748b", fontSize: 14 }}>Retirados</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{metrics.retirado}</div>
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
                Avise a escola que está a caminho ou informe atraso.
              </p>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
                  Aluno
                </label>
                <select
                  value={parentStudentId}
                  onChange={(e) => setParentStudentId(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                  }}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} • {student.className}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
                  Quem vai buscar
                </label>
                <input
                  value={parentResponsible}
                  onChange={(e) => setParentResponsible(e.target.value)}
                  placeholder="Ex.: Pai do Gabriel"
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
                  Placa do veículo
                </label>
                <input
                  value={parentPlate}
                  onChange={(e) => setParentPlate(e.target.value.toUpperCase())}
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
                onClick={handleImComing}
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

              <div style={{ ...cardStyle(), marginTop: 20, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Avisar atraso</h3>

                <div style={{ marginBottom: 12 }}>
                  <select
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option>5 min</option>
                    <option>10 min</option>
                    <option>15 min</option>
                    <option>20 min</option>
                    <option>30 min</option>
                    <option>45 min</option>
                    <option>1 hora</option>
                  </select>
                </div>

                <textarea
                  value={delayNote}
                  onChange={(e) => setDelayNote(e.target.value)}
                  placeholder="Motivo do atraso"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  onClick={handleDelay}
                  style={{
                    ...buttonStyle(false),
                    width: "100%",
                    marginTop: 12,
                  }}
                >
                  ⏰ Avisar atraso
                </button>
              </div>
            </div>

            <div style={cardStyle()}>
              <h2 style={{ marginTop: 0 }}>Resumo do aluno</h2>
              {selectedStudent && (
                <>
                  <p>
                    <strong>Nome:</strong> {selectedStudent.name}
                  </p>
                  <p>
                    <strong>Turma:</strong> {selectedStudent.className}
                  </p>
                  <p>
                    <strong>Responsável:</strong> {selectedStudent.responsible}
                  </p>
                  <p>
                    <strong>Placa:</strong> {selectedStudent.plate || "—"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span style={badgeStyle(selectedStudent.status)}>
                      {statusLabel[selectedStudent.status]}
                    </span>
                  </p>
                  <p>
                    <strong>Última atualização:</strong> {selectedStudent.updatedAt}
                  </p>
                  <p>
                    <strong>Previsão:</strong> {selectedStudent.eta || "—"}
                  </p>
                </>
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
                  width: 320,
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
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 16,
                    background: "#fff",
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{student.name}</div>
                      <div style={{ color: "#64748b", marginTop: 4 }}>
                        {student.className}
                      </div>
                    </div>
                    <div>
                      <span style={badgeStyle(student.status)}>
                        {statusLabel[student.status]}
                      </span>
                    </div>
                  </div>

                  <div style={{ color: "#334155" }}>
                    <strong>Responsável:</strong> {student.responsible}
                  </div>

                  <div style={{ color: "#334155" }}>
                    <strong>Placa:</strong> {student.plate || "—"}
                  </div>

                  <div style={{ color: "#334155" }}>
                    <strong>Previsão:</strong> {student.eta || "—"} •{" "}
                    <strong>Atualizado às:</strong> {student.updatedAt}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      style={buttonStyle(false)}
                      onClick={() => markArrived(student.id)}
                    >
                      Marcar chegada
                    </button>
                    <button
                      style={buttonStyle(true)}
                      onClick={() => markPickedUp(student.id)}
                    >
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
