import React, { useEffect, useState } from "react";
import "./App.css";

const CLIENT_ID = process.env.REACT_APP_BUNGIE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const USER_URL = "https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/";
const REDIRECT_URI = "https://d2-test.vercel.app/callback"; // Asegúrate de que coincida con la configuración en Bungie

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log("CLIENT_ID:", CLIENT_ID);
    console.log("API_KEY:", API_KEY);

    const token = localStorage.getItem("bungie_access_token");
    console.log("Token en localStorage:", token);

    if (token) {
      console.log("Obteniendo datos del usuario desde:", USER_URL);
      
      fetch(USER_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-API-Key": API_KEY,
        },
      })
        .then((res) => {
          console.log("Respuesta de la API de Bungie:", res);
          return res.json();
        })
        .then((data) => {
          console.log("Datos del usuario obtenidos:", data);
          if (data.Response && data.Response.bungieNetUser) {
            setUser(data.Response.bungieNetUser);
          } else {
            console.error("Error: No se encontró 'bungieNetUser' en la respuesta", data);
          }
        })
        .catch((error) => console.error("Error obteniendo datos del usuario:", error));
    } else {
      console.warn("No se encontró token en localStorage.");
    }
  }, []);

  const handleLogin = () => {
    console.log("Redirigiendo a la autenticación de Bungie...");
    const authUrl = `https://www.bungie.net/en/OAuth/Authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    console.log("URL de autenticación:", authUrl);
    window.location.href = authUrl; // Redirige al usuario a Bungie para autenticación
  };

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    localStorage.removeItem("bungie_access_token");
    setUser(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        {user ? (
          <>
            <h1>Bienvenido, {user.uniqueName}</h1>
            <p>ID de Bungie: {user.membershipId}</p>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </>
        ) : (
          <>
            <h1>Bienvenido, inicia sesión</h1>
            <button onClick={handleLogin}>Iniciar Sesión con Bungie</button>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
