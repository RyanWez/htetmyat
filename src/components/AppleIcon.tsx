import Image from 'next/image';
import styles from './AppleIcon.module.css';

interface AppleIconProps {
  className?: string;
}

export default function AppleIcon({ className = '' }: AppleIconProps) {
  return (
    <span className={`${styles.iconWrapper} ${className}`}>
      <img src="/images/apple-dark.png" alt="Apple" className={styles.lightIcon} />
      <img src="/images/apple-light.png" alt="Apple" className={styles.darkIcon} />
    </span>
  );
}
