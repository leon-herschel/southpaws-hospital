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


$action = $_GET['action'] ?? null;


// Define allowed tables
$allowedTables = [
    "products", "categories", "brands", "suppliers", "inventory", "unit_of_measurement", 
    "clients", "services"
];

// Function to format dates
function formatDate($dateString) {
    return $dateString ? date("M d, Y, h:i A", strtotime($dateString)) : "N/A";
}

if ($method === 'GET') {
    try {
        $tables = [
            "products" => "SELECT p.id, 'Products' AS table_name, p.product_name, p.created_at FROM products p WHERE p.archived = 0",
            "categories" => "SELECT c.id, 'Categories' AS table_name, c.name AS category_name, c.created_at FROM categories c WHERE c.archived = 0",
            "brands" => "SELECT b.id, 'Brands' AS table_name, b.name AS brand_name, b.created_at FROM brands b WHERE b.archived = 0",
            "suppliers" => "SELECT s.id, 'Suppliers' AS table_name, s.supplier_name, s.contact_person, s.contact_number, s.created_at FROM suppliers s WHERE s.archived = 0",
            "inventory" => "SELECT i.id, 'Inventory' AS table_name, i.sku, i.barcode, p.product_name, s.supplier_name, i.price, i.quantity, i.created_at 
                            FROM inventory i 
                            LEFT JOIN products p ON i.product_id = p.id 
                            LEFT JOIN suppliers s ON i.supplier_id = s.id 
                            WHERE i.archived = 0",
            "unit_of_measurement" => "SELECT u.id, 'Unit of Measurement' AS table_name, u.unit_name, u.created_at FROM unit_of_measurement u WHERE u.archived = 0",
            "clients" => "SELECT c.id, 'Clients' AS table_name, c.name, c.address, c.cellnumber, c.email, c.gender, c.created_at 
                          FROM clients c WHERE c.archived = 0", // ✅ Added clients
            "services" => "SELECT s.id, 'Services' AS table_name, s.name, s.price, s.consent_form, s.created_at, s.status 
                           FROM services s WHERE s.archived = 0" // ✅ Added services
        ];

        $result = [];

        if ($action === 'all') {
            foreach ($tables as $table => $sql) {
                $stmt = $conn->prepare($sql . " ORDER BY created_at DESC");
                $stmt->execute();
                $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($records as &$record) {
                    $record['created_at'] = formatDate($record['created_at']);
                }

                $result = array_merge($result, $records);
            }
        } elseif (isset($tables[$action])) {
            $stmt = $conn->prepare($tables[$action] . " ORDER BY created_at DESC");
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($result as &$record) {
                $record['created_at'] = formatDate($record['created_at']);
                unset($record['table_name']); 
            }
        } else {
            echo json_encode(['status' => 0, 'message' => 'Invalid action.']);
            exit;
        }

        echo json_encode(['status' => 1, 'data' => $result]);
        exit;
    } catch (Exception $e) {
        echo json_encode(['status' => 0, 'message' => 'Failed to fetch records: ' . $e->getMessage()]);
        exit;
    }
}


