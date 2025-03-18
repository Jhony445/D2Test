import React, { useEffect, useState } from 'react';
import "../styles/CharacterInventory.css";

const API_KEY = process.env.REACT_APP_API_KEY;

// Bucket Hashes para filtrar armas
const WEAPON_BUCKETS = {
  KINETIC: 1498876634,
  ENERGY: 2465295065,
  POWER: 953998645
};

const CharacterInventory = ({ character, membershipType, membershipId, otherCharacters }) => {
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDefinitions, setItemDefinitions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('bungie_access_token');
      if (!token) {
        console.error("No se encontró el token de autenticación");
        setIsLoading(false);
        return;
      }

      const url = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${character.characterId}/?components=201`;

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-API-Key': API_KEY
          }
        });

        const data = await response.json();
        
        if (data.Response?.inventory?.data?.items) {
          const weapons = data.Response.inventory.data.items.filter(item =>
            Object.values(WEAPON_BUCKETS).includes(item.bucketHash)
          );
          setInventory(weapons);
        } else {
          console.warn("No se encontraron armas en el inventario.");
        }
      } catch (error) {
        console.error('Error al obtener el inventario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (character?.characterId) {
      fetchInventory();
    }
  }, [character, membershipType, membershipId]);

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
            return response.json();
          })
        );

        const definitionsMap = definitions.reduce((acc, { Response: def }) => {
          if (def) acc[def.hash] = def;
          return acc;
        }, {});

        setItemDefinitions(definitionsMap);
      } catch (error) {
        console.error('Error al obtener definiciones de ítems:', error);
      }
    };

    if (inventory.length > 0) {
      const itemHashes = inventory.map(item => item.itemHash);
      fetchItemDefinitions([...new Set(itemHashes)]);
    }
  }, [inventory]);

  const handleTransfer = async (targetCharacterId) => {
    const token = localStorage.getItem('bungie_access_token');
    if (!token) {
      console.error("No se encontró el token de autenticación.");
      return;
    }

    const transferUrl = 'https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/';

    if (!selectedItem?.itemInstanceId || !selectedItem?.itemHash) {
      console.error('Datos del ítem incompletos:', selectedItem);
      return;
    }

    const body = {
      itemReferenceHash: Number(selectedItem.itemHash),
      itemId: selectedItem.itemInstanceId,
      stackSize: 1,
      transferToVault: false,
      characterId: targetCharacterId,
      membershipType: membershipType
    };

    console.log("Enviando transferencia:", body);

    try {
      const response = await fetch(transferUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      console.log("Respuesta de la API:", result);

      if (result.ErrorCode === 1) {
        console.log('Transferencia exitosa.');
        setInventory(prev => prev.filter(item => item.itemInstanceId !== selectedItem.itemInstanceId));
        setSelectedItem(null);
      } else {
        console.error('Error en transferencia:', {
          status: result.ErrorStatus,
          code: result.ErrorCode,
          message: result.Message,
          throttle: result.ThrottleSeconds
        });
      }
    } catch (error) {
      console.error('Error de red en la transferencia:', error);
    }
  };

  return (
    <div className="inventory-container">
      <h3>Inventario de {getClassName(character.classType)}</h3>
      {isLoading ? (
        <div className="loading-message">Cargando inventario...</div>
      ) : (
        <>
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
                    alt={itemDef.displayProperties?.name || 'Ítem desconocido'} 
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
              <h4>Transferir {itemDefinitions[selectedItem.itemHash]?.displayProperties?.name || 'Ítem'}</h4>
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
        </>
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
