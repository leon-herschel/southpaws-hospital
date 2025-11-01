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

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $conn->prepare("SELECT * FROM surgical_notes");
        $stmt->execute();
        $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($notes);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("INSERT INTO surgical_notes (title, content) VALUES (:title, :content)");
        $stmt->bindParam(':title', $data->title);
        $stmt->bindParam(':content', $data->content);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Note Created']);
        } else {
            echo json_encode(['message' => 'Note Creation Failed']);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        $stmt = $conn->prepare("UPDATE surgical_notes SET title = :title, content = :content WHERE id = :id");
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':title', $data->title);
        $stmt->bindParam(':content', $data->content);
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Note Updated']);
        } else {
            echo json_encode(['message' => 'Note Update Failed']);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            echo json_encode(['message' => 'ID is required for deletion.']);
            exit;
        }
    
        $id = intval($_GET['id']);
        $stmt = $conn->prepare("DELETE FROM surgical_notes WHERE id = :id");
        $stmt->bindParam(':id', $id);
    
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Note Deleted']);
        } else {
            echo json_encode(['message' => 'Note Deletion Failed']);
        }
        break;
}
