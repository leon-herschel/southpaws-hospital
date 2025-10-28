<?php
include 'cors.php';
header("Content-Type: application/json");


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
        if (isset($_GET['receipt_number'])) {
            error_log("🔍 Fetching details for receipt_number: " . $_GET['receipt_number']);

            // Fetch the order details
            $stmt = $conn->prepare("
                SELECT o.id, o.receipt_number, 
                       COALESCE(c.name, uc.name) AS client_name, 
                       o.order_date, o.tax_amount, o.grand_total, 
                       o.confirmed_by, COALESCE(o.amount_tendered, 0) AS amount_tendered
                FROM orders o
                LEFT JOIN clients c ON o.client_id = c.id
                LEFT JOIN unregistered_clients uc ON o.unregistered_client_id = uc.id
                WHERE o.receipt_number = :receipt_number
            ");
            $stmt->bindParam(':receipt_number', $_GET['receipt_number']);
            $stmt->execute();
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                error_log("❌ Error: Receipt not found.");
                echo json_encode(['status' => 0, 'message' => 'Receipt not found.']);
                exit;
            }

            // ✅ Ensure `subtotal`, `change_amount` calculations are correct
            $order['subtotal'] = (float) $order['grand_total'] - (float) $order['tax_amount'];
            $order['change_amount'] = (float) $order['amount_tendered'] - (float) $order['grand_total'];

            // Fetch items for the receipt
            $stmtItems = $conn->prepare("
                SELECT product_name, quantity, price, total, type
                FROM order_items
                WHERE order_id = :order_id
            ");
            $stmtItems->bindParam(':order_id', $order['id']);
            $stmtItems->execute();
            $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

            $order['items'] = $items;
            echo json_encode(['status' => 1, 'receipt' => $order]);
        } else {
            // Fetch all transactions (Sales List)
            $stmt = $conn->prepare("
                SELECT o.id, o.receipt_number, 
                       COALESCE(c.name, uc.name) AS client_name, 
                       o.order_date, o.grand_total
                FROM orders o
                LEFT JOIN clients c ON o.client_id = c.id
                LEFT JOIN unregistered_clients uc ON o.unregistered_client_id = uc.id
                ORDER BY o.order_date DESC
            ");
            $stmt->execute();
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($orders);
        }
    } catch (Exception $e) {
        error_log("❌ Database Error: " . $e->getMessage());
        echo json_encode(['status' => 0, 'message' => 'Failed to fetch data: ' . $e->getMessage()]);
    }
    exit;
}
?>
