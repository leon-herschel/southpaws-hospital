<?php
include 'cors.php';
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
    $stmt = $conn->prepare("
        SELECT 
            a.name, a.contact, a.email, a.status, a.date,
            a.pet_name, a.pet_breed, a.pet_species, a.time, a.end_time, a.reference_number, a.service,
            a.doctor_id,
            CONCAT(d.first_name, ' ', d.last_name) AS doctor_name
        FROM appointments a
        LEFT JOIN internal_users d ON a.doctor_id = d.id
        WHERE a.reference_number = ?
        LIMIT 1
    ");
    $stmt->execute([$reference_number]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        http_response_code(404);
        echo json_encode(["error" => "Appointment not found."]);
        exit();
    }

    echo json_encode($appointment);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query error: " . $e->getMessage()]);
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}