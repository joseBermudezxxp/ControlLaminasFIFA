import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../server/api";
import "./navbar.css";

import {
  Menu,
  X,
  Settings,
  LogOut,
  Upload,
} from "lucide-react";

const Navbar = ({ user, onOpenCargar }) => {
  const [open, setOpen] = useState(false);

  const [showNavbar, setShowNavbar] = useState(true);

  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      // ================= DESKTOP =================
      if (window.innerWidth > 768) {
        if (currentScroll > lastScroll && currentScroll > 80) {
          setShowNavbar(false);
        } else {
          setShowNavbar(true);
        }
      }

      // ================= MOBILE =================
      else {
        if (currentScroll > lastScroll && currentScroll > 80) {
          document.body.classList.add("hide-mobile-logo");
        } else {
          document.body.classList.remove("hide-mobile-logo");
        }
      }

      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, [lastScroll]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      <nav
        className={`navbar ${
          showNavbar ? "show" : "hide"
        }`}
      >
        {/* LEFT - LOGO */}
        <div className="navbar-logo">
          MiAlbum
        </div>

        {/* CENTER - DESKTOP MENU */}
        <div className="navbar-links">

          {/* PROFILE - LEFT */}
          <div className="navbar-profile">
            <div className="navbar-info">
              <span className="navbar-greeting">Hola</span>
              <span className="navbar-name">{user.displayName?.split(" ")[0]}</span>
            </div>
            <img
              src={user.photoURL}
              alt="Foto de perfil"
              className="navbar-avatar"
            />
          </div>

          {user.rol === "admin" && (
            <button className="nav-btn upload-btn" onClick={onOpenCargar}>
              <Upload size={18} />
              Cargar Mundial
            </button>
          )}

          <button className="nav-btn">
            <Settings size={18} />
            Ajustes
          </button>

          <button className="nav-btn logout" onClick={handleLogout}>
            <LogOut size={18} />
            Cerrar sesión
          </button>

        </div>

        {/* MOBILE BUTTON */}
        <button
          className="menu-toggle"
          onClick={() => setOpen(true)}
        >
          <Menu size={28} />
        </button>
      </nav>

      {/* OVERLAY */}
      <div
        className={`overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${open ? "open" : ""}`}>

        <div className="mobile-header">

          <button
            className="close-btn"
            onClick={() => setOpen(false)}
          >
            <X size={28} />
          </button>

        </div>

        {/* MOBILE PROFILE */}
        <div className="mobile-profile">
          <img
            src={user.photoURL}
            alt="Foto de perfil"
            className="mobile-avatar"
          />
          <div className="mobile-profile-info">
            <span className="mobile-greeting">Hola</span>
            <span className="mobile-profile-name">{user.displayName}</span>
          </div>
        </div>

        <div className="mobile-links">

          {user.rol === "admin" && (
            <button className="mobile-link upload-btn" onClick={() => {
              onOpenCargar();
              setOpen(false);
            }}>
              <Upload size={20} />
              Cargar Mundial
            </button>
          )}

          <button className="mobile-link">
            <Settings size={20} />
            Ajustes
          </button>

          <button className="mobile-link logout" onClick={handleLogout}>
            <LogOut size={20} />
            Cerrar sesión
          </button>

        </div>
      </div>
    </>
  );
};

export default Navbar;