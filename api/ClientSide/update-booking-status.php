<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include('../DbConnect.php');
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$status = $data['appointmentFormEnabled'] ?? null;

if (!isset($status)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing appointmentFormEnabled value."]);
    exit();
}

try {
    $stmt = $conn->prepare("UPDATE global_settings SET appointment_form_enabled = ? WHERE id = 1");
    $stmt->execute([(int)$status]);

    echo json_encode(["success" => true, "appointmentFormEnabled" => (bool)$status]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Update failed: " . $e->getMessage()]);
}