if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $table = $data['table'] ?? "";
    $records = $data['records'] ?? [];

    if (!is_array($records) || empty($records)) {
        echo json_encode(['status' => 0, 'message' => 'Invalid request. No records provided.']);
        exit;
    }

    if (!$table || empty($records)) {
        echo json_encode(['status' => 0, 'message' => 'Invalid request. No table or records provided.']);
        exit;
    }

    try {
        if ($table === "categories") {
            $ids = array_unique(array_map('intval', $records));
        
            if (empty($ids)) {
                echo json_encode(['status' => 0, 'message' => 'No valid category IDs found for archiving.']);
                exit;
            }
        
            foreach ($ids as $categoryId) {
                // Debug: Check if the category ID is received correctly
                error_log("Checking category ID: $categoryId");
        
                // Check if any product under this category has quantity > 0
                $checkStockSql = "SELECT COUNT(*) as count FROM inventory i 
                                  JOIN products p ON i.product_id = p.id 
                                  WHERE p.category_id = ? AND i.quantity > 0";
                $stmt = $conn->prepare($checkStockSql);
                $stmt->execute([$categoryId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
                // Debugging: Check the fetched count
                error_log("Category ID $categoryId - Products with stock: " . $row['count']);
        
                if ($row['count'] > 0) {
                    // Fetch the category name from the database
                    $getCategoryNameSql = "SELECT name FROM categories WHERE id = ?";
                    $stmt = $conn->prepare($getCategoryNameSql);
                    $stmt->execute([$categoryId]);
                    $categoryRow = $stmt->fetch(PDO::FETCH_ASSOC);
                    $categoryName = $categoryRow['name'] ?? "Unknown"; // Fallback if not found
                
                    echo json_encode([
                        'status' => 0, 
                        'message' => "Category '$categoryName' cannot be archived because it has products with stock in inventory."
                    ]);
                    exit;
                }                
        
                // Archive all products under this category (since they all have quantity = 0)
                $archiveProductsSql = "UPDATE products SET archived = 1 WHERE category_id = ?";
                $stmt = $conn->prepare($archiveProductsSql);
                $stmt->execute([$categoryId]);
        
                // Archive the category
                $archiveCategorySql = "UPDATE categories SET archived = 1 WHERE id = ?";
                $stmt = $conn->prepare($archiveCategorySql);
                $stmt->execute([$categoryId]);
            }
        
            echo json_encode(['status' => 1, 'message' => 'Selected categories and their products have been archived.']);
            exit;
        }
        
        if ($table === "products") {
            // Change this line to handle the incoming IDs correctly
            $ids = is_array($records) ? array_map('intval', $records) : [intval($records)];
            $ids = array_unique(array_filter($ids)); // Remove empty/zero values
        
            if (empty($ids)) {
                echo json_encode(['status' => 0, 'message' => 'No valid product IDs found for archiving.']);
                exit;
            }
        
            foreach ($ids as $productId) {
                // Check if the product has quantity > 0
                $checkStockSql = "SELECT quantity FROM inventory WHERE product_id = ?";
                $stmt = $conn->prepare($checkStockSql);
                $stmt->execute([$productId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
                if ($row && $row['quantity'] > 0) {
                    // Get product name for better error message
                    $productNameSql = "SELECT product_name FROM products WHERE id = ?";
                    $stmt = $conn->prepare($productNameSql);
                    $stmt->execute([$productId]);
                    $product = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    echo json_encode([
                        'status' => 0, 
                        'message' => "Product '".($product['product_name'] ?? $productId)."' cannot be archived because it still has stock."
                    ]);
                    exit;
                }
        
                // Archive the product
                $archiveProductSql = "UPDATE products SET archived = 1 WHERE id = ?";
                $stmt = $conn->prepare($archiveProductSql);
                $stmt->execute([$productId]);
            }
        
            echo json_encode(['status' => 1, 'message' => 'Selected products have been archived.']);
            exit;
        }
        
if (in_array($table, ["brands", "suppliers", "unit_of_measurement", "clients", "services"])) {
    $ids = array_unique(array_map('intval', $records));
    
    if (empty($ids)) {
        echo json_encode(['status' => 0, 'message' => 'No valid IDs found for archiving.']);
        exit;
    }
    
    // Archive the records
    $archiveSql = "UPDATE $table SET archived = 1 WHERE id IN (" . implode(",", $ids) . ")";
    $stmt = $conn->prepare($archiveSql);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 1, 'message' => 'Selected records have been archived.']);
    } else {
        echo json_encode(['status' => 0, 'message' => 'Failed to archive records.']);
    }
    exit;
}

if ($table === "inventory") {
    $ids = array_unique(array_map('intval', $records));
    
    if (empty($ids)) {
        echo json_encode(['status' => 0, 'message' => 'No valid inventory IDs found for archiving.']);
        exit;
    }

    // Check if any inventory items have quantity > 0
    $checkStockSql = "SELECT i.id, i.quantity, p.product_name 
                     FROM inventory i
                     LEFT JOIN products p ON i.product_id = p.id
                     WHERE i.id IN (" . implode(",", $ids) . ") AND i.quantity > 0";
    $stmt = $conn->prepare($checkStockSql);
    $stmt->execute();
    $itemsWithStock = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($itemsWithStock)) {
        $itemNames = array_map(function($item) {
            return $item['product_name'] . " (Qty: " . $item['quantity'] . ")";
        }, $itemsWithStock);
        
        echo json_encode([
            'status' => 0, 
            'message' => "Cannot archive inventory items with stock: " . implode(", ", $itemNames)
        ]);
        exit;
    }

    // Archive the inventory items
    $archiveSql = "UPDATE inventory SET archived = 1 WHERE id IN (" . implode(",", $ids) . ")";
    $stmt = $conn->prepare($archiveSql);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 1, 'message' => 'Selected inventory items have been archived.']);
    } else {
        echo json_encode(['status' => 0, 'message' => 'Failed to archive inventory items.']);
    }
    exit;
}
    } catch (Exception $e) {
        error_log("SQL Error: " . $e->getMessage());
        echo json_encode(['status' => 0, 'message' => 'Failed to archive records: ' . $e->getMessage()]);
    }
}

?>
