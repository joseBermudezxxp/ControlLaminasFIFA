import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./server/api";

import Login from "./Components/login/login";
import Navbar from "./Resources/navbar/navbar";
import Home from "./Components/home/home";
import Footer from "./Resources/footer/footer";
import Cargar from "./Components/adminalbum/cargar";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cargarModalOpen, setCargarModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Obtener datos adicionales de Firestore (incluyendo rol)
        const userDocRef = doc(db, "usuarios", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUser({
            ...currentUser,
            rol: userData.rol || "usuario",
          });
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Cargando...</h2>;
  }

  // 🔐 Si NO hay usuario → login
  if (!user) {
    return <Login />;
  }

  // 👤 Si hay usuario → app principal con estructura completa
  return (
    <div className="app-container">
      <Navbar user={user} onOpenCargar={() => setCargarModalOpen(true)} />
      <Home user={user} />
      <Footer />
      <Cargar isOpen={cargarModalOpen} onClose={() => setCargarModalOpen(false)} />
    </div>
  );
}

export default App;