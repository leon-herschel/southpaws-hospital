<?php
// Allow requests from frontend (React running on localhost:3000)
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

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
        $path = explode('/', $_SERVER['REQUEST_URI']);

        // Check if 'archived' is passed in the query string (default to 0 for non-archived)
        $archived = isset($_GET['archived']) ? $_GET['archived'] : 0;
        $archived = ($archived == 1) ? 1 : 0; // Ensure valid values

        // Fetch a single record by ID
        if (isset($path[3]) && is_numeric($path[3])) {
            $sql = "SELECT id, generic_name, created_by, updated_by FROM generic_cms WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $path[3], PDO::PARAM_INT);
            $stmt->execute();
            $record = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode($record ? ['record' => $record] : ['status' => 0, 'message' => 'Record not found']);
        } else {
            // Fetch all records
            $sql = "SELECT id, generic_name, created_by, updated_by FROM generic_cms";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['records' => $records]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'));

        $genericName = strtolower($data->generic_name);
        $createdBy = isset($data->created_by) ? $data->created_by : null;
        date_default_timezone_set('Asia/Manila'); // ✅ Ensures Philippine Time (PHT)
        $createdAt = date('Y-m-d H:i:s');

        $conn->beginTransaction();

        try {
            // Check for duplicate entry (case-insensitive)
            $sqlCheck = "SELECT COUNT(*) FROM generic_cms WHERE LOWER(generic_name) = :generic_name";
            $stmtCheck = $conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':generic_name', $genericName);
            $stmtCheck->execute();
            $exists = $stmtCheck->fetchColumn();

            if ($exists) {
                $response = ['status' => 0, 'message' => 'Generic name already exists.'];
            } else {
                // Insert new record
                $sqlInsert = "INSERT INTO generic_cms (generic_name, created_by, created_at) VALUES (:generic_name, :created_by, :created_at)";
                $stmtInsert = $conn->prepare($sqlInsert);
                $stmtInsert->bindParam(':generic_name', $data->generic_name);
                $stmtInsert->bindParam(':created_by', $createdBy);
                $stmtInsert->bindParam(':created_at', $createdAt);
                $stmtInsert->execute();

                $conn->commit();
                $newId = $conn->lastInsertId();
                $sqlFetch = "SELECT * FROM generic_cms WHERE id = :id";
                $stmtFetch = $conn->prepare($sqlFetch);
                $stmtFetch->bindParam(':id', $newId);
                $stmtFetch->execute();
                $newRecord = $stmtFetch->fetch(PDO::FETCH_ASSOC);

                $response = ['status' => 1, 'message' => 'Record created successfully.', 'new_record' => $newRecord];
            }
        } catch (Exception $e) {
            $conn->rollBack();
            error_log("Failed to create record: " . $e->getMessage());
            $response = ['status' => 0, 'message' => 'Failed to create record.'];
        }

        echo json_encode($response);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);

        if (isset($data['id'])) {
            $conn->beginTransaction();
            try {
                if (isset($data['generic_name']) && isset($data['updated_by'])) {
                    $sql = "UPDATE generic_cms SET generic_name = :generic_name, updated_by = :updated_by WHERE id = :id";
                    $stmt = $conn->prepare($sql);
                    $stmt->bindParam(':id', $data['id'], PDO::PARAM_INT);
                    $stmt->bindParam(':generic_name', $data['generic_name'], PDO::PARAM_STR);
                    $stmt->bindParam(':updated_by', $data['updated_by'], PDO::PARAM_INT);
                    $stmt->execute();
                }

                if ($stmt->rowCount() > 0) {
                    $conn->commit();
                    echo json_encode(['status' => 1, 'message' => 'Record updated successfully.']);
                } else {
                    $conn->rollBack();
                    echo json_encode(['status' => 0, 'message' => 'No changes made.']);
                }
            } catch (Exception $e) {
                $conn->rollBack();
                error_log("Failed to update record: " . $e->getMessage());
                echo json_encode(['status' => 0, 'message' => 'Failed to update record.', 'error' => $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 0, 'message' => 'Invalid input data.']);
        }
        break;

    case 'DELETE':
        $path = explode('/', $_SERVER['REQUEST_URI']);
        $deletedId = $path[3];

        $conn->beginTransaction();
        try {
            $sqlDelete = "DELETE FROM generic_cms WHERE id = :id";
            $stmtDelete = $conn->prepare($sqlDelete);
            $stmtDelete->bindParam(':id', $deletedId, PDO::PARAM_INT);
            $stmtDelete->execute();

            $conn->commit();
            $response = ['status' => 1, 'message' => 'Record deleted successfully.'];
        } catch (Exception $e) {
            $conn->rollBack();
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
