import React, { useState } from "react";
import "./cargar.css";

import { db } from "../../server/api";

import {
  collection,
  doc,
  setDoc,
} from "firebase/firestore";

import { X } from "lucide-react";

const Cargar = ({ isOpen, onClose }) => {
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");
  const [numeroEstampitas, setNumeroEstampitas] = useState("");
  const [loading, setLoading] = useState(false);

  const guardarMundial = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Crear referencia automática
      const mundialRef = doc(collection(db, "mundial"));

      await setDoc(mundialRef, {
        id: mundialRef.id,
        nombre: nombre,
        url: url,
        numerodeestampitas: Number(numeroEstampitas),
      });

      alert("Mundial cargado correctamente");

      // Limpiar formulario
      setNombre("");
      setUrl("");
      setNumeroEstampitas("");
      
      // Cerrar modal
      onClose();

    } catch (error) {
      console.error(error);
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`cargar-overlay ${isOpen ? "show" : ""}`} onClick={onClose}>
      <div className="cargar-container" onClick={(e) => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ margin: 0 }}>Cargar Mundial</h1>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={24} color="#333" />
          </button>
        </div>

        <form onSubmit={guardarMundial}>

          <input
            type="text"
            placeholder="Nombre del mundial"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="URL de la imagen"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Número de estampitas"
            value={numeroEstampitas}
            onChange={(e) => setNumeroEstampitas(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Mundial"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Cargar;