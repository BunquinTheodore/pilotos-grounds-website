// Firebase Web SDK config — safe to expose client-side (real access control
// lives in firestore.rules / storage.rules, not in hiding this object).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZY2UZVhFk33Pg_-AAvO-DziI9xd0Ggxs",
  authDomain: "pilotos-grounds.firebaseapp.com",
  projectId: "pilotos-grounds",
  storageBucket: "pilotos-grounds.firebasestorage.app",
  messagingSenderId: "849439888424",
  appId: "1:849439888424:web:9825807967ddf680db911d"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
