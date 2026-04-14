import React, { useState, useEffect, useCallback } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const MAZE_WIDTH = 25;
const MAZE_HEIGHT = 25;

// 25x25 winding maze with 5 barriers gating progression:
//   P(1,1) → wind top-left → N1/D1(row 7) → Coffee(16,5) + path continues
//   → wind mid → N2/D2(row 11) → wind → N3/D3(row 15-16)
//   → wind bottom → N4/D4(row 19) → wind → N5/D5(row 21) → Brain(1,23)
const INITIAL_MAP = [
  ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'],
  ['1','S','0','0','0','0','0','0','0','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'],
  ['1','1','1','1','1','1','1','1','0','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'],
  ['1','0','0','0','0','0','0','0','0','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'],
  ['1','0','1','1','1','1','1','1','0','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'],
  ['1','0','0','0','0','0','0','1','0','1','1','1','1','1','1','1','C','1','1','1','1','1','1','1','1'],
  ['1','0','1','1','1','1','0','1','1','1','1','1','1','1','1','1','0','1','1','1','1','1','1','1','1'],
  ['1','0','1','1','1','1','0','0','0','0','0','N1','D1','0','0','0','0','1','1','1','1','1','1','1','1'],
  ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','0','1','1','1','1','1','1','1','1'],
  ['1','1','1','0','0','0','0','0','0','0','0','0','0','0','0','0','0','1','1','1','1','1','1','1','1'],
  ['1','1','1','0','1','1','1','1','1','1','0','1','1','1','1','1','1','1','1','1','1','1','1','1','1'],
  ['1','1','1','0','0','0','0','0','0','0','N2','D2','0','0','0','0','0','0','0','0','0','1','1','1','1'],
  ['1','1','1','0','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','0','1','1','1','1'],
  ['1','1','1','0','1','1','1','1','1','1','1','1','1','1','0','0','0','0','0','0','0','1','1','1','1'],
  ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','0','1','1','1','1','1','0','1','1','1','1'],
  ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','N3','1','1','1','1','1','0','1','1','1','1'],
  ['1','1','1','1','1','1','1','1','0','1','1','1','1','1','D3','1','1','1','1','1','1','1','1','1','1'],
  ['1','1','1','1','1','0','0','0','0','0','0','0','0','0','0','1','1','1','1','1','1','1','1','1','1'],
  ['1','1','1','1','1','0','1','1','1','1','1','1','0','1','1','1','1','1','1','1','1','1','1','1','1'],
  ['1','1','1','1','1','0','0','0','0','0','0','0','0','0','0','0','0','0','0','N4','D4','0','0','0','1'],
  ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','0','1'],
  ['1','1','1','0','0','0','0','0','0','D5','N5','0','0','0','0','0','0','0','0','0','0','0','0','0','1'],
  ['1','1','1','0','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','0','1'],
  ['1','B','0','0','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','0','1'],
  ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'],
];

// Mixed flora for wall tiles — varied forest texture
const FLORA_EMOJIS = ['🌲', '🌿', '🌱', '🌲', '🌲', '🌿', '🌱', '🌲'];
const getFlora = (x, y) => FLORA_EMOJIS[(x * 7 + y * 13 + x * y * 3) % FLORA_EMOJIS.length];

const TRIVIA = {
  N1: {
    question: "Challenge: When multiple robots are exploring without a shared global positioning system, what is the most critical challenge they face when trying to merge their maps?",
    options: [
      "A) Establishing the unknown initial relative poses",
      "B) Calculating exact battery drain",
      "C) Velocity matching"
    ],
    answer: 0,
    doorToUnlock: 'D1'
  },
  N2: {
    question: "Challenge: In a decentralized multi-robot SLAM system, sending entire maps between agents takes too much bandwidth. What is the standard solution?",
    options: [
      "A) Send full map arrays",
      "B) Transmit only pose graph updates and keyframes",
      "C) Compress into a single JPEG"
    ],
    answer: 1,
    doorToUnlock: 'D2'
  },
  N3: {
    question: "Event: What is the term for when Robot A recognizes a location that Robot B has already visited, allowing their individual trajectories to be tightly coupled?",
    options: [
      "A) Inter-robot Loop Closure",
      "B) Trajectory Extrapolation",
      "C) Sensor Drift"
    ],
    answer: 0,
    doorToUnlock: 'D3'
  },
  N4: {
    question: "Challenge: What is the critical challenge of determining whether Robot A's observed landmark is the same landmark seen by Robot B, enabling their maps to merge?",
    options: [
      "A) Inter-robot Data Association",
      "B) Cross-platform Sensor Fusion",
      "C) Temporal Map Synchronization"
    ],
    answer: 0,
    doorToUnlock: 'D4'
  },
  N5: {
    question: "Challenge: What is the primary global effect of establishing numerous, correct inter-robot loop closures in multi-SLAM?",
    options: [
      "A) Significantly reduced cumulative drift and improved overall consistency",
      "B) Increased computational load per agent",
      "C) Reduced communication frequency between robots"
    ],
    answer: 0,
    doorToUnlock: 'D5'
  }
};

