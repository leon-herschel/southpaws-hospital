<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $sql = "SELECT id, service, date, time, end_time, name, contact FROM appointments ORDER BY date DESC, time DESC";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 1,
                'appointments' => $appointments
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'status' => 0,
                'message' => 'Failed to fetch appointments.',
                'error' => $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);

        if (
            !isset($data['service']) || 
            !isset($data['date']) || 
            !isset($data['time']) || 
            !isset($data['end_time']) || // ✅ make sure end_time is included
            !isset($data['name']) || 
            !isset($data['contact'])
        ) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields.'
            ]);
            exit;
        }

        try {
            $sql = "INSERT INTO appointments (service, date, time, end_time, name, contact) 
                    VALUES (:service, :date, :time, :end_time, :name, :contact)";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':service', $data['service']);
            $stmt->bindParam(':date', $data['date']);
            $stmt->bindParam(':time', $data['time']);
            $stmt->bindParam(':end_time', $data['end_time']); // ✅ bind end_time
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':contact', $data['contact']);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Appointment created successfully.'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create appointment.'
                ]);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ]);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing appointment ID.'
            ]);
            exit;
        }

        try {
            $sql = "DELETE FROM appointments WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $data['id']);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Appointment deleted successfully.'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete appointment.'
                ]);
            }
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ]);
        }
        break;

    case 'OPTIONS':
        http_response_code(200);
        break;

    default:
        http_response_code(405);
        echo json_encode([
            'status' => 0,
            'message' => 'Method not allowed.'
        ]);
        break;
}
