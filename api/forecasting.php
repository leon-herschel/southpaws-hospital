<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

// Include database connection
include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Fetch the most popular products based on total quantity sold for each month
        $sql = "SELECT MONTHNAME(o.order_date) AS month, oi.product_name, SUM(oi.quantity) as total_quantity, ROUND(AVG(oi.price), 2) as avg_price 
                FROM order_items oi
                INNER JOIN orders o ON oi.order_id = o.id
                GROUP BY MONTH(o.order_date), oi.product_name
                ORDER BY MONTH(o.order_date), total_quantity DESC";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $popularProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$popularProducts) {
            echo json_encode(['status' => 0, 'message' => 'No sales data found.']);
            exit();
        }

        echo json_encode(['status' => 1, 'popular_products' => $popularProducts]);
    } catch (Exception $e) {
        echo json_encode(['status' => 0, 'message' => 'Error fetching popular products: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 0, 'message' => 'Method not allowed.']);
}
?>