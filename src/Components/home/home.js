// home.js

import React from "react";

import "./home.css";
import { BookOpen } from "lucide-react";

const Home = ({ user, albums = [], onSelectAlbum }) => {

  return (
    <div className="home-container">

      <div className="home-content">

        {/* TITLE */}
        <div className="welcome-section">

          <h1>
            Mis Álbumes
          </h1>

          <p>
            Tus álbumes mundialistas
            adquiridos
          </p>

        </div>

        {/* EMPTY */}
        {albums.length === 0 ? (

          <div className="empty-albums">

            <BookOpen size={55} />

            <h2>
              No tienes álbumes
            </h2>

            <p>
              Adquiere uno desde
              el menú superior
            </p>

          </div>

        ) : (

          <div className="albums-grid">

            {albums.map(
              (album) => (

                <div
                  key={album.id}
                  className="album-card"
                  onClick={() =>
                    onSelectAlbum(
                      album
                    )
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >

                  <img
                    src={
                      album.portadaAlbum
                    }
                    alt={
                      album.nombreAlbum
                    }
                    className="album-image"
                  />

                  <div className="album-content">

                    <h3>
                      {
                        album.nombreAlbum
                      }
                    </h3>

                    <p>
                      {
                        album.numeroEstampitas
                      }{" "}
                      estampitas
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>
    </div>
  );
};

export default Home;