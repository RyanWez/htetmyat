'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';
import { uploadAdminAvatar } from '@/app/admin/avatar-actions';
import Image from 'next/image';

interface AvatarUploadProps {
  currentUrl?: string | null;
  size?: number;
  showLabel?: boolean;
}

export default function AvatarUpload({ currentUrl, size = 140, showLabel = true }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local Preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Start Upload
    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await uploadAdminAvatar(formData);
      if (res.success && res.url) {
        setPreview(res.url);
        toast.success('✨ Profile Updated', 'သင့် Avatar ပုံကို အောင်မြင်စွာ Update လုပ်လိုက်ပါပြီ။');
      } else {
        toast.error('Upload Failed', res.error || 'စနစ်ချို့ယွင်းမှုတစ်ခု ဖြစ်ပေါ်နေပါတယ်။');
        setPreview(currentUrl || null); // Revert to old one
      }
    } catch {
      toast.error('Error', 'ပုံတင်ရာတွင် အမှားအယွင်းရှိနေပါသည်။');
      setPreview(currentUrl || null);
    } finally {
      setIsUploading(false);
      // Clean up revokeUrl
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div className="avatar-upload-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: showLabel ? '1.5rem' : '0' }}>
      <div style={{ position: 'relative' }}>
        <motion.div 
          className="avatar-preview-box"
          whileHover={{ scale: 1.05 }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            border: showLabel ? '4px solid var(--brand-primary)' : 'none',
            background: 'var(--bg-elevated)',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: showLabel ? '0 15px 35px -10px var(--brand-glow)' : 'none',
          }}
        >
          {preview ? (
            <Image 
              src={preview} 
              alt="Avatar" 
              fill
              sizes="(max-width: 768px) 100vw, 150px"
              priority
              unoptimized={preview.toLowerCase().includes('.gif')}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: size / 3, fontWeight: 800 }}>
              {currentUrl ? '' : '👤'}
            </div>
          )}

          <AnimatePresence>
            {isUploading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <div className="spinner" style={{ width: size / 4, height: size / 4, borderColor: 'white', borderRightColor: 'transparent' }} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(147, 51, 234, 0.8)',
            color: 'white',
            fontSize: size / 12,
            padding: '4px 0',
            textAlign: 'center',
            fontWeight: 800,
            letterSpacing: '0.05em',
            backdropFilter: 'blur(4px)',
            opacity: isUploading ? 0 : 0.9
          }}>
            CHANGE
          </div>
        </motion.div>
      </div>

      {showLabel && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Admin Avatar</h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Supports GIF, JPG, PNG & WebP (Max 5MB)
          </p>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
      
      <style jsx>{`
        .spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-right-color: white;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
