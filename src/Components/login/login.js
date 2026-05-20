import React, { useState } from "react";
import "./login.css";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../../server/api";

const provider = new GoogleAuthProvider();

const Login = () => {
  const [loading, setLoading] = useState(false);

  const loginGoogle = async () => {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Separar nombre y apellido (Google devuelve displayName completo)
      const fullName = user.displayName || "";
      const nameParts = fullName.split(" ");

      const nombre = nameParts[0] || "";
      const apellido = nameParts.slice(1).join(" ") || "";

      await setDoc(
        doc(db, "usuarios", user.uid),
        {
          uid: user.uid,
          nombre: nombre,
          apellido: apellido,
          email: user.email || "",
          fotoURL: user.photoURL || "",
          fechaRegistro: serverTimestamp(),
        },
        { merge: true }
      );

      alert(`Bienvenido ${fullName}`);
    } catch (error) {
      console.error(error);
      alert("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>World Cup Album</h1>

        <p>Inicia sesión con Google</p>

        <button className="google-btn" onClick={loginGoogle}>
          <img
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
            alt="Google"
          />

          {loading ? "Cargando..." : "Continuar con Google"}
        </button>
      </div>
    </div>
  );
};

export default Login;