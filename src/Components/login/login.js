import React, { useState } from "react";
import "./login.css";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../../server/api";
import Carga from "../../Resources/carga/carga";
import { showToast } from "../../Resources/toast/ToastContainer";

const provider = new GoogleAuthProvider();

const Login = () => {
  const [loading, setLoading] = useState(false);

  const loginGoogle = async () => {
    try {
      setLoading(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wc-loader", { detail: { visible: true } }));
      }

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
          rol: "usuario",
          apellido: apellido,
          email: user.email || "",
          fotoURL: user.photoURL || "",
          fechaRegistro: serverTimestamp(),
        },
        { merge: true }
      );
      setLoading(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wc-loader", { detail: { visible: false } }));
      }
    } catch (error) {
      console.error(error);
      showToast("Error al iniciar sesión", "error");
      setLoading(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wc-loader", { detail: { visible: false } }));
      }
    }
  };

  return (
    <>
      <Carga visible={loading} />

      <div className="login-container">
        <div className="login-card">
        <h1>World Cup Album</h1>

        <p>Inicia sesión con Google</p>

        <button className="google-btn" onClick={loginGoogle} disabled={loading} aria-busy={loading}>
          <img
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
            alt="Google"
          />
          Continuar con Google
        </button>
        </div>
      </div>
    </>
  );
};

export default Login;