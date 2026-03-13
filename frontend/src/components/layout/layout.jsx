import { useAuth } from '../../context/AuthContext';
import Navigation from './Navigation';
import Footer from './Footer';
import styles from './Layout.module.css';
import GlobalBetSound from "../audio/GlobalBetSound";

function Layout({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loader}>
          <div className={styles.loaderSpinner}></div>
          <p>Loading Casino Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Navigation />
      <GlobalBetSound enabled={true} volume={0.8} />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default Layout;