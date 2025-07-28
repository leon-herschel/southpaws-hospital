<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $sql = "SELECT id, reference_number, service, date, time, end_time, name, contact, status FROM appointments";
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

    case 'PUT':
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['id']) || !isset($data['status'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields.'
        ]);
        exit;
    }

    try {
        $sql = "UPDATE appointments SET status = :status WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':status', $data['status']);
        $stmt->bindParam(':id', $data['id']);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Status updated successfully.'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update status.'
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
