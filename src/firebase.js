import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyClCef5Zb9ogolvz6kty5kFeAXMWc7T75w",
  authDomain: "pe-com-pe-sem-filas.firebaseapp.com",
  projectId: "pe-com-pe-sem-filas",
  storageBucket: "pe-com-pe-sem-filas.firebasestorage.app",
  messagingSenderId: "799366785304",
  appId: "1:799366785304:web:88d736284e396544d9566d"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// 🔥 ATIVA O BANCO EM TEMPO REAL
export const db = getFirestore(app);
