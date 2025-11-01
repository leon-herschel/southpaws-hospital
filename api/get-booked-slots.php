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

$date = $_GET['date'] ?? '';
$doctorId = $_GET['doctor_id'] ?? '';

if (!$date) {
    http_response_code(400);
    echo json_encode(["error" => "Date is required"]);
    exit();
}

if (!$doctorId) {
    http_response_code(400);
    echo json_encode(["error" => "Doctor ID is required"]);
    exit();
}

// Only get booked slots for that doctor (and exclude pending)
$stmt = $conn->prepare("
    SELECT id, time, end_time 
    FROM appointments 
    WHERE date = ? 
      AND doctor_id = ? 
      AND status != 'Pending'
");
$stmt->execute([$date, $doctorId]);
$booked = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["bookedRanges" => $booked]);
