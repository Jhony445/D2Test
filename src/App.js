import React, { useEffect, useState } from "react";
import "./App.css";
import CharacterSelection from "./pages/CharacterSelection";
import CharacterInventory from "./pages/CharacterInventory";

const CLIENT_ID = process.env.REACT_APP_BUNGIE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_API_KEY;
const USER_URL = "https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/";
const REDIRECT_URI = "https://d2-test.vercel.app/callback";

function App() {
  const [user, setUser] = useState(null);
  const [destinyMembership, setDestinyMembership] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [allCharacters, setAllCharacters] = useState([]);

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
            const bungieUser = data.Response.bungieNetUser;
            const destinyMemberships = data.Response.destinyMemberships;
            const crossSaveOverride = data.Response.primaryMembershipId;
            
            let primaryMembership = crossSaveOverride 
              ? destinyMemberships.find(m => m.membershipId === crossSaveOverride)
              : destinyMemberships[0];

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
    const authUrl = `https://www.bungie.net/en/OAuth/Authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem("bungie_access_token");
    setUser(null);
    setSelectedCharacter(null);
    setAllCharacters([]);
  };

  const handleCharactersLoaded = (characters) => {
    setAllCharacters(characters);
  };

  return (
    <div className="App">
      <header className="App-header">
        {user ? (
          <div className="user-info">
            <h1>Bienvenido, {user.uniqueName}</h1>
            <p>ID de Bungie: {user.membershipId}</p>
            <button className="logout-btn" onClick={handleLogout}>
              Cerrar Sesión
            </button>

            {destinyMembership && (
              <>
                <CharacterSelection
                  membershipType={destinyMembership.type}
                  membershipId={destinyMembership.id}
                  onCharacterSelect={setSelectedCharacter}
                  onCharactersLoaded={handleCharactersLoaded}
                />

                {selectedCharacter && (
                  <CharacterInventory
                    character={selectedCharacter}
                    membershipType={destinyMembership.type}
                    membershipId={destinyMembership.id}
                    otherCharacters={allCharacters.filter(
                      c => c.characterId !== selectedCharacter.characterId
                    )}
                  />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="auth-container">
            <h1>Bienvenido Guardian</h1>
            <button onClick={handleLogin}>Iniciar Sesión con Bungie</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;