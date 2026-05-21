// home.js

import React, {
  useEffect,
  useState,
} from "react";

import "./home.css";

import {
  db,
} from "../../server/api";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  BookOpen,
} from "lucide-react";

const Home = ({ user }) => {

  const [albums, setAlbums] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const fetchAlbums = async () => {

      try {

        const albumsQuery = query(
          collection(
            db,
            "album_usuario"
          ),
          where(
            "idUsuario",
            "==",
            user.uid
          )
        );

        const albumsSnap =
          await getDocs(
            albumsQuery
          );

        const albumsData =
          albumsSnap.docs.map(
            (docu) => ({
              id: docu.id,
              ...docu.data(),
            })
          );

        setAlbums(albumsData);

      } catch (error) {

        console.error(
          "Error cargando álbumes:",
          error
        );

      } finally {

        setLoading(false);

      }
    };

    fetchAlbums();

  }, [user.uid]);

  // =========================
  // LOADING
  // =========================

  if (loading) {

    return (
      <div className="home-container">
        <h2>Cargando...</h2>
      </div>
    );
  }

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
                        album.numeroEstampitas
                      }{" "}
                      estampitas
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