import React, { useEffect, useState, useCallback } from 'react';
import "../styles/CharacterInventory.css";

const API_KEY = process.env.REACT_APP_API_KEY;

const WEAPON_BUCKET_HASHES = new Set([
  1498876634, // Kinetic
  2465295065, // Energy
  953998645   // Power
]);

const CharacterInventory = ({ character, membershipType, membershipId, otherCharacters }) => {
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDefinitions, setItemDefinitions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // 1. Cargar manifiesto completo como DIM
  const loadManifest = useCallback(async () => {
    try {
      const manifestResponse = await fetch(
        'https://www.bungie.net/Platform/Destiny2/Manifest/',
        { headers: { 'X-API-Key': API_KEY } }
      );
      const manifestData = await manifestResponse.json();
      
      const defPath = manifestData.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition;
      const defResponse = await fetch(`https://www.bungie.net${defPath}`);
      const definitions = await defResponse.json();
      
      setItemDefinitions(definitions);
    } catch (error) {
      console.error('Error loading manifest:', error);
      setApiError('Error al cargar datos del juego');
    }
  }, []);

  // 2. Cargar inventario con paginación
  const loadInventory = useCallback(async () => {
    if (!itemDefinitions || !character?.characterId) return;

    setIsLoading(true);
    const token = localStorage.getItem('bungie_access_token');
    
    try {
      const [inventoryRes, equipmentRes] = await Promise.all([
        fetch(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${character.characterId}/?components=201`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-API-Key': API_KEY 
          }
        }),
        fetch(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${character.characterId}/?components=205`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-API-Key': API_KEY 
          }
        })
      ]);

      const [inventoryData, equipmentData] = await Promise.all([
        inventoryRes.json(),
        equipmentRes.json()
      ]);

      const processItems = (items) => items.filter(item => {
        const def = itemDefinitions[item.itemHash];
        return def && 
               WEAPON_BUCKET_HASHES.has(def.inventory?.bucketTypeHash) &&
               !def.lockable &&
               !item.equipped;
      });

      const inventoryItems = processItems(inventoryData.Response.inventory.data.items);
      const equipmentItems = processItems(equipmentData.Response.equipment.data.items);

      setInventory([...inventoryItems, ...equipmentItems]);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setApiError('Error al cargar inventario');
    } finally {
      setIsLoading(false);
    }
  }, [character, membershipType, membershipId, itemDefinitions]);

  // 3. Transferencia en dos pasos (Vault -> Destino)
  const transferItem = useCallback(async (targetCharacterId) => {
    const token = localStorage.getItem('bungie_access_token');
    setApiError(null);

    try {
      // Validación
      if (!selectedItem?.itemInstanceId || !selectedItem?.itemHash) {
        throw new Error('Datos del ítem incompletos');
      }

      // Paso 1: Mover al depósito
      const vaultTransfer = await fetch('https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemReferenceHash: selectedItem.itemHash,
          itemId: selectedItem.itemInstanceId,
          stackSize: 1,
          transferToVault: true,
          characterId: character.characterId,
          membershipType: membershipType
        })
      });

      const vaultResult = await vaultTransfer.json();
      if (vaultResult.ErrorCode !== 1) throw vaultResult;

      // Paso 2: Mover al personaje destino
      const charTransfer = await fetch('https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemReferenceHash: selectedItem.itemHash,
          itemId: selectedItem.itemInstanceId,
          stackSize: 1,
          transferToVault: false,
          characterId: targetCharacterId,
          membershipType: membershipType
        })
      });

      const charResult = await charTransfer.json();
      if (charResult.ErrorCode !== 1) throw charResult;

      // Actualizar estado
      setInventory(prev => prev.filter(item => 
        item.itemInstanceId !== selectedItem.itemInstanceId
      ));
      setSelectedItem(null);

    } catch (error) {
      console.error('Transfer error:', error);
      setApiError(error.Message || 'Error en la transferencia');
      loadInventory(); // Recargar inventario
    }
  }, [selectedItem, character, membershipType, loadInventory]);

  // 4. Efectos de carga inicial
  useEffect(() => {
    const initialize = async () => {
      await loadManifest();
      await loadInventory();
    };

    if (character?.characterId) initialize();
  }, [character, loadManifest, loadInventory]);

  // 5. Renderizado
  return (
    <div className="inventory-container">
      <h3>Inventario de {getClassName(character?.classType)}</h3>
      
      {apiError && (
        <div className="error-message">
          {apiError}
        </div>
      )}

      {isLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando armas...</p>
        </div>
      ) : (
        <>
          <div className="weapons-grid">
            {inventory.map((item) => {
              const def = itemDefinitions[item.itemHash];
              return (
                <div
                  key={item.itemInstanceId}
                  className="weapon-card"
                  onClick={() => setSelectedItem(item)}
                >
                  <img
                    src={`https://www.bungie.net${def?.displayProperties?.icon}`}
                    alt={def?.displayProperties?.name}
                    className="weapon-icon"
                    onError={(e) => {
                      e.target.src = 'https://www.bungie.net/common/destiny2_content/icons/ea5d6b7f6a0c1d3863f3f9b4eab8b61f.png';
                    }}
                  />
                  <div className="weapon-info">
                    <p className="weapon-name">{def?.displayProperties?.name || 'Arma desconocida'}</p>
                    <p className="weapon-type">{getWeaponType(def?.inventory?.bucketTypeHash)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedItem && (
            <div className="transfer-modal">
              <div className="modal-header">
                <h4>Transferir {itemDefinitions[selectedItem.itemHash]?.displayProperties?.name}</h4>
                <button 
                  className="close-button"
                  onClick={() => setSelectedItem(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="characters-list">
                {otherCharacters.map((char) => (
                  <div
                    key={char.characterId}
                    className="character-option"
                    onClick={() => transferItem(char.characterId)}
                  >
                    <div className="character-class-icon">
                      <img 
                        src={getClassIcon(char.classType)} 
                        alt={getClassName(char.classType)} 
                      />
                    </div>
                    <div className="character-info">
                      <p className="character-class">{getClassName(char.classType)}</p>
                      <p className="character-light">Nivel: {char.light}</p>
                    </div>
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

// Funciones helper
const getClassName = (classType) => {
  const classes = {
    0: 'Titán',
    1: 'Cazador',
    2: 'Hechicero'
  };
  return classes[classType] || 'Desconocido';
};

const getClassIcon = (classType) => {
  const icons = {
    0: 'https://www.bungie.net/common/destiny2_content/icons/class_titan.png',
    1: 'https://www.bungie.net/common/destiny2_content/icons/class_hunter.png',
    2: 'https://www.bungie.net/common/destiny2_content/icons/class_warlock.png'
  };
  return icons[classType] || '';
};

const getWeaponType = (bucketHash) => {
  const types = {
    1498876634: 'Principal',
    2465295065: 'Especial',
    953998645: 'Pesada'
  };
  return types[bucketHash] || 'Arma';
};

export default CharacterInventory;