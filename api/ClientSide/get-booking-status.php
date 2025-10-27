<?php
include 'cors.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include('../DbConnect.php');
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

try {
   $stmt = $conn->query("SELECT appointment_form_enabled FROM global_settings WHERE id = 1");
$result = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode(["appointmentFormEnabled" => (bool)$result['appointment_form_enabled']]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed: " . $e->getMessage()]);
}
