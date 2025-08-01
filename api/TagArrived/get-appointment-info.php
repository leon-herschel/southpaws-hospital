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
<<<<<<< HEAD
    $stmt = $conn->prepare("SELECT name, contact, email, pet_name, pet_species, pet_breed FROM appointments WHERE reference_number = ? LIMIT 1");
=======
    $stmt = $conn->prepare("SELECT name, contact, email FROM appointments WHERE reference_number = ? LIMIT 1");
>>>>>>> main
    $stmt->execute([$reference_number]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($appointment) {
        echo json_encode([
            "success" => true,
            "name" => $appointment['name'],
            "contact" => $appointment['contact'],
<<<<<<< HEAD
            "email" => $appointment['email'],
            "pet_name" => $appointment['pet_name'],
            "pet_species" => $appointment['pet_species'],
            "pet_breed" => $appointment['pet_breed']
=======
            "email" => $appointment['email']
>>>>>>> main
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Appointment not found."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error.", "error" => $e->getMessage()]);
}
