<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // Fetch all surgical consent forms including pet images
            $sql = "SELECT sc.id, sc.client_id, sc.patient_id, sc.surgery_date, sc.surgical_procedure, 
                           sc.signature, sc.date_signed, sc.created_at, sc.updated_at, sc.pet_image, 
                           c.name as client_name, c.address, c.cellnumber,  
                           p.name as pet_name, p.age  
                    FROM surgical_consent sc
                    JOIN clients c ON sc.client_id = c.id
                    JOIN patients p ON sc.patient_id = p.id";
    
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            // Process pet images
            foreach ($result as &$row) {
                // If pet_image exists, return the full URL
                if (!empty($row['pet_image'])) {
                    $row['pet_image'] = "http://localhost/api/uploads/" . basename($row['pet_image']);
                } else {
                    $row['pet_image'] = null; // No image available
                }
            }
    
            // Return the result as JSON
            echo json_encode(['status' => 'success', 'data' => $result ?: []]);
    
        } catch (Exception $e) {
            // Log and return errors
            error_log('❌ Error in GET method: ' . $e->getMessage());
            echo json_encode(['status' => 'error', 'message' => 'Failed to retrieve surgical consent records.']);
        }
        break;
    
    
    
    

    case 'POST':
    try {
        // Check if the request is multipart/form-data (for image upload)
        if (!empty($_FILES['pet_image']['name'])) {
            $client_id = $_POST['client_id'];
            $patient_id = $_POST['patient_id'];
            $surgery_date = $_POST['surgery_date'];
            $surgical_procedure = $_POST['surgical_procedure'];
            $signature = $_POST['signature'];
            $date_signed = $_POST['date_signed'];

            // Image Upload Handling
            $uploadDir = 'uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileName = time() . '_' . basename($_FILES['pet_image']['name']);
            $targetFilePath = $uploadDir . $fileName;
            $fileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));

            // Allowed file types
            $allowedTypes = ['jpg', 'jpeg', 'png'];
            if (!in_array($fileType, $allowedTypes)) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid file format. Only JPG, JPEG, and PNG allowed.']);
                exit;
            }

            // Move uploaded file
            if (move_uploaded_file($_FILES['pet_image']['tmp_name'], $targetFilePath)) {
                $pet_image = $targetFilePath;
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to upload pet image.']);
                exit;
            }
        } else {
            // If no image is uploaded, check if data is JSON
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid input data.']);
                exit;
            }

            $client_id = $data['client_id'];
            $patient_id = $data['patient_id'];
            $surgery_date = $data['surgery_date'];
            $surgical_procedure = $data['surgical_procedure'];
            $signature = $data['signature'];
            $date_signed = $data['date_signed'];
            $pet_image = null; // No image uploaded
        }

        // Insert Data into Database
        $sql = "INSERT INTO surgical_consent 
                (client_id, patient_id, surgery_date, surgical_procedure, signature, date_signed, pet_image) 
                VALUES (:client_id, :patient_id, :surgery_date, :surgical_procedure, :signature, :date_signed, :pet_image)";

        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':client_id', $client_id);
        $stmt->bindParam(':patient_id', $patient_id);
        $stmt->bindParam(':surgery_date', $surgery_date);
        $stmt->bindParam(':surgical_procedure', $surgical_procedure);
        $stmt->bindParam(':signature', $signature);
        $stmt->bindParam(':date_signed', $date_signed);
        $stmt->bindParam(':pet_image', $pet_image, PDO::PARAM_STR);

        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Consent form added successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add consent form.']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    break;


    case 'PUT':
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['id'])) {
                echo json_encode(['status' => 'error', 'message' => 'Consent form ID is required.']);
                exit;
            }

            $sql = "UPDATE surgical_consent 
                    SET client_id = :client_id, patient_id = :patient_id, surgery_date = :surgery_date, 
                        surgical_procedure = :surgical_procedure, signature = :signature, date_signed = :date_signed
                    WHERE id = :id";

            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $data['id']);
            $stmt->bindParam(':client_id', $data['client_id']);
            $stmt->bindParam(':patient_id', $data['patient_id']);
            $stmt->bindParam(':surgery_date', $data['surgery_date']);
            $stmt->bindParam(':surgical_procedure', $data['surgical_procedure']);
            $stmt->bindParam(':signature', $data['signature']);
            $stmt->bindParam(':date_signed', $data['date_signed']);

            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Consent form updated successfully.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update consent form.']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        try {
            $path = explode('/', $_SERVER['REQUEST_URI']);
            $id = $path[3] ?? null;

            if (!$id) {
                echo json_encode(['status' => 'error', 'message' => 'Consent form ID is required.']);
                exit;
            }

            $sql = "DELETE FROM surgical_consent WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $id);

            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Consent form deleted successfully.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete consent form.']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
}
?>
