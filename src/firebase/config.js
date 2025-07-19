// src/firebase/config.js (VERSÃO CORRIGIDA)

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "saas-barbearia-2e845.firebaseapp.com",
  // ... resto das suas chaves
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;