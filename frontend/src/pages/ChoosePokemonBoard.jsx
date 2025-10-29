import React, { useState } from 'react';
import babyUnicorn from '../components/images/babyUnicorn.png';
import babyDragon from '../components/images/babyDragon.png';
import babyFox from '../components/images/babyFox.png';

const POKEMON_OPTIONS = [
  {
    type: 'Unicorn',
    image: babyUnicorn,
    description: 'Magical and graceful, the unicorn brings sparkles wherever it goes',
    color: '#8B6F47'
  },
  {
    type: 'Dragon',
    image: babyDragon,
    description: 'Fierce and loyal, the dragon is a powerful companion',
    color: '#A0826D'
  },
  {
    type: 'Fox',
    image: babyFox,
    description: 'Clever and playful, the fox is full of surprises',
    color: '#B8956A'
  }
];

export default function ChoosePokemonBoard({ onConfirm, allowTesting = false }) {
  const [selectedType, setSelectedType] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);

  const handleConfirm = () => {
    if (selectedType) {
      onConfirm(selectedType);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 100%)' }}>
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4" style={{ color: '#6B4423' }}>
            Choose Your Companion
          </h1>
          <p className="text-2xl" style={{ color: '#8B6F47' }}>
            This choice is permanent - choose wisely!
          </p>
        </div>

        {/* Pokemon Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-6xl w-full">
          {POKEMON_OPTIONS.map((pokemon) => {
            const isSelected = selectedType === pokemon.type;
            const isHovered = hoveredType === pokemon.type;

            return (
              <div
                key={pokemon.type}
                onClick={() => setSelectedType(pokemon.type)}
                onMouseEnter={() => setHoveredType(pokemon.type)}
                onMouseLeave={() => setHoveredType(null)}
                className={`
                  relative cursor-pointer rounded-2xl p-6 transition-all duration-300 transform
                  ${isSelected 
                    ? 'scale-105 shadow-2xl' 
                    : 'scale-100 hover:scale-102 shadow-lg'
                  }
                  ${isHovered && !isSelected ? 'shadow-xl' : ''}
                `}
                style={{
                  backgroundColor: isSelected ? '#FFF8F0' : '#FEFBF6',
                  border: isSelected ? `4px solid ${pokemon.color}` : '2px solid #D4C4B0'
                }}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div 
                    className="absolute -top-3 -right-3 rounded-full p-2 shadow-lg"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Pokemon Image */}
                <div 
                  className="rounded-xl p-6 mb-4 flex items-center justify-center h-72"
                  style={{ 
                    backgroundColor: isSelected ? '#F5E6D3' : '#FAF3E9'
                  }}
                >
                  <img
                    src={pokemon.image}
                    alt={pokemon.type}
                    className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
                      isHovered || isSelected ? 'scale-110' : 'scale-100'
                    }`}
                  />
                </div>

                {/* Pokemon Info */}
                <div className="text-center">
                  <h3 
                    className="text-2xl font-bold mb-2"
                    style={{ color: '#6B4423' }}
                  >
                    {pokemon.type}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: '#8B6F47' }}
                  >
                    {pokemon.description}
                  </p>
                </div>

                {/* Gradient Overlay for Selected */}
                {isSelected && (
                  <div 
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${pokemon.color}15, ${pokemon.color}25)`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Confirm Button */}
        {selectedType && (
          <div className="text-center">
            <button
              onClick={handleConfirm}
              className="font-bold py-5 px-16 rounded-full text-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              style={{
                backgroundColor: '#8B4513',
                color: '#FFF8F0'
              }}
            >
              {allowTesting ? `Pick ${selectedType}` : `Confirm ${selectedType}`}
            </button>
            
            {!allowTesting && (
              <p 
                className="mt-4 text-base font-semibold"
                style={{ color: '#C17817' }}
              >
                ⚠️ Warning: This choice cannot be changed!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}