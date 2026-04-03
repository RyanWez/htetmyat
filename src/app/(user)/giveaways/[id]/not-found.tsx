import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: '20px'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.8 }}>🚧</div>
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#f1f5f9' }}>
        Giveaway Not Found
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '450px', marginBottom: '32px', lineHeight: 1.6 }}>
        It looks like this premium giveaway has been deleted, expired, or never existed in the first place. Please check the URL or return to the main page.
      </p>
      <Link 
        href="/giveaways" 
        style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
          color: 'white',
          padding: '14px 28px',
          borderRadius: '100px',
          fontWeight: '600',
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>&larr;</span> Back to Giveaways
      </Link>
    </div>
  );
}
