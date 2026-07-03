import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) { setProfile(null); setIsAdmin(false); setLoading(false); return; }

      // listen to profile doc
      const profRef = doc(db, "users", u.uid);
      const unsubProfile = onSnapshot(profRef, (snap) => {
        setProfile(snap.exists() ? snap.data() : null);
      });

      // check admin role (one-time read; roles doc is set manually in console)
      const roleSnap = await getDoc(doc(db, "roles", u.uid));
      setIsAdmin(roleSnap.exists() && roleSnap.data().admin === true);
      setLoading(false);

      return () => unsubProfile();
    });
    return () => unsub();
  }, []);

  const signup = async (email, password, name, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      name, phone, email, createdAt: new Date().toISOString(),
    });
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, profile, isAdmin, loading, signup, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
