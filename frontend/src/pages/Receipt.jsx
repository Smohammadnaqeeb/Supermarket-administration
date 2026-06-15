import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { billingApi } from '../api';

export default function Receipt({ billId, onBack }) {
  const [bill, setBill] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadReceiptData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await billingApi.getReceipt(billId);
      if (res && res.bill) {
        setBill(res.bill);
        setItems(res.items || []);
      } else {
        setErrorMsg('Receipt data is not available.');
      }
    } catch (e) {
      setErrorMsg('Error contacting API for invoice data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (billId) {
      loadReceiptData();
    }
  }, [billId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <RefreshCw className="spin" size={30} color="#6366f1" />
        <span>Generating print layouts...</span>
      </div>
    );
  }

  if (errorMsg || !bill) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={styles.alertError}>
          <AlertCircle size={20} />
          <span>{errorMsg || 'Failed to render receipt.'}</span>
        </div>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} />
          <span>Return</span>
        </button>
      </div>
    );
  }

  return (
    <div style={styles.outerContainer}>
      {/* Action buttons (hidden during print) */}
      <div style={styles.actionHeader} className="no-print">
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Ledger</span>
        </button>
        <button onClick={handlePrint} className="btn btn-success">
          <Printer size={16} />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* Draped receipt box */}
      <div style={styles.receiptPaper} className="receipt-paper">
        {/* Style injection for printing */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .receipt-paper, .receipt-paper * {
              visibility: visible;
            }
            .receipt-paper {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              background: #fff !important;
              color: #000 !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        <div style={styles.receiptHeader}>
          <h2 style={styles.storeName}>QUICKCART SUPERMARKET</h2>
          <div style={styles.storeAddress}>
            123, Commercial Plaza, Sector 15<br />
            New Delhi - 110001<br />
            Tel: +91 11 4321 8765
          </div>
          <div style={styles.dashedDivider} />
          <h4 style={styles.receiptTitle}>TAX INVOICE</h4>
          <div style={styles.dashedDivider} />
        </div>

        {/* Invoice Info */}
        <div style={styles.metaSection}>
          <div style={styles.metaRow}>
            <span>Invoice No:</span>
            <strong>{bill.bill_number}</strong>
          </div>
          <div style={styles.metaRow}>
            <span>Date & Time:</span>
            <span>{new Date(bill.created_at).toLocaleString('en-IN')}</span>
          </div>
          <div style={styles.metaRow}>
            <span>Cashier:</span>
            <span>{bill.cashier_name || 'System Cashier'}</span>
          </div>
          <div style={styles.metaRow}>
            <span>Customer:</span>
            <span>{bill.customer_name}</span>
          </div>
          {bill.customer_phone && (
            <div style={styles.metaRow}>
              <span>Phone No:</span>
              <span>{bill.customer_phone}</span>
            </div>
          )}
        </div>

        <div style={styles.dashedDivider} />

        {/* Items Table */}
        <table style={styles.receiptTable}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={{ ...styles.th, textAlign: 'left' }}>Item Description</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Qty</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Rate</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const itemTotal = parseFloat(item.total_price);
              const itemRate = parseFloat(item.price);
              const itemTax = parseFloat(item.gst_amount);
              return (
                <React.Fragment key={item.id}>
                  <tr>
                    <td style={{ ...styles.td, textAlign: 'left', fontWeight: 'bold' }}>
                      {item.product_name}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{itemRate.toFixed(2)}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>{itemTotal.toFixed(2)}</td>
                  </tr>
                  {parseFloat(item.gst_percent) > 0 && (
                    <tr style={styles.taxSubRow}>
                      <td colSpan="4" style={styles.taxSubTd}>
                        [GST {parseFloat(item.gst_percent)}%: Included ₹{itemTax.toFixed(2)}]
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        <div style={styles.dashedDivider} />

        {/* Financial Breakdowns */}
        <div style={styles.totalsSection}>
          <div style={styles.totalsRow}>
            <span>Subtotal (Net Cost):</span>
            <span>₹{parseFloat(bill.subtotal).toFixed(2)}</span>
          </div>
          <div style={styles.totalsRow}>
            <span>CGST + SGST Tax:</span>
            <span>₹{parseFloat(bill.gst_amount).toFixed(2)}</span>
          </div>
          {parseFloat(bill.discount) > 0 && (
            <div style={styles.totalsRow}>
              <span>Store Discount:</span>
              <span>-₹{parseFloat(bill.discount).toFixed(2)}</span>
            </div>
          )}
          <div style={styles.solidDivider} />
          <div style={{ ...styles.totalsRow, fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span>NET PAYABLE:</span>
            <span>₹{parseFloat(bill.grand_total).toFixed(2)}</span>
          </div>
          <div style={styles.solidDivider} />
        </div>

        {/* Footer Info */}
        <div style={styles.receiptFooter}>
          <div style={styles.paymentInfo}>
            <span>Payment Mode: <strong>{bill.payment_mode.toUpperCase()}</strong></span>
          </div>
          <div style={styles.barcodeSpacer}>
            {/* Mock physical barcode generator */}
            <div style={styles.mockBarcode} />
            <div style={styles.mockBarcodeNumbers}>{bill.bill_number}</div>
          </div>
          <div style={styles.thankYou}>
            Thank You for Shopping With Us!<br />
            Terms: Items purchased can be returned/exchanged within 7 days with original invoice.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '1rem',
    color: '#94a3b8',
  },
  outerContainer: {
    maxWidth: '420px',
    margin: '0 auto',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  receiptPaper: {
    backgroundColor: '#fff',
    color: '#000',
    padding: '1.5rem 1.25rem',
    borderRadius: '4px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  receiptHeader: {
    textAlign: 'center',
    marginBottom: '0.75rem',
  },
  storeName: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '-0.02em',
    color: '#000',
    marginBottom: '0.2rem',
  },
  storeAddress: {
    fontSize: '0.75rem',
    color: '#333',
    lineHeight: '1.3',
  },
  dashedDivider: {
    borderTop: '1px dashed #000',
    margin: '0.75rem 0',
  },
  solidDivider: {
    borderTop: '1px solid #000',
    margin: '0.4rem 0',
  },
  receiptTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
    margin: '0.25rem 0',
  },
  metaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    fontSize: '0.8rem',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  receiptTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.8rem',
  },
  tableHeaderRow: {
    borderBottom: '1px solid #000',
  },
  th: {
    padding: '0.3rem 0',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  td: {
    padding: '0.35rem 0 0.15rem 0',
  },
  taxSubRow: {
    borderBottom: '1px dotted #ccc',
  },
  taxSubTd: {
    fontSize: '0.7rem',
    color: '#555',
    paddingBottom: '0.3rem',
    textAlign: 'left',
  },
  totalsSection: {
    marginTop: '0.5rem',
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  receiptFooter: {
    textAlign: 'center',
    marginTop: '1.25rem',
  },
  paymentInfo: {
    fontSize: '0.8rem',
    marginBottom: '1rem',
  },
  barcodeSpacer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '1rem 0',
  },
  mockBarcode: {
    width: '180px',
    height: '40px',
    backgroundColor: '#000',
    // Drapes a simple barcode pattern
    backgroundImage: 'linear-gradient(90deg, #fff 2px, transparent 2px, transparent 5px, #fff 5px, #fff 6px, transparent 6px, transparent 10px, #fff 10px, #fff 12px, transparent 12px, transparent 15px, #fff 15px, #fff 18px, transparent 18px)',
    backgroundSize: '24px 100%',
  },
  mockBarcodeNumbers: {
    fontSize: '0.75rem',
    letterSpacing: '0.2em',
    marginTop: '0.25rem',
  },
  thankYou: {
    fontSize: '0.7rem',
    color: '#333',
    lineHeight: '1.3',
    marginTop: '0.75rem',
  },
  alertError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#ef4444',
    fontSize: '0.9rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
};
