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
        $archived = isset($_GET['archived']) ? (int)$_GET['archived'] : 0;
    
        $sqlCount = "SELECT COUNT(*) AS total_products FROM products WHERE archived = :archived";
        $stmtCount = $conn->prepare($sqlCount);
        $stmtCount->bindParam(':archived', $archived, PDO::PARAM_INT);
        $stmtCount->execute();
        $resultCount = $stmtCount->fetch(PDO::FETCH_ASSOC);
        $total_products = $resultCount['total_products'];
    
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $sql = "SELECT p.*, c.name AS category_name, b.name AS brand_name, u.unit_name AS unit_name, g.generic_name AS generic_name 
                    FROM products p 
                    LEFT JOIN categories c ON p.category_id = c.id 
                    LEFT JOIN brands b ON p.brand_id = b.id
                    LEFT JOIN unit_of_measurement u ON p.unit_id = u.id
                    LEFT JOIN generic_cms g ON p.generic_id = g.id
                    WHERE p.id = :id AND p.archived = :archived";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':archived', $archived, PDO::PARAM_INT);
            $stmt->execute();
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
            echo json_encode(['product' => $product ? $product : null]);
        } else {
            $sqlProducts = "SELECT p.*, c.name AS category_name, b.name AS brand_name, u.unit_name AS unit_name, g.generic_name AS generic_name  
                            FROM products p 
                            LEFT JOIN categories c ON p.category_id = c.id 
                            LEFT JOIN brands b ON p.brand_id = b.id
                            LEFT JOIN unit_of_measurement u ON p.unit_id = u.id
                            LEFT JOIN generic_cms g ON p.generic_id = g.id
                            WHERE p.archived = :archived";
    
            $stmtProducts = $conn->prepare($sqlProducts);
            $stmtProducts->bindParam(':archived', $archived, PDO::PARAM_INT);
            $stmtProducts->execute();
            $products = $stmtProducts->fetchAll(PDO::FETCH_ASSOC);
    
            $response = [
                'total_products' => $total_products,
                'products' => $products
            ];
    
            echo json_encode($response);
        }
        break;
    
    case 'POST':
        $product = json_decode(file_get_contents('php://input'));
        $product_name = $product->product_name;
        $generic_id = (int) $product->generic_id;
        $category_id = (int) $product->category_id;
        $brand_id = (int) $product->brand_id;
        $unit_id = (int) $product->unit_id;
        $created_at = date('Y-m-d H:i:s');
        $created_by = (int) $product->created_by;
        
        $sqlCheckName = "SELECT COUNT(*) FROM products WHERE UPPER(product_name) = :product_name";
        $stmtCheckName = $conn->prepare($sqlCheckName);
        $stmtCheckName->bindParam(':product_name', $product_name);
        $stmtCheckName->execute();
        $nameExists = $stmtCheckName->fetchColumn() > 0;
        
        if ($nameExists) {
            echo json_encode(['status' => 0, 'message' => 'Product name already exists.']);
            exit();
        }
        
        $sql = "INSERT INTO products (product_name, generic_id, category_id, brand_id, unit_id, created_at, created_by) 
                VALUES (:product_name, :generic_id, :category_id, :brand_id, :unit_id, :created_at, :created_by)";
        $stmt = $conn->prepare($sql);
        
        $stmt->bindParam(':product_name', $product_name);
        $stmt->bindParam(':generic_id', $generic_id);
        $stmt->bindParam(':category_id', $category_id);
        $stmt->bindParam(':brand_id', $brand_id);
        $stmt->bindParam(':unit_id', $unit_id);
        $stmt->bindParam(':created_at', $created_at);
        $stmt->bindParam(':created_by', $created_by);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 1, 'message' => 'Product created successfully.']);
        } else {
            echo json_encode(['status' => 0, 'message' => 'Failed to create product.']);
        }
        break;

