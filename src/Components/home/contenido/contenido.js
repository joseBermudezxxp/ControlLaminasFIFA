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
} from "firebase/firestore";

import {
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

import SwitchCards from "../../switchCards/SwitchCards";
import "../../../Resources/carga/carga.js";
import { auth } from "../../../server/api";

const Contenido = ({
  album,
  onBack,
}) => {

  const [laminas, setLaminas] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showFaltantes, setShowFaltantes] = useState(false);
  const [ownedLaminas, setOwnedLaminas] = useState({});

  const [collectedLaminas, setCollectedLaminas] = useState(() => {
    const stored =
      localStorage.getItem(
        `coleccion_${album?.idMundial}`
      );
    return stored ? JSON.parse(stored) : {};
  });

  const [switchOpen, setSwitchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {

    if (!album || !album.idMundial) {
      setLoading(false);
      return;
    }

    const fetchLaminas =
      async () => {

        try {

          const mundialRef =
            doc(
              db,
              "mundial",
              album.idMundial
            );

          const mundialSnap =
            await getDoc(
              mundialRef
            );

          if (
            mundialSnap.exists()
          ) {

            const data =
              mundialSnap.data();

            const laminasMap =
              data.laminas || {};

            const laminasArray =
              Object.values(
                laminasMap
              );

            // ORDENAR:
            // 1. Grupo
            // 2. Equipo
            // 3. Número

            laminasArray.sort(
              (a, b) => {

                const grupoA = String(a.grupo || "");
                const grupoB = String(b.grupo || "");
                const abrevA = String(a.abreviacion || "");
                const abrevB = String(b.abreviacion || "");

                if (
                  grupoA <
                  grupoB
                )
                  return -1;

                if (
                  grupoA >
                  grupoB
                )
                  return 1;

                if (
                  abrevA <
                  abrevB
                )
                  return -1;

                if (
                  abrevA >
                  abrevB
                )
                  return 1;

                return (
                  Number(
                    a.numero || 0
                  ) -
                  Number(
                    b.numero || 0
                  )
                );
              }
            );

            setLaminas(
              laminasArray
            );

          }

        } catch (error) {

          console.error(
            "Error cargando láminas:",
            error
          );

        } finally {

          setLoading(false);

        }
      };

    fetchLaminas();

  }, [album]);

  useEffect(() => {
    if (!album?.id) return;

    const fetchOwnedLaminas = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const ref = doc(db, "album_usuario", album.id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setOwnedLaminas(data?.laminas || {});
        }
      } catch (error) {
        console.error("Error cargando colección del álbum:", error);
      }
    };

    fetchOwnedLaminas();
  }, [album?.id]);

  useEffect(() => {
    if (!album?.idMundial) return;

    const ownedFlags = Object.entries(ownedLaminas).reduce(
      (acc, [id, qty]) => {
        if (Number(qty) > 0) {
          acc[id] = true;
        }
        return acc;
      },
      {}
    );

    setCollectedLaminas((prev) => ({
      ...prev,
      ...ownedFlags,
    }));
  }, [ownedLaminas, album?.idMundial]);

  // mostrar/ocultar loader global según estado local de carga
  useEffect(() => {
    if (typeof window !== "undefined" && window.WCLoader) {
      if (loading) window.WCLoader.show();
      else window.WCLoader.hide();
    }
  }, [loading]);

  // =========================
  // GUARDAR EN LOCALSTORAGE
  // =========================

  useEffect(() => {

    if (album?.idMundial) {
      localStorage.setItem(
        `coleccion_${album.idMundial}`,
        JSON.stringify(
          collectedLaminas
        )
      );
    }

  }, [collectedLaminas, album]);

  const isCollected = (lamina) =>
    Boolean(collectedLaminas[lamina.id] || ownedLaminas[lamina.id] > 0);

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

  const toggleLamina = (
    laminaId
  ) => {

    setCollectedLaminas(
      (prev) => {

        const updated = {
          ...prev,
        };

        if (
          updated[laminaId]
        ) {

          delete updated[
            laminaId
          ];

        } else {

          updated[laminaId] =
            true;

        }

        return updated;
      }
    );
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
          placeholder="Buscar por país..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          className="search-input"
        />
      </div>

      {switchOpen && (
        <SwitchCards
          onClose={() => setSwitchOpen(false)}
          laminas={laminas}
          userId={auth.currentUser?.uid}
          albumId={album.idMundial}
        />
      )}

      {Object.keys(
        grupos
      ).map((grupo) => {

  // Filtrar equipos dentro del grupo
  const equiposFiltrados = Object.keys(
    grupos[grupo]
  ).filter((equipo) => {
    if (!searchTerm) return true;
    return equipo.toLowerCase().includes(searchTerm);
  });

  // Si no hay equipos que coincidan, no mostrar el grupo
  if (searchTerm && equiposFiltrados.length === 0) {
    return null;
  }

  // Si hay búsqueda, abrir automáticamente; si no, usar selectedGroup
  const isOpen = searchTerm ? true : selectedGroup === grupo;

  return (

    <div
      key={grupo}
      className="grupo-section"
    >

      {/* HEADER */}
      <button
        className="grupo-header"
        onClick={() =>
          setSelectedGroup(
            isOpen
              ? null
              : grupo
          )
        }
      >

        <div>

          <h2 className="grupo-title">
            Grupo {grupo}
          </h2>

          <p className="grupo-progress">

            {
              gruposStats[
                grupo
              ].collected
            }
            /
            {
              gruposStats[
                grupo
              ].total
            }

            {" • "}

            {
              getGroupPercentage(
                grupo
              )
            }
            %

          </p>

        </div>

        <ChevronDown
          size={24}
          className={`grupo-icon ${
            isOpen
              ? "open"
              : ""
          }`}
        />

      </button>

      {/* CONTENIDO */}
      {isOpen && (

        <div className="grupo-content">

          {equiposFiltrados.map((equipo) => (

            <div
              key={equipo}
              className="equipo-section"
            >

              <h3
                className="equipo-title"
              >
                {equipo}
              </h3>

              <div className="laminas-grid">

                {grupos[
                  grupo
                ][
                  equipo
                ].map(
                  (
                    lamina
                  ) => (

                    <div
                      key={
                        lamina.id
                      }
                      className={`lamina-card ${
                        collectedLaminas[
                          lamina.id
                        ]
                          ? "collected"
                          : ""
                      }`}
                      onClick={() =>
                        toggleLamina(
                          lamina.id
                        )
                      }
                    >

                      <img
                        src={lamina.bandera}
                        alt={lamina.nombre}
                        className={`lamina-image ${
                          isCollected(lamina) ? "owned" : ""
                        }`}
                      />

                      <div className="lamina-info">

                        <h4>
                          {
                            lamina.nombre
                          }
                        </h4>

                        <p>
                          #
                          {
                            lamina.numero
                          }
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>

  );
})}

    </div>
  );
};

export default Contenido;