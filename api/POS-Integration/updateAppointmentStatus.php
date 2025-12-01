<?php
include '../cors.php';
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

    // Validate required parameters
    if (!isset($data->client_id) || !isset($data->pet_names) || !isset($data->status)) {
        echo json_encode(['status' => 0, 'message' => 'Missing parameters']);
        exit;
    }

    $petNames = $data->pet_names; // array of pet names

    if (empty($petNames)) {
        echo json_encode(['status' => 0, 'message' => 'No pets provided']);
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

    $clientName = $client['name'];
    $clientContact = $client['cellnumber'];

    $placeholders = implode(',', array_fill(0, count($petNames), '?'));

    if ($data->status === 'Done') {
        $sql = "
            UPDATE appointments 
            SET status = ?, reference_number = 'ARCHIVED'
            WHERE name = ? 
            AND contact = ? 
            AND status = 'Arrived' 
            AND pet_name IN ($placeholders)
        ";
    } else {
        $sql = "
            UPDATE appointments 
            SET status = ?
            WHERE name = ? 
            AND contact = ? 
            AND status = 'Arrived' 
            AND pet_name IN ($placeholders)
        ";
    }

    $params = array_merge([$data->status, $clientName, $clientContact], $petNames);

    $stmt = $conn->prepare($sql);

    if ($stmt->execute($params)) {
        echo json_encode(['status' => 1, 'message' => 'Appointment status updated']);
    } else {
        echo json_encode(['status' => 0, 'message' => 'Failed to update appointment']);
    }
}
