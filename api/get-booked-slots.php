<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$date = $_GET['date'] ?? '';

if (!$date) {
    http_response_code(400);
    echo json_encode(["error" => "Date is required"]);
    exit();
}

$stmt = $conn->prepare("SELECT id, time, end_time FROM appointments WHERE date = ? AND status != 'Pending'");
$stmt->execute([$date]);
$booked = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["bookedRanges" => $booked]);
