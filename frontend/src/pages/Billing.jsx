import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, User, Phone, Tag, CreditCard, Receipt, Plus, Minus, FileText } from 'lucide-react';
import { billingApi } from '../api';

export default function Billing({ setCurrentPage, setSelectedBillId }) {
  // Autocomplete search states
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  // Cart state
  const [cart, setCart] = useState([]);
  
  // Checkout states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('Cash');

  // Diagnostic notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Handle autocomplete search
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length >= 2) {
        try {
          const res = await billingApi.searchProducts(query);
          if (Array.isArray(res)) {
            setSuggestions(res);
            setShowSuggestions(true);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside suggestions box closes it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProduct = (product) => {
    // Check if item already exists in cart
    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    
    if (product.quantity <= 0) {
      setErrorMsg(`Cannot add "${product.name}". Product is currently out of stock.`);
      setTimeout(() => setErrorMsg(''), 4000);
      setQuery('');
      setShowSuggestions(false);
      return;
    }

    if (existingIndex > -1) {
      const activeQtyInCart = cart[existingIndex].quantity;
      if (activeQtyInCart >= product.quantity) {
        setErrorMsg(`Cannot add more. Limit of ${product.quantity} items reached in inventory.`);
        setTimeout(() => setErrorMsg(''), 4000);
      } else {
        const updated = [...cart];
        updated[existingIndex].quantity += 1;
        setCart(updated);
      }
    } else {
      setCart([...cart, {
        product_id: product.id,
        barcode: product.barcode,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        gst_percent: parseFloat(product.gst_percent),
        max_stock: product.quantity
      }]);
    }

    setQuery('');
    setShowSuggestions(false);
  };

  const handleUpdateQty = (index, delta) => {
    const item = cart[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    if (newQty > item.max_stock) {
      setErrorMsg(`Only ${item.max_stock} units available in stock for "${item.name}".`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await billingApi.searchProducts(query);
      if (Array.isArray(res) && res.length > 0) {
        // If exact barcode match, select the first result automatically
        const exactMatch = res.find(p => p.barcode === query.trim());
        if (exactMatch) {
          handleSelectProduct(exactMatch);
        } else if (res.length === 1) {
          handleSelectProduct(res[0]);
        } else {
          setSuggestions(res);
          setShowSuggestions(true);
        }
      } else {
        setErrorMsg(`No products found matching "${query}"`);
        setTimeout(() => setErrorMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const calculateGstAmount = () => {
    return cart.reduce((acc, item) => {
      const itemSubtotal = item.price * item.quantity;
      return acc + ((itemSubtotal * item.gst_percent) / 100);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const gstAmount = calculateGstAmount();
  const parsedDiscount = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, (subtotal + gstAmount) - parsedDiscount);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Checkout failed. Cart cannot be empty.');
      return;
    }

    setErrorMsg('');
    setCheckoutLoading(true);

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      discount: parsedDiscount,
      payment_mode: paymentMode,
      cart: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    try {
      const res = await billingApi.checkout(payload);
      if (res.success) {
        setSuccessMsg(res.message);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setDiscount('0');
        
        // Immediately load receipt view
        setTimeout(() => {
          setSelectedBillId(res.bill_id);
          setCurrentPage('history');
        }, 1200);
      } else {
        setErrorMsg(res.error || res.message || 'Checkout failed.');
      }
    } catch (e) {
      setErrorMsg('Network error executing checkout transaction.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {errorMsg && (
        <div style={styles.alertError}>{errorMsg}</div>
      )}

      {successMsg && (
        <div style={styles.alertSuccess}>{successMsg}</div>
      )}

      <div style={styles.billingLayout}>
        {/* Left Side - Search & Cart items */}
        <div style={styles.mainPanel}>
          <div className="glass-card" style={{ marginBottom: '1.5rem', position: 'relative' }} ref={dropdownRef}>
            <form onSubmit={handleBarcodeSubmit} style={styles.searchForm}>
              <div style={styles.searchWrapper}>
                <Search size={20} style={styles.searchIcon} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Scan Barcode or Type Product Name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={styles.searchInput}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Add SKU
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-box" style={styles.suggestions}>
                {suggestions.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => handleSelectProduct(p)} 
                    style={styles.suggestionItem}
                  >
                    <div>
                      <strong style={{ color: '#fff' }}>{p.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Barcode: {p.barcode}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#10b981' }}>₹{parseFloat(p.price).toFixed(2)}</strong>
                      <div style={{ fontSize: '0.75rem', color: p.quantity > 0 ? '#64748b' : '#ef4444' }}>
                        {p.quantity > 0 ? `Stock: ${p.quantity}` : 'Out of Stock'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Grid */}
          <div className="glass-card" style={styles.cartCard}>
            <h3 style={styles.sectionTitle}>
              <ShoppingCart size={18} />
              <span>Cart Basket</span>
            </h3>

            {cart.length > 0 ? (
              <div style={styles.cartTableContainer}>
                <table className="custom-table" style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th style={{ textAlign: 'center' }}>Quantity</th>
                      <th>GST</th>
                      <th>Total</th>
                      <th style={{ textAlign: 'right' }}>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => {
                      const itemSub = item.price * item.quantity;
                      const itemGst = (itemSub * item.gst_percent) / 100;
                      const itemTotal = itemSub + itemGst;

                      return (
                        <tr key={item.product_id}>
                          <td>
                            <div style={{ fontWeight: '600', color: '#fff' }}>{item.name}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{item.barcode}</span>
                          </td>
                          <td>₹{item.price.toFixed(2)}</td>
                          <td>
                            <div style={styles.qtyControl}>
                              <button onClick={() => handleUpdateQty(idx, -1)} style={styles.qtyBtn}>
                                <Minus size={12} />
                              </button>
                              <span style={styles.qtyText}>{item.quantity}</span>
                              <button onClick={() => handleUpdateQty(idx, 1)} style={styles.qtyBtn}>
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            <div>{item.gst_percent}%</div>
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>+₹{itemGst.toFixed(2)}</span>
                          </td>
                          <td style={{ fontWeight: '600' }}>₹{itemTotal.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => handleRemoveItem(idx)} style={styles.removeBtn}>
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={styles.emptyCart}>
                <ShoppingCart size={48} color="#1b2640" style={{ marginBottom: '1rem' }} />
                <span>Cart is empty. Scan barcodes or use search above.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Customer Details and invoice Summary */}
        <div style={styles.sidePanel}>
          {/* Customer Metadata Card */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={styles.panelTitle}>Customer Information</h3>
            <div style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <div style={styles.inputIconWrapper}>
                  <User size={16} style={styles.fieldIcon} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={styles.fieldInput}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={styles.inputIconWrapper}>
                  <Phone size={16} style={styles.fieldIcon} />
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={styles.fieldInput}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Summary Card */}
          <div className="glass-card" style={styles.summaryCard}>
            <h3 style={styles.panelTitle}>Invoice Summary</h3>
            
            <div style={styles.summaryDetails}>
              <div style={styles.summaryRow}>
                <span>Subtotal (Net)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>GST Tax Total</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              
              <div className="form-group" style={{ margin: '0.75rem 0' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Invoice Discount (₹)</label>
                <div style={styles.inputIconWrapper}>
                  <Tag size={14} style={styles.fieldIcon} />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    style={{ ...styles.fieldInput, padding: '0.5rem 0.75rem 0.5rem 2.25rem' }}
                  />
                </div>
              </div>

              <div style={styles.paymentSelect}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Payment Mode</label>
                <div style={styles.paymentBtnGrid}>
                  {['Cash', 'UPI', 'Card'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      style={{
                        ...styles.paymentBtn,
                        ...(paymentMode === mode ? styles.paymentBtnActive : {}),
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.divider} />

              <div style={styles.totalRow}>
                <span>GRAND TOTAL</span>
                <span style={styles.totalVal}>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout} 
              className="btn btn-success" 
              style={styles.checkoutBtn}
              disabled={checkoutLoading || cart.length === 0}
            >
              <Receipt size={18} />
              <span>{checkoutLoading ? 'Processing Checkout...' : 'Generate Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  billingLayout: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  mainPanel: {
    flex: 1.6,
    minWidth: '320px',
  },
  sidePanel: {
    flex: 0.9,
    minWidth: '300px',
  },
  searchForm: {
    display: 'flex',
    gap: '0.75rem',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    color: '#64748b',
  },
  searchInput: {
    paddingLeft: '2.5rem',
  },
  suggestions: {
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.25rem',
    borderRadius: '8px',
  },
  cartCard: {
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.1rem',
    color: '#fff',
    fontFamily: "'Outfit', sans-serif",
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '0.75rem',
    marginBottom: '1rem',
  },
  cartTableContainer: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '450px',
  },
  emptyCart: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    fontSize: '0.95rem',
    textAlign: 'center',
    padding: '2rem',
  },
  qtyControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1b2640',
    padding: '0.25rem',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.05)',
    width: 'fit-content',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: 'none',
    borderRadius: '4px',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#fff',
    minWidth: '20px',
    textAlign: 'center',
  },
  removeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'color 0.15s ease',
  },
  panelTitle: {
    fontSize: '1rem',
    color: '#fff',
    fontFamily: "'Outfit', sans-serif",
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '0.5rem',
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
  },
  fieldInput: {
    paddingLeft: '2.25rem',
  },
  summaryCard: {
    backgroundColor: 'rgba(19, 28, 46, 0.85)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  summaryDetails: {
    marginTop: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    color: '#94a3b8',
  },
  paymentSelect: {
    marginTop: '0.5rem',
  },
  paymentBtnGrid: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.4rem',
  },
  paymentBtn: {
    flex: 1,
    padding: '0.5rem 0',
    backgroundColor: '#1b2640',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  paymentBtnActive: {
    backgroundColor: '#6366f1',
    color: '#fff',
    borderColor: '#6366f1',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    margin: '0.5rem 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '700',
    color: '#fff',
    marginTop: '0.25rem',
  },
  totalVal: {
    fontSize: '1.5rem',
    color: '#10b981',
    fontFamily: "'Outfit', sans-serif",
  },
  checkoutBtn: {
    width: '100%',
    marginTop: '1.5rem',
    padding: '0.9rem',
    fontSize: '1rem',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
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
};
