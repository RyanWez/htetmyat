'use client';

import { useState } from 'react';
import { updateNameTheme } from '@/app/admin/settings/actions';
import { useToast } from '@/components/ui/Toast';

const themes = [
  { id: 'none', label: 'None', class: '' },
  { id: 'neon', label: 'Neon Glow (Cyan)', class: 'name-theme-neon' },
  { id: 'matrix', label: 'Matrix Digital (Green)', class: 'name-theme-matrix' },
  { id: 'glitch', label: 'Digital Glitch (White)', class: 'name-theme-glitch' },
  { id: 'gold', label: 'Golden Sparkle (Premium)', class: 'name-theme-gold' },
];

export default function NameThemeSelector({ currentTheme }: { currentTheme: string }) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || 'none');
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const handleThemeChange = async (theme: string) => {
    setSelectedTheme(theme);
    setIsUpdating(true);
    try {
      await updateNameTheme(theme);
      toast.success('Theme Updated', `Name theme changed to ${theme}!`);
    } catch (err) {
      toast.error('Error', 'Failed to update name theme.');
      setSelectedTheme(currentTheme);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
        Name Theme Preview
      </h3>
      
      {/* Preview Box */}
      <div style={{ 
        padding: '1.5rem', 
        background: 'var(--bg-inset)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        minHeight: '80px'
      }}>
        <span className={`name-theme-${selectedTheme}`} style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700,
          color: selectedTheme === 'none' ? 'var(--text-primary)' : undefined,
          transition: 'all 0.3s ease'
        }}>
          Admin Preview
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
        {themes.map((theme) => (
          <button
            key={theme.id}
            disabled={isUpdating}
            onClick={() => handleThemeChange(theme.id)}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid',
              borderColor: selectedTheme === theme.id ? 'var(--brand-primary)' : 'var(--border-default)',
              background: selectedTheme === theme.id ? 'var(--brand-light)' : 'var(--bg-surface-solid)',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
          >
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{theme.label}</span>
            {selectedTheme === theme.id && <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>✓</span>}
          </button>
        ))}
      </div>
      
      <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        Choosing a theme will affect how your name appears in comment threads.
      </p>
    </div>
  );
}
