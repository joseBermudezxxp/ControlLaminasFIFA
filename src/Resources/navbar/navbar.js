// navbar.js

import React, {
  useEffect,
  useState,
} from "react";

import {
  signOut,
} from "firebase/auth";

import {
  auth,
} from "../../server/api";

import "./navbar.css";

import {
  Menu,
  X,
  LogOut,
  Upload,
  BookOpen,
  Users,
} from "lucide-react";

const Navbar = ({
  user,
  onOpenCargar,
  onOpenAdquirir,
  onOpenCargarLaminas,
  onOpenAmigos,
}) => {

  const [open, setOpen] =
    useState(false);

  const [showNavbar, setShowNavbar] =
    useState(true);

  const [lastScroll, setLastScroll] =
    useState(0);

  useEffect(() => {

    const handleScroll = () => {

      const currentScroll =
        window.scrollY;

      // DESKTOP
      if (
        window.innerWidth > 768
      ) {

        if (
          currentScroll >
            lastScroll &&
          currentScroll > 80
        ) {

          setShowNavbar(false);

        } else {

          setShowNavbar(true);

        }
      }

      // MOBILE
      else {

        if (
          currentScroll >
            lastScroll &&
          currentScroll > 80
        ) {

          document.body.classList.add(
            "hide-mobile-logo"
          );

        } else {

          document.body.classList.remove(
            "hide-mobile-logo"
          );

        }
      }

      setLastScroll(
        currentScroll
      );
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );

  }, [lastScroll]);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout =
    async () => {

      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          "Error al cerrar sesión:",
          error
        );
      }
    };

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`navbar ${
          showNavbar
            ? "show"
            : "hide"
        }`}
      >

        {/* LOGO */}
        <div className="navbar-logo">
          MiAlbum
        </div>

        {/* DESKTOP */}
        <div className="navbar-links">

          {/* PROFILE */}
          <div className="navbar-profile">

            <div className="navbar-info">

              <span className="navbar-greeting">
                Hola
              </span>

              <span className="navbar-name">
                {
                  user.displayName
                    ?.split(" ")[0]
                }
              </span>

            </div>

            <img
              src={user.photoURL}
              alt="Foto de perfil"
              className="navbar-avatar"
            />

          </div>

          {/* USER */}
          {user.rol !==
            "admin" && (

            <button
              className="nav-btn"
              onClick={
                onOpenAdquirir
              }
            >
              <BookOpen size={18} />
              Adquirir Álbum
            </button>

          )}

          {/* ADMIN */}
          {user.rol ===
            "admin" && (
            <>
              <button
                className="nav-btn upload-btn"
                onClick={
                  onOpenCargar
                }
              >
                <Upload size={18} />
                Cargar Mundial
              </button>

              <button
                className="nav-btn upload-btn"
                onClick={
                  onOpenCargarLaminas
                }
              >
                <BookOpen size={18} />
                Cargar Láminas
              </button>
            </>
          )}

          {/* AMIGOS */}
          <button
            className="nav-btn"
            onClick={onOpenAmigos}
          >
            <Users size={18} />
            Amigos
          </button>

          {/* LOGOUT */}
          <button
            className="nav-btn logout"
            onClick={
              handleLogout
            }
          >

            <LogOut size={18} />

            Cerrar sesión

          </button>

        </div>

        {/* MOBILE BUTTON */}
        <button
          className="menu-toggle"
          onClick={() =>
            setOpen(true)
          }
        >
          <Menu size={28} />
        </button>

      </nav>

      {/* OVERLAY */}
      <div
        className={`overlay ${
          open ? "show" : ""
        }`}
        onClick={() =>
          setOpen(false)
        }
      />

      {/* MOBILE MENU */}
      <div
        className={`mobile-menu ${
          open ? "open" : ""
        }`}
      >

        {/* HEADER */}
        <div className="mobile-header">

          <button
            className="close-btn"
            onClick={() =>
              setOpen(false)
            }
          >
            <X size={28} />
          </button>

        </div>

        {/* PROFILE */}
        <div className="mobile-profile">

          <img
            src={user.photoURL}
            alt="Foto de perfil"
            className="mobile-avatar"
          />

          <div className="mobile-profile-info">

            <span className="mobile-greeting">
              Hola
            </span>

            <span className="mobile-profile-name">
              {
                user.displayName
              }
            </span>

          </div>

        </div>

        {/* LINKS */}
        <div className="mobile-links">

          {/* USER */}
          {user.rol !==
            "admin" && (

            <button
              className="mobile-link"
              onClick={() => {

                onOpenAdquirir();

                setOpen(false);

              }}
            >

              <BookOpen size={20} />

              Adquirir Álbum

            </button>

          )}

          {/* ADMIN */}
          {user.rol ===
            "admin" && (
            <>
              <button
                className="mobile-link upload-btn"
                onClick={() => {

                  onOpenCargar();

                  setOpen(false);

                }}
              >

                <Upload size={20} />

                Cargar Mundial

              </button>

              <button
                className="mobile-link upload-btn"
                onClick={() => {

                  onOpenCargarLaminas();

                  setOpen(false);

                }}
              >

                <BookOpen size={20} />

                Cargar Láminas

              </button>
            </>
          )}

          {/* AMIGOS */}
          <button
            className="mobile-link"
            onClick={() => {

              onOpenAmigos();

              setOpen(false);

            }}
          >

            <Users size={20} />

            Amigos

          </button>

          {/* LOGOUT */}
          <button
            className="mobile-link logout"
            onClick={
              handleLogout
            }
          >

            <LogOut size={20} />

            Cerrar sesión

          </button>

        </div>

      </div>
    </>
  );
};

export default Navbar;