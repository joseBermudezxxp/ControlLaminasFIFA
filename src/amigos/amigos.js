// amigos.js

import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import { auth, db } from "../server/api";
import { showToast } from "../Resources/toast/ToastContainer";
import { Users, Plus, MessageCircle, Trash2, Search, ArrowLeft } from "lucide-react";

import "./amigos.css";

const Amigos = ({ user, albums, onBack }) => {
  const [activeTab, setActiveTab] = useState("mis-amigos"); // mis-amigos, agregar, cambios
  const [amigos, setAmigos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [selectedFriendForExchange, setSelectedFriendForExchange] = useState(null);
  const [exchangeData, setExchangeData] = useState(null);
  const [selectedAlbumForExchange, setSelectedAlbumForExchange] = useState(null);
  const [selectedAlbumByFriend, setSelectedAlbumByFriend] = useState({});
  const [totalLaminasByFriend, setTotalLaminasByFriend] = useState({}); // Total estampitas por amigo
  const [friendStatsByFriend, setFriendStatsByFriend] = useState({});
  const [selectedFriendLaminas, setSelectedFriendLaminas] = useState([]);
  const [selectedMyLaminas, setSelectedMyLaminas] = useState([]);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeMessage, setExchangeMessage] = useState("");

  // ================================
  // CARGAR AMIGOS EN TIEMPO REAL
  // ================================
  useEffect(() => {
    if (!user?.uid) return;

    // Firestore rules only allow reading friendships where you are one of the participants.
    // For queries we must filter by usuario1 OR usuario2; Firestore doesn't support OR, so
    // listen two queries and merge the results.
    // Ahora aceptamos estado "aceptado" O "pendiente" para que aparezcan
    const q1 = query(
      collection(db, "amigos"),
      where("usuario1", "==", user.uid)
    );

    const q2 = query(
      collection(db, "amigos"),
      where("usuario2", "==", user.uid)
    );

    const unsub1 = onSnapshot(q1, async (snapshot) => {
      const partial = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        const amigoUid = data.usuario1 === user.uid ? data.usuario2 : data.usuario1;
        try {
          const amigoDocRef = doc(db, "usuarios", amigoUid);
          const amigoDocSnap = await getDoc(amigoDocRef);
          const amigoData = amigoDocSnap.data() || {};
          partial.push({
            id: d.id,
            amigoUid,
            nombre: amigoData.nombre || amigoData.displayName || "Usuario sin nombre",
            email: amigoData.email || "",
            photoURL: amigoData.photoURL || "",
            ...data,
          });
        } catch (error) {
          console.error("Error obteniendo datos del amigo:", error);
          partial.push({ id: d.id, amigoUid, nombre: "Usuario sin nombre", email: "", ...data });
        }
      }

      setAmigos((prev) => {
        // merge keeping unique ids
        const map = new Map(prev.map((p) => [p.id, p]));
        for (const item of partial) map.set(item.id, item);
        return Array.from(map.values());
      });
      setLoading(false);
    });

    const unsub2 = onSnapshot(q2, async (snapshot) => {
      const partial = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        const amigoUid = data.usuario1 === user.uid ? data.usuario2 : data.usuario1;
        try {
          const amigoDocRef = doc(db, "usuarios", amigoUid);
          const amigoDocSnap = await getDoc(amigoDocRef);
          const amigoData = amigoDocSnap.data() || {};
          partial.push({
            id: d.id,
            amigoUid,
            nombre: amigoData.nombre || amigoData.displayName || "Usuario sin nombre",
            email: amigoData.email || "",
            photoURL: amigoData.photoURL || "",
            ...data,
          });
        } catch (error) {
          console.error("Error obteniendo datos del amigo:", error);
          partial.push({ id: d.id, amigoUid, nombre: "Usuario sin nombre", email: "", ...data });
        }
      }

      setAmigos((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        for (const item of partial) map.set(item.id, item);
        return Array.from(map.values());
      });
      setLoading(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user?.uid]);

  // ================================
  // CARGAR TOTAL ESTAMPITAS POR AMIGO
  // ================================
  useEffect(() => {
    if (!amigos.length) {
      setTotalLaminasByFriend({});
      setFriendStatsByFriend({});
      return;
    }

    const albumIds = new Set(albums.map((album) => album.idMundial || album.id));
    const unsubscribes = [];

    amigos.forEach((amigo) => {
      // Escuchar cambios en los álbumes del amigo, usando su idUsuario para filtrar.
      const albumQuery = query(
        collection(db, "album_usuario"),
        where("idUsuario", "==", amigo.amigoUid)
      );

      const unsub = onSnapshot(albumQuery, (snapshot) => {
        let total = 0;
        let collected = 0;
        let totalStickers = 0;

        snapshot.docs.forEach((docSnap) => {
          const docData = docSnap.data() || {};
          const laminas = docData.laminas || {};
          total += Object.values(laminas).reduce((sum, qty) => sum + Number(qty || 0), 0);

          const mundId = docData.idMundial || docData.id;
          if (albumIds.has(mundId)) {
            collected += Object.values(laminas).reduce(
              (sum, qty) => sum + (Number(qty) > 0 ? 1 : 0),
              0
            );
            totalStickers += Number(docData.numeroEstampitas || 0);
          }
        });

        setTotalLaminasByFriend((prev) => ({
          ...prev,
          [amigo.amigoUid]: total,
        }));

        setFriendStatsByFriend((prev) => ({
          ...prev,
          [amigo.amigoUid]: {
            collected,
            total: totalStickers,
          },
        }));
      });

      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((u) => u && u());
    };
  }, [amigos, albums]);

  // ================================
  // BUSCAR USUARIO POR EMAIL
  // ================================
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      setMensaje("Ingresa un email");
      return;
    }

    setSearchLoading(true);
    setSearchResult(null);

    try {
      const usersQuery = query(
        collection(db, "usuarios"),
        where("email", "==", searchEmail.trim())
      );
      const snapshot = await getDocs(usersQuery);

      if (snapshot.empty) {
        setMensaje("Usuario no encontrado");
        setSearchResult(null);
      } else {
        const userData = snapshot.docs[0].data();
        const userId = snapshot.docs[0].id;

        // Verificar si ya existe una relación (pendiente o aceptada)
        const qA = query(
          collection(db, "amigos"),
          where("usuario1", "==", user.uid),
          where("usuario2", "==", userId)
        );
        const qB = query(
          collection(db, "amigos"),
          where("usuario1", "==", userId),
          where("usuario2", "==", user.uid)
        );

        const [snapA, snapB] = await Promise.all([getDocs(qA), getDocs(qB)]);
        const isAlreadyFriend = snapA.size > 0 || snapB.size > 0;

        if (isAlreadyFriend) {
          setMensaje("Ya son amigos");
          setSearchResult(null);
        } else if (userId === user.uid) {
          setMensaje("No puedes agregarte a ti mismo");
          setSearchResult(null);
        } else {
          setSearchResult({
            uid: userId,
            nombre: userData.nombre || userData.displayName || "Usuario sin nombre",
            email: userData.email,
            photoURL: userData.photoURL,
          });
          setMensaje("");
        }
      }
    } catch (error) {
      console.error("Error buscando usuario:", error);
      setMensaje("Error al buscar usuario");
    } finally {
      setSearchLoading(false);
    }
  };

  // ================================
  // AGREGAR AMIGO (BIDIRECCIONAL)
  // ================================
  const handleAddFriend = async (amigoUid) => {
    if (!user?.uid) return;

    try {
      // Create as pending to respect Firestore rules; the other user can accept later.
      await addDoc(collection(db, "amigos"), {
        usuario1: user.uid,
        usuario2: amigoUid,
        estado: "pendiente",
        fechaSolicitud: new Date(),
      });

      setMensaje("Solicitud enviada");
      setSearchEmail("");
      setSearchResult(null);

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error agregando amigo:", error);
      setMensaje("Error al agregar amigo");
    }
  };

  // ================================
  // ELIMINAR AMIGO
  // ================================
  const handleRemoveFriend = async (friendshipId) => {
    try {
      await deleteDoc(doc(db, "amigos", friendshipId));
      setMensaje("Amigo eliminado");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error eliminando amigo:", error);
      setMensaje("Error al eliminar amigo");
    }
  };

  // ================================
  // CARGAR DATOS PARA INTERCAMBIO
  // ================================
  const loadExchangeData = useCallback(
    async (friend, mundialId) => {
      try {
        if (!mundialId) {
          setMensaje("Selecciona un álbum");
          return;
        }

        setSelectedFriendLaminas([]);
        setSelectedMyLaminas([]);
        setExchangeMessage("");

        // Obtener láminas del usuario actual
        const myAlbumRef = doc(db, "album_usuario", `${user.uid}_${mundialId}`);
        const myAlbumSnap = await getDoc(myAlbumRef);
        const myLaminas = myAlbumSnap.exists() ? myAlbumSnap.data().laminas || {} : {};

        // Obtener láminas del amigo
        const friendAlbumRef = doc(
          db,
          "album_usuario",
          `${friend.amigoUid}_${mundialId}`
        );
        const friendAlbumSnap = await getDoc(friendAlbumRef);
        const friendLaminas = friendAlbumSnap.exists()
          ? friendAlbumSnap.data().laminas || {}
          : {};

        // Láminas repetidas del amigo que yo no tengo
        const laminasParaMi = [];
        Object.entries(friendLaminas).forEach(([laminaId, cantidad]) => {
          if (cantidad > 1 && (!myLaminas[laminaId] || myLaminas[laminaId] === 0)) {
            laminasParaMi.push({ id: laminaId, cantidad });
          }
        });

        // Láminas repetidas mías que el amigo no tiene
        const laminasParaAmigo = [];
        Object.entries(myLaminas).forEach(([laminaId, cantidad]) => {
          if (cantidad > 1 && (!friendLaminas[laminaId] || friendLaminas[laminaId] === 0)) {
            laminasParaAmigo.push({ id: laminaId, cantidad });
          }
        });

        setExchangeData({
          friend,
          laminasParaMi,
          laminasParaAmigo,
          albumId: mundialId,
        });
        setMensaje("");
      } catch (error) {
        console.error("Error cargando datos de intercambio:", error);
        setMensaje("Error al cargar datos de intercambio");
      }
    },
    [user?.uid]
  );

  const toggleFriendLaminaSelection = useCallback((laminaId) => {
    setSelectedFriendLaminas((prev) =>
      prev.includes(laminaId)
        ? prev.filter((id) => id !== laminaId)
        : [...prev, laminaId]
    );
  }, []);

  const toggleMyLaminaSelection = useCallback((laminaId) => {
    setSelectedMyLaminas((prev) =>
      prev.includes(laminaId)
        ? prev.filter((id) => id !== laminaId)
        : [...prev, laminaId]
    );
  }, []);

  const handleConfirmExchange = useCallback(async () => {
    if (!exchangeData || !exchangeData.friend) return;

    if (selectedFriendLaminas.length === 0 || selectedMyLaminas.length === 0) {
      setExchangeMessage("Selecciona láminas de ambos lados para realizar el cambio.");
      return;
    }

    setExchangeLoading(true);
    setExchangeMessage("");

    try {
      const myAlbumRef = doc(db, "album_usuario", `${user.uid}_${exchangeData.albumId}`);
      const friendAlbumRef = doc(
        db,
        "album_usuario",
        `${exchangeData.friend.amigoUid}_${exchangeData.albumId}`
      );

      await runTransaction(db, async (transaction) => {
        const mySnap = await transaction.get(myAlbumRef);
        const friendSnap = await transaction.get(friendAlbumRef);

        if (!mySnap.exists() || !friendSnap.exists()) {
          throw new Error("Álbum no encontrado");
        }

        const myLaminas = { ...(mySnap.data().laminas || {}) };
        const friendLaminas = { ...(friendSnap.data().laminas || {}) };

        const updatedMy = { ...myLaminas };
        const updatedFriend = { ...friendLaminas };

        selectedFriendLaminas.forEach((laminaId) => {
          const friendQty = Number(friendLaminas[laminaId] || 0);
          if (friendQty <= 1) {
            delete updatedFriend[laminaId];
          } else {
            updatedFriend[laminaId] = friendQty - 1;
          }
          updatedMy[laminaId] = Number(updatedMy[laminaId] || 0) + 1;
        });

        selectedMyLaminas.forEach((laminaId) => {
          const myQty = Number(myLaminas[laminaId] || 0);
          if (myQty <= 1) {
            delete updatedMy[laminaId];
          } else {
            updatedMy[laminaId] = myQty - 1;
          }
          updatedFriend[laminaId] = Number(updatedFriend[laminaId] || 0) + 1;
        });

        transaction.update(myAlbumRef, { laminas: updatedMy });
        transaction.update(friendAlbumRef, { laminas: updatedFriend });
      });

      setExchangeMessage("Cambio realizado correctamente.");
      showToast("Cambio realizado correctamente", "success");
      setSelectedFriendLaminas([]);
      setSelectedMyLaminas([]);
      await loadExchangeData(exchangeData.friend, exchangeData.albumId);
    } catch (error) {
      console.error("Error realizando el intercambio:", error);
      setExchangeMessage("No se pudo realizar el intercambio.");
      showToast("No se pudo realizar el intercambio", "error");
    } finally {
      setExchangeLoading(false);
    }
  }, [exchangeData, selectedFriendLaminas, selectedMyLaminas, user?.uid, loadExchangeData]);

  // ================================
  // RENDER: MIS AMIGOS
  // ================================
  const renderMisAmigos = () => (
    <div className="amigos-section">
      <h2>Mis Amigos</h2>

      {loading ? (
        <div className="amigos-loading">Cargando amigos...</div>
      ) : amigos.length === 0 ? (
        <div className="amigos-empty">
          <Users size={48} />
          <p>No tienes amigos aún</p>
          <p className="text-secondary">Ve a "Agregar amigos" para comenzar</p>
        </div>
      ) : (
        <div className="amigos-list">
          {amigos.map((amigo) => {
            const stats = friendStatsByFriend[amigo.amigoUid] || { collected: 0, total: 0 };
            const percentage = stats.total ? Math.round((stats.collected / stats.total) * 100) : 0;

            return (
              <div key={amigo.id} className="amigo-card">
                <div className="amigo-info">
                  <h3>{amigo.nombre || "Usuario"}</h3>
                  <p>{amigo.email}</p>
                  <p style={{ marginTop: "6px", fontSize: "0.88rem", fontWeight: 700, color: "var(--primary)" }}>
                    📊 {totalLaminasByFriend[amigo.amigoUid] || 0} estampitas
                  </p>
                  <p style={{ marginTop: "4px", fontSize: "0.82rem", fontWeight: 600, color: "var(--success)" }}>
                    {stats.total > 0
                      ? `🎯 ${percentage}% · ${stats.collected}/${stats.total}`
                      : "🎯 Álbum compartido no disponible"}
                  </p>
                </div>

                <div className="amigo-actions">
                  <div className="amigo-album-select">
                    <label htmlFor={`album-select-${amigo.id}`}>Selecciona álbum</label>
                    <select
                      id={`album-select-${amigo.id}`}
                      value={selectedAlbumByFriend[amigo.id] || ""}
                      onChange={(e) =>
                        setSelectedAlbumByFriend((prev) => ({
                          ...prev,
                          [amigo.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona tu álbum</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>
                          {album.nombreAlbum}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn-exchange"
                    onClick={() => {
                      const selectedAlbumId = selectedAlbumByFriend[amigo.id];
                      if (!selectedAlbumId) {
                        showToast("Selecciona un álbum antes de ver los cambios", "error");
                        return;
                      }

                      const album = albums.find((item) => item.id === selectedAlbumId);
                      const mundialId = album?.idMundial || selectedAlbumId;

                      setSelectedFriendForExchange(amigo);
                      setSelectedAlbumForExchange(mundialId);
                      setActiveTab("cambios");
                      setExchangeData(null);
                      setSelectedFriendLaminas([]);
                      setSelectedMyLaminas([]);
                      setExchangeMessage("");
                      loadExchangeData(amigo, mundialId);
                    }}
                  >
                    <MessageCircle size={18} />
                    Cambios
                  </button>

                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveFriend(amigo.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ================================
  // RENDER: AGREGAR AMIGOS
  // ================================
  const renderAgregarAmigos = () => (
    <div className="amigos-section">
      <h2>Agregar Amigos</h2>

      <div className="agregar-form">
        <div className="search-input-group">
          <input
            type="email"
            placeholder="Busca por email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearchUser()}
            className="email-input"
          />
          <button
            onClick={handleSearchUser}
            disabled={searchLoading}
            className="btn-search"
          >
            <Search size={18} />
            {searchLoading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {mensaje && (
          <div className={`mensaje ${mensaje.includes("encontrado") ? "error" : "success"}`}>
            {mensaje}
          </div>
        )}

        {searchResult && (
          <div className="search-result">
            <div className="result-info">
              <h3>{searchResult.nombre}</h3>
              <p>{searchResult.email}</p>
            </div>

            <button
              onClick={() => handleAddFriend(searchResult.uid)}
              className="btn-add"
            >
              <Plus size={18} />
              Agregar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ================================
  // RENDER: CAMBIOS / INTERCAMBIOS
  // ================================
  const renderCambios = () => {
    if (!selectedFriendForExchange) {
      return (
        <div className="amigos-section">
          <h2>Cambios entre Amigos</h2>
          {amigos.length === 0 ? (
            <div className="amigos-empty">
              <MessageCircle size={48} />
              <p>No tienes amigos para hacer cambios</p>
            </div>
          ) : (
            <div className="amigos-list">
              {amigos.map((amigo) => (
                <div key={amigo.id} className="amigo-card">
                  <div className="amigo-info">
                    <h3>{amigo.nombre || "Usuario"}</h3>
                    <p>{amigo.email}</p>
                  </div>

                  <button
                    className="btn-exchange"
                    onClick={() => {
                      setSelectedFriendForExchange(amigo);
                      setSelectedAlbumForExchange(null);
                    }}
                  >
                    <MessageCircle size={18} />
                    Ver cambios
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (!selectedAlbumForExchange) {
      return (
        <div className="amigos-section">
          <button
            className="btn-back"
            onClick={() => {
              setSelectedFriendForExchange(null);
              setExchangeData(null);
            }}
          >
            ← Atrás
          </button>

          <h2>Selecciona un álbum con {selectedFriendForExchange.nombre}</h2>

          {albums.length === 0 ? (
            <div className="amigos-empty">
              <p>No tienes álbumes</p>
            </div>
          ) : (
            <div className="albums-exchange-list">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="album-exchange-card"
                  onClick={() => {
                    setSelectedAlbumForExchange(album.id);
                    loadExchangeData(selectedFriendForExchange, album.idMundial || album.id);
                  }}
                >
                  <img src={album.portadaAlbum} alt={album.nombreAlbum} />
                  <p>{album.nombreAlbum}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Mostrar datos de cambio
    return (
      <div className="amigos-section">
        <button
          className="btn-back"
          onClick={() => {
            setSelectedAlbumForExchange(null);
            setExchangeData(null);
          }}
        >
          ← Atrás
        </button>

        <h2>Cambios con {selectedFriendForExchange.nombre}</h2>

        {!exchangeData ? (
          <div className="loading-exchange">Cargando datos...</div>
        ) : (
          <>
            <div className="exchange-container">
              {/* LÁMINAS QUE NECESITO */}
              <div className="exchange-section">
                <h3>Láminas que {selectedFriendForExchange.nombre} tiene repetidas</h3>
                <p className="section-subtitle">
                  Que tú no tienes (puedes solicitar)
                </p>

                {exchangeData.laminasParaMi.length === 0 ? (
                  <div className="empty-exchange">
                    No hay láminas disponibles para intercambiar
                  </div>
                ) : (
                  <div className="laminas-exchange-list">
                    {exchangeData.laminasParaMi.map((lamina) => (
                      <div
                        key={lamina.id}
                        className={`lamina-exchange-item${selectedFriendLaminas.includes(lamina.id) ? " selected" : ""}`}
                        onClick={() => toggleFriendLaminaSelection(lamina.id)}
                      >
                        <span className="lamina-id">#{lamina.id}</span>
                        <span className="lamina-qty">x{lamina.cantidad}</span>
                      </div>
                    ))}
                  </div>
                )}
                {exchangeData.laminasParaMi.length > 0 && (
                  <p className="exchange-selection-label">
                    Seleccionadas: {selectedFriendLaminas.length}
                  </p>
                )}
              </div>

              {/* LÁMINAS QUE TENGO REPETIDAS */}
              <div className="exchange-section">
                <h3>Tus láminas repetidas</h3>
                <p className="section-subtitle">
                  Que {selectedFriendForExchange.nombre} no tiene (puedes ofrecer)
                </p>

                {exchangeData.laminasParaAmigo.length === 0 ? (
                  <div className="empty-exchange">
                    No tienes láminas repetidas para ofrecer
                  </div>
                ) : (
                  <div className="laminas-exchange-list">
                    {exchangeData.laminasParaAmigo.map((lamina) => (
                      <div
                        key={lamina.id}
                        className={`lamina-exchange-item${selectedMyLaminas.includes(lamina.id) ? " selected" : ""}`}
                        onClick={() => toggleMyLaminaSelection(lamina.id)}
                      >
                        <span className="lamina-id">#{lamina.id}</span>
                        <span className="lamina-qty">x{lamina.cantidad}</span>
                      </div>
                    ))}
                  </div>
                )}
                {exchangeData.laminasParaAmigo.length > 0 && (
                  <p className="exchange-selection-label">
                    Seleccionadas: {selectedMyLaminas.length}
                  </p>
                )}
              </div>
            </div>
            {exchangeLoading && (
              <div className="exchange-loading-overlay">
                <div className="exchange-loading-card">
                  <p>Cambiando álbumes…</p>
                </div>
              </div>
            )}
            <div className="exchange-actions">
              <button
                className="btn-exchange-confirm"
                onClick={handleConfirmExchange}
                disabled={exchangeLoading || selectedFriendLaminas.length === 0 || selectedMyLaminas.length === 0}
              >
                {exchangeLoading ? "Cambiando…" : "Cambiar"}
              </button>
              {exchangeMessage && (
                <p className="exchange-notice">{exchangeMessage}</p>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="amigos-container">
      {onBack && (
        <button className="amigos-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Volver al inicio
        </button>
      )}

      {/* TABS */}
      <div className="amigos-tabs">
        <button
          className={`tab ${activeTab === "mis-amigos" ? "active" : ""}`}
          onClick={() => setActiveTab("mis-amigos")}
        >
          <Users size={20} />
          Mis Amigos
        </button>
        <button
          className={`tab ${activeTab === "agregar" ? "active" : ""}`}
          onClick={() => setActiveTab("agregar")}
        >
          <Plus size={20} />
          Agregar
        </button>
        <button
          className={`tab ${activeTab === "cambios" ? "active" : ""}`}
          onClick={() => setActiveTab("cambios")}
        >
          <MessageCircle size={20} />
          Cambios
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="amigos-content">
        {activeTab === "mis-amigos" && renderMisAmigos()}
        {activeTab === "agregar" && renderAgregarAmigos()}
        {activeTab === "cambios" && renderCambios()}
      </div>
    </div>
  );
};

export default Amigos;
