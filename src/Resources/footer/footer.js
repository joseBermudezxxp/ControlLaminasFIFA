import React, { useState } from "react";

import "./footer.css";

import { Send } from "lucide-react";

const Footer = () => {
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!comment.trim()) return;

    console.log(comment);

    // AQUÍ ENVÍAS A FIRESTORE

    setComment("");
  };

  return (
    <footer className="footer">

      <div className="footer-container">

        {/* LABEL */}
        <div className="footer-info">

          <h3>Comentarios</h3>

          <p>
            Comparte tu opinión, sugerencias o
            experiencia sobre el álbum mundialista.
          </p>

        </div>

        {/* INPUT */}
        <div className="footer-input-container">

          <textarea
            placeholder="Escribe tu comentario..."
            value={comment}
            onChange={(e) =>
              setComment(e.target.value)
            }
          />

          <button onClick={handleSubmit}>
            <Send size={18} />
            Enviar
          </button>

        </div>

      </div>
    </footer>
  );
};

export default Footer;