import React, { useState, useEffect } from 'react';
import { 
  Package, 
  IndianRupee, 
  TrendingUp, 
  AlertOctagon, 
  ArrowRight, 
  FileText,
  Activity,
  DollarSign
} from 'lucide-react';
import { dashboardApi } from '../api';
import MetricCard from '../components/MetricCard';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard({ setCurrentPage, setSelectedBillId }) {
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [mRes, cRes] = await Promise.all([
        dashboardApi.getMetrics(),
        dashboardApi.getCharts()
      ]);

      if (mRes.success) {
        setMetrics(mRes.metrics);
      } else {
        setErrorMsg(mRes.error || 'Failed to load metrics.');
      }

      if (cRes.success) {
        setChartData(cRes);
      }
    } catch (err) {
      setErrorMsg('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleViewBill = (billId) => {
    setSelectedBillId(billId);
    setCurrentPage('history');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Activity size={32} className="spin" color="#6366f1" />
        <span>Syncing system status...</span>
      </div>
    );
  }

  // Chart configuration
  const lineChartData = {
    labels: chartData?.sales_trend?.map(s => s.date) || [],
    datasets: [
      {
        label: 'Daily Revenue (₹)',
        data: chartData?.sales_trend?.map(s => s.total) || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
    }
  };

  const doughnutData = {
    labels: chartData?.payment_split?.map(p => p.mode) || [],
    datasets: [
      {
        data: chartData?.payment_split?.map(p => p.total) || [],
        backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
        borderWidth: 0,
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 11 } }
      }
    }
  };

  const barChartData = {
    labels: chartData?.top_products?.map(p => p.name.substring(0, 15) + '...') || [],
    datasets: [
      {
        label: 'Units Sold',
        data: chartData?.top_products?.map(p => p.sold) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 4,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
    }
  };

  return (
    <div>
      {errorMsg && (
        <div style={styles.errorAlert}>{errorMsg}</div>
      )}

      {/* Metrics Cards */}
      <div className="dashboard-grid">
        <MetricCard 
          title="Total Products" 
          value={metrics?.total_products || 0} 
          icon={Package} 
          color="indigo" 
        />
        <MetricCard 
          title="Total Revenue" 
          value={`₹${metrics?.total_sales?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}`} 
          icon={IndianRupee} 
          color="emerald" 
        />
        <MetricCard 
          title="Today's Revenue" 
          value={`₹${metrics?.daily_revenue?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}`} 
          icon={TrendingUp} 
          color="amber" 
        />
        <MetricCard 
          title="Low Stock Warning" 
          value={metrics?.low_stock_count || 0} 
          icon={AlertOctagon} 
          color="rose" 
          subtext={metrics?.low_stock_count > 0 ? "Requires replenishment action" : "All products sufficiently stocked"}
        />
      </div>

      {/* Visual Graphs section */}
      <div style={styles.graphsGrid}>
        <div className="glass-card" style={styles.largeGraph}>
          <h3 style={styles.graphTitle}>Weekly Sales Revenue (₹)</h3>
          <div style={styles.chartContainer}>
            {chartData?.sales_trend?.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div style={styles.noData}>No recent transactions found</div>
            )}
          </div>
        </div>

        <div className="glass-card" style={styles.smallGraph}>
          <h3 style={styles.graphTitle}>Payment Mode Splits</h3>
          <div style={styles.chartContainer}>
            {chartData?.payment_split?.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div style={styles.noData}>No sales split available</div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.graphsGrid2}>
        <div className="glass-card" style={styles.fullWidthGraph}>
          <h3 style={styles.graphTitle}>Top 5 Best Selling Items</h3>
          <div style={styles.chartContainer}>
            {chartData?.top_products?.length > 0 ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <div style={styles.noData}>No items sold yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent history & Low Stock grid */}
      <div style={styles.splitGrid}>
        {/* Recent Invoices */}
        <div className="glass-card" style={{ flex: 1.2 }}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Recent Bill Generations</h3>
            <button onClick={() => setCurrentPage('history')} style={styles.viewAllBtn}>
              <span>History Ledger</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            {metrics?.recent_bills?.length > 0 ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>Payment</th>
                    <th>Grand Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recent_bills.map((bill) => (
                    <tr key={bill.id}>
                      <td style={{ fontWeight: '600', color: '#6366f1' }}>{bill.bill_number}</td>
                      <td>
                        <div style={{ color: '#fff', fontSize: '0.9rem' }}>{bill.customer_name}</div>
                        {bill.customer_phone && <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{bill.customer_phone}</span>}
                      </td>
                      <td>
                        <span className={`badge badge-success`}>
                          {bill.payment_mode}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>₹{parseFloat(bill.grand_total).toFixed(2)}</td>
                      <td>
                        <button 
                          onClick={() => handleViewBill(bill.id)} 
                          style={styles.viewRowBtn}
                          title="View Bill Details"
                        >
                          <FileText size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={styles.emptyText}>No billing records present in system.</div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card" style={{ flex: 0.8 }}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Immediate Reorders</h3>
            <button onClick={() => setCurrentPage('inventory')} style={styles.viewAllBtn}>
              <span>Reorder Shelf</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            {metrics?.low_stock_items?.length > 0 ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Active Stock</th>
                    <th>Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.low_stock_items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{item.name}</div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.barcode}</span>
                      </td>
                      <td>
                        <span className={`badge badge-danger`} style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                          {item.quantity} units
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{item.min_stock_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={styles.emptyTextSec}>All items fully stocked. Good job!</div>
            )}
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
    fontSize: '0.95rem',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#ef4444',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  graphsGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  graphsGrid2: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  largeGraph: {
    height: '320px',
    display: 'flex',
    flexDirection: 'column',
  },
  smallGraph: {
    height: '320px',
    display: 'flex',
    flexDirection: 'column',
  },
  fullWidthGraph: {
    height: '280px',
    display: 'flex',
    flexDirection: 'column',
  },
  graphTitle: {
    fontSize: '1rem',
    color: '#fff',
    marginBottom: '1rem',
    fontFamily: "'Outfit', sans-serif",
  },
  chartContainer: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  noData: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#64748b',
    fontSize: '0.9rem',
  },
  splitGrid: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  cardTitle: {
    fontSize: '1.1rem',
    color: '#fff',
    fontFamily: "'Outfit', sans-serif",
  },
  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  viewRowBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: '4px',
    color: '#6366f1',
    padding: '0.3rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.9rem',
  },
  emptyTextSec: {
    padding: '2rem',
    textAlign: 'center',
    color: '#10b981',
    fontSize: '0.9rem',
  },
};
