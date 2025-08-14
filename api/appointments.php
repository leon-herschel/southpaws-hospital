<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

function logAudit($conn, $userId, $action, $table, $targetId, $desc = '', $email = '') {
    $stmt = $conn->prepare("
        INSERT INTO audit_logs (user_id, action, target_table, target_id, description, email)
        VALUES (:user_id, :action, :target_table, :target_id, :description, :email)
    ");
    $stmt->execute([
        ':user_id' => $userId,
        ':action' => $action,
        ':target_table' => $table,
        ':target_id' => $targetId,
        ':description' => $desc,
        'email' => $email,
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
             // Auto-cancel confirmed appointments that are past current date
            $autoCancel = $conn->prepare("
                UPDATE appointments
                SET status = 'Cancelled'
                WHERE status = 'Confirmed'
                AND date < CURDATE()
            ");
            $autoCancel->execute();

            $sql = "
                SELECT 
                    a.id, a.reference_number, a.service, a.date, a.time, a.end_time,
                    a.name, a.contact, a.email, a.pet_name, a.pet_species, a.pet_breed, a.status,
                    a.doctor_id,
                    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name
                FROM appointments a
                LEFT JOIN internal_users d ON a.doctor_id = d.id
            ";

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

        if (!isset($data['id']) || !isset($data['user_id'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing appointment ID or user ID.'
            ]);
            exit;
        }

        try {
            $sql = "DELETE FROM appointments WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $data['id']);

            if ($stmt->execute()) {
                logAudit(
    $conn,
    $data['user_id'],
    'reject',
    'appointments',
    $data['id'],
     $data['name'],
    $data['user_email']
);
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
            !isset($data['status']) ||
            !isset($data['doctor_id']) ||
            !isset($data['user_id']) 
        ) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields.'
            ]);
            exit;
        }

        try {
    // Get old status for comparison
    $statusStmt = $conn->prepare("SELECT status FROM appointments WHERE id = :id");
    $statusStmt->bindParam(':id', $data['id']);
    $statusStmt->execute();
    $oldStatusRow = $statusStmt->fetch(PDO::FETCH_ASSOC);
    $oldStatus = $oldStatusRow['status'] ?? null;

    $conflictStmt = $conn->prepare("
    SELECT COUNT(*) FROM appointments 
    WHERE date = :date 
    AND doctor_id = :doctor_id 
    AND id != :id
    AND (
        (time < :end_time AND end_time > :time) -- overlaps if start is before other's end, and end is after other's start
    )
    ");
    $conflictStmt->execute([
        ':date' => $data['date'],
        ':time' => $data['time'],
        ':end_time' => $data['end_time'],
        ':doctor_id' => $data['doctor_id'],
        ':id' => $data['id']
    ]);
    $conflictCount = $conflictStmt->fetchColumn();

    if ($conflictCount > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Schedule conflict: The selected doctor already has an overlapping appointment at this time.'
        ]);
        exit;
    }

    // Update appointment
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
                status = :status,
                doctor_id = :doctor_id
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
        $stmt->bindParam(':doctor_id', $data['doctor_id']);

    if ($stmt->execute()) {
        // Determine if status changed
        if ($oldStatus !== $data['status'] && $data['status'] === 'Confirmed') {
            logAudit(
                $conn,
                $data['user_id'],
                'confirm',
                'appointments',
                $data['id'],
                $data['name'],
                $data['user_email']
            );
        } else {
            logAudit(
                $conn,
                $data['user_id'],
                'update',
                'appointments',
                $data['id'],
                $data['name'],
                $data['user_email']
            );
        }

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
}
 catch (Exception $e) {
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
