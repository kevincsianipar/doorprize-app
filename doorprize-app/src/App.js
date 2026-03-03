import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

function App() {
  const [minNumber, setMinNumber] = useState(10000);
  const [maxNumber, setMaxNumber] = useState(99999);
  const [currentNumber, setCurrentNumber] = useState('00000');
  const [winningNumbers, setWinningNumbers] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempMin, setTempMin] = useState(10000);
  const [tempMax, setTempMax] = useState(99999);
  const animationRef = useRef(null);

  const getAvailableNumbers = useCallback(() => {
    const available = [];
    for (let i = minNumber; i <= maxNumber; i++) {
      if (!winningNumbers.includes(i)) {
        available.push(i);
      }
    }
    return available;
  }, [minNumber, maxNumber, winningNumbers]);

  const handleButtonClick = useCallback(() => {
    if (isAnimating) {
      // Stop animation
      setIsAnimating(false);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }

      // Generate final number
      const available = getAvailableNumbers();
      if (available.length === 0) {
        return;
      }
      const randomIndex = Math.floor(Math.random() * available.length);
      const finalNumber = available[randomIndex];

      if (finalNumber !== null) {
        setCurrentNumber(finalNumber.toString().padStart(5, '0'));
        setWinningNumbers(prev => [finalNumber, ...prev]);
      }
    } else {
      // Start animation
      const available = getAvailableNumbers();
      if (available.length === 0) {
        alert('All numbers have been drawn!');
        return;
      }

      setIsAnimating(true);
      // Animation function that cycles through random digits
      animationRef.current = setInterval(() => {
        const randomDigits = [];
        for (let i = 0; i < 5; i++) {
          randomDigits.push(Math.floor(Math.random() * 10));
        }
        setCurrentNumber(randomDigits.join(''));
      }, 50);
    }
  }, [isAnimating, getAvailableNumbers]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !showSettings) {
      handleButtonClick();
    }
  }, [showSettings, handleButtonClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [handleKeyPress]);

  const handleSaveSettings = () => {
    const min = parseInt(tempMin);
    const max = parseInt(tempMax);

    if (isNaN(min) || isNaN(max)) {
      alert('Please enter valid numbers');
      return;
    }

    if (min < 10000 || max > 99999) {
      alert('Numbers must be between 10000 and 99999 (5 digits)');
      return;
    }

    if (min >= max) {
      alert('Minimum must be less than maximum');
      return;
    }

    setMinNumber(min);
    setMaxNumber(max);
    setWinningNumbers([]);
    setCurrentNumber('00000');
    setShowSettings(false);
  };

  const handleReset = () => {
    setWinningNumbers([]);
    setCurrentNumber('00000');
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }
  };

  const digits = currentNumber.split('');

  return (
    <div className="App">
      <header className="app-header">
        <h1 className="app-title">Bona Taon Punguan Sianipar Dohot Boruna Na Sian Lumban Balik Tahun 2026</h1>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          ⚙️ Settings
        </button>
      </header>

      <div className="main-container">
        <div className="randomizer-section">
          <div className="slot-machine">
            {digits.map((digit, index) => (
              <div key={index} className={`digit-slot ${isAnimating ? 'spinning' : ''}`}>
                <div className="digit">{digit}</div>
              </div>
            ))}
          </div>

          <button
            className={`action-btn ${isAnimating ? 'stop-btn' : 'start-btn'}`}
            onClick={handleButtonClick}
          >
            {isAnimating ? '⏹ STOP' : '🎰 DRAW NUMBER'}
          </button>

          <div className="info-text">
            {isAnimating ? 'Press ENTER or click STOP to select number' : 'Press ENTER or click button to draw'}
          </div>

          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Range:</span>
              <span className="stat-value">{minNumber.toString().padStart(5, '0')} - {maxNumber.toString().padStart(5, '0')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Remaining:</span>
              <span className="stat-value">{getAvailableNumbers().length}</span>
            </div>
          </div>
        </div>

        <div className="winners-section">
          <div className="winners-header">
            <h2>Winning Numbers</h2>
            {winningNumbers.length > 0 && (
              <button className="reset-btn" onClick={handleReset}>
                🔄 Reset
              </button>
            )}
          </div>

          <div className="winners-list">
            {winningNumbers.length === 0 ? (
              <div className="no-winners">No winners yet</div>
            ) : (
              winningNumbers.map((number, index) => (
                <div key={index} className="winner-card">
                  <div className="winner-number">{number.toString().padStart(5, '0')}</div>
                  <div className="winner-order">Draw #{winningNumbers.length - index}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="settings-form">
              <div className="form-group">
                <label>Minimum Number (5 digits):</label>
                <input
                  type="number"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                  min="10000"
                  max="99999"
                />
              </div>
              <div className="form-group">
                <label>Maximum Number (5 digits):</label>
                <input
                  type="number"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                  min="10000"
                  max="99999"
                />
              </div>
              <div className="warning-text">
                ⚠️ Changing settings will reset all winning numbers
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowSettings(false)}>
                  Cancel
                </button>
                <button className="btn-save" onClick={handleSaveSettings}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
