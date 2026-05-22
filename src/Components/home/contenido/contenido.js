// contenido.js

import React, {
  useEffect,
  useState,
} from "react";

import "./contenido.css";

import {
  db,
} from "../../../server/api";

import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

import {
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

import SwitchCards from "../../switchCards/SwitchCards";
import "../../../Resources/carga/carga.js";
import { auth } from "../../../server/api";
import { showToast } from "../../../Resources/toast/ToastContainer";

const Contenido = ({
  album,
  onBack,
}) => {

  const [laminas, setLaminas] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState("all");
  const [ownedLaminas, setOwnedLaminas] = useState({});
  const [selectedLaminas, setSelectedLaminas] = useState({});
  const [savingSelection, setSavingSelection] = useState(false);

  const [switchOpen, setSwitchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const getOwnedCount = (laminaId) => Number(ownedLaminas[laminaId] || 0);
  const getSelectedCount = (laminaId) => Number(selectedLaminas[laminaId] || 0);
  const getTotalCount = (lamina) => getOwnedCount(lamina.id) + getSelectedCount(lamina.id);
  const isSelected = (lamina) => getSelectedCount(lamina.id) > 0;
  const isCollected = (lamina) => getOwnedCount(lamina.id) > 0 || getSelectedCount(lamina.id) > 0;
  const isRepeated = (lamina) => getTotalCount(lamina) >= 2;
  const shouldDisplayLamina = (lamina) => {
    if (viewMode === "tengo") {
      return getOwnedCount(lamina.id) > 0;
    }
    if (viewMode === "faltantes") {
      return getOwnedCount(lamina.id) === 0;
    }
    if (viewMode === "repetidas") {
      return isRepeated(lamina);
    }
    return true;
  };

  useEffect(() => {

    if (!album || !album.idMundial) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const mundialRef = doc(db, "mundial", album.idMundial);

    const unsubscribeMundial = onSnapshot(
      mundialRef,
      (mundialSnap) => {
        if (mundialSnap.exists()) {
          const data = mundialSnap.data();
          const laminasMap = data.laminas || {};
          const laminasArray = Object.values(laminasMap);

          // ORDENAR:
          // 1. Grupo
          // 2. Equipo
          // 3. Número
          laminasArray.sort((a, b) => {
            const grupoA = String(a.grupo || "");
            const grupoB = String(b.grupo || "");
            const abrevA = String(a.abreviacion || "");
            const abrevB = String(b.abreviacion || "");

            if (grupoA < grupoB) return -1;
            if (grupoA > grupoB) return 1;
            if (abrevA < abrevB) return -1;
            if (abrevA > abrevB) return 1;

            return Number(a.numero || 0) - Number(b.numero || 0);
          });

          setLaminas(laminasArray);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error cargando láminas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeMundial();
  }, [album]);

  useEffect(() => {
    if (!album?.id) return;

    const ref = doc(db, "album_usuario", album.id);
    const unsubscribeAlbum = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setOwnedLaminas(snap.data()?.laminas || {});
        } else {
          setOwnedLaminas({});
        }
      },
      (error) => {
        console.error("Error cargando colección del álbum:", error);
      }
    );

    return () => unsubscribeAlbum();
  }, [album?.id]);

  // mostrar/ocultar loader global según estado local de carga
  useEffect(() => {
    if (typeof window !== "undefined" && window.WCLoader) {
      if (loading) window.WCLoader.show();
      else window.WCLoader.hide();
    }
  }, [loading]);

  // =========================
  // AGRUPAR Y CALCULAR %
  // =========================

  const grupos = {};
  const gruposStats = {};

  laminas.forEach((lamina) => {
    const collected = isCollected(lamina);
    const grupo = lamina.grupo || "Sin grupo";

      const equipo =
        lamina.abreviacion ||
        "Sin equipo";

      if (
        !grupos[grupo]
      ) {

        grupos[grupo] = {};
        gruposStats[grupo] = {
          total: 0,
          collected: 0,
        };
      }

      if (
        !grupos[grupo][
          equipo
        ]
      ) {

        grupos[grupo][
          equipo
        ] = [];
      }

      gruposStats[grupo].total += 1;

      if (collected) {
        gruposStats[grupo].collected += 1;
      }

      grupos[grupo][
        equipo
      ].push(lamina);
    }
  );

  // =========================
  // CALCULAR PORCENTAJE
  // =========================

  const getGroupPercentage = (group) => {
    const stats = gruposStats[group];
    if (!stats || stats.total === 0)
      return 0;
    return Math.round(
      (stats.collected /
        stats.total) *
        100
    );
  };

  // =========================
  // TOGGLE LAMINA
  // =========================

  const toggleLamina = (laminaId) => {
  setSelectedLaminas((prev) => {
    const updated = { ...prev };
    const currentQty = Number(updated[laminaId] || 0);

    updated[laminaId] = currentQty + 1;

    return updated;
  });
};

  const selectedCount = Object.values(selectedLaminas).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const saveSelectedLaminas = async () => {
  if (!album?.id || selectedCount === 0) return;

  setSavingSelection(true);

  try {
    const ref = doc(db, "album_usuario", album.id);

    const snap = await getDoc(ref);

    let existing = {};

    if (snap.exists()) {
      existing = snap.data()?.laminas || {};
    }

    const updated = { ...existing };

    Object.entries(selectedLaminas).forEach(([laminaId, qty]) => {
      const amount = Number(qty || 0);

      if (amount <= 0) return;

      updated[laminaId] =
        Number(updated[laminaId] || 0) + amount;
    });

    await setDoc(
      ref,
      { laminas: updated },
      { merge: true }
    );

    setSelectedLaminas({});

    showToast(
      `${selectedCount} lámina${
        selectedCount === 1 ? "" : "s"
      } agregada${selectedCount === 1 ? "" : "s"} al álbum`,
      "success"
    );

  } catch (error) {
    console.error(
      "Error guardando láminas seleccionadas:",
      error
    );

    showToast(
      "No se pudieron guardar las láminas",
      "error"
    );

  } finally {
    setSavingSelection(false);
  }
};

  // =========================
  // LOADING
  // =========================

  if (loading) return null;

  return (
    <div className="contenido-container" style={{ paddingTop: "80px" }}>

      {/* HEADER */}
      <div className="contenido-header">

        <button
          className="back-button"
          onClick={onBack}
        >

          <ArrowLeft
            size={20}
          />

          Volver

        </button>

        <h1>
          {
            album.nombreAlbum
          }
        </h1>

        <button
          className="add-cards-btn"
          onClick={() => setSwitchOpen(true)}
        >
          +Tarjetas
        </button>

      </div>

      {/* SEARCH INPUT */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por abreviatura o equipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          className="search-input"
        />
      </div>

      <div className="view-mode-buttons">
        <button
          type="button"
          className={viewMode === "all" ? "mode-filter active" : "mode-filter"}
          onClick={() => setViewMode("all")}
        >
          Mostrar todo
        </button>
        <button
          type="button"
          className={viewMode === "tengo" ? "mode-filter active" : "mode-filter"}
          onClick={() => setViewMode("tengo")}
        >
          Mostrar que tengo
        </button>
        <button
          type="button"
          className={viewMode === "faltantes" ? "mode-filter active" : "mode-filter"}
          onClick={() => setViewMode("faltantes")}
        >
          Mostrar faltantes
        </button>
        <button
          type="button"
          className={viewMode === "repetidas" ? "mode-filter active" : "mode-filter"}
          onClick={() => setViewMode("repetidas")}
        >
          Mostrar repetidas
        </button>
      </div>

      {switchOpen && (
        <SwitchCards
          onClose={() => setSwitchOpen(false)}
          laminas={laminas}
          userId={auth.currentUser?.uid}
          albumId={album.idMundial}
        />
      )}

      {Object.keys(grupos).map((grupo) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const searchEnabled = normalizedSearch.length >= 2;

        const equiposFiltrados = Object.entries(grupos[grupo]).reduce(
          (acc, [equipo, equipoLaminas]) => {
            const teamName = equipoLaminas[0]?.nombre || equipo;
            const teamMatches =
              !searchEnabled ||
              equipo.toLowerCase().includes(normalizedSearch) ||
              teamName.toLowerCase().includes(normalizedSearch);

            const visibleLaminas = equipoLaminas.filter(shouldDisplayLamina);
            if (!teamMatches || visibleLaminas.length === 0) {
              return acc;
            }

            acc.push({ equipo, teamName, laminas: visibleLaminas });
            return acc;
          },
          []
        );

        if (equiposFiltrados.length === 0) {
          return null;
        }

        const isOpen = searchEnabled ? true : selectedGroup === grupo;

        return (
          <div key={grupo} className="grupo-section">
            {/* HEADER */}
            <button
              className={`grupo-header ${getGroupPercentage(grupo) === 100 ? "complete" : ""}`}
              onClick={() => setSelectedGroup(isOpen ? null : grupo)}
            >
              <div>
                <h2 className="grupo-title">Grupo {grupo}</h2>
                <div className="grupo-progress-wrapper">
                  <p className="grupo-progress">
                    {gruposStats[grupo].collected}/{gruposStats[grupo].total}
                    {" • "}
                    {getGroupPercentage(grupo)}%
                  </p>
                  <div className="grupo-bar">
                    <div
                      className="grupo-fill"
                      style={{ width: `${getGroupPercentage(grupo)}%` }}
                    />
                  </div>
                </div>
              </div>
              <ChevronDown
                size={24}
                className={`grupo-icon ${isOpen ? "open" : ""}`}
              />
            </button>

            {/* CONTENIDO */}
            {isOpen && (
              <div className="grupo-content">
                {equiposFiltrados.map(({ equipo, teamName, laminas: equipoLaminas }) => (
                  <div key={equipo} className="equipo-section">
                    <h3 className="equipo-title">
                      {equipo}
                      {teamName && teamName.toLowerCase() !== equipo.toLowerCase()
                        ? ` • ${teamName}`
                        : ""}
                    </h3>

                    <div className="laminas-grid">
                      {equipoLaminas.map((lamina) => (
                        <div
                          key={lamina.id}
                          className={`lamina-card ${
                            isCollected(lamina) ? "collected" : ""
                          } ${isSelected(lamina) ? "selected" : ""}`}
                          onClick={() => toggleLamina(lamina.id)}
                        >
                          <img
                            src={lamina.bandera}
                            alt={lamina.nombre}
                            className={`lamina-image ${isCollected(lamina) ? "owned" : ""}`}
                          />

                          <div className="lamina-info">
                            <h4>{lamina.nombre}</h4>
                            <p style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              {String(lamina.id) === "00"
                                ? <span style={{ fontWeight: 700, color: 'var(--primary)' }}>#00</span>
                                : <>
                                    <span>#{lamina.numero}</span>
                                    <small style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{lamina.id}</small>
                                  </>
                              }
                            </p>
                          </div>

                          {getTotalCount(lamina) >= 2 && (
                            <div className="lamina-count-badge">
                              {getTotalCount(lamina)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {selectedCount > 0 && (
        <button
          className="guardar-button"
          onClick={saveSelectedLaminas}
          disabled={savingSelection}
        >
          {savingSelection
            ? "Guardando..."
            : `Guardar ${selectedCount} lámina${selectedCount === 1 ? "" : "s"}`}
        </button>
      )}

    </div>
  );
};

export default Contenido;