import React, { useEffect, useState } from 'react';
import api from '../api';
import ChoosePokemonBoard from './choosePokemonBoard';

// --- Image Imports ---
import babyUnicorn from '../components/images/babyUnicorn.png';
import teenageUnicorn from '../components/images/teenageUnicorn.png';
import adultUnicorn from '../components/images/adultUnicorn.png';
import babyDragon from '../components/images/babyDragon.png';
import teenageDragon from '../components/images/teenageDragon.png';
import adultDragon from '../components/images/adultDragon.png';
import babyFox from '../components/images/babyFox.png';
import teenageFox from '../components/images/teenageFox.png';
import adultFox from '../components/images/adultFox.png';
import forestBackground from '../components/images/forest.png';
import babyUnicornN from '../components/images/babyUnicornN.png';
import necklaceImg from '../components/images/necklace.png';

// Available accessories catalog
const ACCESSORIES = [
  {
    id: 'necklace',
    name: 'Star Necklace',
    cost: 5,
    image: necklaceImg,
    description: 'A beautiful holographic star necklace'
  },
];

// Enable testing mode (set to false in production)
const TESTING_MODE = true;

export default function PointsRewards() {
  const [tx, setTx] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedPokemonType, setSelectedPokemonType] = useState(null);
  const [ownedAccessories, setOwnedAccessories] = useState([]);
  const [equippedAccessories, setEquippedAccessories] = useState([]);
  const [showShop, setShowShop] = useState(false);
  const [showPokemonBoard, setShowPokemonBoard] = useState(false);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedPokemon = localStorage.getItem('selectedPokemon');
    const savedAccessories = localStorage.getItem('ownedAccessories');
    const savedEquipped = localStorage.getItem('equippedAccessories');

    if (savedPokemon) {
      setSelectedPokemonType(savedPokemon);
    } else {
      // First time user - show selection board
      setShowPokemonBoard(true);
    }

    if (savedAccessories) {
      setOwnedAccessories(JSON.parse(savedAccessories));
    }

    if (savedEquipped) {
      setEquippedAccessories(JSON.parse(savedEquipped));
    }
  }, []);

  // Load points transactions
  useEffect(() => {
    api.get('/points/transactions').then(r => {
      setTx(r.data);
      const total = r.data.reduce((sum, t) => sum + t.amount, 0);
      setTotalPoints(total);
    });
  }, []);

  // Animation for floating effect
  useEffect(() => {
    let time = 0;
    const animationFrame = setInterval(() => {
      time += 0.05;
      setOffset(Math.sin(time) * 15);
    }, 16);
    return () => clearInterval(animationFrame);
  }, []);

  // Save to localStorage when pokemon changes
  useEffect(() => {
    if (selectedPokemonType) {
      localStorage.setItem('selectedPokemon', selectedPokemonType);
    }
  }, [selectedPokemonType]);

  // Save accessories to localStorage
  useEffect(() => {
    localStorage.setItem('ownedAccessories', JSON.stringify(ownedAccessories));
  }, [ownedAccessories]);

  useEffect(() => {
    localStorage.setItem('equippedAccessories', JSON.stringify(equippedAccessories));
  }, [equippedAccessories]);

  const handlePokemonConfirm = (pokemonType) => {
    setSelectedPokemonType(pokemonType);
    setShowPokemonBoard(false);
  };

  const getPokemonImage = () => {
    let baby, teenage, adult;
    
    const hasNecklace = equippedAccessories.includes('necklace');
    
    switch (selectedPokemonType) {
      case 'Dragon':
        baby = babyDragon;
        teenage = teenageDragon;
        adult = adultDragon;
        break;
      case 'Fox':
        baby = babyFox;
        teenage = teenageFox;
        adult = adultFox;
        break;
      case 'Unicorn':
      default:
        baby = hasNecklace ? babyUnicornN : babyUnicorn;
        teenage = teenageUnicorn;
        adult = adultUnicorn;
        break;
    }
    
    if (totalPoints >= 20) return adult;
    if (totalPoints >= 10) return teenage;
    return baby;
  };

  const getPokemonStage = () => {
    if (!selectedPokemonType) return '';
    let stageName = totalPoints >= 20 ? 'Adult' : totalPoints >= 10 ? 'Teenage' : 'Baby';
    return `${stageName} ${selectedPokemonType}`;
  };

  const handleBuyAccessory = async (accessory) => {
    if (totalPoints >= accessory.cost && !ownedAccessories.includes(accessory.id)) {
      try {
        // Create a negative transaction for the purchase
        const purchaseTransaction = {
          amount: -accessory.cost,
          description: `Purchased ${accessory.name}`
        };

        // Send to API to permanently record the transaction
        // await api.post('/points/transactions', purchaseTransaction);

        // Update local state with the new transaction
        const updatedTx = [...tx, purchaseTransaction];
        setTx(updatedTx);
        
        // Recalculate total points
        const newTotal = updatedTx.reduce((sum, t) => sum + t.amount, 0);
        setTotalPoints(newTotal);
        
        // Add to owned accessories
        setOwnedAccessories([...ownedAccessories, accessory.id]);
        
        // Auto-equip the accessory
        setEquippedAccessories([...equippedAccessories, accessory.id]);
        
        // Optionally send to backend to update owned accessories
        // await api.post('/user/accessories/buy', { accessoryId: accessory.id });
      } catch (error) {
        console.error('Error purchasing accessory:', error);
      }
    }
  };

  const toggleEquipAccessory = (accessoryId) => {
    if (equippedAccessories.includes(accessoryId)) {
      setEquippedAccessories(equippedAccessories.filter(id => id !== accessoryId));
    } else {
      setEquippedAccessories([...equippedAccessories, accessoryId]);
    }
  };

  const imageSizeStyle = {
    maxWidth: '500px',
    maxHeight: '500px',
  };

  // Show Pokemon selection board if needed
  if (showPokemonBoard) {
    return <ChoosePokemonBoard onConfirm={handlePokemonConfirm} allowTesting={TESTING_MODE} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid md:grid-cols-[70%_28%] gap-4 mb-4 md:items-stretch">
        {/* Avatar Display Card (Left Column) */}
        <div
          className="rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[600px] md:h-full"
          style={{
            backgroundImage: `url(${forestBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">Your Avatar</h2>
          <p className="text-lg text-white mb-4">{getPokemonStage()}</p>
          <div className="relative w-full flex justify-center items-center flex-1">
            <img
              src={getPokemonImage()}
              alt={getPokemonStage()}
              style={{
                ...imageSizeStyle, 
                objectFit: 'contain',
                transform: `translateY(${offset}px)`,
                transition: 'transform 0.2s ease'
              }}
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-3xl font-bold text-white">{totalPoints} Points</p>
          </div>

          {/* Testing Mode: Change Pokemon Button */}
          {TESTING_MODE && (
            <button
              onClick={() => setShowPokemonBoard(true)}
              className="mt-4 bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              🔄 Change Pokemon (Testing)
            </button>
          )}
        </div>

        {/* Right Column Content */}
        <div className="flex flex-col gap-4 h-auto">
          <div className="bg-white p-6 rounded-xl shadow flex-1">
            <h2 className="text-xl font-semibold mb-3">Points Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Points</span>
                <span className="text-2xl font-bold text-green-600">{totalPoints}</span>
              </div>
            </div>
            <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg mb-4">
              💡 Earn points through asking and answering questions in the company dashboard!
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 mb-2">Growth Progress</h3>
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalPoints / 20) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Baby (0)</span>
                <span>Teen (10)</span>
                <span>Adult (20)</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowShop(true)}
              className="w-full mt-4 bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">🛍️</span>
              Accessory Shop
            </button>
          </div>
        </div>
      </div>

      {/* Accessory Shop Modal */}
      {showShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Accessory Shop</h2>
              <button
                onClick={() => setShowShop(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-800 font-semibold">Your Points: {totalPoints}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {ACCESSORIES.map((accessory) => {
                  const isOwned = ownedAccessories.includes(accessory.id);
                  const isEquipped = equippedAccessories.includes(accessory.id);
                  const canAfford = totalPoints >= accessory.cost;

                  return (
                    <div
                      key={accessory.id}
                      className="border-2 rounded-xl p-4 transition-all"
                      style={{
                        borderColor: isOwned ? '#10b981' : '#e5e7eb',
                        backgroundColor: isOwned ? '#f0fdf4' : 'white'
                      }}
                    >
                      <div className="bg-brown-100 rounded-lg p-6 mb-4 flex items-center justify-center" style={{ backgroundColor: '#f5e6d3' }}>
                        <img
                          src={accessory.image}
                          alt={accessory.name}
                          className="max-w-[120px] max-h-[120px] object-contain"
                        />
                      </div>
                      
                      <h3 className="font-bold text-lg mb-2">{accessory.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{accessory.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-purple-600">{accessory.cost} Points</span>
                        {isOwned && (
                          <span className="text-sm font-semibold text-green-600">✓ Owned</span>
                        )}
                      </div>

                      {!isOwned && (
                        <button
                          onClick={() => handleBuyAccessory(accessory)}
                          disabled={!canAfford}
                          className={`w-full py-2 px-4 rounded-lg font-bold transition-colors ${
                            canAfford
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? 'Buy Now' : 'Not Enough Points'}
                        </button>
                      )}

                      {isOwned && (
                        <button
                          onClick={() => toggleEquipAccessory(accessory.id)}
                          className={`w-full py-2 px-4 rounded-lg font-bold transition-colors ${
                            isEquipped
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isEquipped ? 'Unequip' : 'Equip'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}