'use client';

import { useState } from 'react';
import { updateNameTheme } from '@/app/admin/settings/actions';
import { useToast } from '@/components/ui/Toast';
import styles from '@/app/admin/settings/settings.module.css';

const themes = [
  { id: 'none', label: 'Default', class: '' },
  { id: 'neon', label: 'Neon Glow', class: 'name-theme-neon' },
  { id: 'matrix', label: 'Matrix Green', class: 'name-theme-matrix' },
  { id: 'matrix-blue', label: 'Matrix Blue', class: 'name-theme-matrix-blue' },
  { id: 'glitch', label: 'Glitch Effect', class: 'name-theme-glitch' },
  { id: 'gold', label: 'Golden Premium', class: 'name-theme-gold' },
];

export default function NameThemeSelector({ currentTheme }: { currentTheme: string }) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || 'none');
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const isChanged = selectedTheme !== (currentTheme || 'none');

  const handleSave = async () => {
    if (!isChanged) return;
    
    setIsUpdating(true);
    try {
      await updateNameTheme(selectedTheme);
      toast.success('Theme Saved', `Name theme updated successfully!`);
    } catch {
      toast.error('Error', 'Failed to save name theme.');
      setSelectedTheme(currentTheme);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.themeCard}>
      {/* Live Preview Area */}
      <div className={styles.themePreviewArea}>
        <span className={selectedTheme !== 'none' ? `name-theme-${selectedTheme}` : ''} style={{ 
          fontSize: '1.6rem', 
          fontWeight: 800,
          color: selectedTheme === 'none' ? 'var(--text-primary)' : undefined,
          transition: 'all 0.3s ease'
        }}>
          {selectedTheme === 'none' ? 'Your Name' : 'Premium Preview'}
        </span>
      </div>

      {/* Theme Options Grid */}
      <div className={styles.themeSelector}>
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            className={`${styles.themeOption} ${selectedTheme === theme.id ? styles.selected : ''}`}
          >
            <span className={styles.themeOptionLabel}>{theme.label}</span>
            {selectedTheme === theme.id && <span className={styles.themeCheck}>✓</span>}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.themeActions}>
        <button
          onClick={handleSave}
          disabled={!isChanged || isUpdating}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '0.9rem',
            opacity: isChanged ? 1 : 0.5,
            cursor: (!isChanged || isUpdating) ? 'not-allowed' : 'pointer'
          }}
        >
          {isUpdating ? 'Saving...' : isChanged ? 'Apply Theme' : 'Select a theme'}
        </button>
      </div>
    </div>
  );
}
