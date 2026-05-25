// contenido.js — v3

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import "./contenido.css";
import { db } from "../../../server/api";

import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteField,
} from "firebase/firestore";

import { ArrowLeft, ChevronDown } from "lucide-react";

import SwitchCards from "../../switchCards/SwitchCards";
import "../../../Resources/carga/carga.js";
import { auth } from "../../../server/api";
import { showToast } from "../../../Resources/toast/ToastContainer";

// ─────────────────────────────────────────────
// LONG-PRESS HOOK
// ─────────────────────────────────────────────
const LONG_PRESS_MS = 500;

function useLongPress(onLongPress, onClick) {
  const timerRef    = useRef(null);
  const fired       = useRef(false);

  const start = useCallback((e) => {
    fired.current = false;
    timerRef.current = setTimeout(() => {
      fired.current = true;
      onLongPress(e);
    }, LONG_PRESS_MS);
  }, [onLongPress]);

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback((e) => {
    if (fired.current) { fired.current = false; return; }
    onClick(e);
  }, [onClick]);

  return {
    onMouseDown:  start,
    onMouseUp:    cancel,
    onMouseLeave: cancel,
    onTouchStart: (e) => { e.preventDefault(); start(e); },
    onTouchEnd:   cancel,
    onClick:      handleClick,
  };
}

