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

try {
    switch ($method) {
        case 'GET':
            $path = explode('/', $_SERVER['REQUEST_URI']);
            
            // Check if 'archived' status is passed in the query string (default is 0 for non-archived)
            $archived = isset($_GET['archived']) ? $_GET['archived'] : 0;
            
            // Ensure archived is either 0 or 1
            $archived = ($archived == 1) ? 1 : 0;
            
            // SQL query to fetch suppliers based on archived status
            $sql = "SELECT id, supplier_name, contact_person, contact_number, email, address, archived, created_at, created_by FROM suppliers WHERE archived = :archived";
            
            // Check if a specific supplier is requested (based on the URL parameter)
            if (isset($path[3]) && is_numeric($path[3])) {
                $sql .= " AND id = :id"; // Add condition for specific supplier
                $stmt = $conn->prepare($sql);
                $stmt->bindParam(':id', $path[3], PDO::PARAM_INT);
                $stmt->bindParam(':archived', $archived, PDO::PARAM_INT);
                $stmt->execute();
                $suppliers = $stmt->fetch(PDO::FETCH_ASSOC);
            
                // Return just the supplier data (no count)
                echo json_encode(['suppliers' => $suppliers]);
            } else {
                // Fetch all suppliers based on the archived status
                $stmt = $conn->prepare($sql);
                $stmt->bindParam(':archived', $archived, PDO::PARAM_INT);
                $stmt->execute();
                $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
                // Fetch total suppliers count (only when fetching all suppliers)
                $sqlCount = "SELECT COUNT(*) AS total_suppliers FROM suppliers WHERE archived = :archived";
                $stmtCount = $conn->prepare($sqlCount);
                $stmtCount->bindParam(':archived', $archived, PDO::PARAM_INT);
                $stmtCount->execute();
                $totalSuppliers = $stmtCount->fetch(PDO::FETCH_ASSOC)['total_suppliers'];
            
                // Return both suppliers and total count
                $response = [
                    'total_suppliers' => $totalSuppliers,
                    'suppliers' => $suppliers
                ];
                echo json_encode($response);
            }
            break;
        
 case 'POST':
    $supplier = json_decode(file_get_contents('php://input'), true);

    // Check if required fields are provided
    if (!isset($supplier['supplier_name']) || empty($supplier['supplier_name'])) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'Supplier name is required.']);
        exit;
    }

    // Convert the supplier name to lowercase for case-insensitive check
    $supplierNameLower = strtolower($supplier['supplier_name']);

    // Check if supplier name exists (case-insensitive)
    $checkSql = "SELECT COUNT(*) AS count FROM suppliers WHERE LOWER(supplier_name) = :supplier_name AND archived = 0";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':supplier_name', $supplierNameLower, PDO::PARAM_STR);
    $checkStmt->execute();
    $exists = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;

    if ($exists) {
        http_response_code(409); // Conflict
        echo json_encode(['status' => 0, 'message' => 'Supplier name already exists.']);
        exit;
    }

    // Prepare insert query with `created_by`
    $sqlInsert = "INSERT INTO suppliers (supplier_name, contact_person, contact_number, email, address, archived, created_at, created_by) 
                  VALUES (:supplier_name, :contact_person, :contact_number, :email, :address, 0, :created_at, :created_by)";
    $stmtInsert = $conn->prepare($sqlInsert);
    $created_at = date('Y-m-d H:i:s');

    // Ensure `created_by` is set from frontend, default to `NULL` if not provided
    $created_by = isset($supplier['created_by']) ? (int) $supplier['created_by'] : null;

    $stmtInsert->bindParam(':supplier_name', $supplier['supplier_name'], PDO::PARAM_STR);
    $stmtInsert->bindParam(':contact_person', $supplier['contact_person'], PDO::PARAM_STR);
    $stmtInsert->bindParam(':contact_number', $supplier['contact_number'], PDO::PARAM_STR);
    $stmtInsert->bindParam(':email', $supplier['email'], PDO::PARAM_STR);
    $stmtInsert->bindParam(':address', $supplier['address'], PDO::PARAM_STR);
    $stmtInsert->bindParam(':created_at', $created_at);
    $stmtInsert->bindParam(':created_by', $created_by, PDO::PARAM_INT); // Ensure created_by is stored as an integer

    if ($stmtInsert->execute()) {
        http_response_code(201); // Created
        echo json_encode(['status' => 1, 'message' => 'Supplier created successfully.']);
    } else {
        http_response_code(500); // Internal Server Error
        echo json_encode(['status' => 0, 'message' => 'Failed to create supplier.']);
    }
    break;

