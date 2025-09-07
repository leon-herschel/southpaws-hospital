<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Include database connection
include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

// Handle preflight requests
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

switch ($method) {
    case 'GET':
        $sql = "SELECT * FROM services WHERE archived = 0"; // Fetch only archived services
        $path = explode('/', $_SERVER['REQUEST_URI']);
    
        if (isset($path[3]) && is_numeric($path[3])) {
            $sql .= " AND id = :id"; // Filter by ID if provided
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $path[3], PDO::PARAM_INT);
        } else {
            $stmt = $conn->prepare($sql);
        }
    
        $stmt->execute();
        $services = isset($path[3]) ? $stmt->fetch(PDO::FETCH_ASSOC) : $stmt->fetchAll(PDO::FETCH_ASSOC);
    
        echo json_encode($services);
        break;
    

    case 'POST':
        $service = json_decode(file_get_contents('php://input'));

        // Trim name safely
        if (isset($service->name)) {
            $service->name = trim($service->name);
        }

        // Check if the service name already exists (case insensitive)
        $sqlCheck = "SELECT id FROM services WHERE LOWER(name) = LOWER(:name)";
        $stmtCheck = $conn->prepare($sqlCheck);
        $stmtCheck->bindParam(':name', $service->name);
        $stmtCheck->execute();
        
        if ($stmtCheck->rowCount() > 0) {
            echo json_encode(['status' => 0, 'message' => 'Service name must be unique.']);
            exit;
        }

        // Start a transaction
        $conn->beginTransaction();

        try {
            $sqlInsert = "INSERT INTO services (name, price, status, consent_form, created_at, created_by) 
                        VALUES (:name, :price, :status, :consent_form, :created_at, :created_by)";
            $stmtInsert = $conn->prepare($sqlInsert);
            date_default_timezone_set('Asia/Manila');
            $created_at = date('Y-m-d H:i:s');
            $created_by = "1";

            $stmtInsert->bindParam(':name', $service->name);
            $stmtInsert->bindParam(':price', $service->price);
            $stmtInsert->bindParam(':status', $service->status);
            $stmtInsert->bindParam(':consent_form', $service->consent_form);
            $stmtInsert->bindParam(':created_at', $created_at);
            $stmtInsert->bindParam(':created_by', $created_by);
            $stmtInsert->execute();

            $conn->commit();

            $response = ['status' => 1, 'message' => 'Record created successfully.'];
        } catch (Exception $e) {
            $conn->rollBack();
            $response = ['status' => 0, 'message' => 'Failed to create record: ' . $e->getMessage()];
        }

        echo json_encode($response);
    break;

    case 'PUT':
        $service = json_decode(file_get_contents('php://input'));
        $service->name = trim($service->name);

        if (isset($service->id) && isset($service->name) && isset($service->price) && isset($service->consent_form)) {
            // Check if the service name already exists (case insensitive) except for the current service
            $sqlCheck = "SELECT id FROM services WHERE LOWER(name) = LOWER(:name) AND id != :id";
            $stmtCheck = $conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':name', $service->name);
            $stmtCheck->bindParam(':id', $service->id);
            $stmtCheck->execute();
            
            if ($stmtCheck->rowCount() > 0) {
                echo json_encode(['status' => 0, 'message' => 'Service name must be unique.']);
                exit;
            }

            $sql = "UPDATE services SET name = :name, price = :price, status = :status, consent_form = :consent_form WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $service->id);
            $stmt->bindParam(':name', $service->name);
            $stmt->bindParam(':price', $service->price);
            $stmt->bindParam(':status', $service->status); // 'Available' or 'Unavailable'
            $stmt->bindParam(':consent_form', $service->consent_form);

            if ($stmt->execute()) {
                $response = ['status' => 1, 'message' => 'Record updated successfully.'];
            } else {
                $response = ['status' => 0, 'message' => 'Failed to update record.'];
            }
        } else {
            $response = ['status' => 0, 'message' => 'Invalid input data.'];
        }
        echo json_encode($response);
        break;

    case 'DELETE':
        $path = explode('/', $_SERVER['REQUEST_URI']);
        $deletedId = $path[3];

        // Start a transaction
        $conn->beginTransaction();

        try {
            // Delete the service
            $sqlDelete = "DELETE FROM services WHERE id = :id";
            $stmtDelete = $conn->prepare($sqlDelete);
            $stmtDelete->bindParam(':id', $deletedId);
            $stmtDelete->execute();

            // Reassign IDs to avoid gaps and ensure they start from 1
            $sqlReassignIDs = "SET @id = 0; UPDATE services SET id = (@id := @id + 1) ORDER BY id";
            $conn->exec($sqlReassignIDs);

            // Commit transaction
            $conn->commit();

            $response = ['status' => 1, 'message' => 'Record deleted successfully.'];
        } catch (Exception $e) {
            // Rollback transaction if there was an error
            $conn->rollBack();
            // Log detailed error for debugging
            error_log("Failed to delete record: " . $e->getMessage());
            $response = ['status' => 0, 'message' => 'Failed to delete record.'];
        }

        echo json_encode($response);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed.']);
        break;
}
?>
