import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, ArrowUpRight, AlertTriangle, CheckCircle, Ban, MessageSquare } from 'lucide-react';
import { inventoryApi } from '../api';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Replenishment Modal states
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [addQuantity, setAddQuantity] = useState('50');
  const [remarks, setRemarks] = useState('Stock replenishment update');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await inventoryApi.getInventory({ status: statusFilter, search: searchQuery });
      if (res) {
        setItems(res);
      } else {
        setErrorMsg('Failed to query inventory.');
      }
    } catch (e) {
      setErrorMsg('Network error querying inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInventory();
  };

  const openReplenishModal = (item) => {
    setActiveItem(item);
    setAddQuantity('50');
    setRemarks(`Stock replenishment update for ${item.name}`);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleReplenishSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const qty = parseInt(addQuantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Please enter a valid positive quantity.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await inventoryApi.replenish(activeItem.id, qty, remarks);
      if (res.success) {
        setSuccessMsg(res.message || 'Stock updated successfully.');
        setShowModal(false);
        loadInventory();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.error || 'Failed to update stock.');
      }
    } catch (err) {
      setErrorMsg('Error triggering replenishment.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      {errorMsg && !showModal && (
        <div style={styles.alertError}>{errorMsg}</div>
      )}

      {successMsg && (
        <div style={styles.alertSuccess}>{successMsg}</div>
      )}

      {/* Title */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>Inventory & Stock Alerts</h3>
          <p style={styles.headerSubtitle}>Monitor stock counts and process replenishment orders</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={styles.filtersBar}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <div style={styles.inputSearchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              className="form-control"
              placeholder="Search product inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div style={styles.tabButtons}>
          {[
            { id: 'all', label: 'All Items' },
            { id: 'warning', label: 'Low / Warning' },
            { id: 'low', label: 'Low Stock' },
            { id: 'out', label: 'Out of Stock' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                ...styles.tabBtn,
                ...(statusFilter === tab.id ? styles.tabBtnActive : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card">
        {loading ? (
          <div style={styles.loading}>Accessing stock register...</div>
        ) : items.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Barcode</th>
                  <th>Category</th>
                  <th>In Stock</th>
                  <th>Warning Level</th>
                  <th>Latest Remarks</th>
                  <th>Last Sync</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  let badgeClass = 'badge-success';
                  let status = 'Sufficient';
                  const minLvl = item.min_stock_level !== null ? item.min_stock_level : 10;
                  
                  if (item.quantity === 0) {
                    badgeClass = 'badge-danger';
                    status = 'Out of Stock';
                  } else if (item.quantity <= minLvl) {
                    badgeClass = 'badge-warning';
                    status = 'Low Stock';
                  }

                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{item.name}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{item.barcode}</td>
                      <td>{item.category_name || 'Unassigned'}</td>
                      <td>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.85rem', padding: '0.25rem 0.6rem' }}>
                          {item.quantity} units
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8', fontWeight: '500' }}>{minLvl} units</td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.85rem' }} title={item.remarks}>
                        {item.remarks || '-'}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {item.last_updated ? new Date(item.last_updated).toLocaleString() : 'Never'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => openReplenishModal(item)} 
                          className="btn btn-success" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          <ArrowUpRight size={14} />
                          <span>Replenish</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.empty}>No inventory alerts generated in this bracket.</div>
        )}
      </div>

      {/* Replenish Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Stock Replenishment Desk</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                <RefreshCw size={18} style={{ display: 'none' }} />
                <span>✕</span>
              </button>
            </div>

            {errorMsg && (
              <div style={styles.modalError}>{errorMsg}</div>
            )}

            <form onSubmit={handleReplenishSubmit} style={{ marginTop: '1.5rem' }}>
              <div style={styles.productBrief}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Selected Product</span>
                <h4 style={{ color: '#fff', margin: '0.1rem 0 0.3rem 0', fontFamily: "'Outfit', sans-serif" }}>{activeItem?.name}</h4>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                  <span>Barcode: <strong style={{ color: '#6366f1' }}>{activeItem?.barcode}</strong></span>
                  <span>Active Stock: <strong style={{ color: '#10b981' }}>{activeItem?.quantity} units</strong></span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity to Add</label>
                <input
                  type="number"
                  className="form-control"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Replenishment Audit Comments</label>
                <input
                  type="text"
                  className="form-control"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Received weekly stock delivery"
                  required
                />
              </div>

              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn btn-secondary"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Updating register...' : 'Commit Addition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '1.5rem',
  },
  headerTitle: {
    fontSize: '1.25rem',
    color: '#fff',
    fontFamily: "'Outfit', sans-serif",
  },
  headerSubtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  filtersBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  searchForm: {
    display: 'flex',
    gap: '0.5rem',
    flex: 1,
    minWidth: '280px',
  },
  inputSearchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '0.85rem',
    color: '#64748b',
  },
  searchInput: {
    paddingLeft: '2.25rem',
  },
  tabButtons: {
    display: 'flex',
    backgroundColor: '#1b2640',
    padding: '0.25rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tabBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    backgroundColor: '#131c2e',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  loading: {
    padding: '4rem',
    textAlign: 'center',
    color: '#94a3b8',
  },
  empty: {
    padding: '4rem',
    textAlign: 'center',
    color: '#64748b',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '1rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    color: '#fff',
    fontFamily: "'Outfit', sans-serif",
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '1.25rem',
    cursor: 'pointer',
  },
  productBrief: {
    backgroundColor: '#1b2640',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    marginBottom: '1.25rem',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '1rem',
  },
  alertError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#ef4444',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  alertSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#10b981',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  modalError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    padding: '0.6rem 0.8rem',
    color: '#ef4444',
    fontSize: '0.85rem',
    marginTop: '1rem',
  },
};
