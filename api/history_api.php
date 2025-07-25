<?php
header("Access-Control-Allow-Origin: *"); // Allow all domains (for testing)
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // Allow specific methods
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // Allow headers

// Handle preflight OPTIONS request (important for CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $history = [];

        // Define table configurations
        $tables = [
            'brands' => ['name' => 'name', 'type' => 'Brand', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'categories' => ['name' => 'name', 'type' => 'Category', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'clients' => ['name' => 'name', 'type' => 'Client', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'generic_cms' => ['name' => 'generic_name', 'type' => 'Generic', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'products' => ['name' => 'product_name', 'type' => 'Product', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'suppliers' => ['name' => 'supplier_name', 'type' => 'Supplier', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'orders' => ['name' => 'receipt_number', 'type' => 'Order', 'date_column' => 'order_date', 'has_created_by' => false, 'has_updated_by' => false, 'has_confirmed_by' => true],
            'services' => ['name' => 'name', 'type' => 'Service', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => false],
            'surgical_consent' => ['name' => 'surgical_procedure', 'type' => 'Surgical Consent', 'date_column' => 'created_at', 'has_created_by' => false, 'has_updated_by' => false],
            'immunization_form' => ['name' => 'client_id', 'type' => 'Immunization Form', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => false]
        ];

        foreach ($tables as $table => $config) {
            $column_name = $config['name']; 
            $type = $config['type'];
            $date_column = $config['date_column'];
            $hasCreatedBy = $config['has_created_by'];
            $hasUpdatedBy = $config['has_updated_by'];
            $hasConfirmedBy = $config['has_confirmed_by'] ?? false; // Only true for orders

            $sql = "SELECT 
                        $table.$column_name AS record_name, 
                        '$type' AS type, 
                        $table.$date_column AS created_at";

            // Add created_by field if applicable
            if ($hasCreatedBy) {
                $sql .= ", CONCAT(u1.first_name, ' ', u1.last_name) AS created_by";
            }

            // Add updated_by field if applicable
            if ($hasUpdatedBy) {
                $sql .= ", CONCAT(u2.first_name, ' ', u2.last_name) AS updated_by";
            } else {
                $sql .= ", NULL AS updated_by"; // To maintain consistency
            }

            // Special case for orders: Use confirmed_by instead of created_by/updated_by
            if ($hasConfirmedBy) {
                $sql .= ", $table.confirmed_by"; // Directly fetch the confirmed_by field
            } else {
                $sql .= ", NULL AS confirmed_by"; // To maintain consistency
            }

            $sql .= " FROM $table";

            // LEFT JOIN for created_by (if applicable)
            if ($hasCreatedBy) {
                $sql .= " LEFT JOIN internal_users u1 ON $table.created_by = u1.id";
            }

            // LEFT JOIN for updated_by (if applicable)
            if ($hasUpdatedBy) {
                $sql .= " LEFT JOIN internal_users u2 ON $table.updated_by = u2.id";
            }

            // LEFT JOIN for confirmed_by (only for orders)
            if ($hasConfirmedBy) {
                $sql .= " LEFT JOIN internal_users u3 ON $table.confirmed_by = u3.id";
            }

            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $history = array_merge($history, $records);
        }

        // Sort history by created_at (order_date for orders) in descending order
        usort($history, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        header('Content-Type: application/json');
        echo json_encode(['status' => 1, 'data' => $history], JSON_PRETTY_PRINT);
        exit;
    } catch (Exception $e) {
        echo json_encode(['status' => 0, 'message' => 'Failed to fetch history: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
}
?>