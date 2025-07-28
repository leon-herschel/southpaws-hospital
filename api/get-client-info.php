<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'DbConnect.php';
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
    $stmt = $conn->prepare("SELECT name, contact, service FROM appointments WHERE reference_number = ? LIMIT 1");
    $stmt->execute([$reference_number]);
    $client = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($client) {
        echo json_encode(["client" => $client]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Client not found"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query error: " . $e->getMessage()]);
}
