from flask import Blueprint, request, jsonify, g
from database.connection import execute_query
from routes.auth import login_required, admin_required

products_bp = Blueprint('products', __name__)

# ==========================================
# CATEGORIES API
# ==========================================

@products_bp.route('/api/categories', methods=['GET'])
@login_required
def get_categories():
    try:
        categories_list = execute_query("SELECT * BY name ASC") # Wait, is it select * FROM categories? Let's check original SQL: SELECT * FROM categories ORDER BY name ASC. Yes!
        categories_list = execute_query("SELECT * FROM categories ORDER BY name ASC")
        return jsonify(categories_list)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@products_bp.route('/api/categories', methods=['POST'])
@admin_required
def add_category():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Payload must be JSON.'}), 400

    name = data.get('name', '').strip()
    description = data.get('description', '').strip()

    if not name:
        return jsonify({'success': False, 'message': 'Category name is required.'}), 400

    try:
        existing = execute_query("SELECT id FROM categories WHERE name = %s", (name,))
        if existing:
            return jsonify({'success': False, 'error': f"Category '{name}' already exists."}), 400

        execute_query(
            "INSERT INTO categories (name, description) VALUES (%s, %s)",
            (name, description),
            commit=True
        )
        return jsonify({'success': True, 'message': f"Category '{name}' added successfully."})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@products_bp.route('/api/categories/<int:id>', methods=['PUT'])
