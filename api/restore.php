<?php
include 'cors.php';


include 'DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;


// Define allowed tables
$allowedTables = [
    "products", "categories", "brands", "suppliers", "inventory", "unit_of_measurement",  "clients", "services", "appointments"
];

// Function to format dates
function formatDate($dateString) {
    return $dateString ? date("M d, Y, h:i A", strtotime($dateString)) : "N/A";
}

if ($method === 'GET') {
    try {
        $tables = [
            "products" => "SELECT p.id, 'Products' AS table_name,  p.product_name, p.created_at FROM products p WHERE p.archived = 1",
            "categories" => "SELECT c.id, 'Categories' AS table_name, c.name AS category_name, c.created_at FROM categories c WHERE c.archived = 1",
            "brands" => "SELECT b.id, 'Brands' AS table_name, b.name AS brand_name, b.created_at FROM brands b WHERE b.archived = 1",
            "suppliers" => "SELECT s.id, 'Suppliers' AS table_name, s.supplier_name, s.contact_person, s.contact_number, s.created_at FROM suppliers s WHERE s.archived = 1",
            "inventory" => "SELECT i.id, 'Inventory' AS table_name, i.sku, i.barcode, p.product_name, s.supplier_name, i.price, i.quantity, i.created_at 
                            FROM inventory i 
                            LEFT JOIN products p ON i.product_id = p.id 
                            LEFT JOIN suppliers s ON i.supplier_id = s.id 
                            WHERE i.archived = 1",
            "unit_of_measurement" => "SELECT u.id, 'Unit of Measurement' AS table_name, u.unit_name, u.created_at FROM unit_of_measurement u WHERE u.archived = 1",
            "clients" => "SELECT c.id, 'Clients' AS table_name, c.name, c.address, c.cellnumber, c.email, c.gender, c.created_at
                            FROM clients c WHERE c.archived = 1", // ✅ Added clients
            "services" => "SELECT s.id, 'Services' AS table_name, s.name, s.price, s.consent_form, s.created_at, s.status 
                        FROM services s WHERE s.archived = 1", // ✅ Added services
            "appointments" => "SELECT a.id, 'Appointments' AS table_name, a.name, a.contact, a.email, a.created_at FROM appointments a WHERE a.status = 'Done'"
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
    $table = $data['table'] ?? null;
    $records = $data['records'] ?? [];

    if (!$table || empty($records)) {
        echo json_encode(['status' => 0, 'message' => 'Invalid request. No table or records provided.']);
        exit;
    }

    try {
        if ($table === "all") {
            if (!is_array($records) || empty($records)) {
                echo json_encode(['status' => 0, 'message' => 'No valid records to restore.']);
                exit;
            }

            foreach ($records as $tableName => $ids) {
                $tableName = strtolower($tableName);
                if (!in_array($tableName, $allowedTables)) continue;

                $ids = array_unique(array_filter(array_map('intval', $ids))); // Ensure unique valid IDs
                if (empty($ids)) continue;

                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $sql = "UPDATE `$tableName` SET archived = 0 WHERE id IN ($placeholders)";
                $stmt = $conn->prepare($sql);

                foreach ($ids as $index => $id) {
                    $stmt->bindValue(($index + 1), $id, PDO::PARAM_INT);
                }

                $stmt->execute();
            }

            echo json_encode(['status' => 1, 'message' => 'Selected records have been restored.']);
            exit;
        }

        if (!in_array(strtolower($table), $allowedTables)) {
            echo json_encode(['status' => 0, 'message' => 'Invalid table selected.']);
            exit;
        }

        $ids = array_unique(array_map('intval', array_column($records, 'id')));
        if (empty($ids)) {
            echo json_encode(['status' => 0, 'message' => 'No valid IDs found for restoring.']);
            exit;
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $sql = "UPDATE `$table` SET archived = 0 WHERE id IN ($placeholders)";
        $stmt = $conn->prepare($sql);

        foreach ($ids as $index => $id) {
            $stmt->bindValue(($index + 1), $id, PDO::PARAM_INT);
        }

        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            echo json_encode(['status' => 1, 'message' => 'Selected records have been restored.']);
        } else {
            echo json_encode(['status' => 0, 'message' => 'No records were updated. Check if IDs are valid.']);
        }
        
    } catch (Exception $e) {
        error_log("SQL Error: " . $e->getMessage());
        echo json_encode(['status' => 0, 'message' => 'Failed to restore records: ' . $e->getMessage()]);
    }
}

?>
