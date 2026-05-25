// SwitchCards.js — v2

import React, { useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import "./switchcards.css";

import { X, Check, Search, Gift, PackagePlus } from "lucide-react";
import Carga from "../../Resources/carga/carga";
import { showToast } from "../../Resources/toast/ToastContainer";

const SwitchCards = ({ onClose, laminas = [], userId, albumId }) => {
  const [input,          setInput]          = useState("");
  const [results,        setResults]        = useState([]);
  const [selected,       setSelected]       = useState({});   // { id: qty }
  const [mode,           setMode]           = useState("abrir");
  const [ownedCounts,    setOwnedCounts]    = useState({});
  const [loadingOwned,   setLoadingOwned]   = useState(true);
  const [foundId,        setFoundId]        = useState(null);
  const [showLoader,     setShowLoader]     = useState(false);

  const isGift = mode === "regalar";

  // ── Limpiar al cambiar modo ──────────────────
  const switchMode = (m) => {
    setMode(m);
    setSelected({});
    setInput("");
    setResults([]);
  };

  // ── Input de código ──────────────────────────
  const handleInput = (e) => {
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (v.length > 6) return;
    setInput(v);
  };

  // ── Búsqueda reactiva ────────────────────────
  useEffect(() => {
    const norm = input.toUpperCase();
    if (!norm) { setResults([]); return; }

    const found = laminas
      .map((l) => {
        const cand = (l?.codigo || l?.id || "").toString().toUpperCase();
        return { lamina: l, cand };
      })
      .filter(({ cand }) => cand && cand.startsWith(norm))
      .sort((a, b) => {
        if (a.cand === norm && b.cand !== norm) return -1;
        if (b.cand === norm && a.cand !== norm) return 1;
        return 0;
      })
      .map(({ lamina }) => lamina);

    setResults(found);
    if (found.length > 0) {
      setFoundId(found[0].id);
      setTimeout(() => setFoundId(null), 650);
    }
  }, [input, laminas]);

  // ── Cargar álbum del usuario ─────────────────
  useEffect(() => {
    if (!userId || !albumId) return;

    const load = async () => {
      setLoadingOwned(true);
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db }          = await import("../../server/api");
        const snap = await getDoc(doc(db, "album_usuario", `${userId}_${albumId}`));
        setOwnedCounts(snap.exists() ? snap.data()?.laminas || {} : {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOwned(false);
      }
    };
    load();
  }, [albumId, userId]);

  // ── Seleccionar / aumentar cantidad ─────────
  const handleSelect = useCallback((lamina) => {
    if (!lamina?.id) return;
    document.activeElement?.blur?.();
    setSelected((prev) => ({ ...prev, [lamina.id]: (prev[lamina.id] || 0) + 1 }));
  }, []);

  const getLaminaById = (id) => laminas.find((l) => l?.id === id) || null;

  // ── Duplicados para modo regalar ─────────────
  const duplicates = laminas.filter((l) => (ownedCounts[l.id] || 0) >= 2);
  const displayList = isGift ? duplicates : results;

  // ── Guardar ──────────────────────────────────
  const saveAll = async () => {
    if (showLoader || !userId || !albumId) return;

    setShowLoader(true);
    try {
      const { doc, getDoc, setDoc } = await import("firebase/firestore");
      const { db }                  = await import("../../server/api");

      const ref  = doc(db, "album_usuario", `${userId}_${albumId}`);
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data()?.laminas || {} : {};
      const updated  = { ...existing };

      Object.entries(selected).forEach(([id, qty]) => {
        const cur = Number(existing[id] || 0);
        if (isGift) {
          const rem = cur - qty;
          if (rem > 0) updated[id] = rem;
          else          delete updated[id];
        } else {
          updated[id] = cur + qty;
        }
      });

      await setDoc(ref, { laminas: updated }, { merge: true });
      setOwnedCounts(updated);
      setSelected({});
      setInput("");

      const total = Object.values(selected).reduce((s, v) => s + v, 0);
      showToast(
        isGift
          ? `${total} lámina${total === 1 ? "" : "s"} regalada${total === 1 ? "" : "s"}`
          : `${total} lámina${total === 1 ? "" : "s"} guardada${total === 1 ? "" : "s"}`,
        "success"
      );
    } catch (err) {
      console.error(err);
      showToast("Error al guardar láminas", "error");
    } finally {
      setShowLoader(false);
    }
  };

  const selectedEntries = Object.entries(selected).filter(([, q]) => q > 0);
  const totalSelected   = selectedEntries.reduce((s, [, q]) => s + q, 0);

  const modalContent = (
    <div className="switch-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      {showLoader && <Carga visible />}

      <div className="switch-modal">

        {/* Drag handle (móvil) */}
        <div className="switch-drag-handle" />

        {/* ── STICKY HEADER ── */}
        <div className="switch-sticky-header">

          <button className="switch-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>

          <div className="switch-header">
            <h2>Buscador de Láminas</h2>
            <p>
              {isGift
                ? "Regala láminas duplicadas y réstalas de tu colección."
                : "Busca por código y añade láminas nuevas a tu álbum."}
            </p>
          </div>

          {/* Tabs modo */}
          <div className="switch-modes">
            <button
              type="button"
              className={`mode-btn${!isGift ? " active" : ""}`}
              onClick={() => switchMode("abrir")}
            >
              <PackagePlus size={17} />
              Abrir láminas
            </button>
            <button
              type="button"
              className={`mode-btn${isGift ? " active" : ""}`}
              onClick={() => switchMode("regalar")}
            >
              <Gift size={17} />
              Regalar
            </button>
          </div>

        </div>

        {/* ── BODY ── */}
        <div className="switch-body">

          {/* Input búsqueda (solo modo abrir) */}
          {!isGift && (
            <div className="sc-search-wrap">
              <Search size={16} className="sc-search-icon" />
              <input
                className="open-input"
                placeholder="Ej: COL12"
                value={input}
                onChange={handleInput}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          )}

          {/* Lista de cards */}
          {loadingOwned && isGift ? (
            <div className="sc-empty">
              <div className="sc-empty-icon">⏳</div>
              Cargando tu colección…
            </div>
          ) : displayList.length === 0 ? (
            <div className="sc-empty">
              <div className="sc-empty-icon">{isGift ? "🔁" : "🔍"}</div>
              {isGift
                ? "No tienes láminas duplicadas para regalar."
                : input.length >= 1
                ? "Sin resultados para ese código."
                : "Escribe el código de la lámina arriba."}
            </div>
          ) : (
            <div className="cards-grid">
              {displayList.map((lamina) => {
                const owned = ownedCounts[lamina.id] || 0;
                const isFound = foundId === lamina.id;

                return (
                  <div
                    key={lamina.id}
                    className={`card-item${isFound ? " found" : ""}${isGift ? " gift-mode" : ""}`}
                  >
                    {/* Bandera */}
                    <img
                      src={lamina?.bandera || ""}
                      alt={lamina?.nombre || ""}
                      className="card-flag"
                    />

                    {/* Info */}
                    <div className="card-info">
                      <span className="card-code">
                        {String(lamina?.id) === "00" ? "#00" : `#${lamina?.numero} · ${lamina?.id}`}
                      </span>
                      <h4>{lamina?.nombre}</h4>
                      {isGift && (
                        <span className="card-count">
                          🃏 Disponibles: <strong>{owned}</strong>
                        </span>
                      )}
                    </div>

                    {/* Acción */}
                    <button
                      className={`card-action-btn${isGift ? " gift" : ""}`}
                      onClick={() => handleSelect(lamina)}
                      disabled={
                        showLoader ||
                        (isGift && owned === 0)
                      }
                    >
                      <Check size={15} />
                      {isGift ? "Regalar" : "Añadir"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SELECCIONADOS ── */}
          {selectedEntries.length > 0 && (
            <div className="sc-selected-section">
              <p className="sc-selected-title">
                Seleccionadas
                <span className="sc-selected-count">{totalSelected}</span>
              </p>
              <div className="selected-list">
                {selectedEntries.map(([id, qty]) => {
                  const l = getLaminaById(id);
                  return (
                    <div key={id} className="selected-item">
                      <div>
                        <div>{l?.nombre || id}</div>
                        <div className="sel-name">
                          {l ? `#${l.numero} · ${l.id}` : id}
                        </div>
                      </div>
                      <span className="sel-qty">×{qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>{/* /switch-body */}

        {/* ── GUARDAR STICKY ── */}
        {selectedEntries.length > 0 && (
          <div className="sc-save-wrap">
            <button
              className={`open-pack-btn${isGift ? " gift-save" : ""}`}
              disabled={showLoader}
              onClick={saveAll}
            >
              {showLoader
                ? "Guardando…"
                : isGift
                ? `Regalar ${totalSelected} lámina${totalSelected === 1 ? "" : "s"}`
                : `Guardar ${totalSelected} lámina${totalSelected === 1 ? "" : "s"} en mi álbum`}
            </button>
          </div>
        )}

      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default SwitchCards;