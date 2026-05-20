import React, { useState } from "react";

import "./switchcards.css";

import {
  X,
  Gift,
  Repeat,
  Check,
} from "lucide-react";

const SwitchCards = ({ onClose }) => {

  // ================= MODE =================
  const [mode, setMode] = useState("switch");

  // ================= MOCK DATA =================
  const missingCards = [
    {
      id: 1,
      number: 10,
      name: "Lionel Messi",
      image:
        "https://picsum.photos/200/300?1",
    },
    {
      id: 2,
      number: 25,
      name: "Cristiano Ronaldo",
      image:
        "https://picsum.photos/200/300?2",
    },
    {
      id: 3,
      number: 40,
      name: "James Rodríguez",
      image:
        "https://picsum.photos/200/300?3",
    },
  ];

  const repeatedCards = [
    {
      id: 4,
      number: 88,
      name: "Neymar Jr",
      image:
        "https://picsum.photos/200/300?4",
    },
    {
      id: 5,
      number: 91,
      name: "Mbappé",
      image:
        "https://picsum.photos/200/300?5",
    },
  ];

  return (
    <div className="switch-overlay">

      <div className="switch-modal">

        {/* CLOSE */}
        <button
          className="switch-close"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        {/* HEADER */}
        <div className="switch-header">

          <h2>
            Intercambio de Estampitas
          </h2>

          <p>
            Encuentra usuarios para cambiar o
            regalar estampitas repetidas.
          </p>

        </div>

        {/* MODES */}
        <div className="switch-modes">

          <button
            className={
              mode === "switch"
                ? "mode-btn active"
                : "mode-btn"
            }
            onClick={() => setMode("switch")}
          >
            <Repeat size={18} />
            Cambiar
          </button>

          <button
            className={
              mode === "gift"
                ? "mode-btn active"
                : "mode-btn"
            }
            onClick={() => setMode("gift")}
          >
            <Gift size={18} />
            Dar
          </button>

        </div>

        {/* SWITCH MODE */}
        {mode === "switch" && (
          <div className="cards-section">

            <div className="section-info">

              <h3>
                Estampitas faltantes
              </h3>

              <p>
                Selecciona las estampitas que
                estás buscando para encontrar
                usuarios que las tengan.
              </p>

            </div>

            <div className="cards-grid">

              {missingCards.map((card) => (
                <div
                  key={card.id}
                  className="card-item"
                >

                  <img
                    src={card.image}
                    alt={card.name}
                  />

                  <div className="card-content">

                    <span>
                      #{card.number}
                    </span>

                    <h4>{card.name}</h4>

                    <button>
                      <Check size={16} />
                      La necesito
                    </button>

                  </div>

                </div>
              ))}

            </div>

          </div>
        )}

        {/* GIFT MODE */}
        {mode === "gift" && (
          <div className="cards-section">

            <div className="section-info">

              <h3>
                Regalar repetidas
              </h3>

              <p>
                Comparte estampitas repetidas
                con otros usuarios.
              </p>

            </div>

            <div className="cards-grid">

              {repeatedCards.map((card) => (
                <div
                  key={card.id}
                  className="card-item"
                >

                  <img
                    src={card.image}
                    alt={card.name}
                  />

                  <div className="card-content">

                    <span>
                      #{card.number}
                    </span>

                    <h4>{card.name}</h4>

                    <button className="gift-btn">
                      <Gift size={16} />
                      Regalar
                    </button>

                  </div>

                </div>
              ))}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default SwitchCards;