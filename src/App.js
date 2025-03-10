import React, { useEffect, useState } from "react";
import "./App.css";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID; // Usamos la variable de entorno
const API_KEY = process.env.REACT_APP_API_KEY; // Usamos la variable de entorno
const USER_URL = "https://www.bungie.net/Platform/User/GetBungieNetUser/";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("bungie_access_token");

    if (token) {
      fetch(USER_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-API-Key": API_KEY,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.Response) {
            setUser(data.Response);
          }
        })
        .catch((error) => console.error("Error obteniendo datos del usuario:", error));
    }
  }, []);

  const handleLogin = () => {
    const authUrl = `https://www.bungie.net/es/OAuth/Authorize?client_id=${CLIENT_ID}&response_type=code`;
    window.location.href = authUrl; // Redirige al usuario a Bungie para autenticación
  };

  const handleLogout = () => {
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
