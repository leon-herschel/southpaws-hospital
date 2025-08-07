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
    // Get appointment info
    $stmt = $conn->prepare("
        SELECT 
            a.name, a.contact, a.email, a.time, a.end_time, a.date, a.service, a.pet_name, a.pet_species, a.pet_breed,
            iu.first_name AS doctor_first_name, iu.last_name AS doctor_last_name
        FROM appointments a
        LEFT JOIN internal_users iu ON a.doctor_id = iu.id
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

    // Get client by name adn contact
    $stmt2 = $conn->prepare("
        SELECT * FROM clients 
        WHERE TRIM(LOWER(name)) = TRIM(LOWER(?)) 
        AND REPLACE(cellnumber, ' ', '') = REPLACE(?, ' ', '') 
        LIMIT 1
    ");
    $stmt2->execute([$appointment['name'], $appointment['contact']]);
    $client = $stmt2->fetch(PDO::FETCH_ASSOC);

    if (!$client) {
        http_response_code(404);
        echo json_encode(["error" => "Client not found."]);
        exit();
    }

    $client_id = $client['id'];

    // Get pets by client ID
    $stmt3 = $conn->prepare("SELECT name, species, breed FROM patients WHERE owner_id = ?");
    $stmt3->execute([$client_id]);
    $pets = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    // prepare response (strip unwanted fields if needed)
    $filteredClient = [
        'name' => $client['name'],
        'contact' => $client['cellnumber'],
        'email' => $client['email'] ?? null
    ];

    echo json_encode([
        "client" => $filteredClient,
        "appointment_service" => $appointment['service'],
        "appointment_date" => $appointment['date'],
        "appointment_time" => $appointment['time'],
        "appointment_end_time" => $appointment['end_time'],
        "appointment_doctor" => trim(($appointment['doctor_first_name'] ?? '') . ' ' . ($appointment['doctor_last_name'] ?? '')),
        "appointment_pet" => [
            "name" => $appointment['pet_name'],
            "species" => $appointment['pet_species'],
            "breed" => $appointment['pet_breed']
        ],
        "pets" => $pets
    ]);



} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query error: " . $e->getMessage()]);
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}