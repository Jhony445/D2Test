import React, { useEffect, useState } from 'react';

const API_KEY = process.env.REACT_APP_API_KEY;

const CharacterInventory = ({ character, membershipType, membershipId, otherCharacters }) => {
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  useEffect(() => {
    const fetchInventory = async () => {
      const token = localStorage.getItem('bungie_access_token');
      const url = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${character.characterId}/?components=201`;
      
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-API-Key': API_KEY
          }
        });
        const data = await response.json();
        const equipment = data.Response.equipment.data.items;
        setInventory(equipment);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    fetchInventory();
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
      
      if (response.ok) {
        console.log('Transferencia exitosa');
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error transferring item:', error);
    }
  };

  return (
    <div className="inventory-container">
      <h3>Inventario de {character.classType === 0 ? 'Titán' : character.classType === 1 ? 'Cazador' : 'Hechicero'}</h3>
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
            {otherCharacters
              .filter(c => c.characterId !== character.characterId)
              .map((char) => (
                <div 
                  key={char.characterId}
                  className="character-option"
                  onClick={() => handleTransfer(char.characterId)}
                >
                  <p>{char.classType === 0 ? 'Titán' : char.classType === 1 ? 'Cazador' : 'Hechicero'}</p>
                  <p>Nivel: {char.light}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterInventory;