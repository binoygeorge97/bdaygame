import React, { useState, useEffect, useCallback } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const MAZE_WIDTH = 15;
const MAZE_HEIGHT = 15;

const INITIAL_MAP = [
  ['S', '0', '0', '0', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1'], 
  ['1', '1', '1', '0', '1', 'C', 'D3','N3','0', '0', '0', '1', '1', '1', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '1', '1', '1', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '1', '1', '1', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '1', '1', 'B', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '1', '1', '0', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', 'N2','D2','0', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '0', '1', '1', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '1', '1', '1', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '1', '1', '1', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '1', '1', '1', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '1', '1', '1', '1'], 
  ['1', '1', '1', '0', '1', '1', '1', '1', '1', '1', '0', '1', '1', '1', '1'], 
  ['1', '1', '1', 'N1','D1','0', '0', '0', '0', '0', '0', '1', '1', '1', '1'], 
  ['1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1']
];

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
  }
};

const LOOTS = {
  C: {
    title: "Energy Reserves Depleted! 🎈\nHappy Birthday, Jessi! 🎈",
    message: "The birthday girl has discovered a Caffeinated Fuel Cell. Here is your Starbucks Gift Card:",
    type: "starbucks",
    imgUrl: "https://via.placeholder.com/400x250/166534/22c55e?text=STARBUCKS+GIFT+CARD" // placeholder
  },
  B: {
    title: "Compute Bottleneck Detected! 🎂\nHappy Birthday, Jessi! 🎂",
    message: "The birthday girl has unlocked an Advanced Neural Co-Processor. Here is your Claude Subscription:",
    type: "claude",
    url: "https://gift.claude.ai/claim_jessi_bd"
  }
};

export default function App() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [discovered, setDiscovered] = useState(new Set());
  const [doorsState, setDoorsState] = useState({ D1: false, D2: false, D3: false }); // false = locked, true = unlocked
  const [lootsCollected, setLootsCollected] = useState({ C: false, B: false });
  const [activeModal, setActiveModal] = useState(null); // { type: 'trivia', nodeId: 'N1' } | { type: 'loot', lootId: 'C' }

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
        // Circular radius of 3 (dx^2 + dy^2 <= 9)
        if (dx * dx + dy * dy <= 10) {
          if (nx >= 0 && nx < MAZE_WIDTH && ny >= 0 && ny < MAZE_HEIGHT) {
            newDisc.add(`${nx},${ny}`);
          }
        }
      }
    }
    setDiscovered(newDisc);
  };

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
        if (['D1', 'D2', 'D3'].includes(cell)) {
          if (!doorsState[cell]) {
            const nodeId = Object.keys(TRIVIA).find(k => TRIVIA[k].doorToUnlock === cell);
            if (nodeId) setActiveModal({ type: 'trivia', nodeId });
            return;
          }
        }

        // Handle nodes
        if (['N1', 'N2', 'N3'].includes(cell)) {
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

  return (
    <div className="flex items-center justify-center min-h-screen p-4 select-none" style={{ backgroundColor: '#9bbc0f', fontFamily: "'Press Start 2P', monospace" }}>
      {isLootActive && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      
      <div className="flex flex-col items-center">
        <h1 className="text-lg mb-6 text-center leading-relaxed" style={{ color: '#0f380f' }}>
          JESSI's POKEMON<br/>SLAM ADVENTURE
        </h1>

        <div className="relative rounded-lg p-1" style={{ backgroundColor: '#0f380f', border: '4px solid #0f380f', boxShadow: '0 4px 0 #306230' }}>
          {INITIAL_MAP.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => {
                const isDiscovered = discovered.has(`${x},${y}`);
                const isRobotHere = pos.x === x && pos.y === y;
                
                let renderContent = '';
                let bgColor = '#8bac0f'; // path green
                
                if (!isDiscovered) {
                  bgColor = '#0f380f'; // fog = darkest
                  renderContent = '';
                } else if (isRobotHere) {
                  renderContent = '🚶‍♀️';
                } else if (cell === '1') {
                  renderContent = '🌳';
                  bgColor = '#306230';
                } else if (['D1', 'D2', 'D3'].includes(cell)) {
                  renderContent = doorsState[cell] ? '' : '🛑';
                } else if (['N1', 'N2', 'N3'].includes(cell)) {
                  renderContent = doorsState[TRIVIA[cell].doorToUnlock] ? '' : '💻';
                } else if (cell === 'C') {
                  renderContent = lootsCollected['C'] ? '' : '☕';
                } else if (cell === 'B') {
                  renderContent = lootsCollected['B'] ? '' : '🧠';
                } else if (cell === 'S') {
                  renderContent = '';
                } else {
                  renderContent = '';
                }

                return (
                  <div
                    key={`${x}-${y}`}
                    className="w-8 h-8 flex items-center justify-center text-base fog-transition"
                    style={{ backgroundColor: bgColor }}
                  >
                    {renderContent}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-center leading-relaxed" style={{ color: '#306230' }}>
           Use Arrow Keys or WASD.<br/>Find 💻 to unlock barriers 🛑.
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
            <div className="poke-dialog max-w-md w-full text-center">
              <h2 className="text-sm mb-4 whitespace-pre-line leading-loose" style={{ color: '#0f380f' }}>
                {LOOTS[activeModal.lootId].title}
              </h2>
              <p className="text-xs mb-6 leading-loose" style={{ color: '#306230' }}>
                {LOOTS[activeModal.lootId].message}
              </p>
              
              {activeModal.claimed ? (
                <div className="mb-6">
                  {LOOTS[activeModal.lootId].type === 'claude' ? (
                    <div className="p-4 rounded flex flex-col gap-3" style={{ backgroundColor: '#8bac0f', border: '2px solid #0f380f' }}>
                      <span className="break-all select-all block py-2 px-3 rounded text-xs" style={{ backgroundColor: '#9bbc0f', color: '#0f380f' }}>{LOOTS[activeModal.lootId].url}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(LOOTS[activeModal.lootId].url)}
                        className="py-2 px-4 rounded text-xs cursor-pointer transition-colors"
                        style={{ backgroundColor: '#306230', color: '#9bbc0f', border: '2px solid #0f380f' }}
                      >
                        ▶ Copy URL
                      </button>
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

              <button
                onClick={() => setActiveModal(null)}
                className="underline text-xs cursor-pointer"
                style={{ color: '#306230' }}
              >
                ▶ Continue...
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
