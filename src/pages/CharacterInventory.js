import React, { useEffect, useState } from 'react';

const API_KEY = process.env.REACT_APP_API_KEY;

const CharacterInventory = ({ character, membershipType, membershipId, otherCharacters }) => {
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  useEffect(() => {
    const fetchInventory = async () => {
      const token = localStorage.getItem('bungie_access_token');
      const url = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${character.characterId}/?components=205`; // Componente 205 para equipo equipado
    
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-API-Key': API_KEY
          }
        });
        const data = await response.json();
        
        if (data.Response && data.Response.equipment) {
          const equipment = data.Response.equipment.data.items;
          setInventory(equipment);
        } else {
          console.error('Datos de inventario no disponibles:', data);
          setInventory([]);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    if (character && character.characterId) {
      fetchInventory();
    }
  }, [character, membershipType, membershipId]);

  const handleTransfer = async (targetCharacterId) => {
    const token = localStorage.getItem('bungie_access_token');
    const transferUrl = 'https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/';
    
    try {
      const response = await fetch(transferUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemReferenceHash: selectedItem.itemHash,
          stackSize: 1,
          transferToVault: false,
          characterId: targetCharacterId,
          membershipType: membershipType
        })
      });
      
      const data = await response.json();
      if (data.ErrorCode === 1) {
        console.log('Transferencia exitosa');
        setSelectedItem(null);
      } else {
        console.error('Error en transferencia:', data);
      }
    } catch (error) {
      console.error('Error transferring item:', error);
    }
  };

  return (
    <div className="inventory-container">
      <h3>Inventario de {getClassName(character.classType)}</h3>
      <div className="weapons-grid">
        {inventory.map((item) => (
          <div 
            key={item.itemInstanceId} 
            className="weapon-card"
            onClick={() => setSelectedItem(item)}
          >
            <img 
              src={`https://www.bungie.net${item.iconPath}`} 
              alt={item.itemName} 
              className="weapon-icon"
            />
            <p>{item.itemName}</p>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="transfer-modal">
          <h4>Transferir {selectedItem.itemName}</h4>
          <div className="characters-list">
            {otherCharacters.map((char) => (
              <div 
                key={char.characterId}
                className="character-option"
                onClick={() => handleTransfer(char.characterId)}
              >
                <p>{getClassName(char.classType)}</p>
                <p>Nivel: {char.light}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Función helper para nombres de clase
const getClassName = (classType) => {
  switch(classType) {
    case 0: return 'Titán';
    case 1: return 'Cazador';
    case 2: return 'Hechicero';
    default: return 'Desconocido';
  }
};

export default CharacterInventory;