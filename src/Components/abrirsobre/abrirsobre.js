import React, { useState } from "react";

import "./abrirsobre.css";

import {
  X,
  Search,
  Plus,
  PackageOpen,
} from "lucide-react";

const AbrirSobre = ({ onClose }) => {

  // ================= STATES =================
  const [worldcup, setWorldcup] =
    useState("");

  const [team, setTeam] = useState("");

  const [number, setNumber] =
    useState("");

  const [addedCards, setAddedCards] =
    useState([]);

  // ================= MOCK DATA =================
  const worldcups = [
    "Mundial Qatar 2022",
    "Mundial 2026",
  ];

  // ================= SEARCH =================
  const handleSearch = () => {

    if (
      !worldcup ||
      !team.trim() ||
      !number.trim()
    ) {
      return;
    }

    // AQUÍ HARÍAS LA BÚSQUEDA EN FIRESTORE

    const card = {
      id: Date.now(),
      worldcup,
      team,
      number,
      name: `Estampita ${team}-${number}`,
    };

    setAddedCards((prev) => [
      ...prev,
      card,
    ]);

    // LIMPIAR INPUTS
    setTeam("");
    setNumber("");
  };

  return (
    <div className="sobre-overlay">

      <div className="sobre-modal">

        {/* CLOSE */}
        <button
          className="sobre-close"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        {/* HEADER */}
        <div className="sobre-header">

          <div className="sobre-icon">
            <PackageOpen size={34} />
          </div>

          <h2>Abrir Sobre</h2>

          <p>
            Busca rápidamente las estampitas
            obtenidas para agregarlas
            automáticamente a tu álbum.
          </p>

        </div>

        {/* FORM */}
        <div className="sobre-form">

          {/* MUNDIAL */}
          <div className="sobre-group">

            <label>
              Mundial
            </label>

            <select
              value={worldcup}
              onChange={(e) =>
                setWorldcup(e.target.value)
              }
            >

              <option value="">
                Selecciona un mundial
              </option>

              {worldcups.map((item, index) => (
                <option
                  key={index}
                  value={item}
                >
                  {item}
                </option>
              ))}

            </select>

          </div>

          {/* TEAM */}
          <div className="sobre-group">

            <label>
              Abreviación equipo
            </label>

            <input
              type="text"
              placeholder="ARG"
              value={team}
              onChange={(e) =>
                setTeam(
                  e.target.value.toUpperCase()
                )
              }
            />

          </div>

          {/* NUMBER */}
          <div className="sobre-group">

            <label>
              Número estampita
            </label>

            <input
              type="number"
              placeholder="10"
              value={number}
              onChange={(e) =>
                setNumber(e.target.value)
              }
            />

          </div>

          {/* BUTTON */}
          <button
            className="sobre-add-btn"
            onClick={handleSearch}
          >
            <Plus size={18} />
            Agregar estampita
          </button>

        </div>

        {/* RESULTS */}
        <div className="sobre-results">

          <div className="sobre-results-header">

            <h3>
              Estampitas agregadas
            </h3>

            <span>
              {addedCards.length}
            </span>

          </div>

          {addedCards.length === 0 ? (
            <div className="empty-state">

              <Search size={40} />

              <p>
                Aún no has agregado
                estampitas.
              </p>

            </div>
          ) : (
            <div className="added-list">

              {addedCards.map((card) => (
                <div
                  key={card.id}
                  className="added-card"
                >

                  <div>

                    <h4>
                      {card.team} - #
                      {card.number}
                    </h4>

                    <p>{card.worldcup}</p>

                  </div>

                  <span>
                    Agregada
                  </span>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AbrirSobre;