import React, { useEffect, useState } from "react";
import "./adquiriralbum.css";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../../server/api";
import { showToast } from "../../../Resources/toast/ToastContainer";

import {
  X,
  BookOpen,
  Hash,
} from "lucide-react";

const AdquirirAlbum = ({
  isOpen,
  onClose,
  onAlbumAcquired,
}) => {

  const [mundiales, setMundiales] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    selectedAlbum,
    setSelectedAlbum,
  ] = useState(null);

  const [buying, setBuying] =
    useState(false);

  useEffect(() => {

    if (isOpen) {
      cargarMundiales();
    }

  }, [isOpen]);

  // =========================
  // CARGAR ALBUMES
  // =========================

  const cargarMundiales = async () => {

    try {

      setLoading(true);

      const querySnapshot =
        await getDocs(
          collection(db, "mundial")
        );

      const data =
        querySnapshot.docs.map(
          (docu) => ({
            id: docu.id,
            ...docu.data(),
          })
        );

      setMundiales(data);

    } catch (error) {

      console.error(error);

      showToast(
        "Error cargando álbumes",
        "error"
      );

    } finally {

      setLoading(false);

    }
  };

  // =========================
  // ADQUIRIR ALBUM
  // =========================

  const adquirirAlbum = async () => {

    try {

      setBuying(true);

      const user =
        auth.currentUser;

      if (!user) {

        showToast(
          "Debes iniciar sesión",
          "error"
        );

        return;
      }

      // ID UNICO
      const albumUserId =
        `${user.uid}_${selectedAlbum.id}`;

      const existingAlbum = await getDoc(
        doc(db, "album_usuario", albumUserId)
      );

      if (existingAlbum.exists()) {
        showToast(
          "Ya tienes este álbum y no puedes volver a adquirirlo sin perder tu progreso.",
          "error"
        );
        return;
      }

      await setDoc(
        doc(
          db,
          "album_usuario",
          albumUserId
        ),
        {
          id: albumUserId,

          idUsuario:
            user.uid,

          idMundial:
            selectedAlbum.id,

          nombreAlbum:
            selectedAlbum.nombre,

          portadaAlbum:
            selectedAlbum.url,

          numeroEstampitas:
            selectedAlbum.numerodeestampitas,

          fechaAdquisicion:
            serverTimestamp(),
        }
      );

      showToast(
        `Has adquirido el álbum ${selectedAlbum.nombre}`,
        "success"
      );

      if (typeof onAlbumAcquired === "function") {
        onAlbumAcquired();
      }

      onClose();

    } catch (error) {

      console.error(error);

      showToast(
        "Error al adquirir álbum",
        "error"
      );

    } finally {

      setBuying(false);

    }
  };

  return (
    <div
      className={`adquirir-overlay ${
        isOpen ? "show" : ""
      }`}
      onClick={onClose}
    >

      <div
        className="adquirir-container"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* HEADER */}
        <div className="adquirir-header">

          <h1>
            Adquirir Álbum
          </h1>

          <button
            className="close-btn"
            onClick={onClose}
          >
            <X size={26} />
          </button>

        </div>

        {/* DETAIL */}
        {selectedAlbum ? (

          <div className="album-detail">

            {/* IMAGE */}
            <img
              src={selectedAlbum.url}
              alt={
                selectedAlbum.nombre
              }
              className="album-detail-image"
            />

            {/* INFO */}
            <div className="album-detail-info">

              <h2>
                {
                  selectedAlbum.nombre
                }
              </h2>

              <div className="album-info-item">

                <BookOpen size={18} />

                <span>
                  Álbum oficial
                  disponible
                </span>

              </div>

              <div className="album-info-item">

                <Hash size={18} />

                <span>
                  {
                    selectedAlbum.numerodeestampitas
                  }{" "}
                  estampitas
                </span>

              </div>

              {/* BUY */}
              <button
                className="album-buy-btn"
                onClick={
                  adquirirAlbum
                }
                disabled={buying}
              >
                {buying
                  ? "Adquiriendo..."
                  : "Adquirir Álbum"}
              </button>

              {/* BACK */}
              <button
                className="album-back-btn"
                onClick={() =>
                  setSelectedAlbum(
                    null
                  )
                }
              >
                Volver
              </button>

            </div>

          </div>

        ) : (

          <>
            {loading ? (

              <div className="loading">
                Cargando álbumes...
              </div>

            ) : (

              <div className="album-grid">

                {mundiales.map(
                  (album) => (

                    <div
                      key={album.id}
                      className="album-card"
                      onClick={() =>
                        setSelectedAlbum(
                          album
                        )
                      }
                    >

                      <img
                        src={album.url}
                        alt={
                          album.nombre
                        }
                        className="album-image"
                      />

                      <div className="album-content">

                        <h3>
                          {
                            album.nombre
                          }
                        </h3>

                        <p>
                          {
                            album.numerodeestampitas
                          }{" "}
                          estampitas
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}
          </>

        )}

      </div>
    </div>
  );
};

export default AdquirirAlbum;