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
        $path = explode('/', $_SERVER['REQUEST_URI']);
    
        // Check if 'categoryId' is passed in the query string (for inventory check)
        if (isset($_GET['categoryId'])) {
            $categoryId = $_GET['categoryId'];
        
            // Query to calculate the total quantity of items in the inventory for the given category
            $sql = "SELECT COALESCE(SUM(i.quantity), 0) AS quantity 
                    FROM inventory i
                    JOIN products p ON i.product_id = p.id
                    WHERE p.category_id = :categoryId";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':categoryId', $categoryId, PDO::PARAM_INT);
            $stmt->execute();
        
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
            // Return the quantity
            echo json_encode(['quantity' => $result['quantity']]);
        } else {
            // Handle fetching categories (single or multiple)
            // Check if 'archived' is passed in the query string (default to 0 for non-archived)
            $archived = isset($_GET['archived']) ? (int)$_GET['archived'] : 0;
    
            // Validate archived status (ensure only 0 or 1)
            $archived = ($archived === 1) ? 1 : 0;
    
            if (isset($path[3]) && is_numeric($path[3])) {
                // Fetch a single category by ID along with the quantity in inventory
                $sql = "SELECT c.id, c.name, c.created_by, c.updated_by, c.created_at, c.archived, 
                               COALESCE(SUM(i.quantity), 0) AS quantity 
                        FROM categories c
                        LEFT JOIN products p ON c.id = p.category_id
                        LEFT JOIN inventory i ON p.id = i.product_id
                        WHERE c.id = :id 
                        GROUP BY c.id";
                $stmt = $conn->prepare($sql);
                $stmt->bindParam(':id', $path[3], PDO::PARAM_INT);
                $stmt->execute();
                $category = $stmt->fetch(PDO::FETCH_ASSOC);
    
                if ($category) {
                    echo json_encode(['category' => $category]);
                } else {
                    http_response_code(404);
                    echo json_encode(['status' => 0, 'message' => 'Category not found']);
                }
            } else {
                // Fetch all categories filtered by archived status along with the total quantity in inventory
                $sql = "SELECT c.id, c.name, c.created_by, c.updated_by, c.created_at, c.archived, 
                               COALESCE(SUM(i.quantity), 0) AS quantity 
                        FROM categories c
                        LEFT JOIN products p ON c.id = p.category_id
                        LEFT JOIN inventory i ON p.id = i.product_id
                        WHERE c.archived = :archived 
                        GROUP BY c.id 
                        ORDER BY c.id DESC";
                $stmt = $conn->prepare($sql);
                $stmt->bindParam(':archived', $archived, PDO::PARAM_INT);
                $stmt->execute();
                $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
                // Count total categories based on the archived filter
                $sqlCount = "SELECT COUNT(*) AS total_categories FROM categories WHERE archived = :archived";
                $stmtCount = $conn->prepare($sqlCount);
                $stmtCount->bindParam(':archived', $archived, PDO::PARAM_INT);
                $stmtCount->execute();
                $total_categories = $stmtCount->fetch(PDO::FETCH_ASSOC)['total_categories'];
    
                echo json_encode([
                    'total_categories' => $total_categories,
                    'categories' => $categories
                ]);
            }
        }
        break;
    
    case 'POST':
        $category = json_decode(file_get_contents('php://input'));

        if (!isset($category->name) || !isset($category->created_by)) {
            echo json_encode(['status' => 0, 'message' => 'Missing required fields.']);
            exit;
        }

        $categoryName = strtolower($category->name);
        $createdBy = intval($category->created_by);

        $conn->beginTransaction();
        try {
            // Check for duplicate category name
            $sqlCheck = "SELECT COUNT(*) FROM categories WHERE LOWER(name) = :name";
            $stmtCheck = $conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':name', $categoryName, PDO::PARAM_STR);
            $stmtCheck->execute();
            $exists = $stmtCheck->fetchColumn();

            if ($exists) {
                echo json_encode(['status' => 0, 'message' => 'Category name already exists.']);
                exit;
            }

            // Insert new category
            $sqlInsert = "INSERT INTO categories (name, created_by) VALUES (:name, :created_by)";
            $stmtInsert = $conn->prepare($sqlInsert);
            $stmtInsert->bindParam(':name', $category->name, PDO::PARAM_STR);
            $stmtInsert->bindParam(':created_by', $createdBy, PDO::PARAM_INT);
            $stmtInsert->execute();

            $conn->commit();
            echo json_encode(['status' => 1, 'message' => 'Category created successfully.']);
        } catch (Exception $e) {
            $conn->rollBack();
            error_log("Failed to create category: " . $e->getMessage());
            echo json_encode(['status' => 0, 'message' => 'Failed to create category.']);
        }
        break;

        case 'PUT':
            $category = json_decode(file_get_contents('php://input'), true);
        
            if (isset($category['id'])) { // Ensure category ID is provided
                $conn->beginTransaction();
                try {
                    if (isset($category['archived']) && $category['archived'] == 1) {
                        // Step 1: Archive all products under this category
                        $archiveProductsSql = "UPDATE products SET archived = :archived WHERE category_id = :category_id";
                        $archiveProductsStmt = $conn->prepare($archiveProductsSql);
                        $archiveProductsStmt->bindParam(':archived', $category['archived'], PDO::PARAM_INT);
                        $archiveProductsStmt->bindParam(':category_id', $category['id'], PDO::PARAM_INT);
                        $archiveProductsStmt->execute();
        
                        // Step 2: Archive the category
                        $archiveCategorySql = "UPDATE categories SET archived = :archived WHERE id = :id";
                        $archiveCategoryStmt = $conn->prepare($archiveCategorySql);
                        $archiveCategoryStmt->bindParam(':archived', $category['archived'], PDO::PARAM_INT);
                        $archiveCategoryStmt->bindParam(':id', $category['id'], PDO::PARAM_INT);
                        $archiveCategoryStmt->execute();
                    }
        
                    if (isset($category['name']) && isset($category['updated_by'])) {
                        // Update name and updated_by if they exist
                        $sql = "UPDATE categories SET name = :name, updated_by = :updated_by WHERE id = :id";
                        $stmt = $conn->prepare($sql);
                        $stmt->bindParam(':id', $category['id'], PDO::PARAM_INT);
                        $stmt->bindParam(':name', $category['name'], PDO::PARAM_STR);
                        $stmt->bindParam(':updated_by', $category['updated_by'], PDO::PARAM_INT);
                        $stmt->execute();
                    }
        
                    if ($archiveCategoryStmt->rowCount() > 0 || $archiveProductsStmt->rowCount() > 0 || $stmt->rowCount() > 0) {
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

        if (!isset($path[3]) || !is_numeric($path[3])) {
            echo json_encode(['status' => 0, 'message' => 'Invalid category ID.']);
            exit;
        }

        $deletedId = intval($path[3]);

        $conn->beginTransaction();
        try {
            // Check if category exists
            $sqlCheck = "SELECT id FROM categories WHERE id = :id";
            $stmtCheck = $conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':id', $deletedId, PDO::PARAM_INT);
            $stmtCheck->execute();

            if (!$stmtCheck->fetch(PDO::FETCH_ASSOC)) {
                echo json_encode(['status' => 0, 'message' => 'Category not found.']);
                exit;
            }

            // Delete category
            $sqlDelete = "DELETE FROM categories WHERE id = :id";
            $stmtDelete = $conn->prepare($sqlDelete);
            $stmtDelete->bindParam(':id', $deletedId, PDO::PARAM_INT);
            $stmtDelete->execute();

            $conn->commit();
            echo json_encode(['status' => 1, 'message' => 'Category deleted successfully.']);
        } catch (Exception $e) {
            $conn->rollBack();
            error_log("Failed to delete category: " . $e->getMessage());
            echo json_encode(['status' => 0, 'message' => 'Failed to delete category.']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed.']);
        break;
}
?>
