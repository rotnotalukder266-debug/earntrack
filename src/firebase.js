import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqgvFr_leQ5roh7aBatx8-gnGftmGLq2M",
  authDomain: "earntrack-8ca5a.firebaseapp.com",
  projectId: "earntrack-8ca5a",
  storageBucket: "earntrack-8ca5a.firebasestorage.app",
  messagingSenderId: "681234743388",
  appId: "1:681234743388:web:af2ec6051286c448912699",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
