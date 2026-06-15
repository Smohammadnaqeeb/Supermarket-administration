import React, { useState, useEffect } from 'react';
import { Bell, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { dbSetupApi, dashboardApi } from '../api';

export default function Navbar({ pageTitle, setCurrentPage }) {
  const [dbHealthy, setDbHealthy] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);

  const checkStatus = async () => {
    try {
      const dbRes = await dbSetupApi.getStatus();
      setDbHealthy(dbRes.success && dbRes.responsive);
      
      // Update low stock alerts if authenticated
      if (localStorage.getItem('token')) {
        const metricsRes = await dashboardApi.getMetrics();
        if (metricsRes.success && metricsRes.metrics) {
          setLowStockCount(metricsRes.metrics.low_stock_count);
        }
      }
    } catch (e) {
      setDbHealthy(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={styles.navbar}>
      <h2 style={styles.pageTitle}>{pageTitle}</h2>

      <div style={styles.actionContainer}>
        {/* DB Status Widget */}
        <div 
          style={{
            ...styles.statusWidget,
            backgroundColor: dbHealthy ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: dbHealthy ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
            color: dbHealthy ? '#10b981' : '#ef4444',
          }}
          title={dbHealthy ? "Database responsive" : "Database server connection failure"}
        >
          {dbHealthy ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span style={styles.statusText}>{dbHealthy ? 'DB Connected' : 'DB Disconnected'}</span>
        </div>

        {/* Alerts Notification Bell */}
        <div 
          onClick={() => lowStockCount > 0 && setCurrentPage('inventory')}
          style={{
            ...styles.alertBell,
            cursor: lowStockCount > 0 ? 'pointer' : 'default',
          }}
        >
          <Bell size={20} color="#94a3b8" />
          {lowStockCount > 0 && (
            <span style={styles.alertBadge}>{lowStockCount}</span>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    marginBottom: '2rem',
  },
  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#fff',
    fontFamily: "'Outfit', sans-serif",
  },
  actionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statusWidget: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  statusText: {
    fontSize: '0.8rem',
  },
  alertBell: {
    position: 'relative',
    padding: '0.5rem',
    backgroundColor: '#131c2e',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: '700',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
  },
};
