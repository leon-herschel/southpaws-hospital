<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

// Extract and sanitize data
$reason_for_visit = $data["reason_for_visit"] ?? '';
$preferred_date   = $data["preferred_date"] ?? '';
$preferred_time   = $data["preferred_time"] ?? '';
$name             = $data["name"] ?? '';
$contact          = $data["contact"] ?? '';
$email            = isset($data["email"]) ? filter_var($data["email"], FILTER_SANITIZE_EMAIL) : '';
$status           = $data["status"] ?? 'Pending';
$pet_name         = $data["pet_name"] ?? '';
$pet_breed        = $data["pet_breed"] ?? '';
$pet_species      = $data["pet_species"] ?? '';
$notes            = $data["notes"] ?? '';

// Validate required fields
if (!$reason_for_visit || !$preferred_date || !$preferred_time || !$name || !$contact || !$email || !$pet_name || !$pet_breed || !$pet_species) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit();
}

try {
    $stmt = $conn->prepare("
        INSERT INTO pending_appointments (
            reason_for_visit, preferred_date, preferred_time, name, contact, status, email,
            pet_name, pet_breed, pet_species, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $success = $stmt->execute([
        $reason_for_visit,
        $preferred_date,
        $preferred_time,
        $name,
        $contact,
        $status,
        $email,
        $pet_name,
        $pet_breed,
        $pet_species,
        $notes
    ]);

    if ($success) {
        echo json_encode(["success" => true, "message" => "Pending appointment submitted"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Insert failed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Insert error: " . $e->getMessage()]);
}
