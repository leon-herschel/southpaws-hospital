<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // Fetch total inventory count
            $sqlCount = "SELECT COUNT(*) AS total_inventory FROM inventory";
            $stmtCount = $conn->prepare($sqlCount);
            $stmtCount->execute();
            $resultCount = $stmtCount->fetch(PDO::FETCH_ASSOC);
            $total_inventory = $resultCount['total_inventory'];
    
            // Check if archived parameter is passed (default to 0)
            $archived = isset($_GET['archived']) ? intval($_GET['archived']) : 0;
    
            // Base query to fetch inventory data with joins
            $sqlInventory = "SELECT 
                i.id, i.product_id, i.supplier_id, i.sku, i.barcode, i.price, i.quantity, 
                i.total_count, i.item_sold, i.expiration_date, i.created_at, i.created_by, i.updated_by, i.archived,
                u.unit_name AS unit_name, p.product_name AS product_name,
                g.generic_name AS generic_name,                                 
                s.supplier_name AS supplier_name,
                c.name AS category_name,
                b.name AS brand_name
            FROM inventory i
            LEFT JOIN products p ON i.product_id = p.id
            LEFT JOIN unit_of_measurement u ON p.unit_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN suppliers s ON i.supplier_id = s.id
            LEFT JOIN generic_cms g ON p.generic_id = g.id
            WHERE i.archived = :archived";
    
            $path = explode('/', $_SERVER['REQUEST_URI']);
    
            // If product_id is passed in URL, filter by product_id
            if (isset($path[3]) && is_numeric($path[3])) {
                $sqlInventory .= " AND i.product_id = :product_id";
                $stmtInventory = $conn->prepare($sqlInventory);
                $stmtInventory->bindParam(':product_id', $path[3], PDO::PARAM_INT);
            } else {
                // Prepare statement without product filter
                $stmtInventory = $conn->prepare($sqlInventory);
            }
    
            $stmtInventory->bindParam(':archived', $archived, PDO::PARAM_INT);
            $stmtInventory->execute();
            $inventoryResult = $stmtInventory->fetchAll(PDO::FETCH_ASSOC);
    
            // Process fetched inventory data
            $inventory = [];
            if (!empty($inventoryResult)) {
                foreach ($inventoryResult as &$item) {
                    // Ensure price is numeric and default to 0.00 if missing
                    $item['price'] = !empty($item['price']) ? floatval($item['price']) : 0.00;
                }
                $inventory = $inventoryResult;
            } else {
                error_log("No inventory found.");
            }
    
            // Construct response
            $response = [
                'status' => 'success',
                'total_inventory' => $total_inventory, // Total count
                'inventory' => $inventory
            ];
            echo json_encode($response);
    
        } catch (Exception $e) {
            // Handle error response
            error_log("Error fetching inventory: " . $e->getMessage());
            $response = [
                'status' => 'error',
                'message' => 'An error occurred: ' . $e->getMessage()
            ];
            echo json_encode($response);
        }
        break;
    

        case 'POST':
            $inventory = json_decode(file_get_contents('php://input'), true);
        
            // 🔍 **Check if all required fields are present**
            if (!isset($inventory['product_id'], $inventory['sku'], $inventory['supplier_id'], $inventory['barcode'], 
                      $inventory['price'], $inventory['quantity'], $inventory['expiration_date'], 
                      $inventory['created_by'])) {
                echo json_encode(['status' => 0, 'message' => 'Missing required fields.']);
                exit();
            }
        
            // 🔴 **Check if SKU already exists**
            $skuCheckSql = "SELECT COUNT(*) FROM inventory WHERE sku = :sku";
            $skuCheckStmt = $conn->prepare($skuCheckSql);
            $skuCheckStmt->bindParam(':sku', $inventory['sku']);
            $skuCheckStmt->execute();
            $skuExists = $skuCheckStmt->fetchColumn();
        
            if ($skuExists > 0) {
                echo json_encode(["status" => 0, "message" => "This SKU already exists. Please enter a unique SKU."]);
                exit();
            }
        
            // 🔍 **Check if the barcode already exists for the same supplier & expiration date**
            $checkSql = "SELECT id, total_count, quantity FROM inventory 
                         WHERE barcode = :barcode 
                         AND supplier_id = :supplier_id 
                         AND expiration_date = :expiration_date";
            $checkStmt = $conn->prepare($checkSql);
            $checkStmt->bindParam(':barcode', $inventory['barcode']);
            $checkStmt->bindParam(':supplier_id', $inventory['supplier_id']);
            $checkStmt->bindParam(':expiration_date', $inventory['expiration_date']);
            $checkStmt->execute();
            $existingInventory = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
            if ($existingInventory) {
                // ✅ **Update quantity if barcode already exists**
                $newTotalCount = $existingInventory['total_count'] + $inventory['quantity'];
                $newQuantity = $existingInventory['quantity'] + $inventory['quantity'];
        
                $updateSql = "UPDATE inventory 
                              SET quantity = :new_quantity, total_count = :new_total_count
                              WHERE id = :id";
                $updateStmt = $conn->prepare($updateSql);
                $updateStmt->bindParam(':new_quantity', $newQuantity);
                $updateStmt->bindParam(':new_total_count', $newTotalCount);
                $updateStmt->bindParam(':id', $existingInventory['id']);
        
                if ($updateStmt->execute()) {
                    echo json_encode(['status' => 1, 'message' => 'Inventory updated successfully.']);
                } else {
                    echo json_encode(['status' => 0, 'message' => 'Failed to update inventory.']);
                }
            } else {
                // ✅ **Insert new inventory entry if barcode is new**
                try {
                    $sql = "INSERT INTO inventory (sku, product_id, supplier_id, barcode, price, quantity, total_count, item_sold, expiration_date, created_at, created_by)
                            VALUES (:sku, :product_id, :supplier_id, :barcode, :price, :quantity, :quantity, 0, :expiration_date, :created_at, :created_by)";
                    
                    $stmt = $conn->prepare($sql);
                    $created_at = date('Y-m-d H:i:s');
                    $created_by = $inventory['created_by'];
        
                    $stmt->bindParam(':sku', $inventory['sku']);
                    $stmt->bindParam(':product_id', $inventory['product_id']);
                    $stmt->bindParam(':supplier_id', $inventory['supplier_id']);
                    $stmt->bindParam(':barcode', $inventory['barcode']);
                    $stmt->bindParam(':price', $inventory['price']);
                    $stmt->bindParam(':quantity', $inventory['quantity']);
                    $stmt->bindParam(':expiration_date', $inventory['expiration_date']);
                    $stmt->bindParam(':created_at', $created_at);
                    $stmt->bindParam(':created_by', $created_by);
        
                    if ($stmt->execute()) {
                        echo json_encode(['status' => 1, 'message' => 'New inventory entry created successfully.']);
                    } else {
                        echo json_encode(['status' => 0, 'message' => 'Failed to create inventory.']);
                    }
                } catch (PDOException $e) {
                    if ($e->getCode() == 23000) { // Integrity constraint violation (duplicate SKU)
                        echo json_encode(["status" => 0, "message" => "This SKU already exists. Please enter a unique SKU."]);
                    } else {
                        echo json_encode(["status" => 0, "message" => "An error occurred while adding stock."]);
                    }
                }
            }
            break;
        

