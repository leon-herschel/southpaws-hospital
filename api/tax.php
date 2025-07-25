<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'DbConnect.php'; // Ensure you have a correct database connection file
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method === 'GET') {
    try {
        $stmt = $conn->prepare("SELECT tax_rate FROM tax LIMIT 1"); // Fetch only one row
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result) {
            echo json_encode(['status' => 1, 'tax' => $result['tax_rate']]);
        } else {
            echo json_encode(['status' => 1, 'tax' => 0]); // Default tax rate to 0 if not found
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 0, 'message' => 'Failed to fetch tax rate: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $newTax = isset($data['tax']) ? floatval($data['tax']) : null;

    if ($newTax === null || $newTax < 0) {
        echo json_encode(['status' => 0, 'message' => 'Invalid tax rate provided.']);
        exit;
    }

    try {
        // Check if a tax record already exists
        $checkStmt = $conn->prepare("SELECT id FROM tax LIMIT 1");
        $checkStmt->execute();
        $existingTax = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingTax) {
            // Update existing tax rate
            $updateStmt = $conn->prepare("UPDATE tax SET tax_rate = ? WHERE id = ?");
            $updateStmt->execute([$newTax, $existingTax['id']]);
        } else {
            // Insert new tax rate
            $insertStmt = $conn->prepare("INSERT INTO tax (tax_rate) VALUES (?)");
            $insertStmt->execute([$newTax]);
        }

        echo json_encode(['status' => 1, 'message' => 'Tax rate updated successfully.', 'new_tax' => $newTax]);
    } catch (Exception $e) {
        echo json_encode(['status' => 0, 'message' => 'Failed to update tax rate: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 0, 'message' => 'Invalid request method.']);
exit;
?>
