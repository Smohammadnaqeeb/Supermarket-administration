import os
import datetime
import logging
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==========================================
# IN-MEMORY DATA STORAGE
# ==========================================

_MOCK_USERS = [
    {"id": 1, "username": "admin", "password_hash": "scrypt:32768:8:1$mm7ZCUSGjCaMmQzn$dff2c1e279f20e8cf106cc1060bc03148862e8179608e6df41e28ca285292b34523683c9c6ac063d1ad8a055773b2d8d35723a643ef76af81d6f071fce7e6985", "role": "admin", "full_name": "System Administrator", "email": "admin@supermarket.com", "is_active": 1},
    {"id": 2, "username": "cashier", "password_hash": "scrypt:32768:8:1$gPPaJc8HsdFjcIlU$f4e0bf7f6c07c30c0aae78d3f1915fce99f3291b9ce21b95ddc860d84117aa7f66b58acd624cfd855b6c3e7f77b4c7c0ad341b004508a5229761e11a87667ffc", "role": "cashier", "full_name": "Rajesh Kumar", "email": "rajesh@supermarket.com", "is_active": 1},
    {"id": 3, "username": "cashier2", "password_hash": "scrypt:32768:8:1$gPPaJc8HsdFjcIlU$f4e0bf7f6c07c30c0aae78d3f1915fce99f3291b9ce21b95ddc860d84117aa7f66b58acd624cfd855b6c3e7f77b4c7c0ad341b004508a5229761e11a87667ffc", "role": "cashier", "full_name": "Sunita Sharma", "email": "sunita@supermarket.com", "is_active": 1}
]

_MOCK_CATEGORIES = [
    {"id": 1, "name": "Groceries", "description": "Daily essential food items, grains, spices, flour, and oils"},
    {"id": 2, "name": "Dairy & Bakery", "description": "Milk, cheese, butter, bread, cakes, and dairy products"},
    {"id": 3, "name": "Beverages", "description": "Soft drinks, fruit juices, tea, coffee, and energy drinks"},
    {"id": 4, "name": "Packaged Foods", "description": "Noodles, chips, biscuits, chocolates, and ready-to-eat meals"},
    {"id": 5, "name": "Personal Care", "description": "Soaps, shampoos, toothpaste, creams, and hygiene products"},
    {"id": 6, "name": "Household Items", "description": "Detergents, cleaning liquids, scrubbers, and bin liners"}
]

_MOCK_PRODUCTS = [
    {"id": 1, "barcode": "8901030752392", "name": "Fortune Premium Mustard Oil 1L", "category_id": 1, "price": 175.00, "quantity": 50, "gst_percent": 5.00},
    {"id": 2, "barcode": "8901725181223", "name": "Aashirvaad Shudh Chakki Atta 5kg", "category_id": 1, "price": 260.00, "quantity": 40, "gst_percent": 0.00},
    {"id": 3, "barcode": "8901262010017", "name": "Tata Salt 1kg", "category_id": 1, "price": 28.00, "quantity": 100, "gst_percent": 0.00},
    {"id": 4, "barcode": "8901719124021", "name": "Amul Butter 500g", "category_id": 2, "price": 275.00, "quantity": 25, "gst_percent": 12.00},
    {"id": 5, "barcode": "8901262020023", "name": "Amul Taaza Toned Milk 1L", "category_id": 2, "price": 66.00, "quantity": 8, "gst_percent": 0.00},
    {"id": 6, "barcode": "8901138510252", "name": "Britannia Marie Gold Biscuits 250g", "category_id": 2, "price": 35.00, "quantity": 60, "gst_percent": 18.00},
    {"id": 7, "barcode": "8901764032210", "name": "Coca Cola 1.25L", "category_id": 3, "price": 70.00, "quantity": 45, "gst_percent": 28.00},
    {"id": 8, "barcode": "8901030654122", "name": "Red Label Tea 500g", "category_id": 3, "price": 210.00, "quantity": 30, "gst_percent": 5.00},
    {"id": 9, "barcode": "8901063016201", "name": "Maggi 2-Minute Masala Noodles 70g", "category_id": 4, "price": 14.00, "quantity": 120, "gst_percent": 18.00},
    {"id": 10, "barcode": "8901725191222", "name": "Kurkure Masala Munch 90g", "category_id": 4, "price": 20.00, "quantity": 75, "gst_percent": 18.00},
    {"id": 11, "barcode": "8901030704155", "name": "Dettol Liquid Handwash Refill 175ml", "category_id": 5, "price": 99.00, "quantity": 35, "gst_percent": 18.00},
    {"id": 12, "barcode": "8901525101221", "name": "Colgate MaxFresh Toothpaste 150g", "category_id": 5, "price": 115.00, "quantity": 40, "gst_percent": 18.00},
    {"id": 13, "barcode": "8901030818227", "name": "Surf Excel Easy Wash 1kg", "category_id": 6, "price": 140.00, "quantity": 5, "gst_percent": 18.00},
    {"id": 14, "barcode": "8901030847227", "name": "Vim Dishwash Gel 500ml", "category_id": 6, "price": 120.00, "quantity": 28, "gst_percent": 18.00}
]

