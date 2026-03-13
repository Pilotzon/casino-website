import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Button from "../components/common/Button";
import styles from "./Home.module.css";

function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const canBypassDisabled = user?.role === "owner" || Boolean(user?.can_bypass_disabled);

  const [pages, setPages] = useState([]);
  const [pagesLoaded, setPagesLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await api.get("/pages");
        if (!mounted) return;
        setPages(res.data?.data ?? []);
      } catch (e) {
        console.warn("Failed to load pages:", e);
        if (!mounted) return;
        setPages([]);
      } finally {
        if (mounted) setPagesLoaded(true);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const pageMap = useMemo(() => {
    const m = new Map();
    pages.forEach((p) => m.set(p.page_key, p));
    return m;
  }, [pages]);

  const isPageEnabled = (key) => {
    const p = pageMap.get(key);
    if (!p) return true; // fail-open if not loaded
    if (p.is_enabled) return true;
    return canBypassDisabled;
  };

  const disabledReason = (key) => {
    const p = pageMap.get(key);
    if (!p) return "";
    if (p.is_enabled) return "";
    return canBypassDisabled ? "Disabled (bypass allowed)" : "Unavailable";
  };

  const dashboardAllowed = isPageEnabled("dashboard");
  const gamesAllowed = isPageEnabled("games");

  return (
    <div className={styles.home}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            The Friend group's <span className={styles.highlight}>Private</span> Casino
          </h1>
          <p className={styles.subtitle}>This casino uses Virtual Credtis instead of real money.</p>

          {isAuthenticated ? (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>YOUR BALANCE</span>
                <span className={styles.statValue}>
                  {Number(user?.balance ?? 0).toFixed(2)}{" "}
                  <span className={styles.currency}>₿</span>
                </span>
              </div>

              <div className={styles.actions}>
                {/* Games */}
                <button
                  type="button"
                  className={`${styles.actionBtnWrap} ${gamesAllowed ? "" : styles.actionBtnDisabled}`}
                  onClick={() => {
                    if (!gamesAllowed) return;
                    navigate("/games");
                  }}
                  title={!gamesAllowed ? disabledReason("games") || "Unavailable" : "Start Playing"}
                  aria-disabled={!gamesAllowed}
                >
                  <Button size="lg">Start Playing</Button>
                  {!gamesAllowed && <span className={styles.unavailablePill}>Unavailable</span>}
                </button>

                {/* Dashboard */}
                <button
                  type="button"
                  className={`${styles.actionBtnWrap} ${dashboardAllowed ? "" : styles.actionBtnDisabled}`}
                  onClick={() => {
                    if (!dashboardAllowed) return;
                    navigate("/dashboard");
                  }}
                  title={!dashboardAllowed ? disabledReason("dashboard") || "Unavailable" : "Dashboard"}
                  aria-disabled={!dashboardAllowed}
                >
                  <Button variant="secondary" size="lg">
                    Dashboard
                  </Button>
                  {!dashboardAllowed && <span className={styles.unavailablePill}>Unavailable</span>}
                </button>
              </div>

              {!pagesLoaded && <div className={styles.pagesNote}>Loading availability…</div>}
            </div>
          ) : (
            <div className={styles.welcome}>
              <p className={styles.welcomeText}>
                New users receive automatically <strong>100 ₿</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

            <div className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>What do we Feature?</h2>
          <div className={styles.grid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Instant Gameplay</h3>
              <p className={styles.featureText}>
                We ensure that gameplay is very responsive and fast.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM5.636 4.136a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.061 1.06l-1.591-1.59a.75.75 0 010-1.061zm12.728 0a.75.75 0 010 1.06l-1.591 1.592a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.061 0zm-6.816 4.496a.75.75 0 01.82.311l5.228 7.917a.75.75 0 01-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 01-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 01-1.247-.606l.569-9.47a.75.75 0 01.554-.68zM3 10.5a.75.75 0 01.75-.75H6a.75.75 0 010 1.5H3.75A.75.75 0 013 10.5zm14.25 0a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H18a.75.75 0 01-.75-.75zm-8.962 3.712a.75.75 0 010 1.061l-1.591 1.591a.75.75 0 11-1.061-1.06l1.591-1.592a.75.75 0 011.06 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Coolest Games</h3>
              <p className={styles.featureText}>
                Flip, Dice, Limbo, Mines, Roulette, Blackjack, and more!
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M15 3.75a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.06l-4.72 4.72a.75.75 0 11-1.06-1.06l4.72-4.72h-2.69a.75.75 0 01-.75-.75zM3.75 15a.75.75 0 01.75.75v2.69l4.72-4.72a.75.75 0 111.06 1.06l-4.72 4.72h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 01.75-.75z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Stock Market Betting</h3>
              <p className={styles.featureText}>
                Bet on real stock prices with live market data!
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd"/>
                  <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Custom Bets</h3>
              <p className={styles.featureText}>
                Create and resolve custom bets with friends!
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Live Statistics</h3>
              <p className={styles.featureText}>
                Track your performance with real-time analytics.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Provably Fair</h3>
              <p className={styles.featureText}>
                Cryptographically secure RNG with verifiable outcomes.
              </p>
            </div>
          </div>
        </div>
      </div>




    </div>
  );
}

export default Home;