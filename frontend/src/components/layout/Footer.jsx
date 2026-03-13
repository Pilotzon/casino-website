import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.section}>
          <p className={styles.warning}>
            Virtual Credits Only - No Real Money
          </p>
          <p className={styles.disclaimer}>
            This platform is for entertainment purposes only. All credits are virtual and have no real-world value.
          </p>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.info}>
          <p>Casino Platform &copy; {new Date().getFullYear()}</p>
          <p className={styles.version}>v1.5.2</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;