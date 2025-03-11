import React, { useEffect, useState } from "react";
import "./App.css";
import CharacterSelection from "./pages/CharacterSelection";

const CLIENT_ID = process.env.REACT_APP_BUNGIE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const USER_URL = "https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/";
const REDIRECT_URI = "https://d2-test.vercel.app/callback"; // Asegúrate de que coincida con la configuración en Bungie

function App() {
  const [user, setUser] = useState(null);
  const [destinyMembership, setDestinyMembership] = useState(null); // Nuevo estado

  useEffect(() => {
    const token = localStorage.getItem("bungie_access_token");

    if (token) {
      fetch(USER_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-API-Key": API_KEY,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.Response) {
            // 1. Obtener usuario de Bungie.net
            const bungieUser = data.Response.bungieNetUser;
            
            // 2. Obtener membresías de Destiny
            const destinyMemberships = data.Response.destinyMemberships;
            
            // 3. Determinar membresía primaria (cross-save o primera disponible)
            const crossSaveOverride = data.Response.primaryMembershipId;
            let primaryMembership;

            if (crossSaveOverride) {
              primaryMembership = destinyMemberships.find(
                m => m.membershipId === crossSaveOverride
              );
            } else {
              primaryMembership = destinyMemberships[0];
            }

            if (primaryMembership) {
              setDestinyMembership({
                type: primaryMembership.membershipType,
                id: primaryMembership.membershipId
              });
            }

            setUser(bungieUser);
          }
        })
        .catch((error) => console.error("Error:", error));
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

            {/* Mostrar selección de personajes */}
            {destinyMembership && (
              <CharacterSelection
                membershipType={destinyMembership.type}
                membershipId={destinyMembership.id}
                onCharacterSelect={(character) => {
                  console.log("Personaje seleccionado:", character);
                  // Aquí puedes manejar la selección del personaje
                }}
              />
            )}
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
