<?php
include 'cors.php';
header("Content-Type: application/json");


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
switch ($method) {
    case 'GET':
        $path = explode('/', $_SERVER['REQUEST_URI']);

        // Check if 'archived' is passed in the query string (default to 0 for active)
        $archived = isset($_GET['archived']) ? (int)$_GET['archived'] : 0;
        $archived = ($archived === 1) ? 1 : 0;

        if (isset($path[3]) && is_numeric($path[3])) {
            // Fetch a single unit
            $sql = "SELECT id, unit_name, created_by, updated_by, created_at, archived 
                    FROM unit_of_measurement 
                    WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $path[3], PDO::PARAM_INT);
            $stmt->execute();
            $unit = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($unit) {
                echo json_encode(['unit' => $unit]);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 0, 'message' => 'Unit not found']);
            }
        } else {
            // Fetch all units filtered by archived status
            $sql = "SELECT id, unit_name, created_by, updated_by, created_at, archived 
                    FROM unit_of_measurement 
                    WHERE archived = :archived 
                    ORDER BY id DESC";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':archived', $archived, PDO::PARAM_INT);
            $stmt->execute();
            $units = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['units' => $units]);
        }
        break;

    case 'POST':
        $unit = json_decode(file_get_contents('php://input'), true);

        if (!isset($unit['unit_name']) || !isset($unit['created_by'])) {
            echo json_encode(['status' => 0, 'message' => 'Missing required fields.']);
            exit;
        }

        $unitName = strtolower($unit['unit_name']);
        $createdBy = intval($unit['created_by']);

        $conn->beginTransaction();
        try {
            // Check if unit already exists (case-insensitive)
            $sqlCheck = "SELECT COUNT(*) FROM unit_of_measurement WHERE LOWER(unit_name) = :unit_name";
            $stmtCheck = $conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':unit_name', $unitName, PDO::PARAM_STR);
            $stmtCheck->execute();
            $exists = $stmtCheck->fetchColumn();

            if ($exists) {
                echo json_encode(['status' => 0, 'message' => 'Unit name already exists.']);
                exit;
            }

            // Insert the new unit
            $sqlInsert = "INSERT INTO unit_of_measurement (unit_name, created_by) VALUES (:unit_name, :created_by)";
            $stmtInsert = $conn->prepare($sqlInsert);
            $stmtInsert->bindParam(':unit_name', $unit['unit_name'], PDO::PARAM_STR);
            $stmtInsert->bindParam(':created_by', $createdBy, PDO::PARAM_INT);
            $stmtInsert->execute();

            $conn->commit();
            echo json_encode(['status' => 1, 'message' => 'Unit created successfully.']);
        } catch (Exception $e) {
            $conn->rollBack();
            error_log("Failed to create unit: " . $e->getMessage());
            echo json_encode(['status' => 0, 'message' => 'Failed to create unit.']);
        }
        break;

case 'PUT':
    $unit = json_decode(file_get_contents('php://input'), true);

    if (isset($unit['id'])) { // Ensure unit ID is provided
        $conn->beginTransaction();
        try {
            // 1. Else If Regular Unit Update (if 'unit_name' and 'updated_by' are provided)
            if (isset($unit['unit_name']) && isset($unit['updated_by'])) {
                $sqlUpdate = "UPDATE unit_of_measurement SET unit_name = :unit_name, updated_by = :updated_by WHERE id = :id";
                $stmtUpdate = $conn->prepare($sqlUpdate);
                $stmtUpdate->bindParam(':id', $unit['id'], PDO::PARAM_INT);
                $stmtUpdate->bindParam(':unit_name', $unit['unit_name'], PDO::PARAM_STR);
                $stmtUpdate->bindParam(':updated_by', $unit['updated_by'], PDO::PARAM_INT);
                $stmtUpdate->execute();
                $conn->commit();

                // Return success message after regular update
                echo json_encode(['status' => 1, 'message' => 'Unit updated successfully.']);
                exit; // Exit after the update
            }

            // 2. Handle Archival Status Update (if 'archived' key exists)
            else if (isset($unit['archived'])) {
                $sqlUpdate = "UPDATE unit_of_measurement SET archived = :archived WHERE id = :id";
                $stmtUpdate = $conn->prepare($sqlUpdate);
                $stmtUpdate->bindParam(':id', $unit['id'], PDO::PARAM_INT);
                $stmtUpdate->bindParam(':archived', $unit['archived'], PDO::PARAM_INT);
                $stmtUpdate->execute();
                $conn->commit();

                // Return success message after archival update
                echo json_encode(['status' => 1, 'message' => 'Unit archived successfully.']);
                exit; // Exit after archiving, as no other actions need to be performed
            }

            // 3. If no valid fields provided, return error
            else {
                echo json_encode(['status' => 0, 'message' => 'No valid update data provided.']);
            }
        } catch (Exception $e) {
            $conn->rollBack();
            error_log("Failed to update unit: " . $e->getMessage());
            echo json_encode(['status' => 0, 'message' => 'Failed to update unit.']);
        }
    } else {
        echo json_encode(['status' => 0, 'message' => 'Invalid input data.']);
    }
    break;




    case 'DELETE':
        $path = explode('/', $_SERVER['REQUEST_URI']);
    
        // Check if the unit ID is provided and if it's a valid number
        if (!isset($path[3]) || !is_numeric($path[3])) {
            echo json_encode(['status' => 0, 'message' => 'Invalid unit ID.']);
            exit;
        }
    
        $deletedId = intval($path[3]);
    
        $conn->beginTransaction();
        try {
            // Check if the unit exists
            $sqlCheck = "SELECT id FROM unit_of_measurement WHERE id = :id";
            $stmtCheck = $conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':id', $deletedId, PDO::PARAM_INT);
            $stmtCheck->execute();
    
            if (!$stmtCheck->fetch(PDO::FETCH_ASSOC)) {
                echo json_encode(['status' => 0, 'message' => 'Unit of measurement not found.']);
                exit;
            }
    
            // Delete the unit of measurement
            $sqlDelete = "DELETE FROM unit_of_measurement WHERE id = :id";
            $stmtDelete = $conn->prepare($sqlDelete);
            $stmtDelete->bindParam(':id', $deletedId, PDO::PARAM_INT);
            $stmtDelete->execute();
    
            // Reassign IDs to avoid gaps (optional)
            $sqlReassignIDs = "SET @id = 0; UPDATE unit_of_measurement SET id = (@id := @id + 1) ORDER BY id";
            $conn->exec($sqlReassignIDs);
    
            // Commit transaction
            $conn->commit();
            echo json_encode(['status' => 1, 'message' => 'Unit of measurement deleted successfully.']);
        } catch (Exception $e) {
            // Rollback transaction if there was an error
            $conn->rollBack();
            error_log("Failed to delete unit of measurement: " . $e->getMessage());
            echo json_encode(['status' => 0, 'message' => 'Failed to delete unit of measurement.']);
        }
        break;
    

    default:
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed.']);
        break;
}
?>
