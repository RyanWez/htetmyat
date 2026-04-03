import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>◉</span>
            <span>HMA</span>
          </Link>
          <p className={styles.tagline}>Free Apple IDs, Managed & Updated Daily</p>
        </div>

        <div className={styles.links}>
          <div className={styles.linkGroup}>
            <h4 className={styles.linkTitle}>Navigate</h4>
            <Link href="/" className={styles.link}>Home</Link>
            <Link href="/apple-ids" className={styles.link}>Apple IDs</Link>
            <Link href="/blog" className={styles.link}>Blog</Link>
          </div>
          <div className={styles.linkGroup}>
            <h4 className={styles.linkTitle}>Connect</h4>
            <a href="https://t.me/H_M_A_2026" target="_blank" rel="noopener noreferrer" className={styles.link}>
              Telegram
            </a>
            <a href="https://www.facebook.com/share/1HLJjkapJ8/" target="_blank" rel="noopener noreferrer" className={styles.link}>
              Facebook
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <p>© {new Date().getFullYear()} HMA — All rights reserved.</p>
          <div className={styles.devCredit}>
            <span className={styles.devText}>Developed by</span>
            <a 
              href="https://ryanwez.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.devLink}
            >
              Ryan Wez
              <span className={styles.devHeart}>❤️</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
