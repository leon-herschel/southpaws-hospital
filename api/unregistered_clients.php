<?php
include 'cors.php';

include 'DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
switch ($method) {
    case 'POST':
        if ($action === 'create') {
            $data = json_decode(file_get_contents('php://input'), true);
            $clientName = trim($data['name'] ?? '');
            $clientEmail = trim($data['email'] ?? '');

            if (!$clientName) {
                echo json_encode(['status' => 0, 'message' => 'Client name is required.']);
                exit;
            }

            if (!filter_var($clientEmail, FILTER_VALIDATE_EMAIL)) {
                echo json_encode(['status' => 0, 'message' => 'Invalid email address.']);
                exit;
            }

            try {
                // ✅ Insert new unregistered client with email
                $sqlInsert = "INSERT INTO unregistered_clients (name, email) VALUES (:name, :email)";
                $stmtInsert = $conn->prepare($sqlInsert);
                $stmtInsert->bindParam(':name', $clientName, PDO::PARAM_STR);
                $stmtInsert->bindParam(':email', $clientEmail, PDO::PARAM_STR);
                $stmtInsert->execute();

                $newClientId = $conn->lastInsertId(); // ✅ Get new client ID
                echo json_encode([
                    'status' => 1,
                    'unregistered_client_id' => $newClientId,
                    'email' => $clientEmail
                ]);

            } catch (Exception $e) {
                echo json_encode(['status' => 0, 'message' => 'Error creating unregistered client: ' . $e->getMessage()]);
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
}
?>
