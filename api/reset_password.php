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

// Read the raw POST data
$data = json_decode(file_get_contents("php://input"), true);

// Check if the token and password are provided
if (isset($data['token']) && isset($data['password'])) {
    $token = $data['token'];
    $password = $data['password'];

    // Check if the token exists in the database
    $sql = "SELECT * FROM internal_users WHERE reset_token = :reset_token";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':reset_token', $token);
    $stmt->execute();
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    // If user is found
    if ($userData) {
        // Hash the new password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Update the password and reset the token
        $updateSql = "UPDATE internal_users SET password = :password, reset_token = NULL WHERE reset_token = :reset_token";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bindParam(':password', $hashedPassword);
        $updateStmt->bindParam(':reset_token', $token);
        $updateStmt->execute();

        // Respond with a success message
        echo json_encode(['status' => 1, 'message' => 'Your password has been reset successfully.']);
    } else {
        // Token is invalid or expired
        echo json_encode(['status' => 0, 'message' => 'Invalid or expired reset token.']);
    }
} else {
    // Missing token or password in the request
    echo json_encode(['status' => 0, 'message' => 'Missing token or password.']);
}
?>
