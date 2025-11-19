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

try {
    $notifications = [];

    // Parse dismissed IDs from query string, e.g., ?dismissed=1,3,5
    $dismissedIds = [];
    if (!empty($_GET['dismissed'])) {
        $dismissedIds = array_filter(
            array_map('intval', explode(',', $_GET['dismissed'])),
            fn($id) => $id > 0
        );
    }

    // Build exclusion condition dynamically
    $cancelledCondition = "";
    $pendingCondition = "";
    if (!empty($dismissedIds)) {
        $placeholders = implode(',', array_fill(0, count($dismissedIds), '?'));
        $cancelledCondition = " AND id NOT IN ($placeholders)";
        $pendingCondition   = " AND id NOT IN ($placeholders)";
    }

    // Query Cancelled Appointments
    $sqlCancelled = "SELECT id, status, name, date, time, created_at
                     FROM appointments 
                     WHERE status = 'Cancelled' $cancelledCondition";
    $stmtCancelled = $conn->prepare($sqlCancelled);
    if (!empty($dismissedIds)) {
        $stmtCancelled->execute($dismissedIds);
    } else {
        $stmtCancelled->execute();
    }
    $cancelled = $stmtCancelled->fetchAll(PDO::FETCH_ASSOC);

    // Query Pending Appointments
    $sqlPending = "SELECT id, status, name, created_at 
                   FROM pending_appointments 
                   WHERE status = 'Pending' $pendingCondition";
    $stmtPending = $conn->prepare($sqlPending);
    if (!empty($dismissedIds)) {
        $stmtPending->execute($dismissedIds);
    } else {
        $stmtPending->execute();
    }
    $pending = $stmtPending->fetchAll(PDO::FETCH_ASSOC);

    // Merge notifications
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
