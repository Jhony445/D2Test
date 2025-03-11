import React, { useEffect, useState } from "react";
import "./App.css";

const CLIENT_ID = process.env.REACT_APP_BUNGIE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;  // Cambia esto para usar la variable de entorno
const USER_URL = "https://www.bungie.net/Platform/User/GetBungieNetUser/";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verificar si el token de acceso está en el localStorage
    const token = localStorage.getItem("bungie_access_token");

    if (token) {
      // Si existe el token, obtener los datos del usuario
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
            setUser(data.Response);  // Guardar los datos del usuario en el estado
          }
        })
        .catch((error) => console.error("Error obteniendo datos del usuario:", error));
    }
  }, []);

  const handleLogin = () => {
    const REDIRECT_URI = "https://d2-test.vercel.app/callback"; 
    const authUrl = `https://www.bungie.net/en/OAuth/Authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
      // Cambié el response_type a "token"
    window.location.href = authUrl; // Redirige al usuario a Bungie para autenticación
  };

  const handleLogout = () => {
    // Eliminar el token de acceso y limpiar el estado
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