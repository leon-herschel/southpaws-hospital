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

if ($method === 'GET') {
    try {
        if (!isset($_GET['client_id'])) {
            echo json_encode(['status' => 0, 'message' => 'Missing client_id']);
            exit;
        }

        $clientId = $_GET['client_id'];
        if (!isset($_GET['pet_name']) || empty($_GET['pet_name'])) {
            echo json_encode(['status' => 0, 'message' => 'Missing pet_name']);
            exit;
        }
        $petName = $_GET['pet_name'];

        // Get client's contact number (used to match appointment.name + contact)
        $stmtClient = $conn->prepare("SELECT name, cellnumber FROM clients WHERE id = :client_id");
        $stmtClient->bindParam(':client_id', $clientId);
        $stmtClient->execute();
        $client = $stmtClient->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            echo json_encode(['status' => 0, 'message' => 'Client not found']);
            exit;
        }

        $clientName = $client['name'];
        $clientContact = $client['cellnumber'];

        // Build appointment query
        $sql = "SELECT service FROM appointments 
                WHERE name = :client_name AND contact = :client_contact 
                AND status = 'Arrived' AND pet_name = :pet_name";
        if ($petName) {
            $sql .= " AND pet_name = :pet_name";
        }

        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':client_name', $clientName);
        $stmt->bindParam(':client_contact', $clientContact);
        if ($petName) {
            $stmt->bindParam(':pet_name', $petName);
        }
        $stmt->execute();
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$appointments) {
            echo json_encode(['status' => 0, 'message' => 'No Arrived appointments found.']);
            exit;
        }

        // Gather all service names into one array
        $servicesList = [];
        foreach ($appointments as $appt) {
            $serviceArray = array_map('trim', explode(',', $appt['service']));
            $servicesList = array_merge($servicesList, $serviceArray);
        }

        $servicesList = array_unique($servicesList); // Remove duplicates

        // Fetch service prices
        $placeholders = implode(',', array_fill(0, count($servicesList), '?'));
        $query = "SELECT name, price FROM services WHERE name IN ($placeholders)";
        $stmt = $conn->prepare($query);
        foreach ($servicesList as $index => $name) {
            $stmt->bindValue($index + 1, $name);
        }
        $stmt->execute();
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 1, 'services' => $services]);

    } catch (Exception $e) {
        error_log("Error: " . $e->getMessage());
        echo json_encode(['status' => 0, 'message' => 'Error fetching services']);
    }
    exit;
}
