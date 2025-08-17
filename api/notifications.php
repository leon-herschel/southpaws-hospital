<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

try {
    $notifications = [];

    $sqlCancelled = "Select id, status, name, date, time FROM appointments WHERE status = 'Cancelled'";
    $stmtCancelled = $conn->prepare($sqlCancelled);
    $stmtCancelled->execute();
    $cancelled = $stmtCancelled->fetchAll(PDO::FETCH_ASSOC);

    $sqlPending = "Select id, status, name, created_at FROM pending_appointments WHERE status = 'Pending'";
    $stmtPending = $conn->prepare($sqlPending);
    $stmtPending->execute();
    $pending = $stmtPending->fetchAll(PDO::FETCH_ASSOC);


    $notifications = array_merge($cancelled, $pending);

    echo json_encode([
        "success" => true,
        "notifications" => $notifications
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

?>
