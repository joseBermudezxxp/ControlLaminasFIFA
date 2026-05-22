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
  getDoc,
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

  const [currentLaminas, setCurrentLaminas] = useState([]);
  const [hasExistingLaminas, setHasExistingLaminas] = useState(false);
  const [updateMode, setUpdateMode] = useState("complete"); // "complete" o "urls"
  const [failedUrls, setFailedUrls] = useState(new Set()); // Rastrea URLs que fallaron a cargar

  // =========================
  // LOAD WORLDCUPS
  // =========================

  useEffect(() => {

    if (isOpen) {
      cargarMundiales();
    }

  }, [isOpen]);

  useEffect(() => {
    const loadExistingLaminas = async () => {
      if (!idMundial) {
        setCurrentLaminas([]);
        setHasExistingLaminas(false);
        setPreview([]);
        setFailedUrls(new Set());
        return;
      }

      try {
        const mundialRef = doc(db, "mundial", idMundial);
        const mundialSnap = await getDoc(mundialRef);

        if (mundialSnap.exists()) {
          const laminasMap = mundialSnap.data()?.laminas || {};
          const laminasArray = Object.values(laminasMap).map((lamina) => ({
            ...lamina,
            id: lamina.id || `${lamina.abreviacion || ""}${lamina.numero || ""}`,
          }));

          setCurrentLaminas(laminasArray);
          setHasExistingLaminas(Object.keys(laminasMap).length > 0);
          setPreview(laminasArray);
          setFailedUrls(new Set());
        } else {
          setCurrentLaminas([]);
          setHasExistingLaminas(false);
          setPreview([]);
          setFailedUrls(new Set());
        }
      } catch (error) {
        console.error("Error cargando láminas existentes:", error);
        setCurrentLaminas([]);
        setHasExistingLaminas(false);
        setFailedUrls(new Set());
      }
    };

    loadExistingLaminas();
  }, [idMundial]);
  useEffect(() => {

  const equiposSinUrl = [];

  const equiposYaAgregados = new Set();

  preview.forEach((item) => {

    const sinUrl =
      !item.bandera ||
      item.bandera.trim() === "";

    const urlFallida =
      failedUrls.has(item.abreviacion);

    if (
      (sinUrl || urlFallida) &&
      !equiposYaAgregados.has(item.abreviacion)
    ) {

      equiposYaAgregados.add(item.abreviacion);

      equiposSinUrl.push({
        abreviacion: item.abreviacion,
        nombre: item.nombre,
        url: item.bandera || "SIN URL",
      });
    }
  });

  if (equiposSinUrl.length > 0) {

    console.log(
      "Equipos sin URL o con URL inválida:"
    );

    console.table(equiposSinUrl);

  }

}, [preview, failedUrls]);

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
  // VALIDAR URL
  // =========================

  const isValidUrl = (url) => {
    if (!url || url.trim() === "") return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch (e) {
      return false;
    }
  };

  // =========================
  // DESCARGAR PLANTILLA URLs POR EQUIPO
  // =========================

  const descargarPlantillaUrls = () => {
    if (currentLaminas.length === 0) {
      alert("No hay láminas cargadas para descargar plantilla");
      return;
    }

    // Agrupar por equipo (nombre)
    const equiposMap = {};
    
    currentLaminas.forEach((lamina) => {
      const nombreEquipo = lamina.nombre;
      if (!equiposMap[nombreEquipo]) {
        equiposMap[nombreEquipo] = {
          nombre: lamina.nombre,
          abreviacion: lamina.abreviacion,
          bandera: lamina.bandera || "",
        };
      }
    });

    // Convertir a array y crear filas
    const rows = Object.values(equiposMap).map((equipo) => ({
      "ABREVIACION": equipo.abreviacion,
      "NOMBRE DEL EQUIPO": equipo.nombre,
      "URL BANDERA": failedUrls.has(equipo.abreviacion) ? "" : equipo.bandera,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Actualizar URLs");
    XLSX.writeFile(workbook, `plantilla_urls_${idMundial}.xlsx`);
  };

  // =========================
  // DESCARGAR PLANTILLA VACÍA
  // =========================

  const descargarPlantillaVacia = () => {
    const rows = [
      {
        "ID": "MEX1",
        "NOMBRE DEL EQUIPO": "México",
        "ABREVIACION": "MEX",
        "GRUPO": "A",
        "URL BANDERA": "https://ejemplo.com/mexico.png",
        "TIPO": "EQUIPO",
        "RANGO DE LAMINAS": "(1-20)",
        "NUMERO": "",
        "JUGADOR": "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    XLSX.writeFile(workbook, "plantilla_laminas.xlsx");
  };

  // =========================
  // ACTUALIZAR SOLO URLs POR EQUIPO
  // =========================

  const actualizarUrls = async (e) => {
    try {
      if (!idMundial) {
        alert("Selecciona primero un mundial");
        return;
      }

      const file = e.target.files[0];
      if (!file) return;

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const nuevasLaminas = preview.length > 0 ? [...preview] : [...currentLaminas];

      // Procesar cada fila del Excel (equipo)
      json.forEach((row) => {
        const abreviacion = (row["ABREVIACION"] || row["abreviacion"] || "").toString().toUpperCase().trim();
        const urlBandera = row["URL BANDERA"] || row["URL"] || row["url"] || "";

        if (abreviacion && urlBandera) {
          // Actualizar TODAS las láminas de este equipo
          nuevasLaminas.forEach((lamina) => {
            if (lamina.abreviacion.toUpperCase() === abreviacion) {
              lamina.bandera = urlBandera;
            }
          });
        }
      });

      setPreview(nuevasLaminas);
      setUpdateMode("urls");
      setFailedUrls(new Set());
      alert(`URLs actualizadas para ${json.length} equipo(s)`);
    } catch (error) {
      console.error(error);
      alert("Error leyendo Excel de URLs");
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

        const numeroRow = Number(row["NUMERO"] || row["numero"] || 0);

        if (rangoTexto) {
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
        } else if (numeroRow > 0) {
          todas.push({
            id: row["ID"]
              ? row["ID"].toString().toUpperCase().trim()
              : `${abreviacion}${numeroRow}`,
            numero: numeroRow,
            nombre,
            abreviacion,
            grupo,
            bandera,
            tipo,
            jugador: row["JUGADOR"] || "",
            idMundial,
            editable: true,
          });
        }
      });

      setPreview(todas);

      setFailedUrls(new Set());

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

  const guardarFirestore = async () => {
    try {
      setLoading(true);

      // =====================
      // MAPA DE LÁMINAS
      // =====================

      const mundialRef = doc(db, "mundial", idMundial);
      const mundialSnap = await getDoc(mundialRef);

      if (!mundialSnap.exists()) {
        alert("El mundial no existe");
        return;
      }

      const laminasMapActual = mundialSnap.data()?.laminas || {};

      if (updateMode === "urls") {
        // =====================
        // ACTUALIZAR SOLO URLs
        // =====================

        const laminasMapActualizado = { ...laminasMapActual };

        preview.forEach((lamina) => {
          if (laminasMapActualizado[lamina.id]) {
            laminasMapActualizado[lamina.id].bandera = lamina.bandera;
          }
        });

        await updateDoc(mundialRef, {
          laminas: laminasMapActualizado,
        });

        alert("URLs actualizadas correctamente");
      } else {
        // =====================
        // IMPORTAR/REEMPLAZAR COMPLETO
        // =====================

        const laminasMap = {};

        preview.forEach((lamina) => {
          laminasMap[lamina.id] = {
            id: lamina.id,
            numero: lamina.numero,
            nombre: lamina.nombre,
            abreviacion: lamina.abreviacion,
            grupo: lamina.grupo,
            bandera: lamina.bandera,
            tipo: lamina.tipo,
            jugador: lamina.jugador,
          };
        });

        await updateDoc(mundialRef, {
          laminas: laminasMap,
        });

        alert("Láminas importadas correctamente");
      }

      setPreview([]);
      setUpdateMode("complete");
      setFailedUrls(new Set());
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error guardando láminas");
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
        <div className="excel-actions">
          <label className="excel-btn">
            <Upload size={18} />
            Importar Excel Completo
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={leerExcel}
            />
          </label>

          <label className="excel-btn update-urls-btn">
            <Upload size={18} />
            Actualizar solo URLs
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={actualizarUrls}
            />
          </label>

          <button
            type="button"
            className="excel-btn download-btn"
            onClick={descargarPlantillaVacia}
          >
            <Upload size={18} />
            Descargar Plantilla
          </button>

          {hasExistingLaminas && (
            <>
              <button
                type="button"
                className="excel-btn export-btn"
                onClick={() => {
                  const rows = currentLaminas.map((item) => ({
                    "ID": item.id,
                    "NOMBRE DEL EQUIPO": item.nombre,
                    "ABREVIACION": item.abreviacion,
                    "GRUPO": item.grupo,
                    "URL BANDERA": item.bandera,
                    "TIPO": item.tipo,
                    "NUMERO": item.numero,
                    "JUGADOR": item.jugador || "",
                  }));
                  const worksheet = XLSX.utils.json_to_sheet(rows);
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "Láminas");
                  XLSX.writeFile(workbook, `${idMundial}_laminas.xlsx`);
                }}
              >
                <Upload size={18} />
                Exportar Completo
              </button>

              <button
                type="button"
                className="excel-btn download-urls-btn"
                onClick={descargarPlantillaUrls}
              >
                <Upload size={18} />
                Exportar Plantilla URLs
              </button>
            </>
          )}
        </div>

        {/* PREVIEW */}
        {preview.length > 0 && (

          <>
            <div className="preview-header">

              <h2>
                Vista previa {updateMode === "urls" ? "- Actualizar URLs" : "- Importación Completa"}
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

                    {/* PREVIEW IMAGEN BANDERA */}
                    <div className="flag-preview-container">
                      {item.bandera ? (
                        <img
                          src={item.bandera}
                          alt={item.nombre}
                          className="flag-preview-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                            setFailedUrls(prev => new Set(prev).add(item.abreviacion));
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = "block";
                            }
                          }}
                          onLoad={(e) => {
                            setFailedUrls(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(item.abreviacion);
                              return newSet;
                            });
                            if (e.target.nextElementSibling) {
                              e.target.nextElementSibling.style.display = "none";
                            }
                          }}
                        />
                      ) : null}
                      <div className="flag-preview-error" style={{ display: item.bandera ? "none" : "flex" }}>
                        <span>Sin URL</span>
                      </div>
                    </div>

                    {/* ID */}
                    {updateMode !== "urls" ? (
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
                    ) : (
                      <p className="lamina-id-display">
                        {item.id}
                      </p>
                    )}

                    {updateMode !== "urls" && (
                      <p>
                        {item.tipo}
                      </p>
                    )}

                    {/* NOMBRE */}
                    {updateMode !== "urls" ? (
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
                    ) : (
                      <p className="lamina-name-display">
                        {item.nombre}
                      </p>
                    )}

                    {/* URL BANDERA */}
                    <input
                      type="text"
                      value={
                        item.bandera
                      }
                      onChange={(e) => {
                        const nuevas = [...preview];
                        nuevas[index].bandera = e.target.value;
                        setPreview(nuevas);
                      }}
                      placeholder="URL de la bandera"
                      className="url-input"
                    />

                    {/* JUGADOR - Solo en modo completo */}
                    {updateMode !== "urls" && (
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
                    )}

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
                : updateMode === "urls"
                ? "Guardar URLs"
                : "Guardar Láminas"}

            </button>
          </>

        )}

      </div>
    </div>
  );
};

export default CargarLaminas;