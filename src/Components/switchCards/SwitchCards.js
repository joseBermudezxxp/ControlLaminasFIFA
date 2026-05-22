import React, { useEffect, useState } from "react";
import "./switchcards.css";

import { X, Check } from "lucide-react";
import Carga from "../../Resources/carga/carga";
import { showToast } from "../../Resources/toast/ToastContainer";

const SwitchCards = ({
  onClose,
  laminas = [],
  userId,
  albumId,
}) => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState({});
  const [mode, setMode] = useState("abrir");
  const [ownedCounts, setOwnedCounts] = useState({});
  const [loadingOwned, setLoadingOwned] = useState(true);
  const [foundAnimation, setFoundAnimation] = useState(null);
  const [showLoader, setShowLoader] = useState(false);

  // ================= INPUT =================
  const handleInput = (e) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, "");

    if (value.length > 5) return;

    setInput(value);
  };

  const isValidCode = (code) => /^[A-Z]{3}[0-9]{0,2}$/.test(code);

  const getCodeSuffix = (value) => {
    const normalized = value.toString().toUpperCase();
    const firstDigit = normalized.search(/[0-9]/);
    return firstDigit >= 0 ? normalized.slice(firstDigit) : normalized;
  };

  // ================= BUSQUEDA EN TIEMPO REAL =================
  useEffect(() => {
    const normalizedInput = input.toUpperCase();
    if (normalizedInput.length === 0) {
      setResults([]);
      return;
    }

    const found = laminas
      .map((l) => {
        const candidate = (l?.codigo || l?.id || "")
          .toString()
          .toUpperCase();
        return { lamina: l, candidate };
      })
      .filter(({ candidate }) => {
        if (!candidate) return false;
        return candidate.startsWith(normalizedInput);
      })
      .sort((a, b) => {
        if (a.candidate === normalizedInput && b.candidate !== normalizedInput) return -1;
        if (b.candidate === normalizedInput && a.candidate !== normalizedInput) return 1;
        return 0;
      })
      .map(({ lamina }) => lamina);

    if (found.length > 0) {
      setResults(found);
      setFoundAnimation(found[0].id);
    } else {
      setResults([]);
    }
  }, [input, laminas]);

  // ================= ANIMACION =================
  useEffect(() => {
    if (!foundAnimation) return;

    const timer = setTimeout(() => {
      setFoundAnimation(null);
    }, 700);

    return () => clearTimeout(timer);
  }, [foundAnimation]);

  // ================= SELECT =================
  const handleSelect = (lamina) => {
    if (!lamina?.id) return;

    document.activeElement?.blur?.();

    setSelected((prev) => {
      const current = prev[lamina.id] || 0;

      return {
        ...prev,
        [lamina.id]: current + 1,
      };
    });
  };

  // ================= SAFE LOOKUP =================
  const getLaminaById = (id) => laminas.find((l) => l?.id === id) || null;

  useEffect(() => {
    if (!userId || !albumId) return;

    const loadOwnedCounts = async () => {
      setLoadingOwned(true);
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("../../server/api");

        const ref = doc(db, "album_usuario", `${userId}_${albumId}`);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setOwnedCounts(snap.data()?.laminas || {});
        } else {
          setOwnedCounts({});
        }
      } catch (error) {
        console.error("Error cargando láminas propias:", error);
      } finally {
        setLoadingOwned(false);
      }
    };

    loadOwnedCounts();
  }, [albumId, userId]);

  const isGiftMode = mode === "regalar";
  const duplicateLaminas = laminas.filter((lamina) => (ownedCounts[lamina.id] || 0) >= 2);
  const displayLaminas = isGiftMode ? duplicateLaminas : results;

  const saveAllToFirestore = async () => {

  if (showLoader) return;

  if (!userId || !albumId) {
    console.warn("Faltan userId o albumId");
    return;
  }

  setShowLoader(true);


    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const { db } = await import("../../server/api");

    const ref = doc(db, "album_usuario", `${userId}_${albumId}`);

    try {
      const snap = await getDoc(ref);

      let existing = {};

      if (snap.exists()) {
        existing = snap.data()?.laminas || {};
      }

      const updated = { ...existing };

      Object.entries(selected).forEach(([id, qty]) => {
        const current = Number(existing[id] || 0);

        if (isGiftMode) {
          const remaining = current - qty;
          if (remaining > 0) {
            updated[id] = remaining;
          } else {
            delete updated[id];
          }
        } else {
          updated[id] = current + qty;
        }
      });

      await setDoc(ref, { laminas: updated }, { merge: true });

setOwnedCounts(updated);

showToast(isGiftMode ? "Láminas regaladas" : "Guardado en tu álbum", "success");

setSelected({});
setInput("");
    } catch (err) {
      console.error("Error guardando:", err);
      showToast("Error al guardar láminas", "error");
    } finally {
      setShowLoader(false);
    }
  };

  return (
  <div className="switch-overlay">

    {showLoader && (
      <Carga visible={true} />
    )}

    <div className="switch-modal">

      {/* CLOSE */}
      <button className="switch-close" onClick={onClose}>
        <X size={22} />
      </button>

      {/* HEADER */}
      <div className="switch-header">
        <h2>Buscador de Láminas</h2>

        <p>
          {isGiftMode
            ? "Regala láminas que ya tienes y réstalas de tu colección."
            : "Busca por código y guarda nuevas láminas en tu álbum."}
        </p>
      </div>

      {/* MODES */}
      <div className="switch-modes">

        <button
          type="button"
          className={`mode-btn ${!isGiftMode ? "active" : ""}`}
          onClick={() => {
            setMode("abrir");
            setSelected({});
            setInput("");
            document.activeElement?.blur?.();
          }}
        >
          Abrir
        </button>

        <button
          type="button"
          className={`mode-btn ${isGiftMode ? "active" : ""}`}
          onClick={() => {
            setMode("regalar");
            setSelected({});
            setInput("");
            document.activeElement?.blur?.();
          }}
        >
          Regalar
        </button>

      </div>

      {/* INFO */}
      <div className="section-info">

        <h3>
          {isGiftMode
            ? "Regalar láminas"
            : "Abrir nuevas láminas"}
        </h3>

        <p>
          {isGiftMode
            ? "Selecciona las láminas que quieres regalar. Se restarán de tu álbum actual."
            : "Busca el código de la lámina y agrégala a tu álbum. Si ya tienes varias, solo una cuenta para el porcentaje."}
        </p>

      </div>

      {/* INPUT */}
      {!isGiftMode && (
        <input
          className="open-input"
          placeholder="ABC12"
          value={input}
          onChange={handleInput}
        />
      )}

      {/* RESULTADOS */}
      <div className="cards-grid">

        {isGiftMode &&
        !loadingOwned &&
        displayLaminas.length === 0 ? (

          <div className="no-duplicates-message">
            No tienes duplicados
          </div>

        ) : (

          displayLaminas.map((lamina) => (

            <div
              key={lamina.id}
              className={`card-item ${
                foundAnimation === lamina.id ? "found" : ""
              } ${isGiftMode ? "gift-mode" : ""}`}
            >

              {!isGiftMode && (
                <img src={lamina?.bandera || ""} />
              )}

              <div className="card-content">

                {isGiftMode && (
                  <img
                    src={lamina?.bandera || ""}
                    className="card-img-gift"
                  />
                )}

                <div className="card-info">

                  {String(lamina?.id) === "00" ? (
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--primary)",
                      }}
                    >
                      #00
                    </span>
                  ) : (
                    <span>#{lamina?.numero}</span>
                  )}

                  <h4>{lamina?.nombre}</h4>

                  {isGiftMode && (
                    <p
                      style={{
                        marginTop: 6,
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      Disponibles:{" "}
                      <strong>
                        {ownedCounts[lamina.id] || 0}
                      </strong>
                    </p>
                  )}

                </div>
              </div>

              <button
                className={isGiftMode ? "gift-btn" : ""}
                onClick={() => handleSelect(lamina)}
                disabled={
                  showLoader ||
                  (isGiftMode &&
                    (ownedCounts[lamina.id] || 0) === 0)
                }
              >
                <Check size={16} />

                {isGiftMode
                  ? "Regalar"
                  : "Guardar"}
              </button>

            </div>
          ))
        )}
      </div>

      {/* SELECCIONADOS */}
      <h4 style={{ marginTop: 20 }}>
        Seleccionados
      </h4>

      <div className="selected-list">

        {Object.entries(selected).map(([id, qty]) => {

          const lamina = getLaminaById(id);

          return (
            <div
              key={id}
              className="selected-item"
            >
              <span>
                {lamina?.id || id}
              </span>

              <strong>
                x{qty}
              </strong>
            </div>
          );
        })}

      </div>

      {/* BOTÓN FINAL */}
      {Object.keys(selected).length > 0 && (

        <button
          className="open-pack-btn"
          disabled={showLoader}
          style={{
            marginTop: "20px",
            background: isGiftMode
              ? "linear-gradient(135deg, #00b0ff, #0091ea)"
              : "linear-gradient(135deg, #00c853, #00e676)",
            fontWeight: "700",
            opacity: showLoader ? 0.7 : 1,
            pointerEvents: showLoader
              ? "none"
              : "auto",
          }}
          onClick={saveAllToFirestore}
        >

          {isGiftMode
            ? "Regalar de mi álbum"
            : "Guardar en mi álbum"}

        </button>

      )}

    </div>
  </div>
);
};

export default SwitchCards;