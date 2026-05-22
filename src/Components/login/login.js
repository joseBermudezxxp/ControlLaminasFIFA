import React, { useState } from "react";
import "./login.css";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

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
        window.dispatchEvent(
          new CustomEvent("wc-loader", {
            detail: { visible: true },
          })
        );
      }

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);

      // Separar nombre y apellido
      const fullName = user.displayName || "";
      const nameParts = fullName.split(" ");

      const nombre = nameParts[0] || "";
      const apellido = nameParts.slice(1).join(" ") || "";

      const data = {
        uid: user.uid,
        nombre,
        apellido,
        rol: "usuario",
        email: user.email || "",
        fotoURL: user.photoURL || "",
      };

      // Solo crear fechaRegistro si el usuario no existe
      if (!userSnap.exists()) {
        data.fechaRegistro = serverTimestamp();
      }

      await setDoc(userRef, data, { merge: true });

      setLoading(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wc-loader", {
            detail: { visible: false },
          })
        );
      }
    } catch (error) {
      console.error(error);

      showToast("Error al iniciar sesión", "error");

      setLoading(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wc-loader", {
            detail: { visible: false },
          })
        );
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

          <button
            className="google-btn"
            onClick={loginGoogle}
            disabled={loading}
            aria-busy={loading}
          >
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