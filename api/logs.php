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
    // Check request method
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Handle GET request to fetch logs
        $stmt = $conn->prepare('
            SELECT l.id, l.user_id, l.event_type, l.event_time, u.first_name, u.last_name 
            FROM user_logs l
            JOIN internal_users u ON l.user_id = u.id
        ');
        $stmt->execute();
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Check if logs is an array
        if (is_array($logs)) {
            echo json_encode(['logs' => $logs]);
        } else {
            echo json_encode(['error' => 'Data fetched is not an array']);
        }
    } elseif ($method === 'POST') {
        // Handle POST request to create a new log
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['user_id']) && isset($data['event_type']) && isset($data['event_time'])) {
            $stmt = $conn->prepare('INSERT INTO user_logs (user_id, event_type, event_time) VALUES (:user_id, :event_type, :event_time)');
            $stmt->execute([
                ':user_id' => $data['user_id'],
                ':event_type' => $data['event_type'],
                ':event_time' => $data['event_time']
            ]);

            echo json_encode(['message' => 'Log added successfully']);
        } else {
            echo json_encode(['error' => 'Invalid input']);
        }
    } elseif ($method === 'PUT') {
        // Handle PUT request to update a log
        parse_str(file_get_contents('php://input'), $data);
        if (isset($data['id']) && isset($data['user_id']) && isset($data['event_type']) && isset($data['event_time'])) {
            $stmt = $conn->prepare('UPDATE user_logs SET user_id = :user_id, event_type = :event_type, event_time = :event_time WHERE id = :id');
            $stmt->execute([
                ':id' => $data['id'],
                ':user_id' => $data['user_id'],
                ':event_type' => $data['event_type'],
                ':event_time' => $data['event_time']
            ]);

            echo json_encode(['message' => 'Log updated successfully']);
        } else {
            echo json_encode(['error' => 'Invalid input']);
        }
    } elseif ($method === 'DELETE') {
        // Handle DELETE request to delete a log
        parse_str(file_get_contents('php://input'), $data);
        if (isset($data['id'])) {
            $stmt = $conn->prepare('DELETE FROM user_logs WHERE id = :id');
            $stmt->execute([':id' => $data['id']]);

            echo json_encode(['message' => 'Log deleted successfully']);
        } else {
            echo json_encode(['error' => 'Invalid input']);
        }
    } else {
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
