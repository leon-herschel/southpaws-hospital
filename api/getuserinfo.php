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

if ($method === 'GET') {
    $userId = $_GET['id'];

    // Check if userID is provided
    if (!empty($userId)) {
        // Prepare the SQL statement to find the user by ID
        $sql = "SELECT username FROM internal_users WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $userId);

        if ($stmt->execute()) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $response = [
                    'status' => 1,
                    'username' => $user['username']
                ];
            } else {
                $response = [
                    'status' => 0,
                    'message' => 'User not found.'
                ];
            }
        } else {
            $response = [
                'status' => 0,
                'message' => 'Failed to execute query.'
            ];
        }
    } else {
        $response = [
            'status' => 0,
            'message' => 'Missing userID.'
        ];
    }

    echo json_encode($response);
}
?>
