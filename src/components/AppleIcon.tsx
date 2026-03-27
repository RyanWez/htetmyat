import Image from 'next/image';
import styles from './AppleIcon.module.css';

interface AppleIconProps {
  className?: string;
}

export default function AppleIcon({ className = '' }: AppleIconProps) {
  return (
    <span className={`${styles.iconWrapper} ${className}`}>
      <Image src="/images/apple-dark.png" alt="Apple" width={24} height={24} className={styles.lightIcon} />
      <Image src="/images/apple-light.png" alt="Apple" width={24} height={24} className={styles.darkIcon} />
    </span>
  );
}
