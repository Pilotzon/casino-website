import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './Crash.module.css';
import useBetSound from "../../hooks/useBetSound";
function Crash() {
  const { user, isAuthenticated, updateBalance } = useAuth();
  const toast = useToast();
  const canvasRef = useRef(null);

  const [betAmount, setBetAmount] = useState('0.00000000');
  const [autoCashout, setAutoCashout] = useState('2.00');
  
  // Game state (shared for all players)
  const [gamePhase, setGamePhase] = useState('waiting'); // waiting, starting, running, crashed
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(null);
  const [countdown, setCountdown] = useState(5);
  
  // Player state
  const [hasBet, setHasBet] = useState(false);
  const [betMultiplier, setBetMultiplier] = useState(null);
  const [cashedOut, setCashedOut] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [activePlayers, setActivePlayers] = useState([]);
  
  const gameLoopRef = useRef(null);
  const startTimeRef = useRef(null);
  const graphPointsRef = useRef([]);

  // Generate crash point (server would do this)
  const generateCrashPoint = () => {
    const rand = Math.random();
    // Exponential distribution for realistic crash points
    return Math.max(1.00, Math.floor((Math.pow(Math.E, rand * 2) - 1) * 100) / 100);
  };

  // Start new game round
  const startNewRound = () => {
    const crash = generateCrashPoint();
    setCrashPoint(crash);
    setGamePhase('starting');
    setCountdown(5);
    graphPointsRef.current = [];
    
    // Countdown before game starts
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countInterval);
          setGamePhase('running');
          startTimeRef.current = Date.now();
          runGame(crash);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Run the actual game
  const runGame = (crash) => {
    const startTime = Date.now();
    
    gameLoopRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const multiplier = 1 + (elapsed * 0.3); // Grows at ~0.3x per second
      
      setCurrentMultiplier(multiplier);
      graphPointsRef.current.push({ time: elapsed, value: multiplier });
      
      // Check auto-cashout
      if (hasBet && !cashedOut) {
        const auto = parseFloat(autoCashout);
        if (multiplier >= auto) {
          handleCashout();
        }
      }
      
      // Check if crashed
      if (multiplier >= crash) {
        clearInterval(gameLoopRef.current);
        setGamePhase('crashed');
        setCurrentMultiplier(crash);
        
        // Add to history
        setHistory(prev => [crash, ...prev].slice(0, 10));
        
        // Reset after 3 seconds
        setTimeout(() => {
          setGamePhase('waiting');
          setCurrentMultiplier(1.00);
          setCrashPoint(null);
          setHasBet(false);
          setCashedOut(false);
          setBetMultiplier(null);
          setTimeout(() => startNewRound(), 2000);
        }, 3000);
      }
    }, 50); // Update every 50ms for smooth animation
  };

  // Draw graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (graphPointsRef.current.length < 2) return;
    
    const points = graphPointsRef.current;
    const maxTime = Math.max(...points.map(p => p.time), 10);
    const maxValue = Math.max(...points.map(p => p.value), 2);
    
    // Draw filled area
    ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    points.forEach(point => {
      const x = (point.time / maxTime) * width;
      const y = height - ((point.value - 1) / (maxValue - 1)) * height;
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    
    // Draw line
    ctx.strokeStyle = gamePhase === 'crashed' ? '#f12c4c' : '#ff9500';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    points.forEach((point, i) => {
      const x = (point.time / maxTime) * width;
      const y = height - ((point.value - 1) / (maxValue - 1)) * height;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    
  }, [currentMultiplier, gamePhase]);

  // Initialize game on mount
  useEffect(() => {
    setTimeout(() => startNewRound(), 1000);
    
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  const handleBet = () => {
    if (!isAuthenticated) return toast.error('Please login to play');
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return toast.error('Invalid bet amount');
    if (amount > user.balance) return toast.error('Insufficient balance');
    if (gamePhase !== 'waiting' && gamePhase !== 'starting') return toast.error('Wait for next round');

    updateBalance(user.balance - amount);
    setHasBet(true);
    setCashedOut(false);
    toast.success('Bet placed! Good luck!');
  };

  const handleCashout = () => {
    if (!hasBet || cashedOut) return;
    if (gamePhase !== 'running') return;

    const amount = parseFloat(betAmount);
    const payout = amount * currentMultiplier;
    
    updateBalance(user.balance + payout);
    setBetMultiplier(currentMultiplier);
    setCashedOut(true);
    setHasBet(false);
    
    toast.success(`Cashed out at ${currentMultiplier.toFixed(2)}x! Won ${payout.toFixed(8)}`);
  };

  const adjustBet = (val) => {
    const curr = parseFloat(betAmount) || 0;
    setBetAmount((curr * val).toFixed(8));
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.modeToggle}>
          <button className={`${styles.modeBtn} ${styles.active}`}>Manual</button>
          <button className={styles.modeBtn}>Auto</button>
        </div>

        <div className={styles.controlGroup}>
          <div className={styles.labelRow}>
            <span>Bet Amount</span>
            <span>$0.00</span>
          </div>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                step="0.00000001"
                disabled={hasBet}
              />
              <span className={styles.btcIcon}>₿</span>
            </div>
            <div className={styles.splitButtons}>
              <button onClick={() => adjustBet(0.5)} disabled={hasBet}>½</button>
              <div className={styles.divider}></div>
              <button onClick={() => adjustBet(2)} disabled={hasBet}>2×</button>
            </div>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <div className={styles.labelRow}>
            <span>Cashout At</span>
          </div>
          <div className={styles.cashoutInput}>
            <input
              type="number"
              value={autoCashout}
              onChange={(e) => setAutoCashout(e.target.value)}
              step="0.01"
              disabled={hasBet}
            />
            <div className={styles.arrowButtons}>
              <button onClick={() => setAutoCashout(p => (parseFloat(p) + 0.1).toFixed(2))}>▲</button>
              <button onClick={() => setAutoCashout(p => Math.max(1.01, parseFloat(p) - 0.1).toFixed(2))}>▼</button>
            </div>
          </div>
        </div>

        {!hasBet ? (
          <button
            className={styles.betButton}
            onClick={handleBet}
            disabled={!isAuthenticated || gamePhase === 'running'}
          >
            {gamePhase === 'running' ? 'Bet (Next Round)' : 'Bet'}
          </button>
        ) : (
          <button
            className={`${styles.betButton} ${styles.cashoutButton}`}
            onClick={handleCashout}
            disabled={gamePhase !== 'running' || cashedOut}
          >
            {cashedOut ? `Cashed @ ${betMultiplier?.toFixed(2)}x` : `Cash Out ${currentMultiplier.toFixed(2)}x`}
          </button>
        )}

        <div className={styles.controlGroup} style={{ marginTop: 'auto' }}>
          <div className={styles.labelRow}>
            <span>Profit on Win</span>
            <span>$0.00</span>
          </div>
          <div className={styles.readonlyInput}>
            <input 
              type="text" 
              value={(parseFloat(betAmount || 0) * (parseFloat(autoCashout) - 1)).toFixed(8)} 
              readOnly 
            />
            <span className={styles.btcIcon}>₿</span>
          </div>
        </div>

        <div className={styles.historySection}>
          <div className={styles.historyLabel}>History</div>
          <div className={styles.historyItems}>
            {history.map((h, i) => (
              <div key={i} className={`${styles.historyChip} ${h < 2 ? styles.lowCrash : h < 10 ? styles.medCrash : styles.highCrash}`}>
                {h.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.gameStage}>
        <div className={styles.graphContainer}>
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={400}
            className={styles.canvas}
          />
          
          <div className={styles.multiplierOverlay}>
            {gamePhase === 'waiting' && (
              <div className={styles.waitingText}>Waiting for next round...</div>
            )}
            
            {gamePhase === 'starting' && (
              <div className={styles.countdownText}>Starting in {countdown}s</div>
            )}
            
            {(gamePhase === 'running' || gamePhase === 'crashed') && (
              <div className={`${styles.currentMulti} ${gamePhase === 'crashed' ? styles.crashedMulti : ''}`}>
                {currentMultiplier.toFixed(2)}x
              </div>
            )}
            
            {gamePhase === 'crashed' && (
              <div className={styles.crashedLabel}>CRASHED!</div>
            )}
          </div>

          <div className={styles.timeAxis}>
            <span>2s</span>
            <span>4s</span>
            <span>6s</span>
            <span>8s</span>
            <span>Total 0s</span>
          </div>
        </div>

        <div className={styles.betsPanel}>
          <div className={styles.betsHeader}>
            <span className={styles.betsCount}>👥 {activePlayers.length || 309}</span>
            <span className={styles.betsTotal}>₿ ${(Math.random() * 5000).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Crash;