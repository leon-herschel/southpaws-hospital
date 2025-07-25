<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

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
