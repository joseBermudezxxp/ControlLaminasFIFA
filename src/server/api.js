// Import Firebase core
import { initializeApp } from "firebase/app";

// Analytics (opcional)
import { getAnalytics } from "firebase/analytics";

// 🔥 AUTH
import { getAuth } from "firebase/auth";

// 🔥 FIRESTORE
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDQJLnQLeXWyR4t4ZZXTnX4vue1yT0TpIg",
  authDomain: "controllaminasfifa.firebaseapp.com",
  projectId: "controllaminasfifa",
  storageBucket: "controllaminasfifa.firebasestorage.app",
  messagingSenderId: "69356050424",
  appId: "1:69356050424:web:39d452214020f96c1a680d",
  measurementId: "G-2DQSWWKNP1"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Servicios
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics (solo funciona en navegador)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Exportar para usar en el proyecto
export { auth, db, analytics };