<?php
require_once 'vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__, '.env.domain');
$dotenv->load();

$API_URL = rtrim($_ENV['API_URL'], '/');

session_start();
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

switch ($method) {
   case 'GET':
    // Fetch immunization form records with client and pet details, including pet image
    $sql = "SELECT 
                im.id, 
                im.client_id, 
                im.patient_id, 
                im.signature, 
                im.created_at, 
                im.pet_image,  -- Fetch pet_image column
                c.name AS client_name, 
                c.address, 
                c.cellnumber, 
                p.name AS pet_name, 
                p.age 
            FROM immunization_form im
            JOIN clients c ON im.client_id = c.id
            JOIN patients p ON im.patient_id = p.id";

    $path = explode('/', $_SERVER['REQUEST_URI']);

    if (isset($path[3]) && is_numeric($path[3])) {
        $id = intval($path[3]);
        $sql .= " WHERE im.id = :id"; 
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    } else {
        $stmt = $conn->prepare($sql);
    }

    if ($stmt->execute()) {
        $immunizations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ensure the pet_image has a proper URL prefix
        foreach ($immunizations as &$record) {
            if (!empty($record['pet_image'])) {
                $record['pet_image'] = "{$API_URL}/uploads/" . basename($record['pet_image']);
            }
        }
        
        echo json_encode(['immunizations' => $immunizations]);
    } else {
        echo json_encode(['status' => 0, 'message' => 'Failed to fetch records.']);
    }
    break;

    

case 'POST':
    // Insert a new immunization record with image upload
    if (!isset($_POST['client_id'], $_POST['patient_id'], $_POST['signature'], $_POST['created_by'], $_POST['created_at'])) {
        echo json_encode(['status' => 0, 'message' => 'Missing required fields.']);
        exit;
    }

    $clientId = $_POST['client_id'];
    $petId = $_POST['patient_id'];
    $signature = $_POST['signature'];
    $createdBy = $_POST['created_by'];
    $createdAt = $_POST['created_at'];

    // Check for duplicate record
    $sqlCheckDuplicate = "SELECT COUNT(*) FROM immunization_form 
        WHERE client_id = :client_id AND patient_id = :patient_id AND DATE(created_at) = DATE(:created_at)";
    $stmtCheckDuplicate = $conn->prepare($sqlCheckDuplicate);
    $stmtCheckDuplicate->bindParam(':client_id', $clientId, PDO::PARAM_INT);
    $stmtCheckDuplicate->bindParam(':patient_id', $petId);
    $stmtCheckDuplicate->bindParam(':created_at', $createdAt, PDO::PARAM_STR);
    $stmtCheckDuplicate->execute();

    if ($stmtCheckDuplicate->fetchColumn() > 0) {
        echo json_encode(['status' => 0, 'message' => 'Duplicate record exists.']);
        exit;
    }

    // Validate client_id and pet_id
    $sqlCheckClient = "SELECT COUNT(*) FROM clients WHERE id = :client_id";
    $stmtCheckClient = $conn->prepare($sqlCheckClient);
    $stmtCheckClient->bindParam(':client_id', $clientId, PDO::PARAM_INT);
    $stmtCheckClient->execute();
    $clientExists = $stmtCheckClient->fetchColumn();

    $sqlCheckPet = "SELECT COUNT(*) FROM patients WHERE id = :pet_id";
    $stmtCheckPet = $conn->prepare($sqlCheckPet);
    $stmtCheckPet->bindParam(':pet_id', $petId);
    $stmtCheckPet->execute();
    $petExists = $stmtCheckPet->fetchColumn();

    if ($clientExists == 0 || $petExists == 0) {
        echo json_encode(['status' => 0, 'message' => 'Invalid client or pet ID.']);
        exit;
    }

    // Image upload handling
    $uploadDir = 'uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true); // Ensure the uploads folder exists
    }

    $imagePath = null;

    if (!empty($_FILES['pet_image']['name'])) {
        $fileName = time() . '_' . basename($_FILES['pet_image']['name']);
        $targetFilePath = $uploadDir . $fileName;
        $fileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));

        // Validate file type
        $allowedTypes = ['jpg', 'jpeg', 'png'];
        if (!in_array($fileType, $allowedTypes)) {
            echo json_encode(['status' => 0, 'message' => 'Invalid file format. Only JPG, JPEG, and PNG allowed.']);
            exit;
        }

        // Move the uploaded file
        if (move_uploaded_file($_FILES['pet_image']['tmp_name'], $targetFilePath)) {
            $imagePath = $targetFilePath;
        } else {
            echo json_encode(['status' => 0, 'message' => 'Failed to upload image.']);
            exit;
        }
    }

    // Insert into database
    $sql = "INSERT INTO immunization_form (client_id, patient_id, created_at, signature, created_by, pet_image) 
            VALUES (:client_id, :patient_id, :created_at, :signature, :created_by, :pet_image)";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':client_id', $clientId, PDO::PARAM_INT);
    $stmt->bindParam(':patient_id', $petId);
    $stmt->bindParam(':created_at', $createdAt, PDO::PARAM_STR);
    $stmt->bindParam(':signature', $signature, PDO::PARAM_INT);
    $stmt->bindParam(':created_by', $createdBy, PDO::PARAM_STR);
    $stmt->bindParam(':pet_image', $imagePath, PDO::PARAM_STR);

    if ($stmt->execute()) {
        echo json_encode(['status' => 1, 'message' => 'Immunization form created successfully.']);
    } else {
        echo json_encode(['status' => 0, 'message' => 'Failed to create immunization form.']);
    }
    break;

        
    case 'PUT':
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['id'])) {
                echo json_encode(['status' => 'error', 'message' => 'ID is required.']);
                exit;
            }

            $sql = "UPDATE immunization_form 
                    SET client_id = :client_id, patient_id = :patient_id, signature = :signature
                    WHERE id = :id";

            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $data['id']);
            $stmt->bindParam(':client_id', $data['client_id']);
            $stmt->bindParam(':patient_id', $data['patient_id']);
            $stmt->bindParam(':signature', $data['signature']);

            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Immunization form updated successfully.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update immunization form.']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

        
    case 'DELETE':
        // Delete an immunization record
        $path = explode('/', $_SERVER['REQUEST_URI']);
        $id = intval($path[3]);

        $sql = "DELETE FROM immunization_form WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);

        if ($stmt->execute()) {
            echo json_encode(['status' => 1, 'message' => 'Immunization form deleted successfully.']);
        } else {
            echo json_encode(['status' => 0, 'message' => 'Failed to delete immunization form.']);
        }
        break;

    default:
        echo json_encode(['status' => 0, 'message' => 'Invalid request method.']);
        break;
}
?>
