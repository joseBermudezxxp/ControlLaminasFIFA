import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "./server/api";

import Login from "./Components/login/login";
import Navbar from "./Resources/navbar/navbar";
import Home from "./Components/home/home";
import Footer from "./Resources/footer/footer";
import Cargar from "./Components/adminalbum/cargar";
import AdquirirAlbum from "./Components/adminalbum/adquiriralbum/adquiriralbum";
import CargarLaminas from "./Components/adminalbum/cargarlaminas";
import Contenido from "./Components/home/contenido/contenido";

// ✅ Importa el componente React, no como script suelto
import Carga from "./Resources/carga/carga";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState([]);

  const [cargarModalOpen, setCargarModalOpen] = useState(false);
  const [adquirirModalOpen, setAdquirirModalOpen] = useState(false);
  const [cargarLaminasOpen, setCargarLaminasOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userDocRef = doc(db, "usuarios", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({ ...currentUser, rol: userData.rol || "usuario" });
          } else {
            setUser(currentUser);
          }

          try {
            const albumsQuery = query(
              collection(db, "album_usuario"),
              where("idUsuario", "==", currentUser.uid)
            );
            const albumsSnap = await getDocs(albumsQuery);
            setAlbums(albumsSnap.docs.map((docu) => ({ id: docu.id, ...docu.data() })));
          } catch (err) {
            console.error("Error cargando álbumes en App:", err);
            setAlbums([]);
          }
        } else {
          setUser(null);
          setAlbums([]);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* ✅ El componente se muestra mientras loading=true y se oculta solo */}
      <Carga visible={loading} />

      {/* ✅ Renderizamos todo siempre, Carga tapa la pantalla con position:fixed */}
      {!loading && !user && <Login />}

      {!loading && user && (
        <div className="app-container">
          <Navbar
            user={user}
            onOpenCargar={() => setCargarModalOpen(true)}
            onOpenAdquirir={() => setAdquirirModalOpen(true)}
            onOpenCargarLaminas={() => setCargarLaminasOpen(true)}
          />

          {selectedAlbum ? (
            <Contenido album={selectedAlbum} onBack={() => setSelectedAlbum(null)} />
          ) : (
            <>
              <Home user={user} albums={albums} onSelectAlbum={setSelectedAlbum} />
              <Footer />
            </>
          )}

          <Cargar isOpen={cargarModalOpen} onClose={() => setCargarModalOpen(false)} />
          <AdquirirAlbum isOpen={adquirirModalOpen} onClose={() => setAdquirirModalOpen(false)} />
          <CargarLaminas isOpen={cargarLaminasOpen} onClose={() => setCargarLaminasOpen(false)} />
        </div>
      )}
    </>
  );
}

export default App;