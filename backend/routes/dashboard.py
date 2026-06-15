from flask import Blueprint, jsonify
from database.connection import execute_query
from routes.auth import login_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard/metrics', methods=['GET'])
@login_required
def get_metrics():
    try:
        # 1. Total Products
        total_products_res = execute_query("SELECT COUNT(*) as count FROM products")
        total_products = total_products_res[0]['count'] if total_products_res else 0

        # 2. Total Sales (All Time Revenue)
        total_sales_res = execute_query("SELECT SUM(grand_total) as total FROM bills")
        total_sales = float(total_sales_res[0]['total']) if total_sales_res and total_sales_res[0]['total'] else 0.00

        # 3. Daily Revenue (Today's Sales)
        daily_revenue_res = execute_query("SELECT SUM(grand_total) as total FROM bills WHERE DATE(created_at) = CURDATE()")
        daily_revenue = float(daily_revenue_res[0]['total']) if daily_revenue_res and daily_revenue_res[0]['total'] else 0.00

        # 4. Low Stock Alert Count
        low_stock_res = execute_query(
            "SELECT COUNT(*) as count FROM products p JOIN inventory i ON p.id = i.product_id WHERE p.quantity <= i.min_stock_level"
        )
        low_stock_count = low_stock_res[0]['count'] if low_stock_res else 0

        # 5. Recent Bills (Limit 5)
        recent_bills = execute_query(
            """
            SELECT b.*, u.full_name as cashier_name 
            FROM bills b 
            LEFT JOIN users u ON b.cashier_id = u.id 
            ORDER BY b.created_at DESC 
            LIMIT 5
            """
        )
        # Format types safely for JSON serialisation
        for b in recent_bills:
            b['subtotal'] = float(b['subtotal'])
            b['gst_amount'] = float(b['gst_amount'])
            b['discount'] = float(b['discount'])
            b['grand_total'] = float(b['grand_total'])
            b['created_at'] = str(b['created_at'])

        # 6. Low Stock Products Details (Limit 5)
        low_stock_items = execute_query(
            """
            SELECT p.*, i.min_stock_level 
            FROM products p 
            JOIN inventory i ON p.id = i.product_id 
            WHERE p.quantity <= i.min_stock_level 
            ORDER BY p.quantity ASC 
            LIMIT 5
            """
        )
        for p in low_stock_items:
            p['price'] = float(p['price'])
            p['gst_percent'] = float(p['gst_percent'])
            p['created_at'] = str(p['created_at'])

        return jsonify({
            'success': True,
            'metrics': {
                'total_products': total_products,
                'total_sales': total_sales,
                'daily_revenue': daily_revenue,
                'low_stock_count': low_stock_count,
                'recent_bills': recent_bills,
                'low_stock_items': low_stock_items
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@dashboard_bp.route('/api/dashboard/charts', methods=['GET'])
@login_required
def get_charts():
    try:
        # Sales Trend (last 7 days)
        sales_trend = execute_query(
            """
            SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as sale_date, SUM(grand_total) as total 
            FROM bills 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
            GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') 
            ORDER BY sale_date ASC
            """
        )
        
        # Payment Mode Distribution
        payment_split = execute_query(
            """
            SELECT payment_mode, SUM(grand_total) as total 
            FROM bills 
            GROUP BY payment_mode
            """
        )
        
        # Top 5 Selling Products
        top_products = execute_query(
            """
            SELECT product_name, SUM(quantity) as quantity_sold 
            FROM bill_items 
            GROUP BY product_id, product_name 
            ORDER BY quantity_sold DESC 
            LIMIT 5
            """
        )
        
        return jsonify({
            'success': True,
            'sales_trend': [{'date': s['sale_date'], 'total': float(s['total'])} for s in sales_trend],
            'payment_split': [{'mode': p['payment_mode'], 'total': float(p['total'])} for p in payment_split],
            'top_products': [{'name': t['product_name'], 'sold': int(t['quantity_sold'])} for t in top_products]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
