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

  // 🔊 SOM DE ALERTA
  function playSound() {
    if (typeof window === "undefined") return;

    const audio = new Audio("/sounds/alert.mp3");
    audio.currentTime = 0;
    audio.volume = 0.8;

    audio.play().catch(() => {
      console.log("Som bloqueado até interação do usuário");
    });

    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }

  // 🔄 TEMPO REAL FIREBASE
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

  // 🚗 BOTÃO "ESTOU CHEGANDO"
  const handleChegando = async (student) => {
    await updateDoc(doc(db, "students", student.id), {
      status: "a caminho",
      time: new Date().toLocaleTimeString().slice(0, 5)
    });

    playSound();
  };

  // 🏫 MARCAR CHEGADA
  const handleChegada = async (student) => {
    await updateDoc(doc(db, "students", student.id), {
      status: "chegou"
    });

    playSound();
  };

  // 👋 CONFIRMAR RETIRADA
  const handleRetirada = async (student) => {
    await updateDoc(doc(db, "students", student.id), {
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
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🚗 BuscaFácil</h1>

      <button onClick={() => setView("pais")}>Área dos pais</button>
      <button onClick={() => setView("escola")}>Painel da escola</button>

      <hr />

      <p>
        <b>Total:</b> {total} | <b>A caminho:</b> {aCaminho} |{" "}
        <b>Chegaram:</b> {chegaram} | <b>Retirados:</b> {retirados}
      </p>

      <hr />

      {/* 👨‍👩‍👧 ÁREA DOS PAIS */}
      {view === "pais" && (
        <div>
          <h2>Área dos pais</h2>

          {students.map((student) => (
            <div key={student.id} style={{ marginBottom: 10 }}>
              <p>
                <b>{student.name}</b> - {student.className}
              </p>

              <button onClick={() => handleChegando(student)}>
                🚗 Estou chegando
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 🏫 PAINEL DA ESCOLA */}
      {view === "escola" && (
        <div>
          <h2>Painel da escola</h2>

          {students.length === 0 && <p>Nenhum aluno encontrado.</p>}

          {students.map((student) => (
            <div
              key={student.id}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                marginBottom: 10,
                borderRadius: 10
              }}
            >
              <p><b>{student.name}</b></p>
              <p>Turma: {student.className}</p>
              <p>Status: {student.status}</p>
              <p>Hora: {student.time || "--:--"}</p>

              <button onClick={() => handleChegada(student)}>
                Marcar chegada
              </button>

              <button onClick={() => handleRetirada(student)}>
                Confirmar retirada
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
