'use client';

import { useState } from 'react';
import { updateNameTheme } from '@/app/admin/settings/actions';
import { useToast } from '@/components/ui/Toast';

const themes = [
  { id: 'none', label: 'None', class: '' },
  { id: 'neon', label: 'Neon Glow (Cyan)', class: 'name-theme-neon' },
  { id: 'matrix', label: 'Matrix Digital (Green)', class: 'name-theme-matrix' },
  { id: 'matrix-blue', label: 'Matrix Digital (Blue)', class: 'name-theme-matrix-blue' },
  { id: 'glitch', label: 'Digital Glitch (White)', class: 'name-theme-glitch' },
  { id: 'gold', label: 'Golden Sparkle (Premium)', class: 'name-theme-gold' },
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
    <div style={{ width: '100%', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
        Name Theme Preview
      </h3>
      
      {/* Preview Box */}
      <div style={{ 
        padding: '2rem', 
        background: 'var(--bg-inset)', 
        borderRadius: 'var(--radius-xl)', 
        border: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem',
        minHeight: '100px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <span className={`name-theme-${selectedTheme}`} style={{ 
          fontSize: '1.75rem', 
          fontWeight: 800,
          color: selectedTheme === 'none' ? 'var(--text-primary)' : undefined,
          transition: 'all 0.3s ease'
        }}>
          {selectedTheme === 'none' ? 'Default Name' : 'Premium Preview'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            style={{
              padding: '14px 20px',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid',
              borderColor: selectedTheme === theme.id ? 'var(--brand-primary)' : 'var(--border-default)',
              background: selectedTheme === theme.id ? 'var(--brand-light)' : 'var(--bg-surface-solid)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{theme.label}</span>
            {selectedTheme === theme.id && <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>✓</span>}
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!isChanged || isUpdating}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '1rem',
          opacity: isChanged ? 1 : 0.5,
          cursor: (!isChanged || isUpdating) ? 'not-allowed' : 'pointer'
        }}
      >
        {isUpdating ? 'Saving Theme...' : isChanged ? 'Apply Changes' : 'Choose a new theme'}
      </button>
      
      <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>
        Choose a theme to see the preview. Click <strong>Apply Changes</strong> to save it to your profile.
      </p>
    </div>
  );
}

