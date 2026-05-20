import React, { useState } from "react";

import "./access.css";

import {
  Phone,
  X,
  Check,
} from "lucide-react";

const Access = ({ onClose, onSave }) => {
  const [phone, setPhone] = useState("");

  const handleAccept = () => {
    onSave(phone);

    onClose();
  };

  const handleSkip = () => {
    onSave(null);

    onClose();
  };

  return (
    <div className="access-overlay">

      <div className="access-modal">

        {/* CLOSE */}
        <button
          className="access-close"
          onClick={handleSkip}
        >
          <X size={22} />
        </button>

        {/* HEADER */}
        <div className="access-header">

          <div className="access-icon">
            <Phone size={32} />
          </div>

          <h2>
            ¿Quieres compartir tu WhatsApp?
          </h2>

          <p>
            Esto permitirá que otros usuarios
            puedan contactarte si estás
            intercambiando alguna lámina o si
            tienes un jugador específico que
            ellos están buscando.
          </p>

        </div>

        {/* INPUT */}
        <div className="access-input-group">

          <label>
            Número de WhatsApp
          </label>

          <input
            type="tel"
            placeholder="+57 300 000 0000"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
          />

          <small>
            Compartirlo es totalmente opcional.
          </small>

        </div>

        {/* BUTTONS */}
        <div className="access-buttons">

          <button
            className="skip-btn"
            onClick={handleSkip}
          >
            No compartir
          </button>

          <button
            className="save-btn"
            onClick={handleAccept}
          >
            <Check size={18} />
            Guardar
          </button>

        </div>

      </div>
    </div>
  );
};

export default Access;