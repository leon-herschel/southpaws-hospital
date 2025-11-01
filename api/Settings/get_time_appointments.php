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

try {
    // Make sure table exists
    $sql = "CREATE TABLE IF NOT EXISTS appointment_settings (
                id INT PRIMARY KEY,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL
            )";
    $conn->exec($sql);

    // Fetch the saved time range (id = 1, since we only keep one row)
    $stmt = $conn->prepare("SELECT start_time, end_time FROM appointment_settings WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        echo json_encode([
            "status" => "success",
            "start_time" => $result['start_time'],
            "end_time" => $result['end_time']
        ]);
    } else {
        echo json_encode([
            "status" => "success",
            "start_time" => null,
            "end_time" => null
        ]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
