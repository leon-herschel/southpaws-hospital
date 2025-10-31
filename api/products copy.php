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
        $sqlCount = "SELECT COUNT(*) AS total_products FROM products";
        $stmtCount = $conn->prepare($sqlCount);
        $stmtCount->execute();
        $resultCount = $stmtCount->fetch(PDO::FETCH_ASSOC);
        $total_products = $resultCount['total_products'];

        // Check if the 'sku' query parameter is present to fetch product by SKU
        if (isset($_GET['sku'])) {
            $sku = $_GET['sku'];
            
            // Fetch the product by SKU
            $sql = "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.sku = :sku";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':sku', $sku);
            $stmt->execute();
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($product) {
                echo json_encode(['product' => $product]);
            } else {
                echo json_encode(['product' => null]); // Product not found
            }
        } else {
            // Fetch all products data if SKU is not provided
            $sqlProducts = "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id";
            $path = explode('/', $_SERVER['REQUEST_URI']);
            if (isset($path[3]) && is_numeric($path[3])) {
                $sqlProducts .= " WHERE p.id = :id";
                $stmtProducts = $conn->prepare($sqlProducts);
                $stmtProducts->bindParam(':id', $path[3]);
                $stmtProducts->execute();
                $products = array($stmtProducts->fetch(PDO::FETCH_ASSOC)); // Wrap single product in an array
            } else {
                $stmtProducts = $conn->prepare($sqlProducts);
                $stmtProducts->execute();
                $products = $stmtProducts->fetchAll(PDO::FETCH_ASSOC);
            }

            // Constructing response for all products
            $response = array(
                'total_products' => $total_products, // Keep total products count for dashboard
                'products' => $products
            );

            // Encode the response as JSON and send it to the client
            echo json_encode($response);
        }
        break;

    case 'POST':
        $product = json_decode(file_get_contents('php://input'));
        $sql = "INSERT INTO products (id, name, brand, sku, category_id, unit_of_measurement, price, quantity, expiration_date, created_at, created_by) 
        VALUES (null, :name, :brand, :sku, :category_id, :unit_of_measurement, :price, :quantity, :expiration_date, :created_at, :created_by)";
        $stmt = $conn->prepare($sql);
        $created_at = date('Y-m-d H:i:s');
        $created_by = "1";
        $stmt->bindParam(':name', $product->name);
        $stmt->bindParam(':brand', $product->brand);
        $stmt->bindParam(':sku', $product->sku); // Assuming 'sku' is a column in your products table
        $stmt->bindParam(':category_id', $product->category_id);
        $stmt->bindParam(':unit_of_measurement', $product->unit_of_measurement);
        $stmt->bindParam(':price', $product->price);
        $stmt->bindParam(':quantity', $product->quantity);
        $stmt->bindParam(':expiration_date', $product->expiration_date);
        $stmt->bindParam(':created_at', $created_at);
        $stmt->bindParam(':created_by', $created_by);

        if($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Record created successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to create record.'];
        }
        echo json_encode($response);
        break;

case 'PUT':
    $product = json_decode(file_get_contents('php://input'));
    
    // First, fetch the current quantity from the database
    $sqlCurrentQuantity = "SELECT quantity FROM products WHERE id = :id";
    $stmtCurrentQuantity = $conn->prepare($sqlCurrentQuantity);
    $stmtCurrentQuantity->bindParam(':id', $product->id);
    $stmtCurrentQuantity->execute();
    $currentQuantity = $stmtCurrentQuantity->fetch(PDO::FETCH_ASSOC)['quantity'];
    
    // Calculate the new quantity
    $newQuantity = $currentQuantity + $product->quantity;
    
    // Update the product with the new quantity
    $sqlUpdate = "UPDATE products SET 
        name = :name, 
        brand = :brand, 
        sku = :sku, 
        category_id = :category_id, 
        unit_of_measurement = :unit_of_measurement, 
        price = :price, 
        quantity = :quantity, 
        expiration_date = :expiration_date 
        WHERE id = :id";
    
    $stmtUpdate = $conn->prepare($sqlUpdate);
    $stmtUpdate->bindParam(':name', $product->name);
    $stmtUpdate->bindParam(':brand', $product->brand);
    $stmtUpdate->bindParam(':sku', $product->sku);
    $stmtUpdate->bindParam(':category_id', $product->category_id);
    $stmtUpdate->bindParam(':unit_of_measurement', $product->unit_of_measurement);
    $stmtUpdate->bindParam(':price', $product->price);
    $stmtUpdate->bindParam(':quantity', $newQuantity);
    $stmtUpdate->bindParam(':expiration_date', $product->expiration_date);
    $stmtUpdate->bindParam(':id', $product->id);
    
    if($stmtUpdate->execute()) {
        $response = ['status' => 1, 'message' => 'Record updated successfully.'];
    } else {
        $response = ['status' => 0, 'message' => 'Failed to edit record.'];
    }
    echo json_encode($response);
    break;

    case 'DELETE':
        $sql = "DELETE FROM products WHERE id = :id";
        $path = explode('/', $_SERVER['REQUEST_URI']);
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $path[3]);
        if($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Record deleted successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to delete record.'];
        }
        echo json_encode($response);
        break;
}
?>
