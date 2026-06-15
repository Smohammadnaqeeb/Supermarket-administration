from flask import Blueprint, request, jsonify
from database.connection import execute_query
from routes.auth import login_required, admin_required

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/api/reports/history', methods=['GET'])
@login_required
def history():
    bill_number = request.args.get('bill_number', '').strip()
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    payment_mode = request.args.get('payment_mode', 'all')

    try:
        query = """
            SELECT b.*, u.full_name as cashier_name 
            FROM bills b 
            LEFT JOIN users u ON b.cashier_id = u.id 
            WHERE 1=1
        """
        params = []

        if bill_number:
            query += " AND b.bill_number LIKE %s"
            params.append(f"%{bill_number}%")

        if start_date:
            query += " AND DATE(b.created_at) >= %s"
            params.append(start_date)

        if end_date:
            query += " AND DATE(b.created_at) <= %s"
            params.append(end_date)

        if payment_mode != 'all':
            query += " AND b.payment_mode = %s"
            params.append(payment_mode)

        query += " ORDER BY b.created_at DESC"
        bills_list = execute_query(query, tuple(params))
        
        # Format types safely for JSON
        for b in bills_list:
            b['subtotal'] = float(b['subtotal'])
            b['gst_amount'] = float(b['gst_amount'])
            b['discount'] = float(b['discount'])
            b['grand_total'] = float(b['grand_total'])
            b['created_at'] = str(b['created_at'])

        return jsonify(bills_list)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@reports_bp.route('/api/reports/view/<int:id>', methods=['GET'])
@login_required
def view_bill(id):
    """View details of a specific historic invoice."""
    try:
        bill_list = execute_query(
            """
            SELECT b.*, u.full_name as cashier_name 
            FROM bills b 
            LEFT JOIN users u ON b.cashier_id = u.id 
            WHERE b.id = %s
            """,
            (id,)
        )
        
        if not bill_list:
            return jsonify({'success': False, 'message': 'Requested bill not found.'}), 404
            
        bill = bill_list[0]
        
        items = execute_query(
            "SELECT * FROM bill_items WHERE bill_id = %s",
            (id,)
        )
        
        # Format types safely
        bill['subtotal'] = float(bill['subtotal'])
        bill['gst_amount'] = float(bill['gst_amount'])
        bill['discount'] = float(bill['discount'])
        bill['grand_total'] = float(bill['grand_total'])
        bill['created_at'] = str(bill['created_at'])
        
        for item in items:
            item['price'] = float(item['price'])
            item['gst_percent'] = float(item['gst_percent'])
            item['gst_amount'] = float(item['gst_amount'])
            item['total_price'] = float(item['total_price'])

        return jsonify({
            'success': True,
            'bill': bill,
            'items': items
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@reports_bp.route('/api/reports/analytics', methods=['GET'])
@admin_required
def analytics():
    """Compiles aggregate category sales summaries and cashier metrics for administrators."""
    try:
        # Fetch category summary performance
        revenue_by_category = execute_query(
            """
            SELECT c.name as category_name, SUM(bi.total_price) as revenue, SUM(bi.quantity) as items_sold
            FROM bill_items bi
            JOIN products p ON bi.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
            """
        )

        cashier_performance = execute_query(
            """
            SELECT u.full_name as cashier_name, COUNT(b.id) as bills_generated, SUM(b.grand_total) as revenue
            FROM bills b
            JOIN users u ON b.cashier_id = u.id
            GROUP BY u.id, u.full_name
            ORDER BY revenue DESC
            """
        )

        # Cast floats for JSON serialization
        for r in revenue_by_category:
            r['revenue'] = float(r['revenue']) if r['revenue'] else 0.00
            r['items_sold'] = int(r['items_sold']) if r['items_sold'] else 0
            
        for c in cashier_performance:
            c['revenue'] = float(c['revenue']) if c['revenue'] else 0.00
            c['bills_generated'] = int(c['bills_generated']) if c['bills_generated'] else 0

        return jsonify({
            'success': True,
            'revenue_by_category': revenue_by_category,
            'cashier_performance': cashier_performance
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
