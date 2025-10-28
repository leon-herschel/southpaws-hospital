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
