import React, { useState } from "react";

import "./myprofile.css";

import {
  User,
  Phone,
  Camera,
  Save,
  Mail,
} from "lucide-react";

const MyProfile = () => {

  // ================= USER STATE =================
  const [userData, setUserData] = useState({
    nombre: "Angel Bermudez",
    correo: "angel@gmail.com",
    telefono: "+57 300 123 4567",
    photoURL:
      "https://i.pravatar.cc/300",
  });

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= SAVE =================
  const handleSave = () => {
    console.log(userData);

    // AQUÍ GUARDAS EN FIRESTORE

    alert("Perfil actualizado");
  };

  return (
    <div className="profile-page">

      <div className="profile-card">

        {/* HEADER */}
        <div className="profile-header">

          <div className="profile-image-container">

            <img
              src={userData.photoURL}
              alt="profile"
            />

            <div className="profile-camera">
              <Camera size={18} />
            </div>

          </div>

          <h1>Mi Perfil</h1>

          <p>
            Actualiza tu información personal
            y datos de contacto.
          </p>

        </div>

        {/* FORM */}
        <div className="profile-form">

          {/* FOTO URL */}
          <div className="input-group">

            <label>
              <Camera size={18} />
              URL Foto
            </label>

            <input
              type="text"
              name="photoURL"
              value={userData.photoURL}
              onChange={handleChange}
              placeholder="https://..."
            />

          </div>

          {/* NOMBRE */}
          <div className="input-group">

            <label>
              <User size={18} />
              Nombre
            </label>

            <input
              type="text"
              name="nombre"
              value={userData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
            />

          </div>

          {/* EMAIL */}
          <div className="input-group">

            <label>
              <Mail size={18} />
              Correo electrónico
            </label>

            <input
              type="email"
              value={userData.correo}
              disabled
            />

            <small>
              El correo no puede modificarse.
            </small>

          </div>

          {/* TELEFONO */}
          <div className="input-group">

            <label>
              <Phone size={18} />
              WhatsApp
            </label>

            <input
              type="tel"
              name="telefono"
              value={userData.telefono}
              onChange={handleChange}
              placeholder="+57 300 000 0000"
            />

          </div>

          {/* BUTTON */}
          <button
            className="save-profile-btn"
            onClick={handleSave}
          >
            <Save size={18} />
            Guardar cambios
          </button>

        </div>

      </div>
    </div>
  );
};

export default MyProfile;