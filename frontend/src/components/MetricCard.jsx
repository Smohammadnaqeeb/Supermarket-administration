import React from 'react';

export default function MetricCard({ title, value, icon: Icon, color, subtext }) {
  const colorMap = {
    indigo: { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.2)', text: '#6366f1' },
    emerald: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
    amber: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
    rose: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-card" style={styles.card}>
      <div style={styles.content}>
        <div>
          <span style={styles.title}>{title}</span>
          <div style={styles.value}>{value}</div>
          {subtext && <div style={styles.subtext}>{subtext}</div>}
        </div>
        <div 
          style={{
            ...styles.iconContainer,
            backgroundColor: selectedColor.bg,
            border: `1px solid ${selectedColor.border}`,
          }}
        >
          <Icon size={24} color={selectedColor.text} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    padding: '1.25rem 1.5rem',
    minHeight: '110px',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#fff',
    marginTop: '0.25rem',
    fontFamily: "'Outfit', sans-serif",
  },
  subtext: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
