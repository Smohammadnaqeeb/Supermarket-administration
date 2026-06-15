from flask import Blueprint, request, jsonify, g
from database.connection import get_connection, execute_query
from routes.auth import login_required
import datetime
import random
import mysql.connector

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/api/billing/search', methods=['GET'])
@login_required
def search_products():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify([])

    try:
        sql = """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.barcode = %s OR p.name LIKE %s 
            LIMIT 10
        """
        params = (query, f"%{query}%")
        results = execute_query(sql, params)
        
        # Format types safely for JSON
        for r in results:
            r['price'] = float(r['price'])
            r['gst_percent'] = float(r['gst_percent'])
            r['created_at'] = str(r['created_at'])
            
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@billing_bp.route('/api/billing/checkout', methods=['POST'])
@login_required
def checkout():
    data = request.get_json()
    if not data or 'cart' not in data:
        return jsonify({'success': False, 'message': 'Invalid cart data submitted.'}), 400

    cart = data['cart']
    customer_name = data.get('customer_name', '').strip() or 'Walk-in Customer'
    customer_phone = data.get('customer_phone', '').strip() or ''
    discount = float(data.get('discount', 0) or 0)
    payment_mode = data.get('payment_mode', 'Cash')

    if not cart:
        return jsonify({'success': False, 'message': 'Cart is empty.'}), 400

    conn = None
    cursor = None
    try:
        conn = get_connection()
        conn.start_transaction()
        cursor = conn.cursor(dictionary=True)

        bill_subtotal = 0.00
        bill_gst_amount = 0.00
        processed_items = []

        for item in cart:
            p_id = int(item['product_id'])
            req_qty = int(item['quantity'])

            if req_qty <= 0:
                continue

            # Fetch product details with a write lock to prevent race conditions
            cursor.execute("SELECT * FROM products WHERE id = %s FOR UPDATE", (p_id,))
            product = cursor.fetchone()

            if not product:
                conn.rollback()
                return jsonify({'success': False, 'message': f"Product ID {p_id} not found."}), 404

            current_qty = product['quantity']
            if current_qty < req_qty:
                conn.rollback()
                return jsonify({
                    'success': False, 
                    'message': f"Insufficient stock for '{product['name']}'. Available: {current_qty}, Requested: {req_qty}."
                }), 400

            unit_price = float(product['price'])
            gst_percent = float(product['gst_percent'])
            
            item_subtotal = unit_price * req_qty
            item_gst = (item_subtotal * gst_percent) / 100
            item_total = item_subtotal + item_gst

            bill_subtotal += item_subtotal
            bill_gst_amount += item_gst

            processed_items.append({
                'product_id': p_id,
                'product_name': product['name'],
                'price': unit_price,
                'quantity': req_qty,
                'gst_percent': gst_percent,
                'gst_amount': item_gst,
                'total_price': item_total
            })

        # Calculate invoice summary
        grand_total = (bill_subtotal + bill_gst_amount) - discount
        if grand_total < 0:
            grand_total = 0.00

        # Generate unique sequential Bill Number (BILL-YYYYMMDD-5RANDOM)
        while True:
            today = datetime.datetime.now().strftime("%Y%m%d")
            rand_num = random.randint(10000, 99999)
            bill_number = f"BILL-{today}-{rand_num}"
            cursor.execute("SELECT id FROM bills WHERE bill_number = %s", (bill_number,))
            if not cursor.fetchone():
                break

        # Create Bill record (using g.user_id from JWT token identity)
        insert_bill_sql = """
            INSERT INTO bills (bill_number, cashier_id, customer_name, customer_phone, subtotal, gst_amount, discount, grand_total, payment_mode)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_bill_sql, (
            bill_number,
            g.user_id,
            customer_name,
            customer_phone,
            bill_subtotal,
            bill_gst_amount,
            discount,
            grand_total,
            payment_mode
        ))
        
        bill_id = cursor.lastrowid

        # Insert Bill Items and decrease stock
        insert_item_sql = """
            INSERT INTO bill_items (bill_id, product_id, product_name, price, quantity, gst_percent, gst_amount, total_price)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        update_stock_sql = "UPDATE products SET quantity = quantity - %s WHERE id = %s"

        for item in processed_items:
            # Insert item details
            cursor.execute(insert_item_sql, (
                bill_id,
                item['product_id'],
                item['product_name'],
                item['price'],
                item['quantity'],
                item['gst_percent'],
                item['gst_amount'],
                item['total_price']
            ))

            # Deduct stock in DB
            cursor.execute(update_stock_sql, (item['quantity'], item['product_id']))

        # Commit Transaction
        conn.commit()
        return jsonify({
            'success': True,
            'message': 'Bill checkout completed successfully.',
            'bill_id': bill_id,
            'bill_number': bill_number
        })

    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f"Database transaction failed: {str(err)}"}), 500
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f"Unexpected server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@billing_bp.route('/api/billing/receipt/<int:id>', methods=['GET'])
@login_required
def receipt(id):
    """Retrieves invoice + line items formatted for receipt printing."""
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
        
        # Format values
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
