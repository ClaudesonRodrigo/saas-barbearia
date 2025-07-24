// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config'; // Importamos o 'db' do firestore
import { doc, getDoc } from "firebase/firestore"; // Funções para ler um documento
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // Novo estado
  const [loading, setLoading] = useState(true);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const idTokenResult = await user.getIdTokenResult(true);
        const role = idTokenResult.claims.role || null;
        setUserRole(role);

        // Se o utilizador for um dono de barbearia, verificamos o estado da sua assinatura
        if (role === 'shopOwner') {
          const barbershopId = idTokenResult.claims.barbershopId;
          if (barbershopId) {
            const shopDocRef = doc(db, "barbershops", barbershopId);
            const shopDoc = await getDoc(shopDocRef);
            if (shopDoc.exists()) {
              // CORREÇÃO: Se o estado não existir, assume-se 'inactive'
              setSubscriptionStatus(shopDoc.data().subscriptionStatus || 'inactive');
            } else {
              setSubscriptionStatus('inactive');
            }
          } else {
            setSubscriptionStatus('inactive');
          }
        } else {
          setSubscriptionStatus(null); // Reset para outros tipos de utilizador
        }
      } else {
        setUserRole(null);
        setSubscriptionStatus(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    subscriptionStatus, // Disponibilizamos o estado da assinatura
    loading,
    login,
    logout
  };

  
}
