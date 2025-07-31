<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include('../DbConnect.php');
$objDB = new DbConnect;
$conn = $objDB->connect();

$data = json_decode(file_get_contents("php://input"), true);
$reference_number = $data['reference_number'] ?? '';

if (!$reference_number) {
    echo json_encode(["success" => false, "message" => "Missing reference number."]);
    exit();
}

try {
    $stmt = $conn->prepare("SELECT name, contact, email FROM appointments WHERE reference_number = ? LIMIT 1");
    $stmt->execute([$reference_number]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($appointment) {
        echo json_encode([
            "success" => true,
            "name" => $appointment['name'],
            "contact" => $appointment['contact'],
            "email" => $appointment['email']
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Appointment not found."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error.", "error" => $e->getMessage()]);
}
