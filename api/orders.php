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

require 'vendor/autoload.php'; // Ensure Composer autoloader is loaded

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__, '.env.acc');
$dotenv->load();

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null; // Define action parameter


// ✅ Function to check if a receipt number exists
function isReceiptDuplicate($conn, $receiptNumber) {
    $sqlCheckReceipt = "SELECT COUNT(*) AS count FROM orders WHERE receipt_number = :receipt_number";
    $stmtCheckReceipt = $conn->prepare($sqlCheckReceipt);
    $stmtCheckReceipt->bindParam(':receipt_number', $receiptNumber, PDO::PARAM_STR);
    $stmtCheckReceipt->execute();
    $result = $stmtCheckReceipt->fetch(PDO::FETCH_ASSOC);
    return $result['count'] > 0;
}

// ✅ Function to generate a unique receipt number
function generateUniqueReceiptNumber($conn) {
    do {
        $datePart = date('dmY'); // Format: DDMMYYYY
        $randomNumber = str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
        $newReceiptNumber = $datePart . '-' . $randomNumber;
    } while (isReceiptDuplicate($conn, $newReceiptNumber)); // Keep generating if duplicate

    return $newReceiptNumber;
}

// ✅ Use `switch` only for `GET` and `POST`, use `if-else` for actions
switch ($method) {
    case 'GET':
        if ($action === 'check_receipt') {
            $receiptNumber = $_GET['receipt_number'] ?? null;
            if (!$receiptNumber) {
                echo json_encode(['status' => 0, 'message' => 'Receipt number is required']);
                exit;
            }
            echo json_encode(['exists' => isReceiptDuplicate($conn, $receiptNumber)]);
            exit;
        } 
        else if (isset($_GET['pet_id'])) { // Retrieve orders filtered by pet_id
            $petId = $_GET['pet_id'];
            $sql = "SELECT 
                        orders.id AS order_id, 
                        orders.receipt_number,
                        IFNULL(clients.name, 'Guest') AS client_name, 
                        orders.order_date, 
                        orders.tax_amount, 
                        orders.grand_total, 
                        orders.confirmed_by,
                        order_items.product_name,
                        order_items.quantity,
                        order_items.price,
                        order_items.total,
                        order_items.type,
                        orders.pet_id
                    FROM 
                        orders
                    LEFT JOIN 
                        clients ON orders.client_id = clients.id
                    LEFT JOIN 
                        order_items ON orders.id = order_items.order_id
                    WHERE 
                        JSON_CONTAINS(orders.pet_id, :pet_id)"; // Use JSON_CONTAINS to filter by pet_id in the JSON field
        } 
        else if (isset($_GET['client_id'])) { // Retrieve orders filtered by client_id
            $clientId = $_GET['client_id'];
            $sql = "SELECT 
                        orders.id AS order_id, 
                        orders.receipt_number,
                        IFNULL(clients.name, 'Guest') AS client_name, 
                        orders.order_date, 
                        orders.tax_amount, 
                        orders.grand_total, 
                        orders.confirmed_by,
                        order_items.product_name,
                        order_items.quantity,
                        order_items.price,
                        order_items.total,
                        order_items.type,
                        orders.client_id
                    FROM 
                        orders
                    LEFT JOIN 
                        clients ON orders.client_id = clients.id
                    LEFT JOIN 
                        order_items ON orders.id = order_items.order_id
                    WHERE 
                        orders.client_id = :client_id"; // Use client_id to filter orders
        } 
        else { // Retrieve all orders
            $sql = "SELECT 
                        orders.id AS order_id, 
                        orders.receipt_number,
                        IFNULL(clients.name, 'Guest') AS client_name, 
                        orders.order_date, 
                        orders.tax_amount, 
                        orders.grand_total, 
                        orders.confirmed_by,
                        order_items.product_name,
                        order_items.quantity,
                        order_items.price,
                        order_items.total,
                        order_items.type
                    FROM 
                        orders
                    LEFT JOIN 
                        clients ON orders.client_id = clients.id
                    LEFT JOIN 
                        order_items ON orders.id = order_items.order_id";
        }
    
        try {
            $stmt = $conn->prepare($sql);
            
            // Bind parameters based on the filter used in the query
            if (isset($petId)) {
                $stmt->bindParam(':pet_id', $petId, PDO::PARAM_STR);  // Treat pet_id as a string for comparison
            } else if (isset($clientId)) {
                $stmt->bindParam(':client_id', $clientId, PDO::PARAM_INT);  // Bind the client_id
            }
    
            $stmt->execute();
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 1, 'orders' => $orders]);
        } catch (Exception $e) {
            echo json_encode(['status' => 0, 'message' => 'Failed to retrieve orders: ' . $e->getMessage()]);
        }
        exit;
    

        case 'POST':
            if ($action === 'create_order') {
                // Fetch input data from client-side
                $orderData = json_decode(file_get_contents('php://input'), true);
        
                // Extract order data
                $clientId = $orderData['client_id'] ?? null;
                $unregisteredClientId = $orderData['unregistered_client_id'] ?? null;
                $taxAmount = $orderData['tax_amount'] ?? 0;
                $grandTotal = $orderData['grand_total'] ?? 0;
                $amountTendered = $orderData['amount_tendered'] ?? 0;
                $confirmedBy = $orderData['confirmed_by'] ?? null;
                $items = $orderData['items'] ?? [];
                $petIds = $orderData['pet_id'] ?? [];
        
                // Encode pet_ids as JSON
                $petIdsJson = json_encode($petIds);
        
                // Generate unique receipt number
                $receiptNumber = generateUniqueReceiptNumber($conn);
        
                // Start transaction
                $conn->beginTransaction();
        
                try {
                    // Insert order
                    $sqlInsertOrder = "INSERT INTO orders (client_id, unregistered_client_id, receipt_number, order_date, tax_amount, grand_total, confirmed_by, pet_id, amount_tendered) 
                                        VALUES (:client_id, :unregistered_client_id, :receipt_number, NOW(), :tax_amount, :grand_total, :confirmed_by, :pet_id, :amount_tendered)";
                    $stmtInsertOrder = $conn->prepare($sqlInsertOrder);
                    $stmtInsertOrder->bindParam(':client_id', $clientId, PDO::PARAM_INT);
                    $stmtInsertOrder->bindParam(':unregistered_client_id', $unregisteredClientId, PDO::PARAM_INT);
                    $stmtInsertOrder->bindParam(':receipt_number', $receiptNumber, PDO::PARAM_STR);
                    $stmtInsertOrder->bindParam(':tax_amount', $taxAmount);
                    $stmtInsertOrder->bindParam(':grand_total', $grandTotal);
                    $stmtInsertOrder->bindParam(':amount_tendered', $amountTendered);
                    $stmtInsertOrder->bindParam(':confirmed_by', $confirmedBy);
                    $stmtInsertOrder->bindParam(':pet_id', $petIdsJson);
                    $stmtInsertOrder->execute();
        
                    $orderId = $conn->lastInsertId();
        
                    // Insert order items and update inventory
                    foreach ($items as $item) {
                        $productName = $item['name'] ?? $item['product_name'];
                        $barcode = $item['barcode'] ?? null;
                        $quantity = (int)$item['quantity'];
        
                        // Insert order items
                        $sqlInsertOrderItem = "INSERT INTO order_items (order_id, product_name, quantity, price, total, type) 
                                                VALUES (:order_id, :product_name, :quantity, :price, :total, :type)";
                        $stmtInsertOrderItem = $conn->prepare($sqlInsertOrderItem);
                        $stmtInsertOrderItem->bindParam(':order_id', $orderId);
                        $stmtInsertOrderItem->bindParam(':product_name', $productName);
                        $stmtInsertOrderItem->bindParam(':quantity', $quantity);
                        $stmtInsertOrderItem->bindParam(':price', $item['price']);
                        $stmtInsertOrderItem->bindParam(':total', $item['total']);
                        $stmtInsertOrderItem->bindParam(':type', $item['type']);
                        $stmtInsertOrderItem->execute();
        
                        // Update inventory using FIFO
                        if ($item['type'] === 'product' && $barcode) {
                            while ($quantity > 0) {
                                $sqlGetInventory = "SELECT id, quantity, item_sold FROM inventory 
                                                    WHERE barcode = :barcode AND quantity > 0
                                                    ORDER BY expiration_date ASC
                                                    LIMIT 1";
                                $stmtGetInventory = $conn->prepare($sqlGetInventory);
                                $stmtGetInventory->bindParam(':barcode', $barcode, PDO::PARAM_STR);
                                $stmtGetInventory->execute();
                                $inventoryItem = $stmtGetInventory->fetch(PDO::FETCH_ASSOC);
        
                                if (!$inventoryItem) {
                                    break; // Stop if no inventory exists
                                }
        
                                $inventoryId = $inventoryItem['id'];
                                $availableStock = (int)$inventoryItem['quantity'];
                                $currentItemSold = (int)$inventoryItem['item_sold'];
        
                                $deductQuantity = min($availableStock, $quantity);
                                $newQuantity = $availableStock - $deductQuantity;
                                $newItemSold = $currentItemSold + $deductQuantity;
                                $quantity -= $deductQuantity;
        
                                // Update inventory
                                $sqlUpdateInventory = "UPDATE inventory 
                                                       SET quantity = :new_quantity, item_sold = :new_item_sold
                                                       WHERE id = :inventory_id";
                                $stmtUpdateInventory = $conn->prepare($sqlUpdateInventory);
                                $stmtUpdateInventory->bindParam(':new_quantity', $newQuantity, PDO::PARAM_INT);
                                $stmtUpdateInventory->bindParam(':new_item_sold', $newItemSold, PDO::PARAM_INT);
                                $stmtUpdateInventory->bindParam(':inventory_id', $inventoryId, PDO::PARAM_INT);
                                $stmtUpdateInventory->execute();
                            }
                        }
                    }
        
                    // Commit transaction
                    $conn->commit();
        
                    // Fetch client email
                    if ($clientId) {
                        $sqlClient = "SELECT email, name FROM clients WHERE id = :client_id";
                        $stmtClient = $conn->prepare($sqlClient);
                        $stmtClient->bindParam(':client_id', $clientId, PDO::PARAM_INT);
                    } else {
                        $sqlClient = "SELECT email, name FROM unregistered_clients WHERE id = :unregistered_client_id";
                        $stmtClient = $conn->prepare($sqlClient);
                        $stmtClient->bindParam(':unregistered_client_id', $unregisteredClientId, PDO::PARAM_INT);
                    }
        
                    $stmtClient->execute();
                    $clientData = $stmtClient->fetch(PDO::FETCH_ASSOC);
        
                    if ($clientData) {
                        $clientEmail = $clientData['email'];
                        $clientName = $clientData['name'];
                    } else {
                        $clientEmail = null;
                        $clientName = 'Customer';
                    }
        
                // Send email using PHPMailer
                if ($clientEmail) {
                    $mail = new PHPMailer(true);
                    try {
                        $mail->isSMTP();
                        $mail->Host       = $_ENV['MAIL_HOST'];
$mail->SMTPAuth   = true;
$mail->Username   = $_ENV['MAIL_USERNAME'];
$mail->Password   = $_ENV['MAIL_PASSWORD'];
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port       = $_ENV['MAIL_PORT'];
$mail->setFrom($_ENV['MAIL_FROM_ADDRESS'], $_ENV['MAIL_FROM_NAME']);
                        $mail->addAddress($clientEmail, $clientName);

                        $mail->isHTML(true);
                        $mail->Subject = 'Order Receipt - SouthPaws';

                        // Generate email receipt HTML
                        $emailContent = '
                        <p style="text-align: left; font-size: 14px; margin-top: 20px;">
                            <strong>Thank you for shopping with SouthPaws!</strong>
                        </p>

                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <!-- Logo on the Left -->
                                <div style="width: 100%;">
                                    <img src="https://southpaws.scarlet2.io/southpawslogo.png" alt="Southpaws Logo" style="max-width: 300px;">
                                </div>

                                <!-- Receipt Details on the Right -->
                                <div style="text-align: right; font-size: 14px; width: 50%;">
                                    <p><strong>Receipt#:</strong> ' . htmlspecialchars($receiptNumber) . '</p>
                                    <p><strong>Date:</strong> ' . date("m/d/Y") . '</p>
                                    <p><strong>Cashier:</strong> ' . htmlspecialchars($confirmedBy) . '</p>
                                </div>
                            </div>
                            <hr style="border: 1px solid black;">

                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th style="border-bottom: 2px solid black; padding: 8px; text-align: left;">Item Name</th>
                                        <th style="border-bottom: 2px solid black; padding: 8px; text-align: center;">Qty</th>
                                        <th style="border-bottom: 2px solid black; padding: 8px; text-align: right;">Price</th>
                                        <th style="border-bottom: 2px solid black; padding: 8px; text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>';

                        foreach ($items as $item) {
                            $emailContent .= '
                                    <tr>
                                        <td style="padding: 8px; border-bottom: 1px solid black;">' . htmlspecialchars($item['name'] ?? $item['product_name']) . '</td>
                                        <td style="padding: 8px; border-bottom: 1px solid black; text-align: center;">' . (int)$item['quantity'] . '</td>
                                        <td style="padding: 8px; border-bottom: 1px solid black; text-align: right;">₱' . number_format((float)$item['price'], 2) . '</td>
                                        <td style="padding: 8px; border-bottom: 1px solid black; text-align: right;">₱' . number_format((float)($item['price'] * $item['quantity']), 2) . '</td>
                                    </tr>';
                        }

                        $changeAmount = max(0, $amountTendered - $grandTotal);

                        $emailContent .= '
                                </tbody>
                            </table>

                            <hr style="border: 1px solid black;">

                            <div style="margin-top: 20px; font-size: 14px; text-align: right;">
                                <p><strong>Subtotal:</strong> ₱' . number_format($grandTotal - $taxAmount, 2) . '</p>
                                <p><strong>Tax:</strong> ₱' . number_format($taxAmount, 2) . '</p>
                                <p><strong>Amount Due:</strong> ₱' . number_format($grandTotal, 2) . '</p>
                                <p><strong>Amount Tendered:</strong> ₱' . number_format($amountTendered, 2) . '</p>
                                <p><strong>Change:</strong> ₱' . number_format($changeAmount, 2) . '</p>
                            </div>

                            <p style="text-align: center; font-size: 14px; margin-top: 20px;">Thank you for shopping with SouthPaws!</p>
                        </div>';

                        $mail->Body = $emailContent;
                        $mail->send();
                    } catch (Exception $e) {
                        error_log("Email sending failed: " . $mail->ErrorInfo);
                    }
                }


        
                    echo json_encode(['status' => 1, 'message' => 'Order created successfully.', 'order_id' => $orderId, 'receipt_number' => $receiptNumber]);
                } catch (Exception $e) {
                    $conn->rollBack();
                    echo json_encode(['status' => 0, 'message' => 'Failed to create order: ' . $e->getMessage()]);
                }
                exit;
            } else {
                http_response_code(400);
                echo json_encode(['status' => 0, 'message' => 'Invalid action']);
                exit;
            }

    default:
        http_response_code(405);
        echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
        exit;
}
?>
