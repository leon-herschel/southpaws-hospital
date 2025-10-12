<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

include '../DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

try {
    $stmt = $conn->query("SELECT log_retention_days FROM global_settings WHERE id = 1");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['days' => $result['log_retention_days'] ?? null]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
