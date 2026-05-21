// App.js

import React, {
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "./server/api";

import Login from "./Components/login/login";

import Navbar from "./Resources/navbar/navbar";

import Home from "./Components/home/home";

import Footer from "./Resources/footer/footer";

import Cargar from "./Components/adminalbum/cargar";

import AdquirirAlbum from "./Components/adminalbum/adquiriralbum/adquiriralbum";

import CargarLaminas from "./Components/adminalbum/cargarlaminas";

import "./App.css";

function App() {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // MODALS
  const [
    cargarModalOpen,
    setCargarModalOpen,
  ] = useState(false);

  const [
    adquirirModalOpen,
    setAdquirirModalOpen,
  ] = useState(false);

  const [
    cargarLaminasOpen,
    setCargarLaminasOpen,
  ] = useState(false);

  // =========================
  // AUTH
  // =========================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (
          currentUser
        ) => {

          if (currentUser) {

            const userDocRef =
              doc(
                db,
                "usuarios",
                currentUser.uid
              );

            const userDocSnap =
              await getDoc(
                userDocRef
              );

            if (
              userDocSnap.exists()
            ) {

              const userData =
                userDocSnap.data();

              setUser({
                ...currentUser,

                rol:
                  userData.rol ||
                  "usuario",
              });

            } else {

              setUser(
                currentUser
              );

            }

          } else {

            setUser(null);

          }

          setLoading(false);

        }
      );

    return () =>
      unsubscribe();

  }, []);

  // =========================
  // LOADING
  // =========================

  if (loading) {

    return (
      <h2
        style={{
          textAlign:
            "center",
        }}
      >
        Cargando...
      </h2>
    );
  }

  // =========================
  // LOGIN
  // =========================

  if (!user) {

    return <Login />;

  }

  // =========================
  // APP
  // =========================

  return (
    <div className="app-container">

      <Navbar
        user={user}

        onOpenCargar={() =>
          setCargarModalOpen(
            true
          )
        }

        onOpenAdquirir={() =>
          setAdquirirModalOpen(
            true
          )
        }

        onOpenCargarLaminas={() =>
          setCargarLaminasOpen(
            true
          )
        }
      />

      {/* HOME */}
      <Home user={user} />

      {/* FOOTER */}
      <Footer />

      {/* CARGAR MUNDIAL */}
      <Cargar
        isOpen={
          cargarModalOpen
        }
        onClose={() =>
          setCargarModalOpen(
            false
          )
        }
      />

      {/* ADQUIRIR */}
      <AdquirirAlbum
        isOpen={
          adquirirModalOpen
        }
        onClose={() =>
          setAdquirirModalOpen(
            false
          )
        }
      />

      {/* CARGAR LAMINAS */}
      <CargarLaminas
        isOpen={
          cargarLaminasOpen
        }
        onClose={() =>
          setCargarLaminasOpen(
            false
          )
        }
      />

    </div>
  );
}

export default App;