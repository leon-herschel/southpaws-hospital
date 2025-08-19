<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include('../DbConnect.php');
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
    $stmt = $conn->query("SELECT id, name, email, cellnumber AS contact FROM clients WHERE archived = 0 ORDER BY name ASC");
    $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "clients" => $clients]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
