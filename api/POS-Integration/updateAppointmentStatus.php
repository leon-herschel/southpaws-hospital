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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->client_id) || !isset($data->pet_name) || !isset($data->status)) {
        echo json_encode(['status' => 0, 'message' => 'Missing parameters']);
        exit;
    }

    // Get client info
    $stmtClient = $conn->prepare("SELECT name, cellnumber FROM clients WHERE id = :client_id");
    $stmtClient->bindParam(':client_id', $data->client_id);
    $stmtClient->execute();
    $client = $stmtClient->fetch(PDO::FETCH_ASSOC);

    if (!$client) {
        echo json_encode(['status' => 0, 'message' => 'Client not found']);
        exit;
    }

    // Update appointment status
    if ($data->status === 'Done') {
        $stmt = $conn->prepare("
            UPDATE appointments 
            SET status = :status,
                reference_number = 'ARCHIVED'
            WHERE name = :name 
            AND contact = :contact 
            AND pet_name = :pet_name 
            AND status = 'Arrived'
        ");
    } else {
        $stmt = $conn->prepare("
            UPDATE appointments 
            SET status = :status
            WHERE name = :name 
            AND contact = :contact 
            AND pet_name = :pet_name 
            AND status = 'Arrived'
        ");
    }

    $stmt->bindParam(':status', $data->status);
    $stmt->bindParam(':name', $client['name']);
    $stmt->bindParam(':contact', $client['cellnumber']);
    $stmt->bindParam(':pet_name', $data->pet_name);

    if ($stmt->execute()) {
        echo json_encode(['status' => 1, 'message' => 'Appointment status updated']);
    } else {
        echo json_encode(['status' => 0, 'message' => 'Failed to update appointment']);
    }
}
