import React, { useEffect, useState } from "react";
import "../styles/CharacterSelection.css";
const API_KEY = process.env.REACT_APP_API_KEY;

const API_KEY = process.env.REACT_APP_API_KEY;

const getClassName = (classType) => {
  switch (classType) {
    case 0: return "Titán";
    case 1: return "Cazador";
    case 2: return "Hechicero";
    default: return "Desconocido";
  }
};

const CharacterSelection = ({ membershipType, membershipId, onCharacterSelect }) => {
  const [characters, setCharacters] = useState([]);

  useEffect(() => { /* ... (mismo código de fetch) */ }, [membershipType, membershipId]);

  return (
    <div>
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