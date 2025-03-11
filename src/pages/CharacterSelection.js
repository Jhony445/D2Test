import React, { useEffect, useState } from "react";
import "../styles/CharacterSelection.css";
const API_KEY = process.env.REACT_APP_API_KEY;

// Función para traducir el tipo de clase
const getClassName = (classType) => {
    switch (classType) {
        case 0:
            return "Titán";
        case 1:
            return "Cazador";
        case 2:
            return "Hechicero";
        default:
            return "Desconocido";
    }
};

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
              const charactersData = Object.values(data.Response.characters.data);
              setCharacters(charactersData);
              
              // Nueva línea añadida aquí
              if (onCharactersLoaded) {
                onCharactersLoaded(charactersData);
              }
            }
          } catch (error) {
            console.error("Error obteniendo personajes:", error);
          }
        };
      
        fetchCharacters();
      }, [membershipType, membershipId]);

    return (
        <div className="character-selection-wrapper"> 
            <h2 className="selection-title">Selecciona un Personaje</h2>
            <div className="characters-container">
                {characters.map((char) => (
                    <div
                        key={char.characterId}
                        className="character-card"
                        onClick={() => onCharacterSelect(char)}
                    >
                        <h3 className="character-class">{getClassName(char.classType)}</h3>
                        <img
                            className="character-emblem"
                            src={`https://www.bungie.net/${char.emblemPath}`}
                            alt="Emblema del personaje"
                        />
                        <p className="character-power">Nivel de poder: {char.light}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CharacterSelection;