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
    // Check if either client_id or pet_id is provided
    if (!isset($_GET['pet_id']) && !isset($_GET['client_id'])) {
        echo json_encode(['status' => 0, 'message' => 'Pet ID or Client ID is required.']);
        exit();
    }

    // Get the pet_id or client_id from the query parameters
    $petId = $_GET['pet_id'] ?? null;
    $clientId = $_GET['client_id'] ?? null;

    try {
        // If pet_id is provided, retrieve orders filtered by pet_id
        if ($petId) {
            // Fetch orders related to the pet_id
            $sql = "SELECT id AS order_id, client_id, order_date, receipt_number, pet_id
                    FROM orders 
                    WHERE JSON_CONTAINS(pet_id, :pet_id)";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':pet_id', json_encode([$petId]), PDO::PARAM_STR);  // Bind pet_id as JSON string
            $stmt->execute();
        } else if ($clientId) {
            // Fetch orders related to the client_id
            $sql = "SELECT id AS order_id, client_id, order_date, receipt_number 
                    FROM orders 
                    WHERE client_id = :client_id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':client_id', $clientId, PDO::PARAM_INT);
            $stmt->execute();
        }

        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$orders) {
            echo json_encode(['status' => 0, 'message' => 'No orders found for this pet or client.']);
            exit();
        }

        $serviceOrders = [];

        // Fetch order items for each order and filter services
        foreach ($orders as $order) {
            $sqlItems = "SELECT order_id, product_name, quantity, price, total, type 
                         FROM order_items 
                         WHERE order_id = :order_id AND type = 'service'";
            $stmtItems = $conn->prepare($sqlItems);
            $stmtItems->bindParam(':order_id', $order['order_id'], PDO::PARAM_INT);
            $stmtItems->execute();
            $orderItems = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($orderItems)) {
                $serviceOrders[] = [
                    'order_id' => $order['order_id'],
                    'orderDate' => $order['order_date'],
                    'receiptNumber' => $order['receipt_number'],
                    'services' => $orderItems
                ];
            }
        }

        echo json_encode(['status' => 1, 'availed_services' => $serviceOrders]);

    } catch (Exception $e) {
        echo json_encode(['status' => 0, 'message' => 'Error fetching services: ' . $e->getMessage()]);
    }

} else {
    http_response_code(405);
    echo json_encode(['status' => 0, 'message' => 'Method not allowed.']);
}
?>
