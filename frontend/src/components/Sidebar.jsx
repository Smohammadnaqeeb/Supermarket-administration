import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Boxes, 
  History, 
  BarChart3, 
  LogOut, 
  User 
} from 'lucide-react';
import { authApi } from '../api';

export default function Sidebar({ currentPage, setCurrentPage, user }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier'] },
    { id: 'billing', name: 'Billing Counter', icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { id: 'products', name: 'Products Catalog', icon: Package, roles: ['admin', 'cashier'] },
    { id: 'categories', name: 'Categories', icon: Tags, roles: ['admin', 'cashier'] },
    { id: 'inventory', name: 'Inventory Alerts', icon: Boxes, roles: ['admin', 'cashier'] },
    { id: 'history', name: 'Billing History', icon: History, roles: ['admin', 'cashier'] },
    { id: 'analytics', name: 'Analytics Reports', icon: BarChart3, roles: ['admin'] },
  ];

  const handleLogout = () => {
    authApi.logout();
  };

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <ShoppingCart size={24} color="#fff" />
        </div>
        <div>
          <h1 style={styles.logoText}>QuickCart</h1>
          <span style={styles.logoSubText}>Billing Suite</span>
        </div>
      </div>

      <nav style={styles.nav}>
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <Icon size={20} style={isActive ? styles.navIconActive : styles.navIcon} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.userFooter}>
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            <User size={18} color="#94a3b8" />
          </div>
          <div>
            <div style={styles.userName}>{user?.full_name}</div>
            <div style={styles.userRole}>{user?.role?.toUpperCase()}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#131c2e',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
  logoContainer: {
    padding: '2rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#6366f1',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#fff',
    fontFamily: "'Outfit', sans-serif",
  },
  logoSubText: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    display: 'block',
    marginTop: '-2px',
  },
  nav: {
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: '#94a3b8',
    textAlign: 'left',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    color: '#fff',
    fontWeight: '600',
  },
  navIcon: {
    color: '#64748b',
    transition: 'color 0.15s ease',
  },
  navIconActive: {
    color: '#6366f1',
  },
  userFooter: {
    padding: '1.5rem 1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    backgroundColor: '#1b2640',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f8fafc',
  },
  userRole: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: '0.05em',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.6rem',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '6px',
    color: '#ef4444',
    fontWeight: '600',
    fontSize: '0.875rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease',
  },
};
