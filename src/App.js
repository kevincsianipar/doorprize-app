import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const STORAGE_KEY = 'doorprize_state';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultCategory = () => ({
  id: generateId(),
  name: 'Grand Prize',
  prizeName: '',
  pickCount: 1,
  winners: [],
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveState(categories, activeCategoryId, globalMin, globalMax) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ categories, activeCategoryId, globalMin, globalMax })
    );
  } catch (e) {}
}

function App() {
  const [initState] = useState(() => {
    const saved = loadState();
    if (saved?.categories?.length) {
      // Migrate old format: per-category min/max → global min/max
      const globalMin = saved.globalMin ?? saved.categories[0]?.min ?? 1;
      const globalMax = saved.globalMax ?? saved.categories[0]?.max ?? 9999;
      const cats = saved.categories.map(c => ({
        ...c,
        prizeName: c.prizeName ?? '',
        pickCount: c.pickCount ?? 1,
      }));
      const activeId = cats.find(c => c.id === saved.activeCategoryId)
        ? saved.activeCategoryId
        : cats[0].id;
      return { categories: cats, activeCategoryId: activeId, globalMin, globalMax };
    }
    const cat = createDefaultCategory();
    return { categories: [cat], activeCategoryId: cat.id, globalMin: 1, globalMax: 9999 };
  });

  const [categories, setCategories] = useState(initState.categories);
  const [activeCategoryId, setActiveCategoryId] = useState(initState.activeCategoryId);
  const [globalMin, setGlobalMin] = useState(initState.globalMin);
  const [globalMax, setGlobalMax] = useState(initState.globalMax);
  const [currentNumber, setCurrentNumber] = useState('0000');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [animatingDigits, setAnimatingDigits] = useState([false, false, false, false]);

  // Settings editing state
  const [editingGlobalMin, setEditingGlobalMin] = useState('1');
  const [editingGlobalMax, setEditingGlobalMax] = useState('9999');
  const [editingCategories, setEditingCategories] = useState([]);

  const [isDramatic, setIsDramatic] = useState(false);
  const [lockingDigits, setLockingDigits] = useState([false, false, false, false]);

  const animationRef = useRef(null);
  const finalNumberRef = useRef('0000');
  const animatingDigitsRef = useRef([false, false, false, false]);
  const isProcessingRef = useRef(false);
  const animationSpeedRef = useRef(80);
  const stopDelayRef = useRef(300);
  const isDramaticRef = useRef(false);

  useEffect(() => {
    saveState(categories, activeCategoryId, globalMin, globalMax);
  }, [categories, activeCategoryId, globalMin, globalMax]);

  const activeCategory = categories.find(c => c.id === activeCategoryId) || categories[0];

  const validDrawsCount = activeCategory
    ? activeCategory.winners.filter(w => w.status !== 'disqualified').length
    : 0;
  const remainingPicks = activeCategory
    ? Math.max(0, activeCategory.pickCount - validDrawsCount)
    : 0;
  const isCategoryFull = activeCategory ? remainingPicks <= 0 : false;

  const getAllDrawnNumbers = useCallback(() => {
    const drawn = new Set();
    categories.forEach(cat => {
      cat.winners.forEach(w => drawn.add(w.number));
    });
    return drawn;
  }, [categories]);

  const getAvailableNumbers = useCallback(() => {
    const drawn = getAllDrawnNumbers();
    const available = [];
    for (let i = globalMin; i <= globalMax; i++) {
      if (!drawn.has(i)) available.push(i);
    }
    return available;
  }, [globalMin, globalMax, getAllDrawnNumbers]);

  useEffect(() => {
    if (!isAnimating || !animationRef.current) return;
    const animate = () => {
      const newDigits = [];
      for (let i = 0; i < 4; i++) {
        if (animatingDigitsRef.current[i]) {
          newDigits.push(Math.floor(Math.random() * 10).toString());
        } else {
          newDigits.push(finalNumberRef.current[i] || '0');
        }
      }
      setCurrentNumber(newDigits.join(''));
    };
    const interval = setInterval(animate, animationSpeedRef.current);
    return () => clearInterval(interval);
  }, [isAnimating]);

  const addWinnerToCategory = useCallback((number) => {
    setCategories(prev => prev.map(cat =>
      cat.id === activeCategoryId
        ? { ...cat, winners: [{ number, status: 'pending' }, ...cat.winners] }
        : cat
    ));
  }, [activeCategoryId]);

  const handleButtonClick = useCallback(() => {
    if (isProcessingRef.current) return;

    if (isAnimating) {
      isProcessingRef.current = true;
      const available = getAvailableNumbers();
      if (available.length === 0) {
        setIsAnimating(false);
        isProcessingRef.current = false;
        return;
      }
      const finalNumber = available[Math.floor(Math.random() * available.length)];
      finalNumberRef.current = finalNumber.toString().padStart(4, '0');

      const dramatic = isDramaticRef.current;
      const stopDigit = (index) => {
        if (index < 0) {
          setIsAnimating(false);
          setIsDramatic(false);
          animatingDigitsRef.current = [false, false, false, false];
          setAnimatingDigits([false, false, false, false]);
          setLockingDigits([false, false, false, false]);
          addWinnerToCategory(finalNumber);
          isProcessingRef.current = false;
          return;
        }
        animatingDigitsRef.current[index] = false;
        setAnimatingDigits([...animatingDigitsRef.current]);
        if (dramatic) {
          setLockingDigits(prev => { const n = [...prev]; n[index] = true; return n; });
          setTimeout(() => {
            setLockingDigits(prev => { const n = [...prev]; n[index] = false; return n; });
          }, 450);
        }
        setTimeout(() => stopDigit(index - 1), stopDelayRef.current);
      };

      stopDigit(3);
    } else {
      if (isCategoryFull) return;
      isProcessingRef.current = true;
      const available = getAvailableNumbers();
      if (available.length === 0) {
        alert('All numbers have been drawn!');
        isProcessingRef.current = false;
        return;
      }
      const dramatic = activeCategory.pickCount === 1;
      animationSpeedRef.current = 80;
      stopDelayRef.current = dramatic ? 700 : 300;
      isDramaticRef.current = dramatic;
      setIsDramatic(dramatic);
      animatingDigitsRef.current = [true, true, true, true];
      setAnimatingDigits([true, true, true, true]);
      finalNumberRef.current = '0000';
      animationRef.current = true;
      setIsAnimating(true);
      setTimeout(() => { isProcessingRef.current = false; }, 200);
    }
  }, [isAnimating, isCategoryFull, activeCategory, getAvailableNumbers, addWinnerToCategory]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !showSettings) {
      e.preventDefault();
      handleButtonClick();
    }
  }, [showSettings, handleButtonClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const updateWinnerStatus = (categoryId, number, newStatus) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, winners: cat.winners.map(w => w.number === number ? { ...w, status: newStatus } : w) }
        : cat
    ));
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    setCurrentNumber('0000');
    animatingDigitsRef.current = [false, false, false, false];
    setAnimatingDigits([false, false, false, false]);
    animationRef.current = null;
    isProcessingRef.current = false;
  };

  const openSettings = () => {
    setEditingGlobalMin(globalMin.toString());
    setEditingGlobalMax(globalMax.toString());
    setEditingCategories(categories.map(c => ({
      ...c,
      pickCount: c.pickCount.toString(),
    })));
    setShowSettings(true);
  };

  const addEditingCategory = () => {
    setEditingCategories(prev => [
      ...prev,
      { id: generateId(), name: `Prize #${prev.length + 1}`, prizeName: '', pickCount: '1', winners: [] },
    ]);
  };

  const removeEditingCategory = (id) => {
    if (editingCategories.length <= 1) {
      alert('You must have at least one category.');
      return;
    }
    setEditingCategories(prev => prev.filter(c => c.id !== id));
  };

  const updateEditingCategory = (id, field, value) => {
    setEditingCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSaveSettings = () => {
    const min = parseInt(editingGlobalMin);
    const max = parseInt(editingGlobalMax);
    if (isNaN(min) || isNaN(max)) {
      alert('Please enter a valid number range.');
      return;
    }
    if (min < 1 || max > 9999) {
      alert('Numbers must be between 1 and 9999.');
      return;
    }
    if (min >= max) {
      alert('Minimum must be less than maximum.');
      return;
    }

    for (const cat of editingCategories) {
      if (!cat.name.trim()) {
        alert('Category name cannot be empty.');
        return;
      }
      const picks = parseInt(cat.pickCount);
      if (isNaN(picks) || picks < 1) {
        alert(`Pick count for "${cat.name}" must be at least 1.`);
        return;
      }
    }

    const rangeChanged = min !== globalMin || max !== globalMax;

    const newCategories = editingCategories.map(ec => {
      const existing = categories.find(c => c.id === ec.id);
      return {
        ...ec,
        pickCount: parseInt(ec.pickCount),
        winners: rangeChanged ? [] : (existing?.winners || []),
      };
    });

    setGlobalMin(min);
    setGlobalMax(max);
    setCategories(newCategories);
    if (!newCategories.find(c => c.id === activeCategoryId)) {
      setActiveCategoryId(newCategories[0].id);
    }
    stopAnimation();
    setShowSettings(false);
  };

  const totalRange = globalMax - globalMin + 1;
  const availableCount = getAvailableNumbers().length;
  const digits = currentNumber.split('');
  const winners = activeCategory?.winners || [];

  let infoText;
  if (isAnimating) {
    infoText = 'Press ENTER or click STOP to select number';
  } else if (isCategoryFull) {
    infoText = `Category complete — all ${activeCategory.pickCount} pick${activeCategory.pickCount !== 1 ? 's' : ''} used`;
  } else {
    infoText = `${availableCount} of ${totalRange} numbers available · ${remainingPicks} pick${remainingPicks !== 1 ? 's' : ''} remaining`;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1 className="app-title">Bona Taon Punguan Sianipar Dohot Boruna Na Sian Lumban Balik Tahun 2026</h1>
        <button className="settings-btn" onClick={openSettings}>
          ⚙️ Settings
        </button>
      </header>

      {categories.length > 1 && (
        <div className="category-bar">
          {categories.map(cat => {
            const drawn = cat.winners.filter(w => w.status !== 'disqualified').length;
            const isFull = drawn >= cat.pickCount;
            return (
              <button
                key={cat.id}
                className={`category-tab ${cat.id === activeCategoryId ? 'active' : ''} ${isFull ? 'tab-full' : ''}`}
                onClick={() => { if (!isAnimating) setActiveCategoryId(cat.id); }}
              >
                <span className="category-tab-name">{cat.name}</span>
                <span className={`category-tab-badge ${isFull ? 'badge-full' : ''}`}>
                  {drawn}/{cat.pickCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="main-container">
        <div className="randomizer-section">
          <div className="active-category-header">
            <div className="active-category-label">{activeCategory?.name}</div>
            {activeCategory?.prizeName && (
              <div className="active-prize-name">{activeCategory.prizeName}</div>
            )}
          </div>

          <div className={`slot-machine ${isDramatic ? 'dramatic' : ''}`}>
            {digits.map((digit, index) => (
              <div
                key={index}
                className={`digit-slot ${animatingDigits[index] ? 'spinning' : ''} ${lockingDigits[index] ? 'locking' : ''}`}
              >
                <div className="digit">{digit}</div>
              </div>
            ))}
          </div>

          <button
            className={`action-btn ${isAnimating ? 'stop-btn' : isCategoryFull ? 'full-btn' : 'start-btn'}`}
            onClick={handleButtonClick}
            disabled={isCategoryFull && !isAnimating}
          >
            {isAnimating ? '⏹ STOP' : isCategoryFull ? '✓ All Picks Used' : 'ACAK NOMOR'}
          </button>

          <div className={`info-text ${isCategoryFull && !isAnimating ? 'info-complete' : ''}`}>
            {infoText}
          </div>
        </div>

        <div className="winners-section">
          <div className="winners-header">
            <div className="winners-header-title">
              <div className="winners-title-text">
                <h2>{activeCategory?.name}</h2>
                {activeCategory?.prizeName && (
                  <div className="winners-prize-name">{activeCategory.prizeName}</div>
                )}
              </div>
              <span className={`winners-count ${isCategoryFull ? 'count-full' : ''}`}>
                {validDrawsCount}/{activeCategory?.pickCount}
              </span>
            </div>
          </div>

          <div className="winners-list">
            {winners.length === 0 ? (
              <div className="no-winners">No winners yet</div>
            ) : (
              winners.map((winner, index) => (
                <div
                  key={winner.number}
                  className={`winner-card winner-${winner.status}`}
                >
                  <div className="winner-info">
                    <div className="winner-number">{winner.number.toString().padStart(4, '0')}</div>
                    <div className="winner-meta">
                      <span className="winner-order">Draw #{winners.length - index}</span>
                      {winner.status === 'confirmed' && (
                        <span className="winner-status-tag confirmed-tag">Confirmed</span>
                      )}
                      {winner.status === 'disqualified' && (
                        <span className="winner-status-tag disqualified-tag">Disqualified</span>
                      )}
                    </div>
                  </div>
                  <div className="winner-actions">
                    <button
                      className={`winner-action-btn confirm-btn ${winner.status === 'confirmed' ? 'active' : ''}`}
                      onClick={() => updateWinnerStatus(
                        activeCategoryId, winner.number,
                        winner.status === 'confirmed' ? 'pending' : 'confirmed'
                      )}
                      title={winner.status === 'confirmed' ? 'Unmark confirmed' : 'Mark as confirmed'}
                    >✓</button>
                    <button
                      className={`winner-action-btn disqualify-btn ${winner.status === 'disqualified' ? 'active' : ''}`}
                      onClick={() => updateWinnerStatus(
                        activeCategoryId, winner.number,
                        winner.status === 'disqualified' ? 'pending' : 'disqualified'
                      )}
                      title={winner.status === 'disqualified' ? 'Restore' : 'Disqualify'}
                    >✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="settings-form">

              {/* Global Number Range */}
              <div className="settings-section">
                <label className="settings-section-label">Number Range <span className="label-hint">(applies to all categories)</span></label>
                <div className="global-range-row">
                  <div className="range-field">
                    <span className="range-field-label">Min</span>
                    <input
                      type="number"
                      value={editingGlobalMin}
                      onChange={(e) => setEditingGlobalMin(e.target.value)}
                      min="1" max="9999"
                      className="range-number-input"
                    />
                  </div>
                  <span className="range-dash">–</span>
                  <div className="range-field">
                    <span className="range-field-label">Max</span>
                    <input
                      type="number"
                      value={editingGlobalMax}
                      onChange={(e) => setEditingGlobalMax(e.target.value)}
                      min="1" max="9999"
                      className="range-number-input"
                    />
                  </div>
                </div>
              </div>

              {/* Prize Categories */}
              <div className="settings-section">
                <div className="categories-section-header">
                  <label className="settings-section-label">Prize Categories</label>
                  <button className="btn-add-category" onClick={addEditingCategory}>
                    + Add Category
                  </button>
                </div>

                <div className="category-table-header">
                  <span>Category Name</span>
                  <span>Prize / Description</span>
                  <span className="col-picks">Picks</span>
                  <span></span>
                </div>

                <div className="categories-list">
                  {editingCategories.map((cat) => (
                    <div key={cat.id} className="category-edit-row">
                      <input
                        type="text"
                        className="category-name-input"
                        placeholder="e.g. Grand Prize"
                        value={cat.name}
                        onChange={(e) => updateEditingCategory(cat.id, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="category-prize-input"
                        placeholder="e.g. Electric Bike"
                        value={cat.prizeName}
                        onChange={(e) => updateEditingCategory(cat.id, 'prizeName', e.target.value)}
                      />
                      <input
                        type="number"
                        className="category-picks-input"
                        placeholder="1"
                        value={cat.pickCount}
                        onChange={(e) => updateEditingCategory(cat.id, 'pickCount', e.target.value)}
                        min="1"
                        max="999"
                      />
                      <button
                        className="btn-remove-category"
                        onClick={() => removeEditingCategory(cat.id)}
                        title="Remove category"
                        disabled={editingCategories.length <= 1}
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="warning-text">
                ⚠️ Changing the number range will clear all winning numbers across all categories. Numbers drawn in any category are excluded from all others.
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowSettings(false)}>Cancel</button>
                <button className="btn-save" onClick={handleSaveSettings}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
