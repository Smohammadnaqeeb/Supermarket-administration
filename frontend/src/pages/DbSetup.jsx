import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { dbSetupApi } from '../api';

export default function DbSetup({ onSetupCompleted }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initLoading, setInitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await dbSetupApi.getStatus();
      if (data) {
        setConfig(data.config || data);
      } else {
        setErrorMsg('Invalid response from server.');
      }
    } catch (e) {
      setErrorMsg('Failed to check database setup status. Backend server may be offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInitialize = async () => {
    setInitLoading(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await dbSetupApi.initialize();
      if (res.success) {
        setMessage(res.message || 'Database tables successfully seeded!');
        // Small delay, then trigger check
        setTimeout(async () => {
          await fetchStatus();
          if (onSetupCompleted) {
            onSetupCompleted();
          }
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Seeding failed. Verify your MySQL server permissions.');
      }
    } catch (e) {
      setErrorMsg('Error triggering database setup execution.');
    } finally {
      setInitLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <RefreshCw className="spin" size={40} color="#6366f1" style={{ margin: '0 auto 1.5rem auto', display: 'block' }} />
          <h2 style={{ textAlign: 'center' }}>Probing database status...</h2>
        </div>
      </div>
    );
  }

  const isHealthy = config?.responsive;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ ...styles.iconBg, backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
            <Database size={28} color={isHealthy ? '#10b981' : '#ef4444'} />
          </div>
          <div>
            <h1 style={styles.title}>Database Setup Panel</h1>
            <p style={styles.subtitle}>Supermarket Billing Diagnostics</p>
          </div>
        </div>

        {errorMsg && (
          <div style={styles.alertError}>
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {message && (
          <div style={styles.alertSuccess}>
            <CheckCircle size={20} />
            <span>{message}</span>
          </div>
        )}

        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Database Server Host</span>
            <span style={styles.infoVal}>{config?.host || 'localhost'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Port</span>
            <span style={styles.infoVal}>{config?.port || '3306'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Database Name</span>
            <span style={styles.infoVal}>{config?.database || 'supermarket_db'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Username</span>
            <span style={styles.infoVal}>{config?.user || 'root'}</span>
          </div>
        </div>

        <div style={{
          ...styles.statusBanner,
          backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          borderColor: isHealthy ? '#10b981' : '#f59e0b',
          color: isHealthy ? '#10b981' : '#f59e0b'
        }}>
          {isHealthy ? (
            <>
              <CheckCircle size={20} />
              <div style={{ flex: 1 }}>
                <strong>Connection OK!</strong> The application is connected to the MySQL database server, and tables are populated.
              </div>
            </>
          ) : (
            <>
              <ShieldAlert size={20} />
              <div style={{ flex: 1 }}>
                <strong>Offline / Seed Required!</strong> Could not query database. Make sure MySQL is running and click below to initialize schemas.
              </div>
            </>
          )}
        </div>

        {config?.error && (
          <div style={styles.errorLog}>
            <h4 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Error Log Detail:</h4>
            <code>{config.error}</code>
          </div>
        )}

        <div style={styles.btnRow}>
          <button 
            onClick={fetchStatus} 
            style={{ ...styles.btn, backgroundColor: '#1b2640', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
            disabled={initLoading}
          >
            <RefreshCw size={18} className={initLoading ? '' : ''} />
            <span>Test Connection</span>
          </button>

          <button 
            onClick={handleInitialize} 
            style={{ ...styles.btn, backgroundColor: '#6366f1', color: '#fff' }}
            disabled={initLoading}
          >
            {initLoading ? (
              <>
                <RefreshCw size={18} className="spin" />
                <span>Initializing Database...</span>
              </>
            ) : (
              <>
                <Database size={18} />
                <span>Run Setup & Seed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0f19',
    backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0, transparent 50%)',
    padding: '2rem 1rem',
  },
  card: {
    width: '100%',
    maxWidth: '550px',
    backgroundColor: '#131c2e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
  },
  iconBg: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#fff',
    fontFamily: "'Outfit', sans-serif",
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  infoItem: {
    backgroundColor: '#1b2640',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  infoLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoVal: {
    fontSize: '0.95rem',
    color: '#f8fafc',
    fontWeight: '500',
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '0.9rem',
    lineHeight: '1.4',
    marginBottom: '1.5rem',
  },
  errorLog: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.12)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    maxHeight: '120px',
    overflowY: 'auto',
  },
  btnRow: {
    display: 'flex',
    gap: '1rem',
  },
  btn: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.15s ease',
  },
  alertError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  alertSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
};