case 'PUT':
    $inventory = json_decode(file_get_contents('php://input'), true);
    $response = [
        'status' => 1,
        'messages' => []
    ];

    if (!isset($inventory['id'])) {
        echo json_encode(['status' => 0, 'message' => 'Inventory ID is required.']);
        exit;
    }

    $inventoryId = $inventory['id'];
    $updatePerformed = false;

    try {
        $conn->beginTransaction();

        // Handle Archiving/Unarchiving
        if (isset($inventory['archived'])) {
            $archivedStatus = (int)$inventory['archived'];

            // Fetch the current quantity of the inventory item
            $sqlFetchQuantity = "SELECT quantity FROM inventory WHERE id = :id";
            $stmtFetchQuantity = $conn->prepare($sqlFetchQuantity);
            $stmtFetchQuantity->bindParam(':id', $inventoryId);
            $stmtFetchQuantity->execute();
            $currentQuantity = $stmtFetchQuantity->fetchColumn();

            // Prevent archiving if the item has stock
            if ($archivedStatus === 1 && $currentQuantity > 0) {
                echo json_encode(['status' => 0, 'message' => 'Cannot archive inventory item with stock.']);
                exit;
            }

            // Proceed with archiving/unarchiving if validation passes
            $sqlArchive = "UPDATE inventory SET archived = :archived WHERE id = :id";
            $stmtArchive = $conn->prepare($sqlArchive);
            $stmtArchive->bindParam(':archived', $archivedStatus, PDO::PARAM_INT);
            $stmtArchive->bindParam(':id', $inventoryId, PDO::PARAM_INT);

            if ($stmtArchive->execute()) {
                $response['messages'][] = ($archivedStatus === 1) 
                    ? 'Inventory item archived successfully.' 
                    : 'Inventory item restored successfully.';
                $updatePerformed = true;
            }
        }

        // Handle Stock Updates (Adding Quantity)
        if (isset($inventory['add_to_quantity'])) {
            $addQuantity = $inventory['add_to_quantity'];

            if (!is_numeric($addQuantity)) {
                echo json_encode(['status' => 0, 'message' => 'Quantity must be a numeric value.']);
                exit;
            }

            // Fetch the current quantity and total_count
            $sqlFetch = "SELECT quantity, total_count FROM inventory WHERE id = :id";
            $stmtFetch = $conn->prepare($sqlFetch);
            $stmtFetch->bindParam(':id', $inventoryId);
            $stmtFetch->execute();
            $currentData = $stmtFetch->fetch(PDO::FETCH_ASSOC);

            if (!$currentData) {
                echo json_encode(['status' => 0, 'message' => 'Inventory item not found.']);
                exit;
            }

            $newQuantity = $currentData['quantity'] + $addQuantity;
            $newTotalCount = $currentData['total_count'] + $addQuantity;

            // Update inventory stock
            $sqlUpdate = "UPDATE inventory SET quantity = :newQuantity, total_count = :newTotalCount WHERE id = :id";
            $stmtUpdate = $conn->prepare($sqlUpdate);
            $stmtUpdate->bindParam(':newQuantity', $newQuantity);
            $stmtUpdate->bindParam(':newTotalCount', $newTotalCount);
            $stmtUpdate->bindParam(':id', $inventoryId);

            if ($stmtUpdate->execute()) {
                $response['messages'][] = 'Stock added successfully, quantity and total count updated.';
                $updatePerformed = true;
            }
        }

        // Handle General Inventory Updates
        $updateFields = [];
        $params = ['id' => $inventoryId];

        if (isset($inventory['updated_by'])) {
            $updateFields[] = "updated_by = :updated_by";
            $params['updated_by'] = $inventory['updated_by'];
        }

        if (isset($inventory['sku']) && !empty($inventory['sku'])) {
            $updateFields[] = "sku = :sku";
            $params['sku'] = $inventory['sku'];
        }

        if (isset($inventory['quantity']) && is_numeric($inventory['quantity']) && $inventory['quantity'] >= 0) {
            $updateFields[] = "quantity = :quantity";
            $params['quantity'] = $inventory['quantity'];
        }

        if (isset($inventory['barcode']) && !empty($inventory['barcode'])) {
            $updateFields[] = "barcode = :barcode";
            $params['barcode'] = $inventory['barcode'];
        }

        if (isset($inventory['price']) && is_numeric($inventory['price']) && $inventory['price'] >= 0) {
            $updateFields[] = "price = :price";
            $params['price'] = $inventory['price'];
        }

        if (isset($inventory['supplier']) && !empty($inventory['supplier'])) {
            $updateFields[] = "supplier = :supplier";
            $params['supplier'] = $inventory['supplier'];
        }

        if (array_key_exists('expiration_date', $inventory)) {
            $updateFields[] = "expiration_date = :expiration_date";

            if (empty($inventory['expiration_date'])) {
                $params['expiration_date'] = null;
            } else {
                $params['expiration_date'] = $inventory['expiration_date'];
            }
        }

        if (!empty($updateFields)) {
            $sqlUpdate = "UPDATE inventory SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $stmtUpdate = $conn->prepare($sqlUpdate);

            foreach ($params as $param => $value) {
                $stmtUpdate->bindValue(":$param", $value);
            }

            if ($stmtUpdate->execute()) {
                $response['messages'][] = 'Inventory details updated successfully.';
                $updatePerformed = true;
            }
        }

        if ($updatePerformed) {
            $conn->commit();
            $response['status'] = 1;
        } else {
            throw new Exception('No valid update parameters provided.');
        }

        echo json_encode($response);

    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Integrity constraint violation (duplicate entry)
            echo json_encode(["status" => 0, "message" => "This SKU already exists. Please enter a unique SKU."]);
        } else {
            echo json_encode(["status" => 0, "message" => "An error occurred while updating inventory."]);
        }
    }
    break;
    



    case 'DELETE':
        // Delete inventory record by ID
        $sql = "DELETE FROM inventory WHERE id = :id";
        $path = explode('/', $_SERVER['REQUEST_URI']);
        
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $path[3]);
        
        if ($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Inventory deleted successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to delete inventory.'];
        }

        echo json_encode($response);
        break;
}
?>
