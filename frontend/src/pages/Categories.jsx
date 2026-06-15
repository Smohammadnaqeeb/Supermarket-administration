import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { productsApi } from '../api';

export default function Categories({ user }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isAdmin = user?.role === 'admin';

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getCategories();
      if (res) {
        setCategories(res);
      } else {
        setErrorMsg('Failed to load categories.');
      }
    } catch (e) {
      setErrorMsg('Network error fetching categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    if (!isAdmin) return;
    setModalType('add');
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (category) => {
    if (!isAdmin) return;
    setModalType('edit');
    setActiveCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    try {
      let res;
      if (modalType === 'add') {
        res = await productsApi.addCategory({ name, description });
      } else {
        res = await productsApi.editCategory(activeCategory.id, { name, description });
      }

      if (res.success) {
        setSuccessMsg(res.message);
        setShowModal(false);
        loadCategories();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.error || 'Operation failed.');
      }
    } catch (err) {
      setErrorMsg('Error processing category request.');
    }
  };

  const handleDelete = async (id, catName) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to delete the category "${catName}"?`)) return;

    try {
      const res = await productsApi.deleteCategory(id);
      if (res.success) {
        setSuccessMsg(res.message);
        loadCategories();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.error || 'Failed to delete category.');
        setTimeout(() => setErrorMsg(''), 5000);
      }
    } catch (err) {
      setErrorMsg('Error deleting category.');
    }
  };

  return (
    <div>
      {errorMsg && (
        <div style={styles.alertError}>{errorMsg}</div>
      )}

      {successMsg && (
        <div style={styles.alertSuccess}>{successMsg}</div>
      )}

      <div style={styles.actionHeader}>
        <div>
          <h3 style={styles.headerTitle}>Category Matrix</h3>
          <p style={styles.headerSubtitle}>Organize product groupings and mappings</p>
        </div>
        {isAdmin && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={18} />
            <span>Add Category</span>
          </button>
        )}
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={styles.loading}>Loading categories...</div>
        ) : categories.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: '700', color: '#6366f1' }}>{cat.id}</td>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{cat.name}</td>
                    <td style={{ color: '#94a3b8', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat.description || 'No description provided'}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={styles.btnGroup}>
                          <button 
                            onClick={() => openEditModal(cat)} 
                            style={styles.actionBtnEdit}
                            title="Edit Category"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cat.id, cat.name)} 
                            style={styles.actionBtnDelete}
                            title="Delete Category"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.empty}>No categories found. Create a category to get started.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalType === 'add' ? 'Create New Category' : 'Edit Category'}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Groceries, Personal Care"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe category items..."
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
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
                  {modalType === 'add' ? 'Create Category' : 'Save Changes'}
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
  loading: {
    padding: '3rem',
    textAlign: 'center',
    color: '#94a3b8',
  },
  empty: {
    padding: '3rem',
    textAlign: 'center',
    color: '#64748b',
  },
  btnGroup: {
    display: 'inline-flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  actionBtnEdit: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: '6px',
    color: '#6366f1',
    padding: '0.4rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  actionBtnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '6px',
    color: '#ef4444',
    padding: '0.4rem',
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
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '2rem',
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
};
