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
switch ($method) {

    case 'GET':
        $path = explode('/', $_SERVER['REQUEST_URI']);
        if (isset($path[3]) && is_numeric($path[3])) {
            $patient_id = intval($path[3]);
            // Use $patient_id in your SQL query to filter medications
            $sql = "SELECT * FROM medications WHERE patient_id = :patient_id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':patient_id', $patient_id);
            if ($stmt->execute()) {
                $medications = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($medications);
            } else {
                echo json_encode(['error' => 'Failed to execute SQL query']);
            }
        } else {
            echo json_encode(['error' => 'Invalid patient ID']);
        }
        break;
        

        

    case 'POST':
        $medication = json_decode(file_get_contents('php://input'));
        $sql = "INSERT INTO medications
            (id, 
            patient_id, 
            medication_name,
            prescribed_by, 
            created_at 
            ) 
            VALUES 
            (null, 
            :name, 
            :price, 
            :prescribed_by, 
            :created_at)";
        $stmt = $conn->prepare($sql);
        $created_at = date('Y-m-d H:i:s');
        $prescribed_by = "1";
        $stmt->bindParam(':patient_id', $medication->patient_id);
        $stmt->bindParam(':medication_name', $medication->medication_name);
        $stmt->bindParam(':prescribed_by', $prescribed_by);
        $stmt->bindParam(':created_at', $created_at);

        if($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Record created successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to create record.'];
        }
        echo json_encode($response);
        break;

    case 'PUT':
        $user = json_decode(file_get_contents('php://input'));
        $sql = "UPDATE services SET 
            name = :name, 
            price =:price, 
            WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $created_at = date('Y-m-d H:i:s');
        $stmt->bindParam(':name', $service->name);
        $stmt->bindParam(':price', $service->price);
        if($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Record updated successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to edit record.'];
        }
        echo json_encode($response);
        break;


    case 'DELETE':
        $sql = "DELETE FROM medications WHERE id = :id";
        $path = explode('/', $_SERVER['REQUEST_URI']);
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $path[3]);
        if($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Record deleted successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to delete record.'];
        }
        echo json_encode($response);
        break;



}


?>