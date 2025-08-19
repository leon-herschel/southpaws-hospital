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
$client_id = $data['client_id'] ?? '';

    try {
        if ($client_id && $reference_number) {
        // --- Fetch client ---
        $stmt = $conn->prepare("SELECT id, name, cellnumber, email FROM clients WHERE id = ? LIMIT 1");
        $stmt->execute([$client_id]);
        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            echo json_encode(["success" => false, "message" => "Client not found."]);
            exit();
        }

        // --- Fetch their pets ---
        $stmt2 = $conn->prepare("SELECT name, species, breed FROM patients WHERE owner_id = ?");
        $stmt2->execute([$client_id]);
        $pets = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $stmt3 = $conn->prepare("
            SELECT a.service, a.date, a.time, a.end_time, a.pet_name, a.pet_species, a.pet_breed,
                iu.first_name AS doctor_first_name, iu.last_name AS doctor_last_name
            FROM appointments a
            LEFT JOIN internal_users iu ON a.doctor_id = iu.id
            WHERE a.reference_number = ?
            LIMIT 1
        ");
        $stmt3->execute([$reference_number]);
        $appointment = $stmt3->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "client" => [
                "name" => $client['name'],
                "contact" => $client['cellnumber'],
                "email" => $client['email'] ?? null
            ],
            "appointment_service" => $appointment['service'] ?? null,
            "appointment_date" => $appointment['date'] ?? null,
            "appointment_time" => $appointment['time'] ?? null,
            "appointment_end_time" => $appointment['end_time'] ?? null,
            "appointment_doctor" => isset($appointment['doctor_first_name']) 
                ? trim($appointment['doctor_first_name'].' '.$appointment['doctor_last_name']) 
                : null,
            "appointment_pet" => $appointment ? [
                "name" => $appointment['pet_name'],
                "species" => $appointment['pet_species'],
                "breed" => $appointment['pet_breed']
            ] : null,
            "pets" => $pets
        ]);
        exit();
    }

    if ($reference_number) {
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
            echo json_encode(["success" => false, "message" => "Appointment not found."]);
            exit();
        }

        $stmt2 = $conn->prepare("
            SELECT * FROM clients 
            WHERE TRIM(LOWER(name)) = TRIM(LOWER(?)) 
            AND REPLACE(cellnumber, ' ', '') = REPLACE(?, ' ', '') 
            LIMIT 1
        ");
        $stmt2->execute([$appointment['name'], $appointment['contact']]);
        $client = $stmt2->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            echo json_encode(["success" => false, "message" => "Client not found."]);
            exit();
        }

        $client_id = $client['id'];
        $stmt3 = $conn->prepare("SELECT name, species, breed FROM patients WHERE owner_id = ?");
        $stmt3->execute([$client_id]);
        $pets = $stmt3->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "client" => [
                "name" => $client['name'],
                "contact" => $client['cellnumber'],
                "email" => $client['email'] ?? null
            ],
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
        exit();
    }

    echo json_encode(["success" => false, "message" => "No client_id or reference_number provided."]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query error: " . $e->getMessage()]);
}
