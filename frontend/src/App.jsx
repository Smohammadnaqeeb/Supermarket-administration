import React, { useState, useEffect } from 'react';
import { dbSetupApi, authApi } from './api';

// Layout components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page components
import DbSetup from './pages/DbSetup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import History from './pages/History';
import Analytics from './pages/Analytics';

export default function App() {
  const [user, setUser] = useState(null);
  const [dbHealthy, setDbHealthy] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedBillId, setSelectedBillId] = useState(null);

  // Check database viability on mount
  const checkDatabaseStatus = async () => {
    try {
      const res = await dbSetupApi.getStatus();
      const healthy = res && res.success && res.responsive;
      setDbHealthy(healthy);
      
      // If healthy, check local authentication details
      if (healthy) {
        const storedUser = authApi.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } else {
        setCurrentPage('db-setup');
      }
    } catch (e) {
      setDbHealthy(false);
      setCurrentPage('db-setup');
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();

    // Listen to global authorization failures (expired tokens)
    const handleAuthChange = () => {
      setUser(null);
      setCurrentPage('dashboard');
    };

    window.addEventListener('auth-status-change', handleAuthChange);
    return () => window.removeEventListener('auth-status-change', handleAuthChange);
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setCurrentPage('dashboard');
  };

  const handleSetupCompleted = () => {
    setDbHealthy(true);
    // Refresh connection status details
    checkDatabaseStatus();
  };

  // Render Loading Shield
  if (dbLoading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} className="spin" />
        <span style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.95rem' }}>
          Initializing QuickCart Billing Suite...
        </span>
      </div>
    );
  }

  // Case 1: Database Setup Required
  if (!dbHealthy) {
    return <DbSetup onSetupCompleted={handleSetupCompleted} />;
  }

  // Case 2: User Authentication Required
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Case 3: Fully Authenticated Application Layout
  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} setSelectedBillId={setSelectedBillId} />;
      case 'billing':
        return <Billing setCurrentPage={setCurrentPage} setSelectedBillId={setSelectedBillId} />;
      case 'products':
        return <Products user={user} />;
      case 'categories':
        return <Categories user={user} />;
      case 'inventory':
        return <Inventory />;
      case 'history':
        return <History selectedBillId={selectedBillId} setSelectedBillId={setSelectedBillId} />;
      case 'analytics':
        return user.role === 'admin' ? <Analytics /> : <Dashboard setCurrentPage={setCurrentPage} setSelectedBillId={setSelectedBillId} />;
      case 'db-setup':
        return <DbSetup onSetupCompleted={handleSetupCompleted} />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} setSelectedBillId={setSelectedBillId} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard Overview';
      case 'billing': return 'Point of Sale (POS) Desk';
      case 'products': return 'Inventory Catalog';
      case 'categories': return 'Product Classifications';
      case 'inventory': return 'Stock Threshold Alerts';
      case 'history': return 'Historic Invoices';
      case 'analytics': return 'Store Performance Analytics';
      case 'db-setup': return 'Database Diagnostics';
      default: return 'QuickCart Supermarket';
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        user={user} 
      />
      <main className="main-content">
        <Navbar 
          pageTitle={getPageTitle()} 
          setCurrentPage={setCurrentPage}
        />
        {renderActivePage()}
      </main>
    </div>
  );
}

const styles = {
  loadingScreen: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0f19',
    backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0, transparent 50%)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(99, 102, 241, 0.1)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
  },
};
