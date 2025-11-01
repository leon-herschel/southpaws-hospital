<?php
include '../cors.php';
header("Content-Type: application/json");


include '../DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$reference_number = $data['reference_number'] ?? '';

if (!$reference_number) {
    http_response_code(400);
    echo json_encode(["error" => "Reference number is required."]);
    exit();
}

try {
    $stmt = $conn->prepare("SELECT status, DATE(date) as appointment_date FROM appointments WHERE reference_number = ?");
    $stmt->execute([$reference_number]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        echo json_encode(["valid" => false, "message" => "Reference number not found."]);
    } elseif ($appointment['status'] !== 'Confirmed') {
        echo json_encode(["valid" => false, "message" => "Appointment is not confirmed."]);
    } elseif ($appointment['appointment_date'] !== date('Y-m-d')) {
        // Send a "warning" flag but still allow proceeding
        echo json_encode([
            "valid" => "warning",
            "message" => "This appointment is not scheduled for today. Please verify before proceeding."
        ]);
    } else {
        echo json_encode(["valid" => true]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query error: " . $e->getMessage()]);
}
