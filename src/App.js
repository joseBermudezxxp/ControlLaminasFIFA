import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "./server/api";

import Login from "./Components/login/login";
import Navbar from "./Resources/navbar/navbar";
import Home from "./Components/home/home";
import Footer from "./Resources/footer/footer";
import Cargar from "./Components/adminalbum/cargar";
import AdquirirAlbum from "./Components/adminalbum/adquiriralbum/adquiriralbum";
import CargarLaminas from "./Components/adminalbum/cargarlaminas";
import Contenido from "./Components/home/contenido/contenido";
import Amigos from "./amigos/amigos";

import Carga from "./Resources/carga/carga";
import ToastContainer from "./Resources/toast/ToastContainer";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [albums, setAlbums] = useState([]);

  const [cargarModalOpen, setCargarModalOpen] = useState(false);
  const [adquirirModalOpen, setAdquirirModalOpen] = useState(false);
  const [cargarLaminasOpen, setCargarLaminasOpen] = useState(false);

  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [amigosView, setAmigosView] = useState(false);

  // ================= RECARGAR ÁLBUMES =================
  const fetchAlbums = async (uid) => {
    try {
      const albumsQuery = query(
        collection(db, "album_usuario"),
        where("idUsuario", "==", uid)
      );

      const albumsSnap = await getDocs(albumsQuery);

      setAlbums(
        albumsSnap.docs.map((docu) => ({
          id: docu.id,
          ...docu.data(),
        }))
      );
    } catch (err) {
      console.error("Error recargando álbumes:", err);
    }
  };

  // ================= AUTH =================
  useEffect(() => {
    let unsubscribeAlbums = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (currentUser) => {
        try {
          if (currentUser) {
            // ================= USER DATA =================
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

            // ================= REALTIME ÁLBUMES =================
            try {
              const albumsQuery = query(
                collection(db, "album_usuario"),
                where("idUsuario", "==", currentUser.uid)
              );

              unsubscribeAlbums = onSnapshot(
                albumsQuery,
                (snapshot) => {
                  setAlbums(
                    snapshot.docs.map((docu) => ({
                      id: docu.id,
                      ...docu.data(),
                    }))
                  );
                },
                (err) => {
                  console.error(
                    "Error realtime álbumes:",
                    err
                  );

                  setAlbums([]);
                }
              );
            } catch (err) {
              console.error(
                "Error iniciando realtime álbumes:",
                err
              );

              setAlbums([]);
            }
          } else {
            setUser(null);
            setAlbums([]);

            if (unsubscribeAlbums) {
              unsubscribeAlbums();
              unsubscribeAlbums = null;
            }
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeAlbums) {
        unsubscribeAlbums();
      }
    };
  }, []);

  // ================= LOADER GLOBAL =================
  useEffect(() => {
    const handleLoaderEvent = (event) => {
      const visible = event?.detail?.visible;

      if (typeof visible === "boolean") {
        setActionLoading(visible);
      }
    };

    window.addEventListener(
      "wc-loader",
      handleLoaderEvent
    );

    return () => {
      window.removeEventListener(
        "wc-loader",
        handleLoaderEvent
      );
    };
  }, []);

  // ================= RENDER =================
  return (
    <>
      {/* TOAST */}
      <ToastContainer />

      {/* LOADER */}
      <Carga visible={loading || actionLoading} />

      {/* LOGIN */}
      {!loading && !user && <Login />}

      {/* APP */}
      {!loading && user && (
        <div className="app-container">
          <Navbar
            user={user}
            onOpenCargar={() =>
              setCargarModalOpen(true)
            }
            onOpenAdquirir={() =>
              setAdquirirModalOpen(true)
            }
            onOpenCargarLaminas={() =>
              setCargarLaminasOpen(true)
            }
            onOpenAmigos={() =>
              setAmigosView(true)
            }
          />

          {amigosView ? (
            <Amigos
              user={user}
              albums={albums}
              onBack={() => {
                setAmigosView(false);
                setSelectedAlbum(null);
              }}
            />
          ) : selectedAlbum ? (
            <Contenido
              album={selectedAlbum}
              onBack={() =>
                setSelectedAlbum(null)
              }
            />
          ) : (
            <>
              <Home
                user={user}
                albums={albums}
                onSelectAlbum={setSelectedAlbum}
              />

              <Footer />
            </>
          )}

          {/* MODAL CARGAR */}
          <Cargar
            isOpen={cargarModalOpen}
            onClose={() =>
              setCargarModalOpen(false)
            }
          />

          {/* MODAL ADQUIRIR */}
          <AdquirirAlbum
            isOpen={adquirirModalOpen}
            onClose={() =>
              setAdquirirModalOpen(false)
            }
            onAlbumAcquired={() =>
              fetchAlbums(user.uid)
            }
          />

          {/* MODAL CARGAR LÁMINAS */}
          <CargarLaminas
            isOpen={cargarLaminasOpen}
            onClose={() =>
              setCargarLaminasOpen(false)
            }
          />
        </div>
      )}
    </>
  );
}

export default App;