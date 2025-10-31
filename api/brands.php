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

switch ($method) {

    case 'GET':
        $path = explode('/', $_SERVER['REQUEST_URI']);
    
        // Check if 'archived' is passed in the query string (default to 0 for non-archived)
        $archived = isset($_GET['archived']) ? $_GET['archived'] : 0;
        $archived = ($archived == 1) ? 1 : 0; // Ensure valid values
    
        // If an ID is provided in the URL, fetch a single brand
        if (isset($path[3]) && is_numeric($path[3])) {
            $sql = "SELECT id, name, created_by, updated_by, archived FROM brands WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $path[3], PDO::PARAM_INT);
            $stmt->execute();
            $brand = $stmt->fetch(PDO::FETCH_ASSOC);
    
            // If the brand exists, return it; otherwise, return an error message
            if ($brand) {
                echo json_encode(['brand' => $brand]); // ✅ Correctly returning a single brand
            } else {
                http_response_code(404);
                echo json_encode(['status' => 0, 'message' => 'Brand not found']);
            }
        } else {
            // Fetch all brands based on archived status
            $sql = "SELECT id, name, created_by, updated_by, archived FROM brands WHERE archived = :archived";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':archived', $archived, PDO::PARAM_INT);
            $stmt->execute();
            $brands = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            echo json_encode(['brands' => $brands]); // ✅ Correctly returning all brands
        }
        break;
    
    
        case 'POST':
            $brand = json_decode(file_get_contents('php://input'));
        
            // Convert the brand name to lowercase to ensure case-insensitivity
            $brandName = strtolower($brand->name);
            $createdBy = isset($brand->created_by) ? $brand->created_by : null; // Get created_by (null if not provided)
            date_default_timezone_set('Asia/Manila'); // ✅ Ensures Philippine Time (PHT)
            $createdAt = date('Y-m-d H:i:s'); // Generate current timestamp
        
            // Start a transaction
            $conn->beginTransaction();
        
            try {
                // Check if the brand name already exists (case-insensitive check)
                $sqlCheckName = "SELECT COUNT(*) FROM brands WHERE LOWER(name) = :name";
                $stmtCheckName = $conn->prepare($sqlCheckName);
                $stmtCheckName->bindParam(':name', $brandName);
                $stmtCheckName->execute();
                $exists = $stmtCheckName->fetchColumn();
        
                if ($exists) {
                    $response = ['status' => 0, 'message' => 'Brand name already exists.'];
                } else {
                    // Proceed with the insert if no duplicate name is found
                    $sqlInsert = "INSERT INTO brands (name, created_by, created_at) VALUES (:name, :created_by, :created_at)";
                    $stmtInsert = $conn->prepare($sqlInsert);
                    $stmtInsert->bindParam(':name', $brand->name);
                    $stmtInsert->bindParam(':created_by', $createdBy); // Add created_by field
                    $stmtInsert->bindParam(':created_at', $createdAt); // Add created_at field
                    $stmtInsert->execute();
        
                    // Commit transaction
                    $conn->commit();
        
                    // Fetch the newly added brand
                    $newBrandId = $conn->lastInsertId();
                    $sqlFetchNewBrand = "SELECT * FROM brands WHERE id = :id";
                    $stmtFetchNewBrand = $conn->prepare($sqlFetchNewBrand);
                    $stmtFetchNewBrand->bindParam(':id', $newBrandId);
                    $stmtFetchNewBrand->execute();
                    $newBrand = $stmtFetchNewBrand->fetch(PDO::FETCH_ASSOC);
        
                    $response = ['status' => 1, 'message' => 'Record created successfully.', 'new_brand' => $newBrand];
                }
            } catch (Exception $e) {
                // Rollback transaction if there was an error
                $conn->rollBack();
                error_log("Failed to create record: " . $e->getMessage());
                $response = ['status' => 0, 'message' => 'Failed to create record.'];
            }
        
            echo json_encode($response);
            break;
        
        

            case 'PUT':
                $brand = json_decode(file_get_contents('php://input'), true);
            
                if (isset($brand['id'])) { // Ensure brand ID is provided
                    $conn->beginTransaction();
                    try {
                        if (isset($brand['archived'])) {
                            // If 'archived' key exists, handle archive/restoration
                            $sql = "UPDATE brands SET archived = :archived WHERE id = :id";
                            $stmt = $conn->prepare($sql);
                            $stmt->bindParam(':archived', $brand['archived'], PDO::PARAM_INT);
                            $stmt->bindParam(':id', $brand['id'], PDO::PARAM_INT);
                            $stmt->execute();
                        }
            
                        if (isset($brand['name']) && isset($brand['updated_by'])) {
                            // Update name and updated_by if they exist
                            $sql = "UPDATE brands SET name = :name, updated_by = :updated_by WHERE id = :id";
                            $stmt = $conn->prepare($sql);
                            $stmt->bindParam(':id', $brand['id'], PDO::PARAM_INT);
                            $stmt->bindParam(':name', $brand['name'], PDO::PARAM_STR);
                            $stmt->bindParam(':updated_by', $brand['updated_by'], PDO::PARAM_INT);
                            $stmt->execute();
                        }
            
                        if ($stmt->rowCount() > 0) {
                            $conn->commit();
                            echo json_encode(['status' => 1, 'message' => 'Record updated successfully.']);
                        } else {
                            $conn->rollBack();
                            echo json_encode(['status' => 0, 'message' => 'No changes made. Perhaps the new data is the same as the old data.']);
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
    
    // Start a transaction
    $conn->beginTransaction();

    try {
        // Delete the brand
        $sqlDelete = "DELETE FROM brands WHERE id = :id";
        $stmtDelete = $conn->prepare($sqlDelete);
        $stmtDelete->bindParam(':id', $deletedId);
        $stmtDelete->execute();

        // Reassign IDs to avoid gaps and ensure they start from 1
        $sqlReassignIDs = "SET @id = 0; UPDATE brands SET id = (@id := @id + 1) ORDER BY id";
        $conn->exec($sqlReassignIDs);

        // Commit transaction
        $conn->commit();

        $response = ['status' => 1, 'message' => 'Record deleted successfully.'];
    } catch (Exception $e) {
        // Rollback transaction if there was an error
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
