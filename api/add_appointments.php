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

// Define the logAudit function
function logAudit($conn, $userId, $action, $targetTable, $targetId, $recordName, $email) {
    $stmt = $conn->prepare("
        INSERT INTO audit_logs (user_id, action, target_table, target_id, description, email, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $userId,
        $action,
        $targetTable,
        $targetId,
        $recordName,
        $email
    ]);
}

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

// Extract appointment fields
$service = $data["service"] ?? '';
$date = $data["date"] ?? '';
$time = $data["time"] ?? '';
$name = $data["name"] ?? '';
$contact = $data["contact"] ?? '';
$email = isset($data["email"]) ? filter_var($data["email"], FILTER_SANITIZE_EMAIL) : '';
$end_time = $data["end_time"] ?? '';
$status = $data["status"] ?? 'Pending';
$reference_number = $data["reference_number"] ?? "";
$pet_name = $data["pet_name"] ?? '';
$pet_breed = $data["pet_breed"] ?? '';
$pet_species = $data["pet_species"] ?? '';
$doctor_id = $data["doctor_id"] ?? null;

// For audit logging
$user_id = $data["user_id"] ?? null;
$user_email = isset($data["user_email"]) ? filter_var($data["user_email"], FILTER_SANITIZE_EMAIL) : null;

if (
    !$service || !$date || !$time || !$name || !$contact || !$end_time || !$email ||
    !$pet_name || !$pet_breed || !$pet_species || !$user_id || !$user_email || !$doctor_id
) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit();
}

// Time validation
$endDateTime = strtotime("1970-01-01 $end_time");
$latestEnd = strtotime("1970-01-01 17:00");

if ($endDateTime > $latestEnd) {
    http_response_code(400);
    echo json_encode(["error" => "End time must not be later than 5:00 PM"]);
    exit();
}

// Conflict check
$checkStmt = $conn->prepare("SELECT COUNT(*) FROM appointments WHERE date = ? AND time = ? AND doctor_id = ?");
$checkStmt->execute([$date, $time, $doctor_id]);
$existingCount = $checkStmt->fetchColumn();

if ($existingCount > 0) {
    http_response_code(409);
    echo json_encode(["error" => "Schedule conflict: An appointment already exists at this time."]);
    exit();
}

try {
    $stmt = $conn->prepare("
        INSERT INTO appointments (
            service, date, time, name, contact, end_time, status, reference_number, email,
            pet_name, pet_breed, pet_species, doctor_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $success = $stmt->execute([
        $service,
        $date,
        $time,
        $name,
        $contact,
        $end_time,
        $status,
        $reference_number,
        $email,
        $pet_name,
        $pet_breed,
        $pet_species,
        $doctor_id
    ]);

    if ($success) {
        $appointmentId = $conn->lastInsertId(); // Get inserted appointment ID
        logAudit(
            $conn,
            $user_id,
            'create',       // Action type
            'appointments', // Table name
            $appointmentId, // Target ID
            $name,          // Record name (client's name)
            $user_email     // User email
        );

        echo json_encode(["success" => true, "message" => "Appointment added"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Insert failed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Insert error: " . $e->getMessage()]);
}
