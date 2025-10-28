<?php
include 'cors.php';
header("Content-Type: application/json");



include 'DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// Get the requested history type (brands, categories, products, inventory, suppliers, unit_of_measurement)
$historyType = $_GET['type'] ?? 'brands';

// Security check: Allow only specific tables
$allowedTypes = ['brands', 'categories', 'products', 'inventory', 'suppliers', 'unit_of_measurement'];
if (!in_array($historyType, $allowedTypes)) {
    echo json_encode(['error' => 'Invalid history type']);
    exit;
}

// Define table-specific SQL queries
$sqlQueries = [
    'brands' => "SELECT t.id, t.name, u1.first_name AS created_by, u2.first_name AS updated_by, 
                        t.created_at, t.archived 
                 FROM brands t 
                 LEFT JOIN internal_users u1 ON t.created_by = u1.id 
                 LEFT JOIN internal_users u2 ON t.updated_by = u2.id",

    'categories' => "SELECT t.id, t.name, u1.first_name AS created_by, u2.first_name AS updated_by, 
                            t.created_at, t.archived 
                     FROM categories t 
                     LEFT JOIN internal_users u1 ON t.created_by = u1.id 
                     LEFT JOIN internal_users u2 ON t.updated_by = u2.id",

    'products' => "SELECT t.id, t.sku, t.product_name AS name, t.generic_name, 
                          c.name AS category_name, b.name AS brand_name, 
                          u1.first_name AS created_by, u2.first_name AS updated_by, 
                          t.created_at, t.archived 
                   FROM products t 
                   LEFT JOIN categories c ON t.category_id = c.id
                   LEFT JOIN brands b ON t.brand_id = b.id
                   LEFT JOIN internal_users u1 ON t.created_by = u1.id 
                   LEFT JOIN internal_users u2 ON t.updated_by = u2.id",

    'inventory' => "SELECT t.id, t.barcode AS name, p.product_name, s.supplier_name, 
                           t.price, t.quantity, t.total_count, t.item_sold, t.expiration_date, 
                           u1.first_name AS created_by, u2.first_name AS updated_by, 
                           t.created_at, t.archived 
                    FROM inventory t 
                    LEFT JOIN products p ON t.product_id = p.id
                    LEFT JOIN suppliers s ON t.supplier_id = s.id
                    LEFT JOIN internal_users u1 ON t.created_by = u1.id 
                    LEFT JOIN internal_users u2 ON t.updated_by = u2.id",

    'suppliers' => "SELECT t.id, t.supplier_name AS name, t.contact_person, t.contact_number, 
                           t.email, t.address, 
                           u1.first_name AS created_by, u2.first_name AS updated_by, 
                           t.created_at, t.archived 
                    FROM suppliers t 
                    LEFT JOIN internal_users u1 ON t.created_by = u1.id 
                    LEFT JOIN internal_users u2 ON t.updated_by = u2.id",

    'unit_of_measurement' => "SELECT t.id, t.unit_name AS name, 
                                     u1.first_name AS created_by, u2.first_name AS updated_by, 
                                     t.created_at, t.archived 
                              FROM unit_of_measurement t 
                              LEFT JOIN internal_users u1 ON t.created_by = u1.id 
                              LEFT JOIN internal_users u2 ON t.updated_by = u2.id"
];

// Execute the appropriate query based on `historyType`
$sql = $sqlQueries[$historyType];

$stmt = $conn->prepare($sql);
$stmt->execute();
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Return JSON response
echo json_encode([$historyType => $data]);

// Close connection properly
$conn = null;
?>
