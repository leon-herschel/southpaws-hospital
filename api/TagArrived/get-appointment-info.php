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

$data = json_decode(file_get_contents("php://input"), true);
$reference_number = $data['reference_number'] ?? '';

if (!$reference_number) {
    echo json_encode(["success" => false, "message" => "Missing reference number."]);
    exit();
}

try {
    $stmt = $conn->prepare("SELECT name, contact, email, pet_name, pet_species, pet_breed FROM appointments WHERE reference_number = ? LIMIT 1");
    $stmt->execute([$reference_number]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($appointment) {
        echo json_encode([
            "success" => true,
            "name" => $appointment['name'],
            "contact" => $appointment['contact'],
            "email" => $appointment['email'],
            "pet_name" => $appointment['pet_name'],
            "pet_species" => $appointment['pet_species'],
            "pet_breed" => $appointment['pet_breed']
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Appointment not found."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error.", "error" => $e->getMessage()]);
}
