<?php
include 'cors.php';

include 'DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $user = json_decode(file_get_contents('php://input'));

    // Start the session
    session_start();

    // Check if user_id exists
    if (!empty($user->user_id)) {
        // Check if the logged-in user is a super admin (user_role = 3)
        if ($user->user_role !== 3) {
            // If not super admin, log the logout event in the database
            $logSql = "INSERT INTO user_logs (user_id, event_type) VALUES (:user_id, 'logout')";
            $logStmt = $conn->prepare($logSql);
            $logStmt->bindParam(':user_id', $user->user_id);
            $logStmt->execute();
        }

        // Clear session variables and destroy session
        session_unset();
        session_destroy();

        echo json_encode([
            'status' => 1,
            'message' => 'Logout successful.'
        ]);
    } else {
        // Force logout and destroy the session if user_id is missing
        session_unset();
        session_destroy();

        echo json_encode([
            'status' => 0,
            'message' => 'User ID is missing. Forced logout performed.'
        ]);
    }
}
?>
