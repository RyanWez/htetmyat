'use client';

import { useEffect, useState } from 'react';
import styles from './InstallPromptDialog.module.css';

interface InstallPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallPromptDialog({ isOpen, onClose }: InstallPromptDialogProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Deriving state from props during render (React recommended pattern)
  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Professional, staggered Apple-like entrance
      const t1 = setTimeout(() => setAnimatedProgress(1), 600);
      const t2 = setTimeout(() => setAnimatedProgress(2), 1200);
      const t3 = setTimeout(() => setAnimatedProgress(3), 1800);
      const t4 = setTimeout(() => setAnimatedProgress(4), 2400);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else {
      document.body.style.overflow = '';
      const t0 = setTimeout(() => setAnimatedProgress(0), 0);
      // Sync exit animation length with CSS before unmounting
      const t = setTimeout(() => setShouldRender(false), 500);
      return () => {
        clearTimeout(t0);
        clearTimeout(t);
      };
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.fadeIn : styles.fadeOut}`}>
      <div 
        className={`${styles.dialog} ${isOpen ? styles.slideUp : styles.slideDown}`} 
      >
        <div className={styles.glowBg} />
        
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>

        <div className={styles.content}>
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </div>
                <h2 className={styles.title}>App Install လုပ်နည်း</h2>
                <p className={styles.subtitle}>
                    ဒီ Web App ကို ဖုန်းထဲမှာ Native App လို တိုက်ရိုက် သုံးနိုင်ဖို့အတွက် အောက်ပါအတိုင်း အဆင့်ဆင့် လုပ်ဆောင်ပါ။
                </p>
            </div>

            <div className={styles.stepsContainer}>
                <div className={styles.stepLine}>
                    <div className={styles.stepLineFill} style={{ height: `${(animatedProgress / 4) * 100}%` }} />
                </div>

                <div className={`${styles.step} ${animatedProgress >= 1 ? styles.stepActive : ''}`}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepText}>
                        Search Bar ညာဘက်နားမှာရှိတဲ့ <span>အစက်သုံးစက် (⋮)</span> ကို နှိပ်ပါ။
                    </div>
                </div>

                <div className={`${styles.step} ${animatedProgress >= 2 ? styles.stepActive : ''}`}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepText}>
                        <span>Share</span> Icon လေးကို ထပ်နှိပ်ပေးပါ။
                    </div>
                </div>

                <div className={`${styles.step} ${animatedProgress >= 3 ? styles.stepActive : ''}`}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepText}>
                        အောက်ကို ဆွဲချပြီး <span>View More</span> လေးကို နှိပ်ပါ။
                    </div>
                </div>

                <div className={`${styles.step} ${animatedProgress >= 4 ? styles.stepActive : ''}`}>
                    <div className={styles.stepNumber}>4</div>
                    <div className={styles.stepText}>
                        နောက်ဆုံးအနေနဲ့ <span>Add to Home Screen</span> ကို နှိပ်ပြီး <span>Add</span> ကို ထပ်နှိပ်ရင် ရပါပြီ! 🎉
                    </div>
                </div>
            </div>

            <button className={`${styles.doneBtn} ${animatedProgress >= 4 ? styles.doneBtnActive : ''}`} onClick={onClose}>
                 သဘောပေါက်ပါပြီ!
            </button>
        </div>
      </div>
    </div>
  );
}