case 'PUT':
    // Decode the incoming JSON request
    $data = json_decode(file_get_contents('php://input'), true);

    // Log incoming request data
    error_log('Received PUT data: ' . print_r($data, true));

    // Check if this is a bulk archive/restore request
    if (isset($data['ids']) && is_array($data['ids']) && isset($data['archived'])) {
        $supplierIds = $data['ids']; // Array of supplier IDs
        $archivedStatus = $data['archived']; // 1 for archive, 0 for restore

        // Convert array to a comma-separated list for SQL
        $idList = implode(',', array_map('intval', $supplierIds));

        // Archive or Restore multiple suppliers in one query
        $sqlBulkUpdate = "UPDATE suppliers SET archived = :archived WHERE id IN ($idList)";
        $stmtBulkUpdate = $conn->prepare($sqlBulkUpdate);
        $stmtBulkUpdate->bindParam(':archived', $archivedStatus, PDO::PARAM_INT);

        if ($stmtBulkUpdate->execute()) {
            $message = $archivedStatus == 1 ? 'Suppliers archived successfully.' : 'Suppliers restored successfully.';
            error_log($message);
            echo json_encode(['status' => 1, 'message' => count($supplierIds) . ' suppliers ' . ($archivedStatus == 1 ? 'archived' : 'restored') . ' successfully.']);
        } else {
            error_log('Error: Failed to update archived status for multiple suppliers.');
            http_response_code(500);
            echo json_encode(['status' => 0, 'message' => 'Failed to update suppliers.']);
        }
        exit; // Stop execution after handling bulk archive/restore
    }

    // --- SINGLE SUPPLIER UPDATE ---
    $path = explode('/', $_SERVER['REQUEST_URI']);
    error_log('Requested URL path: ' . print_r($path, true));

    // Check if the ID is being passed in the URL
    if (!isset($path[3]) || !is_numeric($path[3])) {
        error_log('Error: Supplier ID missing in URL');
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'ID is required.']);
        exit;
    }

    $supplierId = $path[3]; // Extract ID from URL
    error_log('Processing supplier with ID: ' . $supplierId);

    // Handle Single Archive or Restore (DOES NOT INCLUDE UPDATED_BY)
    if (isset($data['archived'])) {
        $sqlArchive = "UPDATE suppliers SET archived = :archived WHERE id = :id";
        $stmtArchive = $conn->prepare($sqlArchive);
        $stmtArchive->bindParam(':id', $supplierId, PDO::PARAM_INT);
        $stmtArchive->bindParam(':archived', $data['archived'], PDO::PARAM_INT);

        if ($stmtArchive->execute()) {
            $message = $data['archived'] == 1 ? 'Supplier archived successfully.' : 'Supplier restored successfully.';
            error_log($message);
            echo json_encode(['status' => 1, 'message' => $message]);
        } else {
            error_log('Error: Failed to change archived status for supplier ID: ' . $supplierId);
            http_response_code(500);
            echo json_encode(['status' => 0, 'message' => 'Failed to change archived status.']);
        }
        exit; // Stop further execution
    }

    // If 'archived' is NOT passed, proceed to update other supplier data
    $supplierNameLower = strtolower($data['supplier_name']);

    // Check if the updated supplier name already exists
    $checkSql = "SELECT COUNT(*) AS count FROM suppliers WHERE LOWER(supplier_name) = :supplier_name AND id != :id AND archived = 0";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':supplier_name', $supplierNameLower, PDO::PARAM_STR);
    $checkStmt->bindParam(':id', $supplierId, PDO::PARAM_INT);
    $checkStmt->execute();
    $exists = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;

    if ($exists) {
        http_response_code(409);
        echo json_encode(['status' => 0, 'message' => 'Supplier name already exists.']);
        exit;
    }

    // Ensure 'updated_by' exists before proceeding
    if (!isset($data['updated_by'])) {
        http_response_code(400);
        echo json_encode(['status' => 0, 'message' => 'Updated by field is required.']);
        exit;
    }

    // Prepare SQL query to update supplier data (INCLUDES updated_by)
    $sqlUpdate = "UPDATE suppliers SET 
                    supplier_name = :supplier_name,
                    contact_person = :contact_person,
                    contact_number = :contact_number,
                    email = :email,
                    address = :address,
                    updated_by = :updated_by
                  WHERE id = :id";

    $stmtUpdate = $conn->prepare($sqlUpdate);
    $stmtUpdate->bindParam(':id', $supplierId, PDO::PARAM_INT);
    $stmtUpdate->bindParam(':supplier_name', $data['supplier_name'], PDO::PARAM_STR);
    $stmtUpdate->bindParam(':contact_person', $data['contact_person'], PDO::PARAM_STR);
    $stmtUpdate->bindParam(':contact_number', $data['contact_number'], PDO::PARAM_STR);
    $stmtUpdate->bindParam(':email', $data['email'], PDO::PARAM_STR);
    $stmtUpdate->bindParam(':address', $data['address'], PDO::PARAM_STR);
    $stmtUpdate->bindParam(':updated_by', $data['updated_by'], PDO::PARAM_INT); // Ensuring updated_by is an integer

    if ($stmtUpdate->execute()) {
        error_log('Supplier updated successfully.');
        echo json_encode(['status' => 1, 'message' => 'Supplier updated successfully.']);
    } else {
        error_log('Error: Failed to update supplier data for ID: ' . $supplierId);
        http_response_code(500);
        echo json_encode(['status' => 0, 'message' => 'Failed to update supplier data.']);
    }
    break;

            

            
    
            case 'DELETE':
                $path = explode('/', $_SERVER['REQUEST_URI']);
                if (!isset($path[3]) || !is_numeric($path[3])) {
                    http_response_code(400);
                    echo json_encode(['status' => 0, 'message' => 'Invalid ID for deletion.']);
                    exit;
                }
            
                $deletedId = $path[3];
            
                // Prepare the SQL query to delete the supplier
                $sqlDelete = "DELETE FROM suppliers WHERE id = :id";
                $stmtDelete = $conn->prepare($sqlDelete);
                $stmtDelete->bindParam(':id', $deletedId, PDO::PARAM_INT);
            
                // Execute the delete query
                if ($stmtDelete->execute()) {
                    echo json_encode(['status' => 1, 'message' => 'Supplier deleted successfully.']);
                } else {
                    http_response_code(500);
                    echo json_encode(['status' => 0, 'message' => 'Failed to delete supplier.']);
                }
                break;
            
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 0, 'message' => 'An error occurred: ' . $e->getMessage()]);
    }
    ?>