case 'PUT':
    $product = json_decode(file_get_contents('php://input'));

    if (isset($product->id)) { // Ensure product ID is provided
        $conn->beginTransaction();
        try {
            // Archive or restore the product if 'archived' key exists
            if (isset($product->archived)) {
                $sql = "UPDATE products SET archived = :archived WHERE id = :id";
                $stmt = $conn->prepare($sql);
                $stmt->bindParam(':archived', $product->archived, PDO::PARAM_INT);
                $stmt->bindParam(':id', $product->id, PDO::PARAM_INT);
                $stmt->execute();
            }

            // Update product details like name and updated_by if they exist
            if (isset($product->product_name)) {
                // Check for duplicate product names (excluding the current product)
                $sqlCheckDuplicate = "SELECT COUNT(*) FROM products WHERE UPPER(product_name) = :product_name AND id != :id";
                $stmtCheckDuplicate = $conn->prepare($sqlCheckDuplicate);
                $stmtCheckDuplicate->bindParam(':product_name', $product->product_name);
                $stmtCheckDuplicate->bindParam(':id', $product->id);
                $stmtCheckDuplicate->execute();
                $nameExists = $stmtCheckDuplicate->fetchColumn() > 0;

                if ($nameExists) {
                    $conn->rollBack();
                    echo json_encode(['status' => 0, 'message' => 'Product name already exists.']);
                    exit();
                }

                // Proceed with updating the product
                $sql = "UPDATE products 
                SET product_name = :product_name, 
                    generic_id = :generic_id, 
                    category_id = :category_id, 
                    brand_id = :brand_id, 
                    unit_id = :unit_id, 
                    updated_by = :updated_by
                WHERE id = :id";
                $stmt = $conn->prepare($sql);
                $stmt->bindParam(':id', $product->id, PDO::PARAM_INT);
                $stmt->bindParam(':product_name', $product->product_name, PDO::PARAM_STR);
                $stmt->bindParam(':generic_id', $product->generic_id, PDO::PARAM_INT);
                $stmt->bindParam(':category_id', $product->category_id, PDO::PARAM_INT);
                $stmt->bindParam(':brand_id', $product->brand_id, PDO::PARAM_INT);
                $stmt->bindParam(':unit_id', $product->unit_id, PDO::PARAM_INT);
                $stmt->bindParam(':updated_by', $product->updated_by, PDO::PARAM_INT);
                $stmt->execute();
            }

            if ($stmt->rowCount() > 0) {
                $conn->commit();
                echo json_encode(['status' => 1, 'message' => 'Product updated successfully.']);
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
        $product_name = isset($path[3]) ? strtoupper($path[3]) : null;

        if (!$product_name) {
            echo json_encode(['status' => 0, 'message' => 'Product name is required for deletion.']);
            exit();
        }

        try {
            $conn->beginTransaction();

            $sqlGetProductId = "SELECT id FROM products WHERE UPPER(product_name) = :product_name";
            $stmtGetProductId = $conn->prepare($sqlGetProductId);
            $stmtGetProductId->bindParam(':product_name', $product_name);
            $stmtGetProductId->execute();
            $product = $stmtGetProductId->fetch(PDO::FETCH_ASSOC);

            if ($product) {
                $productId = $product['id'];
                $sqlDeleteInventory = "DELETE FROM inventory WHERE product_id = :id";
                $stmtDeleteInventory = $conn->prepare($sqlDeleteInventory);
                $stmtDeleteInventory->bindParam(':id', $productId);
                $stmtDeleteInventory->execute();

                $sqlDeleteProduct = "DELETE FROM products WHERE id = :id";
                $stmtDeleteProduct = $conn->prepare($sqlDeleteProduct);
                $stmtDeleteProduct->bindParam(':id', $productId);
                $stmtDeleteProduct->execute();
            } else {
                echo json_encode(['status' => 0, 'message' => 'Product not found.']);
                exit();
            }

            $conn->commit();
            echo json_encode(['status' => 1, 'message' => 'Product and its inventory deleted successfully.']);
        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode(['status' => 0, 'message' => 'Failed to delete product: ' . $e->getMessage()]);
        }
        break;
}
