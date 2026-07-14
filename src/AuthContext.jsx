import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const isPhoneLike = (v) => /^0?1\d{9}$/.test(v.replace(/[\s-]/g, ""));
const normalizePhone = (v) => {
  let p = v.replace(/[\s-]/g, "");
  if (p.startsWith("+880")) p = "0" + p.slice(4);
  if (p.startsWith("880")) p = "0" + p.slice(3);
  return p;
};

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
    // ফোন নম্বর দিয়ে পরে লগইন করা যাবে বলে একটা লুকআপ রেকর্ড রাখা হচ্ছে
    if (phone) {
      const normalized = normalizePhone(phone);
      try {
        await setDoc(doc(db, "phoneLookup", normalized), { email });
      } catch (e) {
        console.error("Phone lookup save failed:", e);
      }
    }
  };

  // identifier = ইমেইল অথবা ফোন নম্বর, দুটোই গ্রহণ করা হয়
  const login = async (identifier, password) => {
    const trimmed = identifier.trim();
    let email = trimmed;
    if (isPhoneLike(trimmed)) {
      const normalized = normalizePhone(trimmed);
      const snap = await getDoc(doc(db, "phoneLookup", normalized));
      if (!snap.exists()) {
        throw new Error("এই ফোন নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি");
      }
      email = snap.data().email;
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  // identifier = ইমেইল অথবা ফোন নম্বর
  const resetPassword = async (identifier) => {
    const trimmed = identifier.trim();
    let email = trimmed;
    if (isPhoneLike(trimmed)) {
      const normalized = normalizePhone(trimmed);
      const snap = await getDoc(doc(db, "phoneLookup", normalized));
      if (!snap.exists()) {
        throw new Error("এই ফোন নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি");
      }
      email = snap.data().email;
    }
    await sendPasswordResetEmail(auth, email);
    return email;
  };

  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, profile, isAdmin, loading, signup, login, logout, resetPassword }}>
      {children}
    </AuthCtx.Provider>
  );
}