_MOCK_INVENTORY = [
    {"product_id": 1, "min_stock_level": 15, "remarks": "Fast moving oil category", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 2, "min_stock_level": 10, "remarks": "Essential grain storage", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 3, "min_stock_level": 20, "remarks": "High frequency purchase", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 4, "min_stock_level": 8, "remarks": "Perishable refrigerator item", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 5, "min_stock_level": 10, "remarks": "Daily fresh milk intake required", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 6, "min_stock_level": 15, "remarks": "Biscuit racks standard", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 7, "min_stock_level": 12, "remarks": "Beverage cooling rack", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 8, "min_stock_level": 10, "remarks": "Beverage shelf dry", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 9, "min_stock_level": 30, "remarks": "Fast food section staples", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 10, "min_stock_level": 20, "remarks": "Snack counter display", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 11, "min_stock_level": 10, "remarks": "Bathroom shelf items", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 12, "min_stock_level": 12, "remarks": "Dental hygiene rack", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 13, "min_stock_level": 8, "remarks": "Heavy detergents floor space", "last_updated": "2026-06-15 12:00:00"},
    {"product_id": 14, "min_stock_level": 10, "remarks": "Kitchen cleaning section", "last_updated": "2026-06-15 12:00:00"}
]

_MOCK_BILLS = [
    {"id": 1, "bill_number": "BILL-2026-00001", "cashier_id": 2, "customer_name": "Walk-in Customer", "customer_phone": "", "subtotal": 535.00, "gst_amount": 35.80, "discount": 10.00, "grand_total": 560.80, "payment_mode": "Cash", "created_at": "2026-06-14 11:20:00"},
    {"id": 2, "bill_number": "BILL-2026-00002", "cashier_id": 2, "customer_name": "Aman Verma", "customer_phone": "9876543210", "subtotal": 975.00, "gst_amount": 93.60, "discount": 25.00, "grand_total": 1043.60, "payment_mode": "UPI", "created_at": "2026-06-14 15:45:00"},
    {"id": 3, "bill_number": "BILL-2026-00003", "cashier_id": 3, "customer_name": "Walk-in Customer", "customer_phone": "", "subtotal": 148.00, "gst_amount": 25.20, "discount": 0.00, "grand_total": 173.20, "payment_mode": "Card", "created_at": "2026-06-15 10:15:00"},
    {"id": 4, "bill_number": "BILL-2026-00004", "cashier_id": 2, "customer_name": "Pooja Sen", "customer_phone": "9988776655", "subtotal": 380.00, "gst_amount": 12.00, "discount": 15.00, "grand_total": 377.00, "payment_mode": "UPI", "created_at": "2026-06-15 14:30:00"}
]

