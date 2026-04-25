import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";

export default function App() {
  const [students, setStudents] = useState([]);
  const [view, setView] = useState("pais");

  // 🔊 SOM
  function playSound() {
    const audio = new Audio("/sounds/alert.mp3");
    audio.volume = 0.7;
    audio.play().catch(() => {});
  }

  // 🔄 FIREBASE TEMPO REAL
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "students"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(data);
    });

    return () => unsub();
  }, []);

  // 🚗 AÇÕES
  const handleChegando = async (s) => {
    await updateDoc(doc(db, "students", s.id), {
      status: "a caminho",
      time: new Date().toLocaleTimeString().slice(0, 5)
    });
    playSound();
  };

  const handleChegada = async (s) => {
    await updateDoc(doc(db, "students", s.id), {
      status: "chegou"
    });
    playSound();
  };

  const handleRetirada = async (s) => {
    await updateDoc(doc(db, "students", s.id), {
      status: "retirado"
    });
    playSound();
  };

  // 📊 CONTADORES
  const total = students.length;
  const aCaminho = students.filter(s => s.status === "a caminho").length;
  const chegaram = students.filter(s => s.status === "chegou").length;
  const retirados = students.filter(s => s.status === "retirado").length;

  return (
    <div style={{ fontFamily: "Arial", background: "#f4f6f8", minHeight: "100vh", padding: 20 }}>
      
      {/* HEADER */}
      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h1 style={{ margin: 0 }}>🚗 BuscaFácil</h1>
          <small>Transporte escolar com segurança</small>
        </div>

        <div>
          <button onClick={() => setView("pais")} style={btn(view === "pais")}>Área dos pais</button>
          <button onClick={() => setView("escola")} style={btn(view === "escola")}>Painel da escola</button>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Card title="Alunos" value={total} />
        <Card title="A caminho" value={aCaminho} />
        <Card title="Chegaram" value={chegaram} />
        <Card title="Retirados" value={retirados} />
      </div>

      {/* PAIS */}
      {view === "pais" && (
        <div style={box}>
          <h2>Área dos pais</h2>

          {students.map((s) => (
            <div key={s.id} style={item}>
              <div>
                <b>{s.name}</b>
                <div>{s.className}</div>
              </div>

              <button onClick={() => handleChegando(s)} style={primaryBtn}>
                🚗 Estou chegando
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ESCOLA */}
      {view === "escola" && (
        <div style={box}>
          <h2>Painel da escola</h2>

          {students.map((s) => (
            <div key={s.id} style={item}>
              <div>
                <b>{s.name}</b>
                <div>{s.className}</div>
                <div>Status: {s.status}</div>
                <div>Hora: {s.time || "--:--"}</div>
              </div>

              <div>
                <button onClick={() => handleChegada(s)} style={secondaryBtn}>
                  Chegou
                </button>

                <button onClick={() => handleRetirada(s)} style={dangerBtn}>
                  Retirar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 🎨 COMPONENTES

const Card = ({ title, value }) => (
  <div style={{
    background: "#fff",
    padding: 15,
    borderRadius: 10,
    flex: 1
  }}>
    <small>{title}</small>
    <h2>{value}</h2>
  </div>
);

const btn = (active) => ({
  marginLeft: 10,
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  background: active ? "#0d1b2a" : "#ddd",
  color: active ? "#fff" : "#000"
});

const primaryBtn = {
  background: "#0d1b2a",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer"
};

const secondaryBtn = {
  marginRight: 5,
  background: "#ccc",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer"
};

const dangerBtn = {
  background: "#d9534f",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
  cursor: "pointer"
};

const box = {
  background: "#fff",
  padding: 20,
  borderRadius: 12
};

const item = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #eee",
  padding: "10px 0"
};
