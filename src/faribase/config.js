import { initializeApp } from "firebase/app";
// Importe os serviços que vamos usar
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // Você tinha este, vamos mantê-lo

// Sua configuração do Firebase está correta
const firebaseConfig = {
  apiKey: "AIzaSyDHZjlFeBZFkD7wNVCC_yAkCVwOZ7O7Vu8",
  authDomain: "saas-barbearia-2e845.firebaseapp.com",
  projectId: "saas-barbearia-2e845",
  storageBucket: "saas-barbearia-2e845.firebasestorage.app",
  messagingSenderId: "56073958677",
  appId: "1:56073958677:web:dc19f547d75d26818f251c",
  measurementId: "G-RFHCKGLMTN"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// CRÍTICO: Inicializa e exporta os serviços para o resto do app poder usar
export const auth = getAuth(app);
export const db = getFirestore(app);

// A linha de analytics é opcional para a nossa lógica principal, mas pode manter
const analytics = getAnalytics(app);

// Exportação padrão (opcional, mas boa prática)
export default app;