_MOCK_BILL_ITEMS = [
    {"id": 1, "bill_id": 1, "product_id": 1, "product_name": "Fortune Premium Mustard Oil 1L", "price": 175.00, "quantity": 2, "gst_percent": 5.00, "gst_amount": 17.50, "total_price": 367.50},
    {"id": 2, "bill_id": 1, "product_id": 3, "product_name": "Tata Salt 1kg", "price": 28.00, "quantity": 3, "gst_percent": 0.00, "gst_amount": 0.00, "total_price": 84.00},
    {"id": 3, "bill_id": 1, "product_id": 11, "product_name": "Dettol Liquid Handwash Refill 175ml", "price": 99.00, "quantity": 1, "gst_percent": 18.00, "gst_amount": 17.82, "total_price": 116.82},
    {"id": 4, "bill_id": 2, "product_id": 2, "product_name": "Aashirvaad Shudh Chakki Atta 5kg", "price": 260.00, "quantity": 2, "gst_percent": 0.00, "gst_amount": 0.00, "total_price": 520.00},
    {"id": 5, "bill_id": 2, "product_id": 4, "product_name": "Amul Butter 500g", "price": 275.00, "quantity": 1, "gst_percent": 12.00, "gst_amount": 33.00, "total_price": 308.00},
    {"id": 6, "bill_id": 2, "product_id": 8, "product_name": "Red Label Tea 500g", "price": 210.00, "quantity": 1, "gst_percent": 5.00, "gst_amount": 10.50, "total_price": 220.50},
    {"id": 7, "bill_id": 2, "product_id": 9, "product_name": "Maggi 2-Minute Masala Noodles 70g", "price": 14.00, "quantity": 5, "gst_percent": 18.00, "gst_amount": 12.60, "total_price": 82.60},
    {"id": 8, "bill_id": 3, "product_id": 7, "product_name": "Coca Cola 1.25L", "price": 70.00, "quantity": 1, "gst_percent": 28.00, "gst_amount": 19.60, "total_price": 89.60},
    {"id": 9, "bill_id": 3, "product_id": 10, "product_name": "Kurkure Masala Munch 90g", "price": 20.00, "quantity": 2, "gst_percent": 18.00, "gst_amount": 7.20, "total_price": 47.20},
    {"id": 10, "bill_id": 3, "product_id": 9, "product_name": "Maggi 2-Minute Masala Noodles 70g", "price": 14.00, "quantity": 2, "gst_percent": 18.00, "gst_amount": 5.04, "total_price": 33.04},
    {"id": 11, "bill_id": 4, "product_id": 2, "product_name": "Aashirvaad Shudh Chakki Atta 5kg", "price": 260.00, "quantity": 1, "gst_percent": 0.00, "gst_amount": 0.00, "total_price": 260.00},
    {"id": 12, "bill_id": 4, "product_id": 14, "product_name": "Vim Dishwash Gel 500ml", "price": 120.00, "quantity": 1, "gst_percent": 18.00, "gst_amount": 21.60, "total_price": 141.60}
]

# Helper connection variables
DB_HOST = "localhost"
DB_USER = "mock"
DB_PORT = "3306"
DB_DATABASE = "in_memory"

# ==========================================
# MOCK DATABASE ENGINE
# ==========================================

class MockCursor:
    def __init__(self):
        self.lastrowid = 1
        self.rowcount = 1
        self.results = []

    def execute(self, query, params=()):
        self.results = evaluate_mock_query(query, params)
        q_upper = query.upper()
        if "INSERT INTO" in q_upper:
            # Dynamically extract table name and increment ID
            if "BILLS" in q_upper and "BILL_ITEMS" not in q_upper:
                self.lastrowid = len(_MOCK_BILLS)
            elif "BILL_ITEMS" in q_upper:
                self.lastrowid = len(_MOCK_BILL_ITEMS)
            elif "PRODUCTS" in q_upper:
                self.lastrowid = len(_MOCK_PRODUCTS)
            elif "CATEGORIES" in q_upper:
                self.lastrowid = len(_MOCK_CATEGORIES)
            self.rowcount = 1
        elif "UPDATE" in q_upper or "DELETE" in q_upper:
            self.rowcount = 1

    def fetchall(self):
        return self.results

    def fetchone(self):
        return self.results[0] if self.results else None

    def close(self):
        pass

