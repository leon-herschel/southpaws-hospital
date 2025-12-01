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

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {

    try {
        if (!isset($_GET['client_id'])) {
            echo json_encode(['status' => 0, 'message' => 'Missing client_id']);
            exit;
        }

        if (!isset($_GET['pet_names']) || empty($_GET['pet_names'])) {
            echo json_encode(['status' => 0, 'message' => 'Missing pet_names']);
            exit;
        }

        $clientId = $_GET['client_id'];
        $petNames = array_map('trim', explode(',', $_GET['pet_names'])); // clean pet names
        $petNames = array_filter($petNames, fn($name) => $name !== ''); // remove empty strings
        if (empty($petNames)) {
            echo json_encode(['status' => 0, 'message' => 'No valid pet names provided.']);
            exit;
        }

        // Get client name + contact
        $stmtClient = $conn->prepare("
            SELECT name, cellnumber 
            FROM clients 
            WHERE id = :client_id
        ");
        $stmtClient->bindParam(':client_id', $clientId);
        $stmtClient->execute();
        $client = $stmtClient->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            echo json_encode(['status' => 0, 'message' => 'Client not found']);
            exit;
        }

        $clientName = $client['name'];
        $clientContact = $client['cellnumber'];

        // Fetch Arrived appointments for all selected pets
        $placeholders = implode(',', array_fill(0, count($petNames), '?'));
        $sql = "
            SELECT pet_name, service 
            FROM appointments 
            WHERE name = ?
            AND contact = ?
            AND status = 'Arrived'
            AND pet_name IN ($placeholders)
        ";

        $stmt = $conn->prepare($sql);
        $stmt->bindValue(1, $clientName);
        $stmt->bindValue(2, $clientContact);
        foreach ($petNames as $i => $pet) {
            $stmt->bindValue($i + 3, $pet); // +3 because 1 and 2 are clientName, clientContact
        }

        $stmt->execute();
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$appointments) {
            echo json_encode(['status' => 0, 'message' => 'No Arrived appointments found.']);
            exit;
        }

        // Aggregate services and count duplicates
        $serviceCounts = [];
        foreach ($appointments as $appt) {
            $services = array_map('trim', explode(',', $appt['service']));
            foreach ($services as $service) {
                if (!isset($serviceCounts[$service])) {
                    $serviceCounts[$service] = 0;
                }
                $serviceCounts[$service]++;
            }
        }

        // Fetch prices
        $servicesList = array_keys($serviceCounts);
        $placeholders = implode(',', array_fill(0, count($servicesList), '?'));
        $query = "SELECT name, price FROM services WHERE name IN ($placeholders)";
        $stmt = $conn->prepare($query);
        foreach ($servicesList as $index => $name) {
            $stmt->bindValue($index + 1, $name);
        }
        $stmt->execute();
        $servicesData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add quantity to services
        foreach ($servicesData as &$svc) {
            $svc['quantity'] = $serviceCounts[$svc['name']];
        }

        echo json_encode(['status' => 1, 'services' => $servicesData]);

    } catch (Exception $e) {
        error_log("Error: " . $e->getMessage());
        echo json_encode(['status' => 0, 'message' => 'Error fetching services']);
    }

    exit;
}
