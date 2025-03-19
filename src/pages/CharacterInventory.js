import React, { useEffect, useState } from 'react';
import "../styles/CharacterInventory.css";

const API_KEY = process.env.REACT_APP_API_KEY;

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
  const [apiError, setApiError] = useState(null);

  // Obtener inventario actualizado
  const fetchInventory = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('bungie_access_token');
    try {
      const response = await fetch(
        `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${character.characterId}/?components=201,205`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-API-Key': API_KEY
          }
        }
      );
      
      const data = await response.json();
      const allItems = [
        ...(data.Response.inventory?.data?.items || []),
        ...(data.Response.equipment?.data?.items || [])
      ];

      const transferableItems = allItems.filter(item => {
        const def = itemDefinitions[item.itemHash];
        return def && 
          Object.values(WEAPON_BUCKETS).includes(def.inventory?.bucketTypeHash) &&
          !def.lockable &&
          !item.equipped;
      });

      setInventory(transferableItems);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener definiciones de items
  useEffect(() => {
    const fetchItemDefinitions = async (itemHashes) => {
      try {
        const response = await fetch(
          `https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/`,
          {
            headers: {
              'X-API-Key': API_KEY
            }
          }
        );
        
        const data = await response.json();
        const definitionsMap = data.Response.reduce((acc, def) => {
          acc[def.hash] = def;
          return acc;
        }, {});
        
        setItemDefinitions(definitionsMap);
      } catch (error) {
        console.error('Error fetching definitions:', error);
      }
    };

    if (inventory.length > 0) {
      const itemHashes = inventory.map(item => item.itemHash);
      fetchItemDefinitions([...new Set(itemHashes)]);
    }
  }, [inventory]);

  useEffect(() => {
    if (character?.characterId) {
      fetchInventory();
    }
  }, [character, membershipType, membershipId]);

  const handleTransfer = async (targetCharacterId) => {
    const token = localStorage.getItem('bungie_access_token');
    const transferUrl = 'https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/';
    setApiError(null);

    try {
      // Validación completa de parámetros
      if (!selectedItem?.itemInstanceId || !selectedItem?.itemHash) {
        throw new Error('Missing required item data');
      }

      const requestBody = {
        itemReferenceHash: Number(selectedItem.itemHash),
        itemId: String(selectedItem.itemInstanceId),
        stackSize: 1,
        transferToVault: false,
        characterId: String(targetCharacterId),
        membershipType: Number(membershipType)
      };

      // Verificación final de parámetros
      if (isNaN(requestBody.itemReferenceHash)) {
        throw new Error('Invalid itemReferenceHash');
      }

      const response = await fetch(transferUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.ErrorCode === 1) {
        setInventory(prev => prev.filter(item => 
          item.itemInstanceId !== selectedItem.itemInstanceId
        ));
        setSelectedItem(null);
      } else {
        handleTransferError(result);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setApiError(error.message);
      await fetchInventory(); // Recargar inventario
    }
  };

  const handleTransferError = (result) => {
    const errorMap = {
      'DestinyItemNotFound': 'Item not found in inventory',
      'DestinyItemActionForbidden': 'Item is locked or non-transferable',
      'DestinyCannotPerformActionAtThisLocation': 'Move to vault first',
      'DestinyItemUniqueEquipRestricted': 'Item is currently equipped'
    };

    const errorMessage = errorMap[result.ErrorStatus] || result.Message;
    setApiError(`${errorMessage} (Code: ${result.ErrorCode})`);
  };

  return (
    <div className="inventory-container">
      <h3>Inventario de {getClassName(character.classType)}</h3>
      
      {apiError && (
        <div className="error-message">
          Error: {apiError}
        </div>
      )}

      {isLoading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          <div className="weapons-grid">
            {inventory.map((item) => {
              const itemDef = itemDefinitions[item.itemHash] || {};
              const canTransfer = itemDef.inventory?.bucketTypeHash in WEAPON_BUCKETS &&
                                 !itemDef.lockable &&
                                 !item.equipped;

              return (
                <div
                  key={item.itemInstanceId}
                  className={`weapon-card ${canTransfer ? '' : 'disabled'}`}
                  onClick={() => canTransfer && setSelectedItem(item)}
                >
                  <img
                    src={`https://www.bungie.net${itemDef.displayProperties?.icon}`}
                    alt={itemDef.displayProperties?.name}
                    className="weapon-icon"
                    onError={(e) => {
                      e.target.src = 'https://www.bungie.net/common/destiny2_content/icons/ea5d6b7f6a0c1d3863f3f9b4eab8b61f.png';
                    }}
                  />
                  <p>{itemDef.displayProperties?.name || 'Arma desconocida'}</p>
                  {item.equipped && <div className="equipped-tag">EQUIPADO</div>}
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
              <button 
                className="close-button"
                onClick={() => setSelectedItem(null)}
              >
                Cancelar
              </button>
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