class MockConnection:
    def start_transaction(self):
        pass
    def commit(self):
        pass
    def rollback(self):
        pass
    def cursor(self, dictionary=True):
        return MockCursor()
    def close(self):
        pass

def get_connection():
    return MockConnection()

def check_db_connection():
    return True, "Mock In-Memory Database responsive."

def initialize_database():
    return True, "Mock In-Memory Database variables successfully populated."

def evaluate_mock_query(query, params=()):
    q_norm = " ".join(query.split()).upper()
    
    # 1. SELECT * FROM users WHERE username = %s AND is_active = 1
    if "FROM USERS" in q_norm and "USERNAME =" in q_norm:
        username = params[0]
        return [u for u in _MOCK_USERS if u["username"] == username and u["is_active"] == 1]
        
    # 2. SELECT COUNT(*) as count FROM products
    elif "COUNT(*)" in q_norm and "FROM PRODUCTS" in q_norm and "JOIN INVENTORY" not in q_norm:
        return [{"count": len(_MOCK_PRODUCTS)}]
        
    # 3. SELECT SUM(grand_total) as total FROM bills WHERE DATE(created_at) = CURDATE()
    elif "SUM(GRAND_TOTAL)" in q_norm and "FROM BILLS" in q_norm and ("CURDATE()" in q_norm or "DATE('NOW')" in q_norm):
        today_str = datetime.datetime.now().strftime("%Y-%m-%d")
        today_bills = [b for b in _MOCK_BILLS if b["created_at"].startswith(today_str)]
        total = sum(float(b["grand_total"]) for b in today_bills)
        return [{"total": total}]
        
    # 4. SELECT SUM(grand_total) as total FROM bills
    elif "SUM(GRAND_TOTAL)" in q_norm and "FROM BILLS" in q_norm:
        total = sum(float(b["grand_total"]) for b in _MOCK_BILLS)
        return [{"total": total}]
        
    # 5. SELECT COUNT(*) as count FROM products p JOIN inventory i ON p.id = i.product_id WHERE p.quantity <= i.min_stock_level
    elif "COUNT(*)" in q_norm and "FROM PRODUCTS" in q_norm and "JOIN INVENTORY" in q_norm:
        count = 0
        for p in _MOCK_PRODUCTS:
            inv = next((i for i in _MOCK_INVENTORY if i["product_id"] == p["id"]), None)
            min_lvl = inv["min_stock_level"] if inv else 10
            if p["quantity"] <= min_lvl:
                count += 1
        return [{"count": count}]
        
    # 6. Recent Bills (Limit 5)
    elif "FROM BILLS B" in q_norm and "ORDER BY" in q_norm and "LIMIT 5" in q_norm:
        sorted_bills = sorted(_MOCK_BILLS, key=lambda x: x["created_at"], reverse=True)[:5]
        results = []
        for b in sorted_bills:
            cashier = next((u for u in _MOCK_USERS if u["id"] == b["cashier_id"]), None)
            b_copy = b.copy()
            b_copy["cashier_name"] = cashier["full_name"] if cashier else "System Cashier"
            results.append(b_copy)
        return results
        
    # 7. Low Stock Products Details (Limit 5)
    elif "FROM PRODUCTS P" in q_norm and "JOIN INVENTORY I" in q_norm and "LIMIT 5" in q_norm:
        low_stock = []
        for p in _MOCK_PRODUCTS:
            inv = next((i for i in _MOCK_INVENTORY if i["product_id"] == p["id"]), None)
            min_lvl = inv["min_stock_level"] if inv else 10
            if p["quantity"] <= min_lvl:
                p_copy = p.copy()
                p_copy["min_stock_level"] = min_lvl
                low_stock.append(p_copy)
        sorted_low = sorted(low_stock, key=lambda x: x["quantity"])[:5]
        return sorted_low

    # 8. Sales Trend (last 7 days)
    elif "SUM(GRAND_TOTAL)" in q_norm and "FROM BILLS" in q_norm and "GROUP BY" in q_norm:
        # Generate last 7 days sales trend dynamically
        today = datetime.date.today()
        trend = []
        for d_offset in range(6, -1, -1):
            day = today - datetime.timedelta(days=d_offset)
            day_str = day.strftime("%Y-%m-%d")
            day_total = sum(float(b["grand_total"]) for b in _MOCK_BILLS if b["created_at"].startswith(day_str))
            trend.append({"sale_date": day_str, "total": day_total})
        return trend

    # 9. Payment Mode Split
    elif "PAYMENT_MODE" in q_norm and "SUM(GRAND_TOTAL)" in q_norm:
        modes = ["Cash", "UPI", "Card"]
        splits = []
        for mode in modes:
            total = sum(float(b["grand_total"]) for b in _MOCK_BILLS if b["payment_mode"].lower() == mode.lower())
            splits.append({"payment_mode": mode, "total": total})
        return splits

    # 10. Top Selling Products
    elif "SUM(QUANTITY) AS QUANTITY_SOLD" in q_norm:
        sold_counts = {}
        for item in _MOCK_BILL_ITEMS:
            p_id = item["product_id"]
            sold_counts[p_id] = sold_counts.get(p_id, 0) + item["quantity"]
            
        sorted_sold = sorted(sold_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        results = []
        for p_id, qty in sorted_sold:
            prod = next((p for p in _MOCK_PRODUCTS if p["id"] == p_id), None)
            name = prod["name"] if prod else "Unknown Item"
            results.append({"product_name": name, "quantity_sold": qty})
        return results

    # 11. Fetch categories
    elif "FROM CATEGORIES" in q_norm and "ORDER BY" in q_norm:
        return sorted(_MOCK_CATEGORIES, key=lambda x: x["name"])

    # 12. Check duplicate name category
    elif "FROM CATEGORIES" in q_norm and "NAME =" in q_norm and "ID !=" in q_norm:
        name = params[0]
        cid = params[1]
        return [c for c in _MOCK_CATEGORIES if c["name"].lower() == name.lower() and c["id"] != cid]

    elif "FROM CATEGORIES" in q_norm and "NAME =" in q_norm:
        name = params[0]
        return [c for c in _MOCK_CATEGORIES if c["name"].lower() == name.lower()]

    # 13. Insert Category
    elif "INSERT INTO CATEGORIES" in q_norm:
        name = params[0]
        desc = params[1]
        new_id = len(_MOCK_CATEGORIES) + 1
        _MOCK_CATEGORIES.append({"id": new_id, "name": name, "description": desc})
        return []

    # 14. Update Category
    elif "UPDATE CATEGORIES" in q_norm:
        name = params[0]
        desc = params[1]
        cid = params[2]
        cat = next((c for c in _MOCK_CATEGORIES if c["id"] == cid), None)
        if cat:
            cat["name"] = name
            cat["description"] = desc
        return []

    # 15. Check products in category
    elif "FROM PRODUCTS" in q_norm and "COUNT(*)" in q_norm and "CATEGORY_ID =" in q_norm:
        cat_id = params[0]
        count = sum(1 for p in _MOCK_PRODUCTS if p["category_id"] == cat_id)
        return [{"count": count}]

    # 16. Delete Category
    elif "DELETE FROM CATEGORIES" in q_norm:
        cid = params[0]
        global _MOCK_CATEGORIES
        _MOCK_CATEGORIES = [c for c in _MOCK_CATEGORIES if c["id"] != cid]
        return []

    # 17. Fetch Products Catalog (with potential filters)
    elif "FROM PRODUCTS P" in q_norm and "ORDER BY P.NAME" in q_norm:
        filtered = _MOCK_PRODUCTS.copy()
        
        # Check category filter
        cat_filter_idx = q_norm.find("P.CATEGORY_ID = ?")
        # Check search filters
        search_filter_idx = q_norm.find("(P.NAME LIKE ? OR P.BARCODE LIKE ?)")
        
        # If we have category filter (which will be first parameter if query has it)
        param_idx = 0
        if "CATEGORY_ID =" in q_norm:
            cat_id = int(params[param_idx])
            filtered = [p for p in filtered if p["category_id"] == cat_id]
            param_idx += 1
            
        if "LIKE" in q_norm:
            search_str = params[param_idx].replace('%', '').lower()
            filtered = [p for p in filtered if search_str in p["name"].lower() or search_str in p["barcode"]]
            
        # Map category names and min_stock_levels
        results = []
        for p in filtered:
            cat = next((c for c in _MOCK_CATEGORIES if c["id"] == p["category_id"]), None)
            inv = next((i for i in _MOCK_INVENTORY if i["product_id"] == p["id"]), None)
            
            p_copy = p.copy()
            p_copy["category_name"] = cat["name"] if cat else "Unassigned"
            p_copy["min_stock_level"] = inv["min_stock_level"] if inv else 10
            p_copy["created_at"] = str(datetime.datetime.now())
            results.append(p_copy)
        return results

    # 18. Check product duplicate barcode
    elif "FROM PRODUCTS" in q_norm and "BARCODE =" in q_norm and "ID !=" in q_norm:
        barcode = params[0]
        pid = params[1]
        return [p for p in _MOCK_PRODUCTS if p["barcode"] == barcode and p["id"] != pid]

    elif "FROM PRODUCTS" in q_norm and "BARCODE =" in q_norm:
        barcode = params[0]
        return [p for p in _MOCK_PRODUCTS if p["barcode"] == barcode]

    # 19. Insert Product
    elif "INSERT INTO PRODUCTS" in q_norm:
        barcode = params[0]
        name = params[1]
        cat_id = params[2]
        price = params[3]
        qty = params[4]
        gst = params[5]
        new_id = len(_MOCK_PRODUCTS) + 1
        _MOCK_PRODUCTS.append({
            "id": new_id,
            "barcode": barcode,
            "name": name,
            "category_id": cat_id,
            "price": price,
            "quantity": qty,
            "gst_percent": gst
        })
        return []

    # 20. Insert Inventory Threshold
    elif "INSERT INTO INVENTORY" in q_norm:
        pid = params[0]
        min_lvl = params[1]
        remarks = params[2]
        _MOCK_INVENTORY.append({
            "product_id": pid,
            "min_stock_level": min_lvl,
            "remarks": remarks,
            "last_updated": str(datetime.datetime.now())
        })
        return []

    # 21. Update Product details
    elif "UPDATE PRODUCTS" in q_norm:
        barcode = params[0]
        name = params[1]
        cat_id = params[2]
        price = params[3]
        qty = params[4]
        gst = params[5]
        pid = params[6]
        prod = next((p for p in _MOCK_PRODUCTS if p["id"] == pid), None)
        if prod:
            prod["barcode"] = barcode
            prod["name"] = name
            prod["category_id"] = cat_id
            prod["price"] = price
            prod["quantity"] = qty
            prod["gst_percent"] = gst
        return []

    # 22. Check inventory row exists
    elif "FROM INVENTORY" in q_norm and "PRODUCT_ID =" in q_norm:
        pid = params[0]
        return [i for i in _MOCK_INVENTORY if i["product_id"] == pid]

    # 23. Update inventory threshold
    elif "UPDATE INVENTORY" in q_norm and "MIN_STOCK_LEVEL" in q_norm:
        min_lvl = params[0]
        pid = params[1]
        inv = next((i for i in _MOCK_INVENTORY if i["product_id"] == pid), None)
        if inv:
            inv["min_stock_level"] = min_lvl
            inv["last_updated"] = str(datetime.datetime.now())
        return []

    # 24. Delete Product
    elif "DELETE FROM PRODUCTS" in q_norm:
        pid = params[0]
        global _MOCK_PRODUCTS
        _MOCK_PRODUCTS = [p for p in _MOCK_PRODUCTS if p["id"] != pid]
        return []

    # 25. Autocomplete search (POS counter)
    elif "FROM PRODUCTS P" in q_norm and "P.BARCODE =" in q_norm and "P.NAME LIKE" in q_norm:
        search_str = params[0].lower() # This will be the exact query string
        filtered = []
        for p in _MOCK_PRODUCTS:
            if p["barcode"] == search_str or search_str in p["name"].lower():
                cat = next((c for c in _MOCK_CATEGORIES if c["id"] == p["category_id"]), None)
                p_copy = p.copy()
                p_copy["category_name"] = cat["name"] if cat else "Unassigned"
                p_copy["created_at"] = str(datetime.datetime.now())
                filtered.append(p_copy)
        return filtered[:10]

    # 26. Fetch product details with write lock
    elif "FROM PRODUCTS" in q_norm and "WHERE ID =" in q_norm:
        pid = params[0]
        return [p for p in _MOCK_PRODUCTS if p["id"] == pid]

    # 27. Insert Bill (Transaction)
    elif "INSERT INTO BILLS" in q_norm:
        bill_number = params[0]
        cashier_id = params[1]
        cust_name = params[2]
        cust_phone = params[3]
        sub = params[4]
        gst = params[5]
        disc = params[6]
        grand = params[7]
        pay_mode = params[8]
        new_id = len(_MOCK_BILLS) + 1
        _MOCK_BILLS.append({
            "id": new_id,
            "bill_number": bill_number,
            "cashier_id": cashier_id,
            "customer_name": cust_name,
            "customer_phone": cust_phone,
            "subtotal": sub,
            "gst_amount": gst,
            "discount": disc,
            "grand_total": grand,
            "payment_mode": pay_mode,
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        return []

    # 28. Insert Bill Item
    elif "INSERT INTO BILL_ITEMS" in q_norm:
        bill_id = params[0]
        pid = params[1]
        pname = params[2]
        price = params[3]
        qty = params[4]
        gst_p = params[5]
        gst_a = params[6]
        total = params[7]
        new_id = len(_MOCK_BILL_ITEMS) + 1
        _MOCK_BILL_ITEMS.append({
            "id": new_id,
            "bill_id": bill_id,
            "product_id": pid,
            "product_name": pname,
            "price": price,
            "quantity": qty,
            "gst_percent": gst_p,
            "gst_amount": gst_a,
            "total_price": total
        })
        return []

    # 29. Deduct stock / Update quantity
    elif "UPDATE PRODUCTS SET QUANTITY = QUANTITY -" in q_norm:
        qty_diff = params[0]
        pid = params[1]
        prod = next((p for p in _MOCK_PRODUCTS if p["id"] == pid), None)
        if prod:
            prod["quantity"] = max(0, prod["quantity"] - qty_diff)
        return []

    # 30. Fetch receipt / view bill details
    elif "FROM BILLS B" in q_norm and "B.ID =" in q_norm:
        bid = params[0]
        bill = next((b for b in _MOCK_BILLS if b["id"] == bid), None)
        if bill:
            cashier = next((u for u in _MOCK_USERS if u["id"] == bill["cashier_id"]), None)
            b_copy = bill.copy()
            b_copy["cashier_name"] = cashier["full_name"] if cashier else "System Cashier"
            return [b_copy]
        return []

    elif "FROM BILL_ITEMS" in q_norm and "BILL_ID =" in q_norm:
        bid = params[0]
        return [item for item in _MOCK_BILL_ITEMS if item["bill_id"] == bid]

    # 31. Inventory Alerts (reorder tracker)
    elif "FROM PRODUCTS P" in q_norm and "FROM PRODUCTS" in q_norm:
        results = []
        for p in _MOCK_PRODUCTS:
            inv = next((i for i in _MOCK_INVENTORY if i["product_id"] == p["id"]), None)
            cat = next((c for c in _MOCK_CATEGORIES if c["id"] == p["category_id"]), None)
            
            p_copy = p.copy()
            p_copy["category_name"] = cat["name"] if cat else "Unassigned"
            p_copy["min_stock_level"] = inv["min_stock_level"] if inv else 10
            p_copy["remarks"] = inv["remarks"] if inv else "-"
            p_copy["last_updated"] = inv["last_updated"] if inv else str(datetime.datetime.now())
            results.append(p_copy)
            
        # Optional search queries
        search_filter = None
        if len(params) > 0:
            search_str = params[0].replace('%', '').lower()
            results = [r for r in results if search_str in r["name"].lower() or search_str in r["barcode"]]
            
        # Optional status filters
        status_filter = "all"
        # Extract status filter from path or URL params manually if needed, but we can return results
        return results

    # 32. Update stock count (Replenish)
    elif "UPDATE PRODUCTS SET QUANTITY = QUANTITY +" in q_norm:
        qty_add = params[0]
        pid = params[1]
        prod = next((p for p in _MOCK_PRODUCTS if p["id"] == pid), None)
        if prod:
            prod["quantity"] += qty_add
        return []

    # 33. Update inventory metadata (Replenish remarks)
    elif "UPDATE INVENTORY SET REMARKS =" in q_norm:
        remarks = params[0]
        pid = params[1]
        inv = next((i for i in _MOCK_INVENTORY if i["product_id"] == pid), None)
        if inv:
            inv["remarks"] = remarks
            inv["last_updated"] = str(datetime.datetime.now())
        return []

    # 34. History Ledger (with search filters)
    elif "FROM BILLS B" in q_norm and "1=1" in q_norm:
        results = []
        for b in _MOCK_BILLS:
            cashier = next((u for u in _MOCK_USERS if u["id"] == b["cashier_id"]), None)
            b_copy = b.copy()
            b_copy["cashier_name"] = cashier["full_name"] if cashier else "System Cashier"
            results.append(b_copy)
            
        # Filter matching
        # Depending on params count, map them:
        param_idx = 0
        if "B.BILL_NUMBER LIKE" in q_norm:
            b_num = params[param_idx].replace('%', '').lower()
            results = [r for r in results if b_num in r["bill_number"].lower()]
            param_idx += 1
            
        if "DATE(B.CREATED_AT) >=" in q_norm:
            s_date = params[param_idx]
            results = [r for r in results if r["created_at"].split(" ")[0] >= s_date]
            param_idx += 1
            
        if "DATE(B.CREATED_AT) <=" in q_norm:
            e_date = params[param_idx]
            results = [r for r in results if r["created_at"].split(" ")[0] <= e_date]
            param_idx += 1
            
        if "B.PAYMENT_MODE =" in q_norm:
            pay_m = params[param_idx]
            results = [r for r in results if r["payment_mode"] == pay_m]
            
        return sorted(results, key=lambda x: x["created_at"], reverse=True)

    # 35. Category Revenue Analytics
    elif "SUM(BI.TOTAL_PRICE) AS REVENUE" in q_norm:
        cat_stats = []
        for cat in _MOCK_CATEGORIES:
            cat_products = [p for p in _MOCK_PRODUCTS if p["category_id"] == cat["id"]]
            p_ids = [p["id"] for p in cat_products]
            
            cat_items = [bi for bi in _MOCK_BILL_ITEMS if bi["product_id"] in p_ids]
            rev = sum(float(item["total_price"]) for item in cat_items)
            qty = sum(int(item["quantity"]) for item in cat_items)
            
            cat_stats.append({
                "category_name": cat["name"],
                "revenue": rev,
                "items_sold": qty
            })
        return sorted(cat_stats, key=lambda x: x["revenue"], reverse=True)

    # 36. Cashier Performance Analytics
    elif "COUNT(B.ID) AS BILLS_GENERATED" in q_norm:
        cashier_stats = []
        for cashier in _MOCK_USERS:
            if cashier["role"] != "cashier" and cashier["username"] != "admin":
                continue
            cashier_bills = [b for b in _MOCK_BILLS if b["cashier_id"] == cashier["id"]]
            rev = sum(float(b["grand_total"]) for b in cashier_bills)
            cashier_stats.append({
                "cashier_name": cashier["full_name"],
                "bills_generated": len(cashier_bills),
                "revenue": rev
            })
        return sorted(cashier_stats, key=lambda x: x["revenue"], reverse=True)

    # 37. Default fallback query logger
    logger.info(f"Mocking unmapped query: {query}")
    return []

def execute_query(query, params=(), commit=False, dictionary=True):
    # Route directly to in-memory evaluator
    return evaluate_mock_query(query, params)
