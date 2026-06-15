import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Filter, AlertOctagon } from 'lucide-react';
import { productsApi } from '../api';

export default function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [activeProduct, setActiveProduct] = useState(null);
  
  // Form states
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [gstPercent, setGstPercent] = useState('0');
  const [minStockLevel, setMinStockLevel] = useState('10');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        productsApi.getProducts({ category: categoryFilter, search: searchQuery }),
        productsApi.getCategories()
      ]);
      
      if (pRes) setProducts(pRes);
      if (cRes) setCategories(cRes);
    } catch (e) {
      setErrorMsg('Error fetching products list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]); // Reload on category change.

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const openAddModal = () => {
    if (!isAdmin) return;
    setModalType('add');
    setBarcode('');
    setName('');
    setCategoryId(categories[0]?.id || '');
    setPrice('');
    setQuantity('0');
    setGstPercent('0');
    setMinStockLevel('10');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (product) => {
    if (!isAdmin) return;
    setModalType('edit');
    setActiveProduct(product);
    setBarcode(product.barcode);
    setName(product.name);
    setCategoryId(product.category_id || '');
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setGstPercent(product.gst_percent.toString());
    setMinStockLevel((product.min_stock_level || 10).toString());
    setErrorMsg('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!barcode.trim() || !name.trim() || !price || !categoryId) {
      setErrorMsg('Barcode, Name, Category, and Price are required.');
      return;
    }

    const priceVal = parseFloat(price);
    const qtyVal = parseInt(quantity);
    const gstVal = parseFloat(gstPercent);
    const minStockVal = parseInt(minStockLevel);

    if (isNaN(priceVal) || priceVal < 0) {
      setErrorMsg('Price must be a valid positive number.');
      return;
    }
    if (isNaN(qtyVal) || qtyVal < 0) {
      setErrorMsg('Quantity must be a valid positive integer.');
      return;
    }
    if (isNaN(minStockVal) || minStockVal < 0) {
      setErrorMsg('Minimum warning level must be a positive integer.');
      return;
    }

    const payload = {
      barcode,
      name,
      category_id: parseInt(categoryId),
      price: priceVal,
      quantity: qtyVal,
      gst_percent: gstVal,
      min_stock_level: minStockVal
    };

    try {
      let res;
      if (modalType === 'add') {
        res = await productsApi.addProduct(payload);
      } else {
        res = await productsApi.editProduct(activeProduct.id, payload);
      }

      if (res.success) {
        setSuccessMsg(res.message);
        setShowModal(false);
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.error || 'Operation failed.');
      }
    } catch (err) {
      setErrorMsg('Error processing product form.');
    }
  };

  const handleDelete = async (id, prodName) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to delete product "${prodName}" from inventory database?`)) return;

    try {
      const res = await productsApi.deleteProduct(id);
      if (res.success) {
        setSuccessMsg(res.message);
        loadData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.error || 'Deletion failed.');
      }
    } catch (e) {
      setErrorMsg('Error deleting product.');
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

      {/* Header Actions */}
      <div style={styles.actionHeader}>
        <div>
          <h3 style={styles.headerTitle}>Products Catalog</h3>
          <p style={styles.headerSubtitle}>View and manage inventory SKUs</p>
        </div>
        {isAdmin && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={styles.filtersBar}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <div style={styles.inputSearchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by barcode or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div style={styles.filterDropdownWrapper}>
          <Filter size={16} color="#94a3b8" />
          <select
            className="form-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="glass-card">
        {loading ? (
          <div style={styles.loading}>Querying product index...</div>
        ) : products.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Qty</th>
                  <th>GST %</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLow = p.quantity <= (p.min_stock_level || 10);
                  const isOut = p.quantity === 0;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: '500' }}>{p.barcode}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{p.name}</div>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{p.category_name || 'Unassigned'}</td>
                      <td style={{ fontWeight: '600' }}>₹{parseFloat(p.price).toFixed(2)}</td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{p.quantity} units</span>
                      </td>
                      <td>{parseFloat(p.gst_percent)}%</td>
                      <td>
                        {isOut ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Sufficient</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={styles.btnGroup}>
                            <button 
                              onClick={() => openEditModal(p)} 
                              style={styles.actionBtnEdit}
                              title="Edit Product Details"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button 
                              onClick={() => handleDelete(p.id, p.name)} 
                              style={styles.actionBtnDelete}
                              title="Remove Product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.empty}>No products matching selected filters.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', padding: '2rem' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalType === 'add' ? 'Add Product to Catalog' : 'Modify Product Record'}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={styles.modalError}>{errorMsg}</div>
            )}

            <form onSubmit={handleFormSubmit} style={{ marginTop: '1.5rem' }}>
              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Barcode / UPC</label>
                  <input
                    type="text"
                    className="form-control"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan or enter barcode"
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1.2 }}>
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Britannia Bread 500g"
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category Group</label>
                  <select
                    className="form-control"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Initial Stock Qty</label>
                  <input
                    type="number"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    disabled={modalType === 'edit'} // Restrict direct quantity edits here; force replenishment route!
                    required
                  />
                  {modalType === 'edit' && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                      To alter stock, use the Inventory Alerts replenishment panel.
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">GST Tax Bracket</label>
                  <select
                    className="form-control"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(e.target.value)}
                    required
                  >
                    <option value="0">0% (Exempted)</option>
                    <option value="5">5% (Essential Foods)</option>
                    <option value="12">12% (Processed Goods)</option>
                    <option value="18">18% (Standard Grocery)</option>
                    <option value="28">28% (Luxury items)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Minimum Stock Alert Threshold</label>
                <input
                  type="number"
                  className="form-control"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(e.target.value)}
                  placeholder="10"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Generate low stock system warnings when inventory dips below this level.
                </span>
              </div>

              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  {modalType === 'add' ? 'Add Product' : 'Save Update'}
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
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filterDropdownWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1b2640',
    padding: '0 0.75rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  filterSelect: {
    backgroundColor: 'transparent',
    border: 'none',
    width: '160px',
    padding: '0.6rem 0.5rem',
    outline: 'none',
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
  },
  actionBtnEdit: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: '6px',
    color: '#6366f1',
    padding: '0.45rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  actionBtnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '6px',
    color: '#ef4444',
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
  formRow: {
    display: 'flex',
    gap: '1rem',
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
