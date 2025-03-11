import React, { useEffect, useState } from 'react';
import "../styles/CharacterInventory.css";
const API_KEY = process.env.REACT_APP_API_KEY;

const CharacterInventory = ({ character, membershipType, membershipId, otherCharacters }) => {
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDefinitions, setItemDefinitions] = useState({});

  // Obtener definiciones de items
  useEffect(() => {
    const fetchItemDefinitions = async (itemHashes) => {
      try {
        const definitions = await Promise.all(
          itemHashes.map(async (hash) => {
            const response = await fetch(
              `https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${hash}/`,
              {
                headers: {
                  'X-API-Key': API_KEY
                }
              }
            );
            const data = await response.json();
            return data.Response;
          })
        );
        
        const definitionsMap = definitions.reduce((acc, def) => {
          acc[def.hash] = def;
          return acc;
        }, {});
        
        setItemDefinitions(definitionsMap);
      } catch (error) {
        console.error('Error fetching item definitions:', error);
      }
    };

    if (inventory.length > 0) {
      const itemHashes = inventory.map(item => item.itemHash);
      fetchItemDefinitions([...new Set(itemHashes)]);
    }
  }, [inventory]);

  // Obtener inventario
  useEffect(() => {
    const fetchInventory = async () => {
      const token = localStorage.getItem('bungie_access_token');
      const url = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${character.characterId}/?components=205`;
    
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-API-Key': API_KEY
          }
        });
        const data = await response.json();
        
        if (data.Response?.equipment?.data?.items) {
          setInventory(data.Response.equipment.data.items);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    if (character?.characterId) {
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
      
      const result = await response.json();
      if (result.ErrorCode === 1) {
        console.log('Transferencia exitosa');
        setSelectedItem(null);
        // Recargar inventario
        const newInventory = inventory.filter(item => item.itemInstanceId !== selectedItem.itemInstanceId);
        setInventory(newInventory);
      }
    } catch (error) {
      console.error('Error transferring item:', error);
    }
  };

  return (
    <div className="inventory-container">
      <h3>Inventario de {getClassName(character.classType)}</h3>
      <div className="weapons-grid">
        {inventory.map((item) => {
          const itemDef = itemDefinitions[item.itemHash] || {};
          return (
            <div 
              key={item.itemInstanceId} 
              className="weapon-card"
              onClick={() => setSelectedItem(item)}
            >
              <img 
                src={`https://www.bungie.net${itemDef.displayProperties?.icon}`} 
                alt={itemDef.displayProperties?.name} 
                className="weapon-icon"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://www.bungie.net/common/destiny2_content/icons/ea5d6b7f6a0c1d3863f3f9b4eab8b61f.png';
                }}
              />
              <p>{itemDef.displayProperties?.name || 'Arma desconocida'}</p>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <div className="transfer-modal">
          <h4>Transferir {itemDefinitions[selectedItem.itemHash]?.displayProperties?.name}</h4>
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

const getClassName = (classType) => {
  const classes = {
    0: 'Titán',
    1: 'Cazador',
    2: 'Hechicero'
  };
  return classes[classType] || 'Desconocido';
};

export default CharacterInventory;