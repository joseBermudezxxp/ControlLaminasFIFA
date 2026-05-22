// home.js

import React, { useEffect, useState } from "react";

import "./home.css";
import { BookOpen } from "lucide-react";
import { auth, db } from "../../server/api";
import { doc, onSnapshot } from "firebase/firestore";

const Home = ({ user, albums = [], onSelectAlbum }) => {
  const [albumStats, setAlbumStats] = useState({});

  useEffect(() => {
    if (!albums.length || !auth.currentUser?.uid) {
      setAlbumStats({});
      return;
    }

    const userId = auth.currentUser.uid;
    const unsubscribes = [];

    for (const album of albums) {
      try {
        const ref = doc(db, "album_usuario", `${userId}_${album.idMundial}`);
        const unsub = onSnapshot(
          ref,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const laminas = data?.laminas || {};
              const collectedCount = Object.values(laminas).reduce(
                (sum, qty) => sum + (Number(qty) > 0 ? 1 : 0),
                0
              );
              setAlbumStats((prev) => ({
                ...prev,
                [album.id]: { collected: collectedCount, total: album.numeroEstampitas },
              }));
            } else {
              setAlbumStats((prev) => ({
                ...prev,
                [album.id]: { collected: 0, total: album.numeroEstampitas },
              }));
            }
          },
          (error) => {
            console.error("Error en snapshot de stats del álbum:", error);
          }
        );

        unsubscribes.push(unsub);
      } catch (error) {
        console.error("Error iniciando listener de stats del álbum:", error);
        setAlbumStats((prev) => ({
          ...prev,
          [album.id]: { collected: 0, total: album.numeroEstampitas },
        }));
      }
    }

    return () => unsubscribes.forEach((u) => u && u());
  }, [albums]);

  const getPercentage = (album) => {
    const stat = albumStats[album.id];
    if (!stat) return 0;
    return Math.round((stat.collected / stat.total) * 100);
  };

  return (
    <div className="home-container">

      <div className="home-content">

        {/* TITLE */}
        <div className="welcome-section">

          <h1>
            Mis Álbumes
          </h1>

          <p>
            Tus álbumes mundialistas
            adquiridos
          </p>

        </div>

        {/* EMPTY */}
        {albums.length === 0 ? (

          <div className="empty-albums">

            <BookOpen size={55} />

            <h2>
              No tienes álbumes
            </h2>

            <p>
              Adquiere uno desde
              el menú superior
            </p>

          </div>

        ) : (

          <div className="albums-grid">

            {albums.map(
              (album) => (

                <div
                  key={album.id}
                  className="album-card"
                  onClick={() =>
                    onSelectAlbum(
                      album
                    )
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >

                  <img
                    src={
                      album.portadaAlbum
                    }
                    alt={
                      album.nombreAlbum
                    }
                    className="album-image"
                  />

                  <div className="album-content">

                    <h3>
                      {
                        album.nombreAlbum
                      }
                    </h3>

                    <p>
                      {
                        albumStats[album.id]?.collected || 0
                      }{" "}
                      / {album.numeroEstampitas}{" "}
                      estampitas
                    </p>

                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{
                          width: `${getPercentage(album)}%`
                        }}
                      ></div>
                    </div>

                    <p className="progress-text">
                      {getPercentage(album)}% completado
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>
    </div>
  );
};

export default Home;
