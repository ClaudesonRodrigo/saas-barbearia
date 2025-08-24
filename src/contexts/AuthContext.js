// src/contexts/AuthContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from "firebase/firestore";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  // 1. IMPORTAMOS O PROVEDOR DO GOOGLE E A FUNÇÃO DE POPUP
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    // ... (sua função de login com email/senha permanece igual)
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (user) {
      const idTokenResult = await user.getIdTokenResult(true);
      const role = idTokenResult.claims.role || null;
      setUserRole(role);
      return { user, role };
    }
    return null;
  };
  
  const logout = () => signOut(auth);

  // --- 2. NOVA FUNÇÃO PARA LOGIN COM GOOGLE ---
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (user) {
      const token = await user.getIdToken();
      // Chama nosso backend para criar o perfil e definir o papel, se for um novo usuário
      const response = await fetch('/.netlify/functions/handle-social-login', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return { user, role: data.role }; // Retorna o papel que o backend confirmou
    }
    return null;
  };
  
  useEffect(() => {
    // ... (seu useEffect do onAuthStateChanged permanece igual)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const idTokenResult = await user.getIdTokenResult(true);
        const role = idTokenResult.claims.role || null;
        setUserRole(role);

        if (role === 'shopOwner') {
          const barbershopId = idTokenResult.claims.barbershopId;
          if (barbershopId) {
            const shopDocRef = doc(db, "barbershops", barbershopId);
            const shopDoc = await getDoc(shopDocRef);
            if (shopDoc.exists()) {
              const shopData = shopDoc.data();
              setSubscriptionStatus(shopData.subscriptionStatus || 'inactive');
              setPlanId(shopData.planId || null);
            } else {
              setSubscriptionStatus('inactive');
              setPlanId(null);
            }
          } else {
            setSubscriptionStatus('inactive');
            setPlanId(null);
          }
        } else {
          setSubscriptionStatus(null);
          setPlanId(null);
        }
      } else {
        setUserRole(null);
        setSubscriptionStatus(null);
        setPlanId(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    subscriptionStatus,
    planId,
    loading,
    login,
    logout,
    // 3. EXPORTAMOS A NOVA FUNÇÃO
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}