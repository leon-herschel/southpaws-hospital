<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

switch ($method) {
    case 'GET':
        $path = explode('/', $_SERVER['REQUEST_URI']);

        // Case 1: Fetch a specific category with product count (via ?categoryId=)
        if (isset($_GET['categoryId']) && is_numeric($_GET['categoryId'])) {
            $categoryId = intval($_GET['categoryId']);

            $sql = "SELECT c.id, c.name, c.created_by, c.updated_by, c.created_at, c.archived,
                        COUNT(p.id) AS product_count
                    FROM categories c
                    LEFT JOIN products p ON c.id = p.category_id AND p.archived = 0
                    WHERE c.id = :categoryId
                    GROUP BY c.id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':categoryId', $categoryId, PDO::PARAM_INT);
            $stmt->execute();
            $category = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($category) {
                echo json_encode($category);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 0, 'message' => 'Category not found']);
            }
        }

        // Case 2: Fetch a single category by ID from /categories/{id}
        elseif (isset($path[3]) && is_numeric($path[3])) {
            $id = intval($path[3]);

            $sql = "SELECT c.id, c.name, c.created_by, c.updated_by, c.created_at, c.archived,
                        COUNT(p.id) AS product_count
                    FROM categories c
                    LEFT JOIN products p ON c.id = p.category_id AND p.archived = 0
                    WHERE c.id = :id
                    GROUP BY c.id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $category = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($category) {
                echo json_encode($category);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 0, 'message' => 'Category not found']);
            }
        }

        // Case 3: Fetch all categories
        else {
            $archived = isset($_GET['archived']) ? (int)$_GET['archived'] : 0;
            $archived = ($archived === 1) ? 1 : 0;

            $sql = "SELECT c.id, c.name, c.created_by, c.updated_by, c.created_at, c.archived,
                        COUNT(p.id) AS product_count
                    FROM categories c
                    LEFT JOIN products p ON c.id = p.category_id AND p.archived = 0
                    WHERE c.archived = :archived
                    GROUP BY c.id
                    ORDER BY c.id DESC";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':archived', $archived, PDO::PARAM_INT);
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
    break;

    case 'POST':
        $category = json_decode(file_get_contents('php://input'));

        if (!isset($category->name) || !isset($category->created_by)) {
            echo json_encode(['status' => 0, 'message' => 'Missing required fields.']);
            exit;
        }

        $categoryName = trim($category->name);
        $createdBy = intval($category->created_by);

        // Prepare lowercase for duplicate check only
        $categoryNameLower = strtolower($categoryName);


        $conn->beginTransaction();
        try {
            // Check for duplicate category name
            $sqlCheck = "SELECT COUNT(*) FROM categories WHERE LOWER(name) = :name";
            $stmtCheck = $conn->prepare($sqlCheck);
            $stmtCheck->bindParam(':name', $categoryNameLower, PDO::PARAM_STR);
            $stmtCheck->execute();
            $exists = $stmtCheck->fetchColumn();

            if ($exists) {
                echo json_encode(['status' => 0, 'message' => 'Category name already exists.']);
                exit;
            }

            // Insert new category
            $sqlInsert = "INSERT INTO categories (name, created_by) VALUES (:name, :created_by)";
            $stmtInsert = $conn->prepare($sqlInsert);
            $stmtInsert->bindParam(':name', $categoryName, PDO::PARAM_STR);
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

        if (!isset($category['id']) || !is_numeric($category['id'])) {
            echo json_encode(['status' => 0, 'message' => 'Invalid category ID.']);
            break;
        }

        $conn->beginTransaction();
        try {
            $rowsChanged = 0;

            // 1. If archiving request
            if (isset($category['archived']) && $category['archived'] == 1) {
                // Check if any products are still using this category
                $checkSql = "SELECT COUNT(*) AS product_count
                             FROM products
                             WHERE category_id = :categoryId
                               AND archived = 0";
                $checkStmt = $conn->prepare($checkSql);
                $checkStmt->bindParam(':categoryId', $category['id'], PDO::PARAM_INT);
                $checkStmt->execute();
                $result = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if ($result && $result['product_count'] > 0) {
                    $conn->rollBack(); // rollback early
                    echo json_encode([
                        'status' => 0,
                        'message' => "Category cannot be archived because it is still used by active products."
                    ]);
                    break;
                }

                // Archive the category
                $archiveCategorySql = "UPDATE categories SET archived = 1 WHERE id = :id";
                $archiveCategoryStmt = $conn->prepare($archiveCategorySql);
                $archiveCategoryStmt->bindParam(':id', $category['id'], PDO::PARAM_INT);
                $archiveCategoryStmt->execute();
                $rowsChanged += $archiveCategoryStmt->rowCount();
            }

            // 2. If updating name
            if (isset($category['name']) && isset($category['updated_by'])) {
                $trimmedName = trim($category['name']);
                $lowerName = strtolower($trimmedName); // only for duplicate check

                $sqlCheck = "SELECT COUNT(*) FROM categories WHERE LOWER(name) = :name AND id != :id";
                $stmtCheck = $conn->prepare($sqlCheck);
                $stmtCheck->bindParam(':name', $lowerName, PDO::PARAM_STR);

                $stmtCheck->bindParam(':name', $lowerName, PDO::PARAM_STR);
                $stmtCheck->bindParam(':id', $category['id'], PDO::PARAM_INT);
                $stmtCheck->execute();
                $exists = $stmtCheck->fetchColumn();

                if ($exists) {
                    $conn->rollBack();
                    echo json_encode(['status' => 0, 'message' => 'Category name already exists.']);
                    break;
                }

                $sql = "UPDATE categories SET name = :name, updated_by = :updated_by WHERE id = :id";
                $stmt = $conn->prepare($sql);
                $stmt->bindParam(':id', $category['id'], PDO::PARAM_INT);
                $stmt->bindParam(':name', $trimmedName, PDO::PARAM_STR);
                $stmt->bindParam(':updated_by', $category['updated_by'], PDO::PARAM_INT);
                $stmt->execute();
                $rowsChanged += $stmt->rowCount();
            }

            // 3. Finalize
            if ($rowsChanged > 0) {
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
