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
$reference_number = $data['reference_number'] ?? '';

if (!$reference_number) {
    http_response_code(400);
    echo json_encode(["error" => "Reference number is required."]);
    exit();
}

try {
    $stmt = $conn->prepare("UPDATE appointments SET status = 'Arrived' WHERE reference_number = ?");
    $stmt->execute([$reference_number]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Appointment marked as done."]);
    } else {
        echo json_encode(["success" => false, "message" => "No matching record found."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Update error: " . $e->getMessage()]);
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
