// cargarlaminas.js

import React, {
  useEffect,
  useState,
} from "react";

import "./cargarlaminas.css";

import * as XLSX from "xlsx";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../../server/api";

import {
  X,
  Upload,
  Save,
} from "lucide-react";

const CargarLaminas = ({
  isOpen,
  onClose,
}) => {

  // =========================
  // STATES
  // =========================

  const [mundiales, setMundiales] =
    useState([]);

  const [idMundial, setIdMundial] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [preview, setPreview] =
    useState([]);

  // =========================
  // LOAD WORLDCUPS
  // =========================

  useEffect(() => {

    if (isOpen) {
      cargarMundiales();
    }

  }, [isOpen]);

  const cargarMundiales = async () => {

    try {

      const snap =
        await getDocs(
          collection(
            db,
            "mundial"
          )
        );

      const data =
        snap.docs.map(
          (docu) => ({
            id: docu.id,
            ...docu.data(),
          })
        );

      setMundiales(data);

    } catch (error) {

      console.error(error);

    }
  };

  // =========================
  // READ EXCEL
  // =========================

  const leerExcel = async (e) => {

    try {

      if (!idMundial) {
        alert(
          "Selecciona primero un mundial"
        );
        return;
      }

      const file =
        e.target.files[0];

      if (!file) return;

      const data =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(data);

      const sheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const json =
        XLSX.utils.sheet_to_json(
          sheet
        );

      let todas = [];

      /*
        ESTRUCTURA DEL EXCEL

        NOMBRE DEL EQUIPO
        ABREVIACION
        GRUPO
        URL BANDERA
        TIPO
        RANGO DE LAMINAS
      */

      json.forEach((row) => {

        const nombre =
          row[
            "NOMBRE DEL EQUIPO"
          ] || "";

        const abreviacion =
          (
            row[
              "ABREVIACION"
            ] || ""
          )
            .toUpperCase()
            .trim();

        const grupo =
          row["GRUPO"] || "";

        const bandera =
          row[
            "URL BANDERA"
          ] || "";

        const tipo =
          (
            row["TIPO"] || ""
          )
            .toUpperCase()
            .trim();

        // "(1-20)"
        const rangoTexto =
          (
            row[
              "RANGO DE LAMINAS"
            ] || ""
          )
            .replace("(", "")
            .replace(")", "");

        const [
          inicio,
          fin,
        ] =
          rangoTexto
            .split("-")
            .map(Number);

        // =====================
        // GENERAR LÁMINAS
        // =====================

        for (
          let i = inicio;
          i <= fin;
          i++
        ) {

          todas.push({

            // MEX1
            // FWC9

            id:
              `${abreviacion}${i}`,

            numero: i,

            nombre,

            abreviacion,

            grupo,

            bandera,

            tipo,

            jugador: "",

            idMundial,

            editable: true,
          });
        }
      });

      setPreview(todas);

      alert(
        `${todas.length} láminas generadas`
      );

    } catch (error) {

      console.error(error);

      alert(
        "Error leyendo Excel"
      );
    }
  };

  // =========================
  // EDITAR ID
  // =========================

  const cambiarIdLamina = (
    index,
    value
  ) => {

    const nuevas =
      [...preview];

    nuevas[index].id =
      value.toUpperCase();

    setPreview(nuevas);
  };

  // =========================
  // EDITAR NOMBRE
  // =========================

  const cambiarNombre = (
    index,
    value
  ) => {

    const nuevas =
      [...preview];

    nuevas[index].nombre =
      value;

    setPreview(nuevas);
  };

  // =========================
  // EDITAR JUGADOR
  // =========================

  const cambiarJugador = (
    index,
    value
  ) => {

    const nuevas =
      [...preview];

    nuevas[index].jugador =
      value;

    setPreview(nuevas);
  };

  // =========================
  // GUARDAR FIRESTORE
  // =========================

  const guardarFirestore =
    async () => {

      try {

        setLoading(true);

        // =====================
        // MAPA DE LÁMINAS
        // =====================

        /*
          laminas: {
            MEX1: {...},
            MEX2: {...},
            FWC9: {...}
          }
        */

        const laminasMap = {};

        preview.forEach(
          (lamina) => {

            laminasMap[
              lamina.id
            ] = {

              id:
                lamina.id,

              numero:
                lamina.numero,

              nombre:
                lamina.nombre,

              abreviacion:
                lamina.abreviacion,

              grupo:
                lamina.grupo,

              bandera:
                lamina.bandera,

              tipo:
                lamina.tipo,

              jugador:
                lamina.jugador,
            };
          }
        );

        // =====================
        // UPDATE MUNDIAL
        // =====================

        const mundialRef =
          doc(
            db,
            "mundial",
            idMundial
          );

        await updateDoc(
          mundialRef,
          {
            laminas:
              laminasMap,
          }
        );

        alert(
          "Láminas importadas correctamente"
        );

        setPreview([]);

        onClose();

      } catch (error) {

        console.error(error);

        alert(
          "Error guardando láminas"
        );

      } finally {

        setLoading(false);

      }
    };

  return (
    <div
      className={`cargar-overlay ${
        isOpen ? "show" : ""
      }`}
      onClick={onClose}
    >

      <div
        className="cargar-container"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* HEADER */}
        <div className="cargar-header">

          <h1>
            Importar Láminas
          </h1>

          <button
            className="close-btn"
            onClick={onClose}
          >
            <X size={24} />
          </button>

        </div>

        {/* SELECT */}
        <select
          value={idMundial}
          onChange={(e) =>
            setIdMundial(
              e.target.value
            )
          }
        >

          <option value="">
            Selecciona un mundial
          </option>

          {mundiales.map(
            (mundial) => (

              <option
                key={mundial.id}
                value={mundial.id}
              >
                {mundial.nombre}
              </option>

            )
          )}

        </select>

        {/* FILE */}
        <label className="excel-btn">

          <Upload size={18} />

          Seleccionar Excel

          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={
              leerExcel
            }
          />

        </label>

        {/* PREVIEW */}
        {preview.length > 0 && (

          <>
            <div className="preview-header">

              <h2>
                Vista previa
              </h2>

              <span>
                {
                  preview.length
                } láminas
              </span>

            </div>

            <div className="preview-grid">

              {preview.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={index}
                    className="preview-card"
                  >

                    {/* ID */}
                    <input
                      type="text"
                      className="lamina-id-input"
                      value={
                        item.id
                      }
                      onChange={(e) =>
                        cambiarIdLamina(
                          index,
                          e.target.value
                        )
                      }
                    />

                    <p>
                      {item.tipo}
                    </p>

                    {/* NOMBRE */}
                    <input
                      type="text"
                      value={
                        item.nombre
                      }
                      onChange={(e) =>
                        cambiarNombre(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="Nombre"
                    />

                    {/* JUGADOR */}
                    <input
                      type="text"
                      value={
                        item.jugador
                      }
                      onChange={(e) =>
                        cambiarJugador(
                          index,
                          e.target.value
                        )
                      }
                      placeholder="Jugador"
                    />

                  </div>

                )
              )}

            </div>

            {/* SAVE */}
            <button
              className="save-btn"
              onClick={
                guardarFirestore
              }
              disabled={loading}
            >

              <Save size={18} />

              {loading
                ? "Guardando..."
                : "Guardar Láminas"}

            </button>
          </>

        )}

      </div>
    </div>
  );
};

export default CargarLaminas;