<?php
include '../cors.php';
header("Content-Type: application/json");

include '../DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

try {
    $stmt = $conn->query("SELECT log_retention_days FROM global_settings WHERE id = 1");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['days' => $result['log_retention_days'] ?? null]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
