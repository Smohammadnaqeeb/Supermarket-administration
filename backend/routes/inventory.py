from flask import Blueprint, request, jsonify
from database.connection import execute_query
from routes.auth import login_required

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/api/inventory', methods=['GET'])
@login_required
def list_inventory():
    stock_status = request.args.get('status', 'all')
    search_query = request.args.get('search', '').strip()

    try:
        query = """
            SELECT p.id, p.barcode, p.name, p.quantity, c.name as category_name, 
                   i.min_stock_level, i.remarks, i.last_updated
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN inventory i ON p.id = i.product_id
            WHERE 1=1
        """
        params = []

        if search_query:
            query += " AND (p.name LIKE %s OR p.barcode LIKE %s)"
            params.append(f"%{search_query}%")
            params.append(f"%{search_query}%")

        if stock_status == 'low':
            query += " AND p.quantity <= i.min_stock_level AND p.quantity > 0"
        elif stock_status == 'out':
            query += " AND p.quantity = 0"
        elif stock_status == 'warning':
            query += " AND p.quantity <= i.min_stock_level"

        query += " ORDER BY p.quantity ASC"
        inventory_items = execute_query(query, tuple(params))
        
        # Cast fields safely for JSON serialization
        for item in inventory_items:
            item['quantity'] = int(item['quantity'])
            if item['min_stock_level'] is not None:
                item['min_stock_level'] = int(item['min_stock_level'])
            if item['last_updated'] is not None:
                item['last_updated'] = str(item['last_updated'])

        return jsonify(inventory_items)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@inventory_bp.route('/api/inventory/replenish/<int:id>', methods=['POST'])
@login_required
def replenish(id):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Payload must be JSON.'}), 400

    add_qty = data.get('add_quantity', '0')
    remarks = data.get('remarks', '').strip() or 'Stock replenishment update'

    try:
        qty_to_add = int(add_qty)
        if qty_to_add <= 0:
            return jsonify({'success': False, 'message': 'Please enter a valid positive quantity to add.'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Quantity must be a valid positive integer.'}), 400

    try:
        # Check if product exists
        product = execute_query("SELECT name, quantity FROM products WHERE id = %s", (id,))
        if not product:
            return jsonify({'success': False, 'message': 'Product not found.'}), 404
            
        # Update stock count
        execute_query(
            "UPDATE products SET quantity = quantity + %s WHERE id = %s",
            (qty_to_add, id),
            commit=True
        )

        # Update inventory metadata remarks
        inv_existing = execute_query("SELECT id FROM inventory WHERE product_id = %s", (id,))
        if inv_existing:
            execute_query(
                "UPDATE inventory SET remarks = %s, last_updated = CURRENT_TIMESTAMP WHERE product_id = %s",
                (remarks, id),
                commit=True
            )
        else:
            execute_query(
                "INSERT INTO inventory (product_id, min_stock_level, remarks) VALUES (%s, %s, %s)",
                (id, 10, remarks),
                commit=True
            )

        new_qty = product[0]['quantity'] + qty_to_add
        return jsonify({
            'success': True,
            'message': f"Replenished {qty_to_add} units for product '{product[0]['name']}'. New Stock: {new_qty}."
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
