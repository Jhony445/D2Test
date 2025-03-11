import React, { useEffect, useState } from "react";

const API_KEY = process.env.REACT_APP_API_KEY;

const CharacterSelection = ({ membershipType, membershipId, onCharacterSelect }) => {
  const [characters, setCharacters] = useState([]);

  useEffect(() => {
    const fetchCharacters = async () => {
      if (!membershipType || !membershipId) return;
      const token = localStorage.getItem("bungie_access_token");
      if (!token) return;

      const profileUrl = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=100,200`;
      
      try {
        const response = await fetch(profileUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-API-Key": API_KEY,
          },
        });
        const data = await response.json();
        if (data.Response && data.Response.characters) {
          setCharacters(Object.values(data.Response.characters.data));
        }
      } catch (error) {
        console.error("Error obteniendo personajes:", error);
      }
    };

    fetchCharacters();
  }, [membershipType, membershipId]);

  return (
    <div>
      <h2>Selecciona un Personaje</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        {characters.map((char) => (
          <div key={char.characterId} onClick={() => onCharacterSelect(char)} style={{ border: "1px solid white", padding: "10px", cursor: "pointer" }}>
            <p>Clase: {char.classType}</p>
            <p>Power Level: {char.light}</p>
            <img src={`https://www.bungie.net/${char.emblemPath}`} alt="Emblema" width={100} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSelection;