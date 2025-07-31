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
    // Step 1: Get appointment info
    $stmt = $conn->prepare("SELECT name, contact, service FROM appointments WHERE reference_number = ? LIMIT 1");
    $stmt->execute([$reference_number]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        http_response_code(404);
        echo json_encode(["error" => "Appointment not found."]);
        exit();
    }

    // Step 2: Use the name (or contact) to find the client in clients table
    $stmt2 = $conn->prepare("SELECT * FROM clients WHERE name = ? LIMIT 1");
    $stmt2->execute([$appointment['name']]);
    $client = $stmt2->fetch(PDO::FETCH_ASSOC);

    if (!$client) {
        http_response_code(404);
        echo json_encode(["error" => "Client not found."]);
        exit();
    }

    $client_id = $client['id'];

    // Step 3: Get all pets for this client
    $stmt3 = $conn->prepare("SELECT * FROM patients WHERE owner_id = ?");
    $stmt3->execute([$client_id]);
    $pets = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "client" => $client,
        "appointment_service" => $appointment['service'],
        "pets" => $pets
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query error: " . $e->getMessage()]);
}
