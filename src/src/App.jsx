import { useState } from "react";

export default function App() {
  const [fila, setFila] = useState([]);
  const [nome, setNome] = useState("");

  function adicionar() {
    if (!nome) return alert("Digite o nome");
    setFila([...fila, nome]);
    setNome("");
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 20, textAlign: "center" }}>
      <h1>📲 Pé com Pé sem filas</h1>

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do aluno"
        style={{ padding: 10 }}
      />

      <br />

      <button onClick={adicionar} style={{ marginTop: 10, padding: 10 }}>
        Estou chegando
      </button>

      <h2>Fila</h2>

      {fila.map((n, i) => (
        <div key={i} style={{
          background: "#fff",
          margin: 10,
          padding: 10,
          borderRadius: 8,
          boxShadow: "0 0 5px rgba(0,0,0,0.1)"
        }}>
          {i + 1}º - {n}
        </div>
      ))}
    </div>
  );
}
