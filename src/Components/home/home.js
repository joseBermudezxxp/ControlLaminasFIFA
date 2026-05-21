import React, { useState, useEffect } from "react";
import "./home.css";

import { auth, db } from "../../server/api";
import { doc, getDoc } from "firebase/firestore";

const Home = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user.uid]);

  if (loading) {
    return <div className="home-container"><h2>Cargando...</h2></div>;
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="profile-section">
          <img
            src={user.photoURL}
            alt="Foto de perfil"
            className="profile-pic"
          />
          <h2>Hola, {userData?.nombre || user.displayName}! 👋</h2>
          <p className="profile-email">{user.email}</p>
        </div>

        <div className="welcome-section">
          <h1>World Cup Album</h1>
          <p>Bienvenido a tu álbum mundialista</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
