<?php
include 'cors.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../DbConnect.php';
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
$reason_for_visit = $data["reason_for_visit"] ?? '';
$preferred_date   = $data["preferred_date"] ?? '';
$preferred_time   = $data["preferred_time"] ?? '';
$name             = $data["name"] ?? '';
$contact          = $data["contact"] ?? '';
$email            = isset($data["email"]) ? filter_var($data["email"], FILTER_SANITIZE_EMAIL) : '';
$status           = $data["status"] ?? 'Pending';
$pet_name         = $data["pet_name"] ?? '';
$pet_breed        = $data["pet_breed"] ?? '';
$pet_species      = $data["pet_species"] ?? '';
$notes            = $data["notes"] ?? '';

// Validate required fields
if (!$reason_for_visit || !$preferred_date || !$preferred_time || !$name || !$contact || !$email || !$pet_name || !$pet_breed || !$pet_species) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit();
}

// Rate-limit check BEFORE inserting
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

try {
    // Cleanup: delete attempts older than 1 day
    $cleanup = $conn->prepare("DELETE FROM booking_attempts WHERE attempt_time < (NOW() - INTERVAL 1 DAY)");
    $cleanup->execute();

    // Cleanup: delete pending appointments older than 30 days
    $cleanupPending = $conn->prepare("DELETE FROM pending_appointments WHERE preferred_date < (CURDATE() - INTERVAL 30 DAY)");
    $cleanupPending->execute();

    // Check attempts in the last 1 hour for this IP or contact
    $stmt = $conn->prepare("
        SELECT COUNT(*) as attempts 
        FROM booking_attempts 
        WHERE (ip_address = :ip OR contact = :contact) 
          AND attempt_time > (NOW() - INTERVAL 1 HOUR)
    ");
    $stmt->execute([':ip' => $ip, ':contact' => $contact]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row['attempts'] >= 3) {
        http_response_code(429); // Too Many Requests
        echo json_encode(["error" => "Too many booking attempts. Please try again later."]);
        exit();
    }

    // Log attempt
    $log = $conn->prepare("INSERT INTO booking_attempts (ip_address, contact) VALUES (?, ?)");
    $log->execute([$ip, $contact]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Rate-limit check failed: " . $e->getMessage()]);
    exit();
}

// Insert appointment (only runs if allowed)
try {
    $stmt = $conn->prepare("
        INSERT INTO pending_appointments (
            reason_for_visit, preferred_date, preferred_time, name, contact, status, email,
            pet_name, pet_breed, pet_species, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $success = $stmt->execute([
        $reason_for_visit,
        $preferred_date,
        $preferred_time,
        $name,
        $contact,
        $status,
        $email,
        $pet_name,
        $pet_breed,
        $pet_species,
        $notes
    ]);

    if ($success) {
        echo json_encode(["success" => true, "message" => "Pending appointment submitted"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Insert failed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Insert error: " . $e->getMessage()]);
}
