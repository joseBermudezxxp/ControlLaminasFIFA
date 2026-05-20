import React, { useEffect, useState } from "react";

import "./navbar.css";

import {
  Menu,
  X,
  Settings,
  LogOut,
} from "lucide-react";

const Navbar = () => {
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

  return (
    <>
      <nav
        className={`navbar ${
          showNavbar ? "show" : "hide"
        }`}
      >
        {/* LEFT */}
        <div className="navbar-logo">
          Hola
        </div>

        {/* DESKTOP MENU */}
        <div className="navbar-links">

          <button className="nav-btn">
            <Settings size={18} />
            Ajustes
          </button>

          <button className="nav-btn logout">
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

          <h2>Menú</h2>

          <button
            className="close-btn"
            onClick={() => setOpen(false)}
          >
            <X size={28} />
          </button>

        </div>

        <div className="mobile-links">

          <button className="mobile-link">
            <Settings size={20} />
            Ajustes
          </button>

          <button className="mobile-link logout">
            <LogOut size={20} />
            Cerrar sesión
          </button>

        </div>
      </div>
    </>
  );
};

export default Navbar;