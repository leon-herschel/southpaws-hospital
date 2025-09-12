<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

include '../DbConnect.php';
$objDB = new DbConnect;


 try {
    $conn = $objDB->connect();
 } catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit();
 }

 $data = json_decode(file_get_contents("php://input"), true);

 if (!isset($data['startTime']) || !isset($data['endTime'])) {
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
    exit();
 }

 $startTime = $data['startTime'];
 $endTime = $data['endTime'];

 try {
    $sql = "INSERT INTO appointment_settings (id, start_time, end_time)
    VALUES (1, :start_time, :end_time)
    ON DUPLICATE KEY UPDATE
    start_time = VALUES(start_time),
    end_time = VALUES(end_time)";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':start_time', $startTime);
    $stmt->bindParam(':end_time', $endTime);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Time limits saved"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to save"]);
    }

 } catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>