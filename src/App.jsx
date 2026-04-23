import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "./firebase";

const alertSound = new Audio("/sounds/alert.mp3");

export default function App() {
  const [students, setStudents] = useState([]);
  const [view, setView] = useState("pais");
  const [selectedId, setSelectedId] = useState("");

  // 🔥 ESCUTA EM TEMPO REAL
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(data);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 ATUALIZAR STATUS
  const updateStudent = async (id, updates) => {
    const ref = doc(db, "students", id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toLocaleTimeString()
    });
  };

  // 🔊 SOM
  const playSound = () => {
    alertSound.currentTime = 0;
    alertSound.play();
  };

  // 🚗 PAI CLICOU "ESTOU CHEGANDO"
  const handleChegando = () => {
    if (!selectedId) return alert("Selecione um aluno");

    updateStudent(selectedId, {
      status: "a-caminho",
      eta: "5 min"
    });

    playSound();
  };

  // 🏫 ESCOLA MARCA CHEGADA
  const handleChegada = (id) => {
    updateStudent(id, {
      status: "chegou",
      eta: ""
    });
  };

  // 🏫 CONFIRMAR RETIRADA
  const handleRetirada = (id) => {
    updateStudent(id, {
      status: "retirado"
    });
  };

  // 📊 CONTADORES
  const stats = {
    total: students.length,
    caminho: students.filter(s => s.status === "a-caminho").length,
    chegou: students.filter(s => s.status === "chegou").length,
    retirado: students.filter(s => s.status === "retirado").length
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🚗 BuscaFácil</h1>

      <button onClick={() => setView("pais")}>Área dos pais</button>
      <button onClick={() => setView("escola")}>Painel da escola</button>

      <hr />

      <div>
        <strong>Total:</strong> {stats.total} |{" "}
        <strong>A caminho:</strong> {stats.caminho} |{" "}
        <strong>Chegaram:</strong> {stats.chegou} |{" "}
        <strong>Retirados:</strong> {stats.retirado}
      </div>

      <hr />

      {view === "pais" && (
        <div>
          <h2>Área dos pais</h2>

          <select onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Selecione o aluno</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <br /><br />

          <button onClick={handleChegando}>
            🚗 Estou chegando
          </button>
        </div>
      )}

      {view === "escola" && (
        <div>
          <h2>Painel da escola</h2>

          {students.map(s => (
            <div key={s.id} style={{
              border: "1px solid #ccc",
              margin: 10,
              padding: 10,
              borderRadius: 10
            }}>
              <strong>{s.name}</strong> <br />
              Status: <b>{s.status}</b> <br />
              ETA: {s.eta || "-"} <br />
              Atualizado: {s.updatedAt || "-"}

              <br /><br />

              <button onClick={() => handleChegada(s.id)}>
                Marcar chegada
              </button>

              <button onClick={() => handleRetirada(s.id)}>
                Confirmar retirada
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
