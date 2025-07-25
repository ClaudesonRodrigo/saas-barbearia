// src/contexts/AuthContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config'; // Importamos o 'db' do firestore
import { doc, getDoc } from "firebase/firestore"; // Funções para ler um documento
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [planId, setPlanId] = useState(null); // Novo estado para o plano
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

        if (role === 'shopOwner') {
          const barbershopId = idTokenResult.claims.barbershopId;
          if (barbershopId) {
            const shopDocRef = doc(db, "barbershops", barbershopId);
            const shopDoc = await getDoc(shopDocRef);
            if (shopDoc.exists()) {
              const shopData = shopDoc.data();
              setSubscriptionStatus(shopData.subscriptionStatus || 'inactive');
              setPlanId(shopData.planId || null); // Guardamos o ID do plano
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

  return (
    <AuthContext.Provider value={{ currentUser, userRole, subscriptionStatus, planId, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