const LOOTS = {
  C: {
    title: "Energy Reserves Depleted! 🎈\nHappy Birthday, Jessi! 🎈",
    message: "The birthday girl has discovered a Caffeinated Fuel Cell. Here is your Starbucks Gift Card:",
    type: "starbucks",
    imgUrl: "https://via.placeholder.com/400x250/166534/22c55e?text=STARBUCKS+GIFT+CARD"
  },
  B: {
    title: "Compute Bottleneck Detected! 🎂\nHappy Birthday, Jessi! 🎂",
    message: "The birthday girl has unlocked an Advanced Neural Co-Processor. Here is your Claude Subscription:",
    type: "claude",
    url: "https://gift.claude.ai/claim_jessi_bd"
  }
};

// Scenery animals — start on wall tiles, wander through flora
const INITIAL_ANIMALS = [
  { x: 2, y: 2, emoji: '🐛' },
  { x: 12, y: 4, emoji: '🦋' },
  { x: 8, y: 14, emoji: '🦊' },
  { x: 18, y: 18, emoji: '🐇' },
  { x: 22, y: 6, emoji: '🕷️' },
];

export default function App() {
  const [gamePhase, setGamePhase] = useState('locked'); // 'locked' | 'playing' | 'finished'
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [pos, setPos] = useState({ x: 1, y: 1 });
  const [discovered, setDiscovered] = useState(new Set());
  const [doorsState, setDoorsState] = useState({ D1: false, D2: false, D3: false, D4: false, D5: false });
  const [lootsCollected, setLootsCollected] = useState({ C: false, B: false });
  const [activeModal, setActiveModal] = useState(null);
  const [animalPositions, setAnimalPositions] = useState(INITIAL_ANIMALS);

  // Full game reset
  const resetGame = () => {
    setPos({ x: 1, y: 1 });
    setDiscovered(new Set());
    setDoorsState({ D1: false, D2: false, D3: false, D4: false, D5: false });
    setLootsCollected({ C: false, B: false });
    setActiveModal(null);
    setAnimalPositions(INITIAL_ANIMALS);
    setGamePhase('locked');
    setPassword('');
    setPasswordError(false);
  };

  // Password check
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.toUpperCase() === 'COFFEEGIRL') {
      setGamePhase('playing');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // Initialize discovery
  useEffect(() => {
    updateDiscovery(pos.x, pos.y);
  }, [pos]);

  const updateDiscovery = (x, y) => {
    const newDisc = new Set(discovered);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        // Circular radius of 3 (dx^2 + dy^2 <= 10)
        if (dx * dx + dy * dy <= 10) {
          if (nx >= 0 && nx < MAZE_WIDTH && ny >= 0 && ny < MAZE_HEIGHT) {
            newDisc.add(`${nx},${ny}`);
          }
        }
      }
    }
    setDiscovered(newDisc);
  };

  // Animal movement — one random animal moves every 5 seconds
  useEffect(() => {
    const moveAnimal = (animalPos) => {
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];
      const shuffled = [...directions].sort(() => Math.random() - 0.5);
      for (const { dx, dy } of shuffled) {
        const nx = animalPos.x + dx;
        const ny = animalPos.y + dy;
        if (nx >= 0 && nx < MAZE_WIDTH && ny >= 0 && ny < MAZE_HEIGHT) {
          if (INITIAL_MAP[ny][nx] === '1') {
            return { ...animalPos, x: nx, y: ny };
          }
        }
      }
      return animalPos;
    };

    const interval = setInterval(() => {
      setAnimalPositions(prev => {
        const idx = Math.floor(Math.random() * prev.length);
        const updated = [...prev];
        updated[idx] = moveAnimal(updated[idx]);
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (activeModal) return; // Block movement if modal open

      let { x, y } = pos;
      if (e.key === 'ArrowUp' || e.key === 'w') y -= 1;
      else if (e.key === 'ArrowDown' || e.key === 's') y += 1;
      else if (e.key === 'ArrowLeft' || e.key === 'a') x -= 1;
      else if (e.key === 'ArrowRight' || e.key === 'd') x += 1;
      else return;

      if (x >= 0 && x < MAZE_WIDTH && y >= 0 && y < MAZE_HEIGHT) {
        const cell = INITIAL_MAP[y][x];

        if (cell === '1') return; // Wall
        
        // Handle doors
        if (['D1', 'D2', 'D3', 'D4', 'D5'].includes(cell)) {
          if (!doorsState[cell]) {
            const nodeId = Object.keys(TRIVIA).find(k => TRIVIA[k].doorToUnlock === cell);
            if (nodeId) setActiveModal({ type: 'trivia', nodeId });
            return;
          }
        }

        // Handle nodes
        if (['N1', 'N2', 'N3', 'N4', 'N5'].includes(cell)) {
          const doorId = TRIVIA[cell].doorToUnlock;
          if (!doorsState[doorId]) {
            setActiveModal({ type: 'trivia', nodeId: cell });
            return;
          }
        }

        // Handle loots
        if (['C', 'B'].includes(cell) && !lootsCollected[cell]) {
          setActiveModal({ type: 'loot', lootId: cell, claimed: false });
          setLootsCollected((prev) => ({ ...prev, [cell]: true }));
        }

        setPos({ x, y });
      }
    },
    [pos, doorsState, activeModal, lootsCollected]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleAnswer = (nodeId, optionIdx) => {
    const trivia = TRIVIA[nodeId];
    if (trivia.answer === optionIdx) {
      // Correct!
      setDoorsState((prev) => ({ ...prev, [trivia.doorToUnlock]: true }));
      setActiveModal(null);
    } else {
      // Incorrect, maybe a shake effect later, but simple close for now
      alert("Incorrect! Re-calibrate your sensors and try again.");
      setActiveModal(null);
      // Push back one step
      setPos((prev) => ({ ...prev, x: pos.x, y: pos.y })); 
    }
  };

  const isLootActive = activeModal?.type === 'loot';
  const isBrainClaimed = activeModal?.type === 'loot' && activeModal?.lootId === 'B' && activeModal?.claimed;

  const gameScreen = (
    <div className="flex items-center justify-center min-h-screen p-4 select-none" style={{ backgroundColor: '#9bbc0f', fontFamily: "'Press Start 2P', monospace" }}>
      {isLootActive && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      
      <div className="flex flex-col items-center">
        <h1 className="mb-4 text-center leading-relaxed" style={{ color: '#0f380f', fontSize: '14px' }}>
          JESSI's POKEMON<br/>SLAM ADVENTURE
        </h1>

        <div className="relative rounded-lg p-1" style={{ backgroundColor: '#0f380f', border: '4px solid #0f380f', boxShadow: '0 4px 0 #306230' }}>
          {INITIAL_MAP.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => {
                const isDiscovered = discovered.has(`${x},${y}`);
                const isRobotHere = pos.x === x && pos.y === y;
                const animal = animalPositions.find(a => a.x === x && a.y === y);
                
                let renderContent = '';
                let bgColor = '#8bac0f'; // path green
                
                if (!isDiscovered) {
                  bgColor = '#0f380f'; // fog = darkest
                  renderContent = '';
                } else if (isRobotHere) {
                  renderContent = '🚶‍♀️';
                } else if (cell === '1') {
                  bgColor = '#306230';
                  if (animal) {
                    renderContent = animal.emoji;
                  } else {
                    renderContent = getFlora(x, y);
                  }
                } else if (['D1', 'D2', 'D3', 'D4', 'D5'].includes(cell)) {
                  renderContent = doorsState[cell] ? '' : '🛑';
                } else if (['N1', 'N2', 'N3', 'N4', 'N5'].includes(cell)) {
                  renderContent = doorsState[TRIVIA[cell].doorToUnlock] ? '' : '💻';
                } else if (cell === 'C') {
                  renderContent = lootsCollected['C'] ? '' : '☕';
                } else if (cell === 'B') {
                  renderContent = lootsCollected['B'] ? '' : '🧠';
                } else {
                  renderContent = '';
                }

                return (
                  <div
                    key={`${x}-${y}`}
                    className="flex items-center justify-center fog-transition"
                    style={{ backgroundColor: bgColor, width: '26px', height: '26px', fontSize: '14px' }}
                  >
                    {renderContent}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="mt-3 text-center leading-relaxed" style={{ color: '#306230', fontSize: '8px' }}>
           Use Arrow Keys or WASD. Find 💻 to unlock barriers 🛑.
        </p>
      </div>

      <AnimatePresence>
        {activeModal && activeModal.type === 'trivia' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
            style={{ backgroundColor: 'rgba(15, 56, 15, 0.5)' }}
          >
            <div className="poke-dialog max-w-lg w-full">
              <div className="flex items-center gap-2 mb-4 text-sm pb-2" style={{ color: '#0f380f', borderBottom: '2px solid #0f380f' }}>
                <span>💻 DATA NODE</span>
              </div>
              <p className="text-xs mb-6 leading-loose" style={{ color: '#306230' }}>
                {TRIVIA[activeModal.nodeId].question}
              </p>
              <div className="flex flex-col gap-3">
                {TRIVIA[activeModal.nodeId].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(activeModal.nodeId, idx)}
                    className="text-left px-4 py-3 text-xs leading-relaxed transition-colors cursor-pointer"
                    style={{ 
                      backgroundColor: '#8bac0f', 
                      border: '2px solid #0f380f',
                      color: '#0f380f',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9bbc0f'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#8bac0f'; }}
                  >
                    ▶ {opt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeModal && activeModal.type === 'loot' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
            style={{ backgroundColor: 'rgba(15, 56, 15, 0.5)' }}
          >
            <div className="poke-dialog max-w-md w-full text-center" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <h2 className="text-sm mb-4 whitespace-pre-line leading-loose" style={{ color: '#0f380f' }}>
                {LOOTS[activeModal.lootId].title}
              </h2>
              <p className="text-xs mb-6 leading-loose" style={{ color: '#306230' }}>
                {LOOTS[activeModal.lootId].message}
              </p>
              
              {activeModal.claimed ? (
                <div className="mb-6">
                  {LOOTS[activeModal.lootId].type === 'claude' ? (
                    <div>
                      <div className="p-4 rounded flex flex-col gap-3 mb-4" style={{ backgroundColor: '#8bac0f', border: '2px solid #0f380f' }}>
                        <span className="break-all select-all block py-2 px-3 rounded text-xs" style={{ backgroundColor: '#9bbc0f', color: '#0f380f' }}>{LOOTS[activeModal.lootId].url}</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText(LOOTS[activeModal.lootId].url)}
                          className="py-2 px-4 rounded text-xs cursor-pointer transition-colors"
                          style={{ backgroundColor: '#306230', color: '#9bbc0f', border: '2px solid #0f380f' }}
                        >
                          ▶ Copy URL
                        </button>
                      </div>
                      <div className="p-4 rounded mb-2" style={{ backgroundColor: '#0f380f', border: '2px solid #306230' }}>
                        <p className="leading-loose" style={{ color: '#9bbc0f', fontSize: '13px' }}>
                          🎉 CONGRATULATIONS, Jessi! 🎉
                        </p>
                        <p className="leading-loose mt-2" style={{ color: '#8bac0f', fontSize: '10px' }}>
                          Adventure Complete. Game Over!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded flex flex-col items-center gap-4" style={{ backgroundColor: '#8bac0f', border: '2px solid #0f380f' }}>
                      <img src={LOOTS[activeModal.lootId].imgUrl} alt="Starbucks Gift Card" className="rounded max-w-full" style={{ border: '2px solid #0f380f' }} />
                      <a 
                        href={LOOTS[activeModal.lootId].imgUrl} 
                        download="Starbucks_Gift_Card.png"
                        className="py-2 px-6 rounded text-xs inline-block w-full text-center cursor-pointer"
                        style={{ backgroundColor: '#306230', color: '#9bbc0f', border: '2px solid #0f380f' }}
                      >
                        ▶ Download Card
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setActiveModal(prev => ({ ...prev, claimed: true }))}
                  className="inline-block w-full py-3 px-6 rounded mb-4 text-xs cursor-pointer transition-colors"
                  style={{ backgroundColor: '#306230', color: '#9bbc0f', border: '2px solid #0f380f' }}
                >
                  ▶ Claim Reward
                </button>
              )}

              {isBrainClaimed ? (
                <button
                  onClick={() => setGamePhase('finished')}
                  className="text-xs cursor-pointer py-2 px-6 rounded"
                  style={{ backgroundColor: '#0f380f', color: '#9bbc0f', border: '2px solid #306230' }}
                >
                  ▶ Complete Adventure
                </button>
              ) : (
                <button
                  onClick={() => setActiveModal(null)}
                  className="underline text-xs cursor-pointer"
                  style={{ color: '#306230' }}
                >
                  ▶ Continue...
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ─── LOCK SCREEN ────────────────────────────────────────────
  if (gamePhase === 'locked') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 select-none" style={{ backgroundColor: '#0f380f', fontFamily: "'Press Start 2P', monospace" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="text-center">
            <p style={{ color: '#306230', fontSize: '12px' }} className="mb-2">🔒 SYSTEM LOCKED 🔒</p>
            <h1 style={{ color: '#9bbc0f', fontSize: '16px', lineHeight: '2' }}>JESSI's POKEMON<br/>SLAM ADVENTURE</h1>
            <p style={{ color: '#8bac0f', fontSize: '9px', lineHeight: '2' }} className="mt-4">Enter the access code to begin your quest.</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col items-center gap-4">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
              placeholder="ACCESS CODE"
              autoFocus
              className="text-center text-xs px-4 py-3 rounded outline-none"
              style={{
                backgroundColor: '#306230',
                color: '#9bbc0f',
                border: passwordError ? '3px solid #ff6b6b' : '3px solid #8bac0f',
                fontFamily: "'Press Start 2P', monospace",
                width: '260px',
                letterSpacing: '3px',
              }}
            />
            {passwordError && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ color: '#ff6b6b', fontSize: '8px' }}
              >
                ✕ INCORRECT CODE. TRY AGAIN.
              </motion.p>
            )}
            <button
              type="submit"
              className="text-xs cursor-pointer py-3 px-8 rounded transition-colors"
              style={{ backgroundColor: '#8bac0f', color: '#0f380f', border: '3px solid #9bbc0f' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9bbc0f'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#8bac0f'; }}
            >
              ▶ ENTER
            </button>
          </form>
          <div className="flex gap-3 mt-4">
            {['🌲','🌿','🌱','🌲','🦋','🌲','🌿','🐛','🌱','🌲'].map((e, i) => (
              <span key={i} style={{ fontSize: '18px', opacity: 0.6 }}>{e}</span>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── VICTORY SCREEN ─────────────────────────────────────────
  if (gamePhase === 'finished') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 select-none" style={{ backgroundColor: '#9bbc0f', fontFamily: "'Press Start 2P', monospace" }}>
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={true} numberOfPieces={150} />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ fontSize: '64px' }}
          >
            🎂
          </motion.div>
          <h1 style={{ color: '#0f380f', fontSize: '18px', lineHeight: '2.2' }}>
            CONGRATULATIONS!<br/>ADVENTURE COMPLETE!
          </h1>
          <div className="poke-dialog" style={{ maxWidth: '480px' }}>
            <p style={{ color: '#0f380f', fontSize: '10px', lineHeight: '2.4' }}>
              You navigated the winding maze, solved all 5 multi-SLAM challenges,
              and collected both hidden treasures!
            </p>
            <div className="mt-4 flex justify-center gap-2" style={{ fontSize: '28px' }}>
              <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>🎈</motion.span>
              <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>🎉</motion.span>
              <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>🥳</motion.span>
              <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}>🎊</motion.span>
              <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.8 }}>🎁</motion.span>
            </div>
            <p className="mt-4" style={{ color: '#306230', fontSize: '12px', lineHeight: '2.2' }}>
              Happy Birthday, Jessi! 🎂
            </p>
            <p style={{ color: '#306230', fontSize: '9px', lineHeight: '2' }}>
              From your favorite multi-agent SLAM research partner.
            </p>
          </div>
          <button
            onClick={resetGame}
            className="text-xs cursor-pointer py-3 px-8 rounded mt-4 transition-colors"
            style={{ backgroundColor: '#306230', color: '#9bbc0f', border: '2px solid #0f380f' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f380f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#306230'; }}
          >
            ▶ Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── GAME SCREEN ────────────────────────────────────────────
  return gameScreen;
}
