// src/pages/games.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gamesAPI } from "../services/api";

import Flip from "../components/games/Flip";
import Dice from "../components/games/Dice";
import Limbo from "../components/games/Limbo";
import Plinko from "../components/games/Plinko";
import Mines from "../components/games/Mines";
import Blackjack from "../components/games/Blackjack";
import Tower from "../components/games/Tower";
import RussianRoulette from "../components/games/RussianRoulette";
import Keno from "../components/games/Keno";
import Roulette from "../components/games/Roulette";
import Wheel from "../components/games/Wheel";
import Snakes from "../components/games/Snakes";
import RPS from "../components/games/RPS";

import styles from "./games.module.css";

// Posters (src/assets/game-posters/)
import flipPoster from "../assets/game-posters/flip.png";
import dicePoster from "../assets/game-posters/dice.png";
import limboPoster from "../assets/game-posters/limbo.png";
import plinkoPoster from "../assets/game-posters/plinko.png";
import crashPoster from "../assets/game-posters/crash.png";
import minesPoster from "../assets/game-posters/mines.png";
import roulettePoster from "../assets/game-posters/roulette.png";
import blackjackPoster from "../assets/game-posters/blackjack.png";
import kenoPoster from "../assets/game-posters/keno.png";
import towerPoster from "../assets/game-posters/tower.png";
import russianRoulettePoster from "../assets/game-posters/RussianRoulette.png";
import wheelPoster from "../assets/game-posters/wheel.png";
import snakesPoster from "../assets/game-posters/snakes.png";
import rpsPoster from "../assets/game-posters/rps.png";

// optional fallback (currently unused)
import fallbackPoster from "../assets/game-posters/fallback.png";

const SOUND_ENABLED_LS_KEY = "games:soundEnabled";
const SOUND_VOLUME_LS_KEY = "games:soundVolume";

function clamp01(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 1;
  return Math.max(0, Math.min(1, x));
}

function Games() {
  const { gameName } = useParams();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sound settings (persisted)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.8);

  useEffect(() => {
    try {
      const rawEnabled = localStorage.getItem(SOUND_ENABLED_LS_KEY);
      const rawVol = localStorage.getItem(SOUND_VOLUME_LS_KEY);

      setSoundEnabled(rawEnabled === null ? true : rawEnabled === "true");
      setSoundVolume(rawVol === null ? 0.8 : clamp01(parseFloat(rawVol)));
    } catch {
      setSoundEnabled(true);
      setSoundVolume(0.8);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_ENABLED_LS_KEY, String(soundEnabled));
      localStorage.setItem(SOUND_VOLUME_LS_KEY, String(soundVolume));
    } catch {
      // ignore
    }
  }, [soundEnabled, soundVolume]);

  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGames = async () => {
    try {
      const response = await gamesAPI.getAll();
      setGames(response.data.data);
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  };

  const gameComponents = useMemo(
    () => ({
      flip: Flip,
      dice: Dice,
      limbo: Limbo,
      plinko: Plinko,
      mines: Mines,
      roulette: Roulette,
      blackjack: Blackjack,
      keno: Keno,
      tower: Tower,
      russian_roulette: RussianRoulette,
      wheel: Wheel,
      snakes: Snakes,
      rps: RPS,
    }),
    []
  );

  const implementedGames = useMemo(
    () =>
      new Set([
        "flip",
        "dice",
        "limbo",
        "plinko",
        "mines",
        "roulette",
        "blackjack",
        "keno",
        "tower",
        "russian_roulette",
        "wheel",
        "snakes",
        "rps",
      ]),
    []
  );

  const GameComponent = gameName && gameComponents[gameName];

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading games...</p>
      </div>
    );
  }

  if (GameComponent) {
    return (
      <div
        className={styles.gameContainer}
        data-game={gameName || ""}
        data-sound={soundEnabled ? "on" : "off"}
        data-sound-enabled={soundEnabled ? "true" : "false"}
      >
        <div className={styles.gameHeader}>
          <button className={styles.backButton} onClick={() => navigate("/games")}>
            ← Back to Games
          </button>

          <h1 className={styles.gameTitle}>
            {games.find((g) => g.name === gameName)?.display_name || gameName}
          </h1>

          <div className={styles.headerRight}>
            {/* Sound control: one compact input-styled pill —
                [ speaker toggle | volume slider | value ] */}
            <div
              className={`${styles.soundSetting} ${soundEnabled ? "" : styles.soundSettingMuted}`}
              role="group"
              aria-label="Sound settings"
            >
              <button
                type="button"
                className={styles.soundToggle}
                onClick={() => setSoundEnabled((v) => !v)}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                title={soundEnabled ? "Mute" : "Unmute"}
              >
                <SpeakerIcon muted={!soundEnabled} level={soundVolume} />
              </button>

              <input
                className={styles.volumeSlider}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={soundVolume}
                onChange={(e) => setSoundVolume(clamp01(e.target.value))}
                disabled={!soundEnabled}
                aria-label="Volume"
                style={{ "--vol-fill": `${Math.round(soundVolume * 100)}%` }}
              />

              <span className={styles.volumeValue} aria-live="polite">
                {soundEnabled ? `${Math.round(soundVolume * 100)}%` : "Off"}
              </span>
            </div>
          </div>
        </div>

        <GameComponent soundEnabled={soundEnabled} soundVolume={soundVolume} />
      </div>
    );
  }

  return (
    <div className={styles.games}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Games</h1>
          <p className={styles.subtitle}>Choose your game and start playing</p>
        </div>

        <div className={styles.grid}>
          {games
            .filter((game) => !!getGamePoster(game.name))
            .map((game) => {
              const isImplemented = implementedGames.has(game.name);

              const isUnavailable = !isImplemented || !Boolean(game.is_enabled);

              return (
                <button
                  key={game.id}
                  type="button"
                  className={`${styles.poster} ${
                    isUnavailable ? styles.unavailable : styles.available
                  }`}
                  onClick={() => {
                    if (isUnavailable) return;
                    navigate(`/games/${game.name}`);
                  }}
                  aria-disabled={isUnavailable}
                  title={
                    !isImplemented
                      ? "Unavailable"
                      : !game.is_enabled
                      ? "Disabled"
                      : game.display_name
                  }
                >
                  <span className={styles.posterMedia}>
                    <img
                      className={styles.posterImage}
                      src={getGamePoster(game.name)}
                      alt={game.display_name}
                      loading="lazy"
                    />

                    {isUnavailable && (
                      <span className={styles.unavailableOverlay} aria-hidden="true">
                        Unavailable
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function SpeakerIcon({ muted = false, level = 1 }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
  };
  const body = <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />;

  if (muted) {
    return (
      <svg {...common}>
        {body}
        <path d="m23 9-6 6" />
        <path d="m17 9 6 6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      {body}
      {level > 0 && <path d="M15.5 8.5a5 5 0 0 1 0 7" />}
      {level > 0.5 && <path d="M19 5a10 10 0 0 1 0 14" />}
    </svg>
  );
}

function getGamePoster(name) {
  const posters = {
    flip: flipPoster,
    dice: dicePoster,
    limbo: limboPoster,
    plinko: plinkoPoster,
    crash: crashPoster,
    mines: minesPoster,
    roulette: roulettePoster,
    blackjack: blackjackPoster,
    keno: kenoPoster,
    tower: towerPoster,
    russian_roulette: russianRoulettePoster,
    wheel: wheelPoster,
    snakes: snakesPoster,
    rps: rpsPoster,
    fallback: fallbackPoster,
  };

  return posters[name];
}

export default Games;