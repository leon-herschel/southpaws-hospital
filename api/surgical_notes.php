<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

include 'DbConnect.php';

$db = new DbConnect();
$conn = $db->connect();

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
