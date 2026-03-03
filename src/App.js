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
  const [animatingDigits, setAnimatingDigits] = useState([false, false, false, false, false]);
  const animationRef = useRef(null);
  const digitCounters = useRef([0, 0, 0, 0, 0]);
  const finalNumberRef = useRef('00000');
  const animatingDigitsRef = useRef([true, true, true, true, true]);
  const isProcessingRef = useRef(false);

  const getAvailableNumbers = useCallback(() => {
    const available = [];
    for (let i = minNumber; i <= maxNumber; i++) {
      if (!winningNumbers.includes(i)) {
        available.push(i);
      }
    }
    return available;
  }, [minNumber, maxNumber, winningNumbers]);

  // Animation loop - runs continuously when interval is active
  useEffect(() => {
    if (!isAnimating || !animationRef.current) return;

    const animate = () => {
      const newDigits = [];
      for (let i = 0; i < 5; i++) {
        if (animatingDigitsRef.current[i]) {
          // Show random number if still animating
          newDigits.push(Math.floor(Math.random() * 10).toString());
        } else {
          // Show final digit if stopped
          newDigits.push(finalNumberRef.current[i] || '0');
        }
      }
      setCurrentNumber(newDigits.join(''));
    };

    const interval = setInterval(animate, 80);
    return () => clearInterval(interval);
  }, [isAnimating]);

  const handleButtonClick = useCallback(() => {
    // Prevent multiple rapid clicks/keypresses
    if (isProcessingRef.current) {
      return;
    }

    if (isAnimating) {
      // STOP: Generate final number and stop digits one by one
      isProcessingRef.current = true;

      const available = getAvailableNumbers();
      if (available.length === 0) {
        setIsAnimating(false);
        isProcessingRef.current = false;
        return;
      }

      const randomIndex = Math.floor(Math.random() * available.length);
      const finalNumber = available[randomIndex];
      finalNumberRef.current = finalNumber.toString().padStart(5, '0');

      // Stop digits one by one from right to left
      const stopDigit = (index) => {
        if (index < 0) {
          // All digits stopped
          setIsAnimating(false);
          animatingDigitsRef.current = [false, false, false, false, false];
          setAnimatingDigits([false, false, false, false, false]);
          setWinningNumbers(prev => [finalNumber, ...prev]);
          isProcessingRef.current = false;
          return;
        }

        // Stop current digit by showing its final value
        animatingDigitsRef.current[index] = false;
        setAnimatingDigits([...animatingDigitsRef.current]);

        // Stop next digit after delay
        setTimeout(() => stopDigit(index - 1), 300);
      };

      stopDigit(4); // Start from rightmost digit

    } else {
      // START: Begin animation
      isProcessingRef.current = true;

      const available = getAvailableNumbers();
      if (available.length === 0) {
        alert('All numbers have been drawn!');
        isProcessingRef.current = false;
        return;
      }

      // Reset everything for new animation
      animatingDigitsRef.current = [true, true, true, true, true];
      setAnimatingDigits([true, true, true, true, true]);
      finalNumberRef.current = '00000';
      animationRef.current = true; // Flag to indicate animation is active

      setIsAnimating(true);

      // Allow new actions after animation starts
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 200);
    }
  }, [isAnimating, getAvailableNumbers]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !showSettings) {
      e.preventDefault();
      handleButtonClick();
    }
  }, [showSettings, handleButtonClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
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
    setIsAnimating(false);
    setWinningNumbers([]);
    setCurrentNumber('00000');
    animatingDigitsRef.current = [false, false, false, false, false];
    setAnimatingDigits([false, false, false, false, false]);
    animationRef.current = null;
    isProcessingRef.current = false;
    setShowSettings(false);
  };

  const handleReset = () => {
    setIsAnimating(false);
    setWinningNumbers([]);
    setCurrentNumber('00000');
    animatingDigitsRef.current = [false, false, false, false, false];
    setAnimatingDigits([false, false, false, false, false]);
    animationRef.current = null;
    isProcessingRef.current = false;
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
              <div key={index} className={`digit-slot ${animatingDigits[index] ? 'spinning' : ''}`}>
                <div className="digit">{digit}</div>
              </div>
            ))}
          </div>

          <button
            className={`action-btn ${isAnimating ? 'stop-btn' : 'start-btn'}`}
            onClick={handleButtonClick}
          >
            {isAnimating ? '⏹ STOP' : 'ACAK NOMOR'}
          </button>

          <div className="info-text">
            {isAnimating ? 'Press ENTER or click STOP to select number' : 'Press ENTER or click button to draw'}
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
