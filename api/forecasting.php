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

if ($method === 'GET') {
    try {
        $sql = "SELECT 
            YEAR(o.order_date) AS year,
            MONTHNAME(o.order_date) AS month,
            oi.product_name,
            SUM(oi.quantity) AS total_quantity,
            ROUND(AVG(oi.price), 2) AS avg_price
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        GROUP BY YEAR(o.order_date), MONTH(o.order_date), oi.product_name
        ORDER BY YEAR(o.order_date), MONTH(o.order_date), total_quantity DESC";
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
