<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Connect to DB
include 'DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

// Extract and sanitize data
$service = $data["service"] ?? '';
$date = $data["date"] ?? '';
$time = $data["time"] ?? '';
$name = $data["name"] ?? '';
$contact = $data["contact"] ?? '';
$end_time = $data["end_time"] ?? '';


if (!$service || !$date || !$time || !$name || !$contact || !$end_time) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit();
}

$endDateTime = strtotime("1970-01-01 $end_time");
$latestEnd = strtotime("1970-01-01 17:00");

if ($endDateTime > $latestEnd) {
    http_response_code(400);
    echo json_encode(["error" => "End time must not be later than 5:00 PM"]);
    exit();
}

try {
    $stmt = $conn->prepare("INSERT INTO appointments (service, date, time, name, contact, end_time) VALUES (?, ?, ?, ?, ?, ?)");
    $success = $stmt->execute([
        $service,
        $date,
        $time,
        $name,
        $contact,
        $end_time
    ]);

    if ($success) {
        echo json_encode(["success" => true, "message" => "Appointment added"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Insert failed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Insert error: " . $e->getMessage()]);
}