// ─────────────────────────────────────────────
// MODAL DE EDICIÓN DE CANTIDAD
// ─────────────────────────────────────────────
function EditQtyModal({ lamina, initialQty, onConfirm, onClose }) {
  // initialQty = la cantidad real en Firestore (ownedCount solamente)
  const [qty, setQty] = useState(initialQty);
  const [bumping, setBumping] = useState(false);

  const bump = () => {
    setBumping(true);
    setTimeout(() => setBumping(false), 180);
  };

  const increment = () => { bump(); setQty((q) => q + 1); };
  const decrement = () => { bump(); setQty((q) => Math.max(0, q - 1)); };

  const isDelete = qty === 0;

  return (
    <div
      className="edit-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="edit-modal">
        <div className="edit-modal-handle" />

        <p className="edit-modal-title">{lamina.nombre}</p>
        <p className="edit-modal-sub">
          #{lamina.numero} · {lamina.id} · Editar cantidad en tu álbum
        </p>

        <div className="edit-qty-row">
          <button
            className={`edit-qty-btn${qty === 0 ? " danger" : ""}`}
            onClick={decrement}
            aria-label="Reducir"
          >
            −
          </button>

          <span className={`edit-qty-value${bumping ? " bump" : ""}`}>
            {qty}
          </span>

          <button className="edit-qty-btn" onClick={increment} aria-label="Aumentar">
            +
          </button>
        </div>

        <div className="edit-modal-actions">
          <button className="edit-modal-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className={`edit-modal-confirm${isDelete ? " delete-mode" : ""}`}
            onClick={() => onConfirm(qty)}
          >
            {isDelete ? "🗑 Eliminar lámina" : `Guardar (${qty})`}
          </button>
        </div>

        <p className="edit-hint">Pon 0 para eliminar la lámina de tu álbum</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CARD DE LÁMINA
// ─────────────────────────────────────────────
function LaminaCard({ lamina, collected, selected, totalCount, onTap, onLongPress }) {
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef(null);

  const handleLP = useCallback(() => {
    setPressing(false);
    onLongPress(lamina);
  }, [lamina, onLongPress]);

  const handleTap = useCallback(() => onTap(lamina.id), [lamina.id, onTap]);

  const lp = useLongPress(handleLP, handleTap);

  const onTS = (e) => {
    setPressing(true);
    lp.onTouchStart(e);
    pressTimer.current = setTimeout(() => setPressing(false), LONG_PRESS_MS + 80);
  };

  const onTE = (e) => {
    setPressing(false);
    clearTimeout(pressTimer.current);
    lp.onTouchEnd(e);
  };

  return (
    <div
      {...lp}
      onTouchStart={onTS}
      onTouchEnd={onTE}
      className={[
        "lamina-card",
        collected ? "collected" : "",
        selected  ? "selected"  : "",
        pressing  ? "pressing"  : "",
      ].filter(Boolean).join(" ")}
    >
      <img
        src={lamina.bandera}
        alt={lamina.nombre}
        className={`lamina-image${collected ? " owned" : ""}`}
        draggable={false}
      />

      <div className="lamina-info">
        <h4>{lamina.nombre}</h4>
        <p>
          {String(lamina.id) === "00" ? (
            <span style={{ fontWeight: 700, color: "var(--primary)" }}>#00</span>
          ) : (
            <>
              <span>#{lamina.numero}</span>
              <small style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                {lamina.id}
              </small>
            </>
          )}
        </p>
      </div>

      {/* Badge solo cuando hay duplicados (≥2) */}
      {totalCount >= 2 && (
        <div className="lamina-count-badge">{totalCount}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
const Contenido = ({ album, onBack }) => {
  const [laminas,         setLaminas]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedGroup,   setSelectedGroup]   = useState(null);
  const [viewMode,        setViewMode]        = useState("all");
  const [ownedLaminas,    setOwnedLaminas]    = useState({});   // Firestore real
  const [pendingLaminas,  setPendingLaminas]  = useState({});   // selección local aún no guardada
  const [savingSelection, setSavingSelection] = useState(false);
  const [switchOpen,      setSwitchOpen]      = useState(false);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [editModal,       setEditModal]       = useState(null);
  const [changeHistory,   setChangeHistory]   = useState([]);   // Historial de cambios para revertir

  // ── Helpers ─────────────────────────────────
  // Conteo confirmado en Firestore
  const getOwned   = (id) => Number(ownedLaminas[id]  || 0);
  // Conteo pendiente (taps sin guardar)
  const getPending = (id) => Number(pendingLaminas[id] || 0);
  // Total visual = owned + pending
  const getTotal   = (lamina) => getOwned(lamina.id) + getPending(lamina.id);

  const isSelected  = (lamina) => getPending(lamina.id) > 0;
  // "collected" = tiene al menos 1 en Firestore O pendiente
  const isCollected = (lamina) => getTotal(lamina) > 0;
  const isRepeated  = (lamina) => getTotal(lamina) >= 2;

  const shouldShow = (lamina) => {
    if (viewMode === "tengo")     return getOwned(lamina.id) > 0;
    if (viewMode === "faltantes") return getOwned(lamina.id) === 0;
    if (viewMode === "repetidas") return isRepeated(lamina);
    return true;
  };

  // ── Firestore: láminas del mundial ──────────
  useEffect(() => {
    if (!album?.idMundial) { setLoading(false); return; }
    setLoading(true);

    const unsub = onSnapshot(
      doc(db, "mundial", album.idMundial),
      (snap) => {
        if (snap.exists()) {
          const arr = Object.values(snap.data().laminas || {});
          arr.sort((a, b) => {
            const gA = String(a.grupo || ""), gB = String(b.grupo || "");
            const eA = String(a.abreviacion || ""), eB = String(b.abreviacion || "");
            if (gA < gB) return -1; if (gA > gB) return 1;
            if (eA < eB) return -1; if (eA > eB) return 1;
            return Number(a.numero || 0) - Number(b.numero || 0);
          });
          setLaminas(arr);
        }
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => unsub();
  }, [album]);

  // ── Firestore: álbum usuario ─────────────────
  useEffect(() => {
    if (!album?.id) return;
    const unsub = onSnapshot(
      doc(db, "album_usuario", album.id),
      (snap) => setOwnedLaminas(snap.exists() ? snap.data()?.laminas || {} : {}),
      console.error
    );
    return () => unsub();
  }, [album?.id]);

  // ── Loader global ────────────────────────────
  useEffect(() => {
    if (window.WCLoader) loading ? window.WCLoader.show() : window.WCLoader.hide();
  }, [loading]);

  // ── Tap: sumar pendiente ─────────────────────
  const toggleLamina = useCallback((id) => {
    setPendingLaminas((prev) => ({ ...prev, [id]: (Number(prev[id] || 0)) + 1 }));
    // Agregar al historial de cambios para poder revertir
    setChangeHistory((prev) => [...prev, id]);
  }, []);

  // ── Long-press: abrir modal ──────────────────
  const openEditModal = useCallback((lamina) => setEditModal({ lamina }), []);

  // ── Revertir último cambio ───────────────────
  const revertLastChange = useCallback(() => {
    if (changeHistory.length === 0) return;

    const newHistory = [...changeHistory];
    const lastChangedId = newHistory.pop();

    setChangeHistory(newHistory);
    setPendingLaminas((prev) => {
      const newQty = Number(prev[lastChangedId] || 0) - 1;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[lastChangedId];
        return updated;
      }
      return { ...prev, [lastChangedId]: newQty };
    });
  }, [changeHistory]);

  // ── Confirmar edición (escribe directo en Firestore) ──
  const handleEditConfirm = useCallback(async (newQty) => {
    const { lamina } = editModal;
    setEditModal(null);
    if (!album?.id) return;

    try {
      const ref = doc(db, "album_usuario", album.id);

      if (newQty === 0) {
        // deleteField() sí elimina la clave aunque usemos merge
        await updateDoc(ref, { [`laminas.${lamina.id}`]: deleteField() });
      } else {
        await setDoc(ref, { laminas: { [lamina.id]: newQty } }, { merge: true });
      }

      // También limpiar cualquier pendiente de esa lámina
      setPendingLaminas((prev) => {
        const next = { ...prev };
        delete next[lamina.id];
        return next;
      });

      showToast(
        newQty === 0
          ? `"${lamina.nombre}" eliminada del álbum`
          : `"${lamina.nombre}" actualizada a ${newQty}`,
        newQty === 0 ? "error" : "success"
      );
    } catch (err) {
      console.error(err);
      showToast("No se pudo actualizar la lámina", "error");
    }
  }, [editModal, album?.id]);

  // ── Guardar pendientes masivos ───────────────
  const pendingCount = Object.values(pendingLaminas).reduce((s, v) => s + Number(v || 0), 0);

  const savePending = async () => {
    if (!album?.id || pendingCount === 0) return;
    setSavingSelection(true);
    try {
      const ref  = doc(db, "album_usuario", album.id);
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data()?.laminas || {} : {};
      const updated  = { ...existing };

      Object.entries(pendingLaminas).forEach(([id, qty]) => {
        const amount = Number(qty || 0);
        if (amount <= 0) return;
        updated[id] = Number(updated[id] || 0) + amount;
      });

      await setDoc(ref, { laminas: updated }, { merge: true });
      setPendingLaminas({});
      setChangeHistory([]); // Limpiar historial después de guardar

      showToast(
        `${pendingCount} lámina${pendingCount === 1 ? "" : "s"} guardada${pendingCount === 1 ? "" : "s"}`,
        "success"
      );
    } catch (err) {
      console.error(err);
      showToast("No se pudieron guardar las láminas", "error");
    } finally {
      setSavingSelection(false);
    }
  };

  // ── Agrupar ──────────────────────────────────
  const grupos = {};
  const gruposStats = {};

  laminas.forEach((lamina) => {
    const grupo  = lamina.grupo        || "Sin grupo";
    const equipo = lamina.abreviacion  || "Sin equipo";
    const col    = isCollected(lamina);

    if (!grupos[grupo])       { grupos[grupo] = {}; gruposStats[grupo] = { total: 0, collected: 0 }; }
    if (!grupos[grupo][equipo]) grupos[grupo][equipo] = [];

    gruposStats[grupo].total++;
    if (col) gruposStats[grupo].collected++;
    grupos[grupo][equipo].push(lamina);
  });

  const getGroupPct = (g) => {
    const s = gruposStats[g];
    return !s || s.total === 0 ? 0 : Math.round((s.collected / s.total) * 100);
  };

  if (loading) return null;

  return (
    <div className="contenido-container" style={{ paddingTop: "80px" }}>

      {/* HEADER */}
      <div className="contenido-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h1>{album.nombreAlbum}</h1>
        <button className="add-cards-btn" onClick={() => setSwitchOpen(true)}>
          + Tarjetas
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por abreviatura o equipo…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          className="search-input"
        />
      </div>

      {/* FILTROS */}
      <div className="view-mode-buttons">
        {[
          { key: "all",       label: "Todo"      },
          { key: "tengo",     label: "Tengo"     },
          { key: "faltantes", label: "Faltantes" },
          { key: "repetidas", label: "Repetidas" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`mode-filter${viewMode === key ? " active" : ""}`}
            onClick={() => setViewMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SWITCH CARDS */}
      {switchOpen && (
        <SwitchCards
          onClose={() => setSwitchOpen(false)}
          laminas={laminas}
          userId={auth.currentUser?.uid}
          albumId={album.idMundial}
        />
      )}

      {/* GRUPOS */}
      {Object.keys(grupos).map((grupo) => {
        const norm = searchTerm.trim().toLowerCase();
        const searchEnabled = norm.length >= 2;

        const equiposFiltrados = Object.entries(grupos[grupo]).reduce((acc, [equipo, eqLaminas]) => {
          const teamName = eqLaminas[0]?.nombre || equipo;
          const matches =
            !searchEnabled ||
            equipo.toLowerCase().includes(norm) ||
            teamName.toLowerCase().includes(norm);

          const visible = eqLaminas.filter(shouldShow);
          if (!matches || visible.length === 0) return acc;
          acc.push({ equipo, teamName, laminas: visible });
          return acc;
        }, []);

        if (equiposFiltrados.length === 0) return null;

        const isOpen = searchEnabled ? true : selectedGroup === grupo;
        const pct    = getGroupPct(grupo);

        return (
          <div key={grupo} className="grupo-section">
            <button
              className={`grupo-header${pct === 100 ? " complete" : ""}`}
              onClick={() => setSelectedGroup(isOpen ? null : grupo)}
            >
              <div>
                <h2 className="grupo-title">Grupo {grupo}</h2>
                <div className="grupo-progress-wrapper">
                  <p className="grupo-progress">
                    {gruposStats[grupo].collected}/{gruposStats[grupo].total} · {pct}%
                  </p>
                  <div className="grupo-bar">
                    <div className="grupo-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              <ChevronDown size={22} className={`grupo-icon${isOpen ? " open" : ""}`} />
            </button>

            {isOpen && (
              <div className="grupo-content">
                {equiposFiltrados.map(({ equipo, teamName, laminas: eqL }) => (
                  <div key={equipo} className="equipo-section">
                    <h3 className="equipo-title">
                      {equipo}
                      {teamName && teamName.toLowerCase() !== equipo.toLowerCase()
                        ? ` · ${teamName}` : ""}
                    </h3>
                    <div className="laminas-grid">
                      {eqL.map((lamina) => (
                        <LaminaCard
                          key={lamina.id}
                          lamina={lamina}
                          collected={isCollected(lamina)}
                          selected={isSelected(lamina)}
                          totalCount={getTotal(lamina)}
                          onTap={toggleLamina}
                          onLongPress={openEditModal}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* GUARDAR FLOTANTE */}
      {pendingCount > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", position: "fixed", right: "20px", bottom: "20px", zIndex: 50, alignItems: "flex-end" }}>
          <button
            className="guardar-button revert-button"
            onClick={revertLastChange}
            disabled={changeHistory.length === 0}
            title="Revertir último cambio"
          >
            ↶ Revertir
          </button>
          <button
            className="guardar-button"
            onClick={savePending}
            disabled={savingSelection}
          >
            {savingSelection
              ? "Guardando…"
              : `Guardar ${pendingCount} lámina${pendingCount === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {/* MODAL EDICIÓN */}
      {editModal && (
        <EditQtyModal
          lamina={editModal.lamina}
          // Le pasamos SOLO lo que hay en Firestore, no sumamos pending
          initialQty={getOwned(editModal.lamina.id)}
          onConfirm={handleEditConfirm}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
};

export default Contenido;