// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHFyCiYjiDULXKqIvYO9Y6gIe5nmwYnJc",
  authDomain: "ostatni-slad.firebaseapp.com",
  projectId: "ostatni-slad",
  storageBucket: "ostatni-slad.firebasestorage.app",
  messagingSenderId: "523172801999",
  appId: "1:523172801999:web:e261a354d214190971f6ba",
  measurementId: "G-YKPJXM6MH8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
