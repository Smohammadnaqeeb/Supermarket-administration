import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, FileText, Printer, ArrowLeft, X, Eye } from 'lucide-react';
import { reportsApi, billingApi } from '../api';
import Receipt from './Receipt';

export default function History({ selectedBillId, setSelectedBillId }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search Filters
  const [billNumber, setBillNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('all');

  // Details panel state
  const [activeBill, setActiveBill] = useState(null);
  const [activeItems, setActiveItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Standalone printable receipt state
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptBillId, setReceiptBillId] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await reportsApi.getHistory({
        bill_number: billNumber,
        start_date: startDate,
        end_date: endDate,
        payment_mode: paymentMode
      });
      if (res) {
        setBills(res);
      } else {
        setErrorMsg('Failed to fetch transaction history.');
      }
    } catch (e) {
      setErrorMsg('Network error fetching history ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [paymentMode]); // Reload on payment mode change

  // Check if we were redirected from billing checkout with a preselected bill ID
  useEffect(() => {
    if (selectedBillId) {
      handleViewDetails(selectedBillId);
      // Clean up after loading
      setSelectedBillId(null);
    }
  }, [selectedBillId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadHistory();
  };

  const handleViewDetails = async (id) => {
    setDetailLoading(true);
    setErrorMsg('');
    try {
      const res = await reportsApi.getBillDetails(id);
      if (res && res.bill) {
        setActiveBill(res.bill);
        setActiveItems(res.items || []);
        setShowDetailModal(true);
      } else {
        setErrorMsg('Could not retrieve bill specifications.');
      }
    } catch (err) {
      setErrorMsg('Error loading bill details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrintReceipt = (id) => {
    setReceiptBillId(id);
    setShowReceipt(true);
  };

  const handleClearFilters = () => {
    setBillNumber('');
    setStartDate('');
    setEndDate('');
    setPaymentMode('all');
    // Reload directly after clear
    setTimeout(loadHistory, 50);
  };

  if (showReceipt) {
    return (
      <Receipt 
        billId={receiptBillId} 
        onBack={() => {
          setShowReceipt(false);
          setReceiptBillId(null);
          loadHistory();
        }} 
      />
    );
  }

  return (
    <div>
      {errorMsg && (
        <div style={styles.alertError}>{errorMsg}</div>
      )}

      {/* Header Actions */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.headerTitle}>Billing Ledger</h3>
          <p style={styles.headerSubtitle}>Audit historic transaction details, totals, and receipts</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={styles.filtersBar}>
        <form onSubmit={handleSearchSubmit} style={styles.filterForm}>
          <div style={{ ...styles.inputIconWrapper, flex: 1.2 }}>
            <Search size={16} style={styles.fieldIcon} />
            <input
              type="text"
              className="form-control"
              placeholder="Search Invoice Number..."
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              style={styles.fieldInput}
            />
          </div>

          <div style={{ ...styles.inputIconWrapper, flex: 1 }}>
            <Calendar size={16} style={styles.fieldIcon} />
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ ...styles.fieldInput, color: startDate ? '#fff' : '#64748b' }}
              title="Start Date"
            />
          </div>

          <div style={{ ...styles.inputIconWrapper, flex: 1 }}>
            <Calendar size={16} style={styles.fieldIcon} />
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ ...styles.fieldInput, color: endDate ? '#fff' : '#64748b' }}
              title="End Date"
            />
          </div>

          <div style={{ ...styles.inputIconWrapper, flex: 1 }}>
            <Filter size={16} style={styles.fieldIcon} />
            <select
              className="form-control"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              style={{ ...styles.fieldInput, paddingRight: '1rem' }}
            >
              <option value="all">All Payments</option>
              <option value="Cash">Cash Only</option>
              <option value="UPI">UPI Only</option>
              <option value="Card">Card Only</option>
            </select>
          </div>

          <div style={styles.btnRow}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
              Filter
            </button>
            <button 
              type="button" 
              onClick={handleClearFilters} 
              className="btn btn-secondary" 
              style={{ padding: '0.6rem 1.2rem' }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="glass-card">
        {loading ? (
          <div style={styles.loading}>Accessing transaction ledger...</div>
        ) : bills.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date & Time</th>
                  <th>Customer Name</th>
                  <th>Cashier</th>
                  <th>Payment</th>
                  <th>Grand Total</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ fontWeight: '700', color: '#6366f1', fontFamily: 'monospace' }}>{bill.bill_number}</td>
                    <td style={{ color: '#94a3b8' }}>
                      {bill.created_at ? new Date(bill.created_at).toLocaleString('en-IN') : '-'}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{bill.customer_name}</div>
                      {bill.customer_phone && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{bill.customer_phone}</span>}
                    </td>
                    <td style={{ color: '#94a3b8' }}>{bill.cashier_name || 'System User'}</td>
                    <td>
                      <span className="badge badge-success">
                        {bill.payment_mode}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>₹{parseFloat(bill.grand_total).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={styles.btnGroup}>
                        <button 
                          onClick={() => handleViewDetails(bill.id)} 
                          style={styles.actionBtn}
                          title="View Invoice Items"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => handlePrintReceipt(bill.id)} 
                          style={{ ...styles.actionBtn, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.15)' }}
                          title="Print Thermal Receipt"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.empty}>No transaction records match the filter query.</div>
        )}
      </div>

      {/* Bill Details Modal */}
      {showDetailModal && activeBill && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', padding: '2rem' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Invoice Specifications</h3>
                <span style={{ fontSize: '0.8rem', color: '#6366f1', fontFamily: 'monospace', fontWeight: '600' }}>{activeBill.bill_number}</span>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Summary Metadata */}
              <div style={styles.metadataGrid}>
                <div>
                  <span style={styles.metaLabel}>Customer</span>
                  <div style={styles.metaVal}>{activeBill.customer_name}</div>
                  {activeBill.customer_phone && <span style={styles.metaPhone}>{activeBill.customer_phone}</span>}
                </div>
                <div>
                  <span style={styles.metaLabel}>Date & Time</span>
                  <div style={styles.metaVal}>{new Date(activeBill.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>Cashier Operator</span>
                  <div style={styles.metaVal}>{activeBill.cashier_name || 'System Operator'}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>Payment Mode</span>
                  <div style={styles.metaVal}>{activeBill.payment_mode}</div>
                </div>
              </div>

              {/* Items Grid */}
              <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: '1.5rem 0 0.5rem 0', fontFamily: "'Outfit', sans-serif" }}>Sold Items Breakdown</h4>
              <div style={styles.modalTableContainer}>
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Rate</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th>GST %</th>
                      <th>Tax (₹)</th>
                      <th style={{ textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '500', color: '#fff' }}>{item.product_name}</td>
                        <td>₹{parseFloat(item.price).toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td>{parseFloat(item.gst_percent)}%</td>
                        <td>₹{parseFloat(item.gst_amount).toFixed(2)}</td>
                        <td style={{ fontWeight: '600', textAlign: 'right' }}>₹{parseFloat(item.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div style={styles.totalsBrief}>
                <div style={styles.totalRow}>
                  <span>Subtotal (Net Price)</span>
                  <span>₹{parseFloat(activeBill.subtotal).toFixed(2)}</span>
                </div>
                <div style={styles.totalRow}>
                  <span>GST Taxes</span>
                  <span>+₹{parseFloat(activeBill.gst_amount).toFixed(2)}</span>
                </div>
                {parseFloat(activeBill.discount) > 0 && (
                  <div style={{ ...styles.totalRow, color: '#ef4444' }}>
                    <span>Store Discount</span>
                    <span>-₹{parseFloat(activeBill.discount).toFixed(2)}</span>
                  </div>
                )}
                <div style={styles.divider} />
                <div style={styles.grandTotalRow}>
                  <span>GRAND TOTAL</span>
                  <span style={{ color: '#10b981', fontSize: '1.3rem', fontWeight: '700' }}>
                    ₹{parseFloat(activeBill.grand_total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button 
                onClick={() => handlePrintReceipt(activeBill.id)} 
                className="btn btn-success"
              >
                <Printer size={16} />
                <span>Thermal Receipt Print</span>
              </button>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
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
    padding: '1rem',
    marginBottom: '1.5rem',
  },
  filterForm: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inputIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  fieldIcon: {
    position: 'absolute',
    left: '0.75rem',
    color: '#64748b',
    pointerEvents: 'none',
  },
  fieldInput: {
    paddingLeft: '2.25rem',
  },
  btnRow: {
    display: 'flex',
    gap: '0.5rem',
    marginLeft: 'auto',
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
  btnGroup: {
    display: 'inline-flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: '6px',
    color: '#6366f1',
    padding: '0.45rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
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
    cursor: 'pointer',
  },
  modalBody: {
    marginTop: '1.25rem',
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '1rem',
    backgroundColor: '#1b2640',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  metaLabel: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#fff',
    marginTop: '0.1rem',
  },
  metaPhone: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    display: 'block',
  },
  modalTableContainer: {
    maxHeight: '220px',
    overflowY: 'auto',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '6px',
  },
  totalsBrief: {
    marginTop: '1.25rem',
    backgroundColor: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxWidth: '300px',
    marginLeft: 'auto',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  grandTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '700',
    color: '#fff',
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
};