@admin_required
def edit_category(id):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Payload must be JSON.'}), 400

    name = data.get('name', '').strip()
    description = data.get('description', '').strip()

    if not name:
        return jsonify({'success': False, 'message': 'Category name cannot be empty.'}), 400

    try:
        existing = execute_query("SELECT id FROM categories WHERE name = %s AND id != %s", (name, id))
        if existing:
            return jsonify({'success': False, 'error': f"Another category with the name '{name}' already exists."}), 400

        execute_query(
            "UPDATE categories SET name = %s, description = %s WHERE id = %s",
            (name, description, id),
            commit=True
        )
        return jsonify({'success': True, 'message': 'Category updated successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@products_bp.route('/api/categories/<int:id>', methods=['DELETE'])
@admin_required
def delete_category(id):
    try:
        products_in_cat = execute_query("SELECT COUNT(*) as count FROM products WHERE category_id = %s", (id,))
        if products_in_cat and products_in_cat[0]['count'] > 0:
            return jsonify({
                'success': False, 
                'error': 'Cannot delete category! It contains active products. Re-assign them first.'
            }), 400
        
        execute_query("DELETE FROM categories WHERE id = %s", (id,), commit=True)
        return jsonify({'success': True, 'message': 'Category deleted successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==========================================
# PRODUCTS API
# ==========================================

@products_bp.route('/api/products', methods=['GET'])
@login_required
def get_products():
    category_filter = request.args.get('category', '')
    search_query = request.args.get('search', '').strip()

    try:
        query = """
            SELECT p.*, c.name as category_name, i.min_stock_level 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            LEFT JOIN inventory i ON p.id = i.product_id
            WHERE 1=1
        """
        params = []

        if category_filter:
            query += " AND p.category_id = %s"
            params.append(category_filter)

        if search_query:
            query += " AND (p.name LIKE %s OR p.barcode LIKE %s)"
            params.append(f"%{search_query}%")
            params.append(f"%{search_query}%")

        query += " ORDER BY p.name ASC"
        products_list = execute_query(query, tuple(params))
        
        # Cast types safely for JSON
        for p in products_list:
            p['price'] = float(p['price'])
            p['gst_percent'] = float(p['gst_percent'])
            p['created_at'] = str(p['created_at'])
            if p['min_stock_level'] is not None:
                p['min_stock_level'] = int(p['min_stock_level'])

        return jsonify(products_list)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@products_bp.route('/api/products', methods=['POST'])
@admin_required
def add_product():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Payload must be JSON.'}), 400

    barcode = data.get('barcode', '').strip()
    name = data.get('name', '').strip()
    category_id = data.get('category_id')
    price = data.get('price')
    quantity = data.get('quantity', 0)
    gst_percent = data.get('gst_percent', 0)
    min_stock = data.get('min_stock_level', 10)

    if not barcode or not name or price is None or category_id is None:
        return jsonify({'success': False, 'message': 'Barcode, Name, Category, and Price are required.'}), 400

    try:
        price_val = float(price)
        qty_val = int(quantity)
        gst_val = float(gst_percent)
        min_stock_val = int(min_stock)
        
        if price_val < 0 or qty_val < 0 or min_stock_val < 0:
            return jsonify({'success': False, 'message': 'Values cannot be negative.'}), 400
    except ValueError:
        return jsonify({'success': False, 'message': 'Price, Quantity, GST, and Min Stock must be valid numbers.'}), 400

    try:
        existing = execute_query("SELECT id FROM products WHERE barcode = %s", (barcode,))
        if existing:
            return jsonify({'success': False, 'error': f"A product with barcode '{barcode}' already exists."}), 400

        # Insert Product
        result = execute_query(
            """
            INSERT INTO products (barcode, name, category_id, price, quantity, gst_percent)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (barcode, name, int(category_id), price_val, qty_val, gst_val),
            commit=True
        )
        
        product_id = result['lastrowid']

        # Add default inventory mapping
        execute_query(
            "INSERT INTO inventory (product_id, min_stock_level, remarks) VALUES (%s, %s, %s)",
            (product_id, min_stock_val, 'Initial stock setup'),
            commit=True
        )

        return jsonify({'success': True, 'message': f"Product '{name}' added successfully with barcode {barcode}."})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@products_bp.route('/api/products/<int:id>', methods=['PUT'])
@admin_required
def edit_product(id):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Payload must be JSON.'}), 400

    barcode = data.get('barcode', '').strip()
    name = data.get('name', '').strip()
    category_id = data.get('category_id')
    price = data.get('price')
    quantity = data.get('quantity')
    gst_percent = data.get('gst_percent')
    min_stock = data.get('min_stock_level', 10)

    if not barcode or not name or price is None or category_id is None:
        return jsonify({'success': False, 'message': 'Barcode, Name, Category, and Price are required.'}), 400

    try:
        price_val = float(price)
        qty_val = int(quantity)
        gst_val = float(gst_percent)
        min_stock_val = int(min_stock)
        
        if price_val < 0 or qty_val < 0 or min_stock_val < 0:
            return jsonify({'success': False, 'message': 'Values cannot be negative.'}), 400
    except ValueError:
        return jsonify({'success': False, 'message': 'Price, Quantity, GST, and Min Stock must be valid numbers.'}), 400

    try:
        # Check duplicate barcode
        existing = execute_query("SELECT id FROM products WHERE barcode = %s AND id != %s", (barcode, id))
        if existing:
            return jsonify({'success': False, 'error': f"Another product with barcode '{barcode}' already exists."}), 400

        # Update product table
        execute_query(
            """
            UPDATE products 
            SET barcode = %s, name = %s, category_id = %s, price = %s, quantity = %s, gst_percent = %s 
            WHERE id = %s
            """,
            (barcode, name, int(category_id), price_val, qty_val, gst_val, id),
            commit=True
        )

        # Update inventory table reorder level
        inv_existing = execute_query("SELECT id FROM inventory WHERE product_id = %s", (id,))
        if inv_existing:
            execute_query(
                "UPDATE inventory SET min_stock_level = %s WHERE product_id = %s",
                (min_stock_val, id),
                commit=True
            )
        else:
            execute_query(
                "INSERT INTO inventory (product_id, min_stock_level, remarks) VALUES (%s, %s, %s)",
                (id, min_stock_val, 'Inventory tracking initiated'),
                commit=True
            )

        return jsonify({'success': True, 'message': f"Product '{name}' updated successfully."})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@products_bp.route('/api/products/<int:id>', methods=['DELETE'])
@admin_required
def delete_product(id):
    try:
        execute_query("DELETE FROM products WHERE id = %s", (id,), commit=True)
        return jsonify({'success': True, 'message': 'Product deleted successfully from database.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
