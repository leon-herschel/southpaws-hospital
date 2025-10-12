<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include '../DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$data = json_decode(file_get_contents('php://input'), true);
$days = intval($data['days'] ?? 0);

if ($days <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid number of days.']);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE global_settings SET log_retention_days = :days WHERE id = 1");
    $stmt->execute([':days' => $days]);
    echo json_encode(['status' => 'success']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
