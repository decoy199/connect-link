import React, { useEffect, useState } from 'react';
import api from '../api';

// --- Image Imports ---
import babyUnicorn from '../components/images/babyUnicorn.png';
import teenageUnicorn from '../components/images/teenageUnicorn.png';
import adultUnicorn from '../components/images/adultUnicorn.png';
import babyDragon from '../components/images/babyDragon.png';
import teenageDragon from '../components/images/teenageDragon.png';
import adultDragon from '../components/images/adultDragon.png';
// import babyFox from '../components/images/babyFox.png';
// import teenageFox from '../components/images/teenageFox.png';
// import adultFox from '../components/images/adultFox.png';
import forestBackground from '../components/images/forest.jpg';

export default function PointsRewards() {
  const [tx, setTx] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedPokemonType, setSelectedPokemonType] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    // In a real app, you would fetch the user's saved choice here and set the state.
    // For example:
    // api.get('/user/avatar').then(response => {
    //   if (response.data.pokemonType) {
    //     setSelectedPokemonType(response.data.pokemonType);
    //     setIsConfirmed(true);
    //   }
    // });

    api.get('/points/transactions').then(r => {
      setTx(r.data);
      const total = r.data.reduce((sum, t) => sum + t.amount, 0);
      setTotalPoints(total);
    });
  }, []);

  useEffect(() => {
    let time = 0;
    const animationFrame = setInterval(() => {
      time += 0.05;
      setOffset(Math.sin(time) * 15);
    }, 16);
    return () => clearInterval(animationFrame);
  }, []);

  const getPokemonImage = () => {
    let baby, teenage, adult;
    switch (selectedPokemonType) {
      case 'Dragon': baby = babyDragon; teenage = teenageDragon; adult = adultDragon; break;
      // case 'Fox': baby = babyFox; teenage = teenageFox; adult = adultFox; break; // Uncomment when Fox images are ready
      case 'Unicorn': default: baby = babyUnicorn; teenage = teenageUnicorn; adult = adultUnicorn; break;
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

  const handlePokemonTypeChange = (event) => {
    setSelectedPokemonType(event.target.value || null);
  };

  const handleConfirm = () => {
    if (selectedPokemonType) {
      setIsConfirmed(true);
      // In a real app, you would save this choice to the database
      // api.post('/user/avatar', { pokemonType: selectedPokemonType });
    }
  };

  const imageSizeStyle = {
    maxWidth: selectedPokemonType === 'Dragon' ? '500px' : '1000px',
    maxHeight: selectedPokemonType === 'Dragon' ? '500px' : '1000px',
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid md:grid-cols-[70%_28%] gap-4 mb-4 md:items-stretch">
        {/* Avatar Display Card (Left Column) */}
        <div
          className="rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[600px] md:h-full"
          // className="rounded-xl shadow p-6 flex flex-col items-center justify-center h-[750px] md:h-full"
          style={{
            backgroundImage: `url(${forestBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {isConfirmed ? (
            <>
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
            </>
          ) : (
            <div className="text-center">
              <div className="bg-black bg-opacity-50 rounded-lg px-8 py-6 backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-white">Choose Your Companion</h2>
                <p className="text-white mt-2">Select a Pokémon from the panel to begin your journey!</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column Content */}
        <div className="flex flex-col gap-4 h-auto">
          {!isConfirmed && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-3">Choose Your Avatar</h2>
              <div>
                <label htmlFor="pokemon-type-select" className="block text-gray-700 text-sm font-bold mb-2">
                  Select your one-time companion:
                </label>
                <select
                  id="pokemon-type-select"
                  value={selectedPokemonType || ''}
                  onChange={handlePokemonTypeChange}
                  className="block w-full px-4 py-2 pr-8 leading-tight bg-white border border-gray-300 rounded-lg"
                >
                  <option value="" disabled>Select a type...</option>
                  <option value="Unicorn">Unicorn</option>
                  <option value="Dragon">Dragon</option>
                  <option value="Fox">Fox</option>
                </select>
              </div>

              {selectedPokemonType && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Are you sure? You can only choose one Pokémon to raise. This choice is permanent!
                  </p>
                  <button
                    onClick={handleConfirm}
                    className="w-full mt-3 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Confirm {selectedPokemonType}
                  </button>
                </div>
              )}
            </div>
          )}

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
                  style={{ width: isConfirmed ? `${Math.min((totalPoints / 20) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}