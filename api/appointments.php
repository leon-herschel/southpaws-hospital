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
            $sql = "SELECT id, reference_number, service, date, time, end_time, name, contact, email, pet_name, pet_species, pet_breed, status FROM appointments";
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

        if (
            !isset($data['id']) ||
            !isset($data['name']) ||
            !isset($data['contact']) ||
            !isset($data['email']) ||
            !isset($data['service']) ||
            !isset($data['date']) ||
            !isset($data['time']) ||
            !isset($data['end_time']) ||
            !isset($data['pet_name']) ||
            !isset($data['pet_species']) ||
            !isset($data['pet_breed']) ||
            !isset($data['status'])
        ) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields.'
            ]);
            exit;
        }

        try {
            $sql = "UPDATE appointments 
                    SET name = :name, 
                        contact = :contact, 
                        email = :email, 
                        service = :service, 
                        date = :date, 
                        time = :time, 
                        end_time = :end_time,
                        pet_name = :pet_name,
                        pet_species = :pet_species,
                        pet_breed = :pet_breed,
                        status = :status 
                    WHERE id = :id";

            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':contact', $data['contact']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':service', $data['service']);
            $stmt->bindParam(':date', $data['date']);
            $stmt->bindParam(':time', $data['time']);
            $stmt->bindParam(':end_time', $data['end_time']);
            $stmt->bindParam(':status', $data['status']);
            $stmt->bindParam(':id', $data['id']);
            $stmt->bindParam(':pet_name', $data['pet_name']);
            $stmt->bindParam(':pet_species', $data['pet_species']);
            $stmt->bindParam(':pet_breed', $data['pet_breed']);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Appointment updated successfully.'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update appointment.'
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
