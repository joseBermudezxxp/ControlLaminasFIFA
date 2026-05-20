import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./server/api";

import Login from "./Components/login/login";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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

  // 👤 Si hay usuario → app principal
  return (
    <div style={{ padding: 20 }}>
      <h1>Bienvenido 👋</h1>

      <img
        src={user.photoURL}
        alt="foto"
        style={{ width: 60, borderRadius: "50%" }}
      />

      <p>{user.displayName}</p>
      <p>{user.email}</p>

      <button onClick={() => signOut(auth)}>
        Cerrar sesión
      </button>
    </div>
  );
}

export default App;