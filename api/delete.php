<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Read and decode the request payload
$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';
$records = $data['records'] ?? [];
$table = $data['table'] ?? '';

$allowedTables = ["products", "categories", "brands", "suppliers", "inventory", "unit_of_measurement", "clients", "services"];

if ($method === 'POST' && $action === "delete") {
    if (empty($records) || !is_array($records)) {
        echo json_encode(["status" => 0, "message" => "No valid records provided for deletion."]);
        exit;
    }

    try {
        foreach ($records as $tableName => $ids) {
            $tableName = strtolower($tableName);

            if (!in_array($tableName, $allowedTables)) {
                error_log("❌ Skipping invalid table: $tableName");
                continue;
            }

            $ids = array_unique(array_filter(array_map('intval', $ids))); // Ensure valid IDs
            if (empty($ids)) continue;

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $sql = "DELETE FROM `$tableName` WHERE id IN ($placeholders)";
            $stmt = $conn->prepare($sql);

            foreach ($ids as $index => $id) {
                $stmt->bindValue(($index + 1), $id, PDO::PARAM_INT);
            }

            $stmt->execute();
            error_log("✅ Delete SQL executed: " . $sql);
        }

        echo json_encode(["status" => 1, "message" => "Selected records have been deleted successfully."]);
        exit;
    } catch (Exception $e) {
        error_log("❌ Error deleting records: " . $e->getMessage());
        echo json_encode(["status" => 0, "message" => "Error occurred: " . $e->getMessage()]);
        exit;
    }
} else {
    echo json_encode(["status" => 0, "message" => "Invalid request. Only action: delete is allowed."]);
    exit;
}
?>
