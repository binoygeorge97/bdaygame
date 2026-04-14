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
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4 font-mono select-none">
      {isLootActive && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold text-green-400 mb-6 glow-text text-center">
          Terminal [bday_jessi_v1.0]
        </h1>

        <div className="relative bg-black border-2 border-green-500/50 rounded-lg p-2 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          {INITIAL_MAP.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => {
                const isDiscovered = discovered.has(`${x},${y}`);
                const isRobotHere = pos.x === x && pos.y === y;
                
                let renderContent = ' ';
                if (isDiscovered) {
                  if (isRobotHere) renderContent = '🤖';
                  else if (cell === '1') renderContent = '█';
                  else if (['D1', 'D2', 'D3'].includes(cell)) renderContent = doorsState[cell] ? '·' : '🔒';
                  else if (['N1', 'N2', 'N3'].includes(cell)) renderContent = doorsState[TRIVIA[cell].doorToUnlock] ? '·' : '📡';
                  else if (cell === 'C') renderContent = lootsCollected['C'] ? '·' : '☕';
                  else if (cell === 'B') renderContent = lootsCollected['B'] ? '·' : '🧠';
                  else if (cell === 'S') renderContent = '○'; // Start marker
                  else renderContent = '·'; // Empty path
                }

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`w-8 h-8 flex items-center justify-center text-lg fog-transition ${
                      !isDiscovered ? 'opacity-0' : 'opacity-100'
                    } ${
                      cell === '1' ? 'text-green-800' : 'text-green-400'
                    }`}
                  >
                    {renderContent}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="mt-4 text-green-500/70 text-sm">
           Use Arrow Keys or WASD to navigate. Locate Data Nodes 📡 to unlock doors 🔒.
        </p>
      </div>

      <AnimatePresence>
        {activeModal && activeModal.type === 'trivia' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="bg-gray-900 border border-green-500 p-6 rounded-lg max-w-lg w-full shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <div className="flex items-center gap-2 mb-4 text-green-400 font-bold text-xl border-b border-green-500/30 pb-2">
                <span>📡 Data Node Encryption</span>
              </div>
              <p className="text-green-300 mb-6 leading-relaxed">
                {TRIVIA[activeModal.nodeId].question}
              </p>
              <div className="flex flex-col gap-3">
                {TRIVIA[activeModal.nodeId].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(activeModal.nodeId, idx)}
                    className="text-left px-4 py-3 bg-gray-800 hover:bg-green-900/40 border border-green-500/30 hover:border-green-400 rounded transition-colors text-green-200 hover:text-green-100"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeModal && activeModal.type === 'loot' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="bg-gray-900 border border-yellow-500 p-8 rounded-lg max-w-md w-full shadow-[0_0_40px_rgba(234,179,8,0.4)] text-center">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 whitespace-pre-line">
                {LOOTS[activeModal.lootId].title}
              </h2>
              <p className="text-yellow-200/90 mb-6 leading-relaxed">
                {LOOTS[activeModal.lootId].message}
              </p>
              
              {activeModal.claimed ? (
                <div className="mb-6">
                  {LOOTS[activeModal.lootId].type === 'claude' ? (
                    <div className="bg-gray-800 p-4 rounded border border-gray-700 flex flex-col gap-3">
                      <span className="text-green-300 break-all select-all block bg-black/50 py-2 px-3 rounded text-sm">{LOOTS[activeModal.lootId].url}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(LOOTS[activeModal.lootId].url)}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-300 font-bold py-2 px-4 rounded border border-green-500/50 transition-colors"
                      >
                        Copy URL
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-800 p-4 rounded border border-gray-700 flex flex-col items-center gap-4">
                      <img src={LOOTS[activeModal.lootId].imgUrl} alt="Starbucks Gift Card" className="rounded shadow-md max-w-full" />
                      <a 
                        href={LOOTS[activeModal.lootId].imgUrl} 
                        download="Starbucks_Gift_Card.png"
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-300 font-bold py-2 px-6 rounded border border-green-500/50 transition-colors inline-block w-full"
                      >
                        Download Card
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setActiveModal(prev => ({ ...prev, claimed: true }))}
                  className="inline-block w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500 text-yellow-300 font-bold py-3 px-6 rounded transition-colors mb-4"
                >
                  Claim Reward Protocol
                </button>
              )}

              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-white underline text-sm"
              >
                Resume Navigation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
