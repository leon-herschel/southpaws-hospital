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
$pet_name   = $data['pet_name']   ?? null;
$pet_species = $data['pet_species'] ?? null;
$pet_breed  = $data['pet_breed']  ?? null;

$client_name   = $data['client_name']   ?? null;
$client_contact = $data['client_contact'] ?? null;
$client_email  = $data['client_email']  ?? null;

if (!$reference_number) {
    http_response_code(400);
    echo json_encode(["error" => "Reference number is required."]);
    exit();
}

try {
    if ($pet_name && $pet_species && $pet_breed && $client_name && $client_contact) {
        // Update everything (status + pet + client)
        $stmt = $conn->prepare("UPDATE appointments 
                                SET status = 'Arrived', 
                                    pet_name = ?, 
                                    pet_species = ?, 
                                    pet_breed = ?,
                                    name = ?, 
                                    contact = ?, 
                                    email = ?
                                WHERE reference_number = ?");
        $stmt->execute([$pet_name, $pet_species, $pet_breed, $client_name, $client_contact, $client_email, $reference_number]);
    } elseif ($pet_name && $pet_species && $pet_breed) {
        // Update status + pet only
        $stmt = $conn->prepare("UPDATE appointments 
                                SET status = 'Arrived', 
                                    pet_name = ?, 
                                    pet_species = ?, 
                                    pet_breed = ?
                                WHERE reference_number = ?");
        $stmt->execute([$pet_name, $pet_species, $pet_breed, $reference_number]);
    } else {
        // Update only status
        $stmt = $conn->prepare("UPDATE appointments 
                                SET status = 'Arrived' 
                                WHERE reference_number = ?");
        $stmt->execute([$reference_number]);
    }

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Appointment updated successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "No matching record found."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Update error: " . $e->getMessage()]);
}
