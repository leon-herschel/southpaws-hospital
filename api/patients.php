<?php
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
        $sql = "SELECT patients.*, clients.name AS owner_name 
                FROM patients 
                LEFT JOIN clients ON patients.owner_id = clients.id";
    
        $path = explode('/', $_SERVER['REQUEST_URI']);
        
        if (isset($path[3]) && is_numeric($path[3])) {
            $clientId = intval($path[3]);
            $sql .= " WHERE patients.owner_id = :clientId"; // Fetch pets based on the owner ID
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':clientId', $clientId, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                $pets = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch all patients (pets) for this client
                echo json_encode(['pets' => $pets]); // Return pets as a field in the response
            } else {
                echo json_encode(['error' => 'Failed to execute query']);
            }
        } else {
            $stmt = $conn->prepare($sql);
            
            if ($stmt->execute()) {
                $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['patients' => $patients]);
            } else {
                echo json_encode(['error' => 'Failed to execute query']);
            }
        }
        break;
    
    case 'POST':
        $patients = json_decode(file_get_contents('php://input'));

        // Check if the owner_id exists in clients table
        $ownerId = $patients->owner_id;
        $sqlCheckOwner = "SELECT COUNT(*) FROM clients WHERE id = :owner_id";
        $stmtCheckOwner = $conn->prepare($sqlCheckOwner);
        $stmtCheckOwner->bindParam(':owner_id', $ownerId, PDO::PARAM_INT);
        $stmtCheckOwner->execute();
        $ownerExists = $stmtCheckOwner->fetchColumn();

        if ($ownerExists == 0) {
            echo json_encode(['status' => 0, 'message' => 'Invalid owner ID.']);
            exit;
        }

        $distinct_features = !empty($patients->distinct_features) ? $patients->distinct_features : "";
        $other_details     = !empty($patients->other_details) ? $patients->other_details : "";
        $weight            = isset($patients->weight) && is_numeric($patients->weight) ? $patients->weight : 0;

        // If owner exists, insert the patient record
        $sql = "INSERT INTO patients (owner_id, name, species, gender, breed, age, birthdate, distinct_features, other_details, weight, created_by, created_at) 
                VALUES (:owner_id, :name, :species, :gender, :breed, :age, :birthdate, :distinct_features, :other_details, :weight, :created_by, NOW())";
        $stmt = $conn->prepare($sql);

        $stmt->bindParam(':owner_id', $patients->owner_id);
        $stmt->bindParam(':name', $patients->name);
        $stmt->bindParam(':species', $patients->species);
        $stmt->bindParam(':gender', $patients->gender);
        $stmt->bindParam(':breed', $patients->breed);
        $stmt->bindParam(':age', $patients->age);
        $stmt->bindParam(':birthdate', $patients->birthdate);
        $stmt->bindParam(':distinct_features', $distinct_features);
        $stmt->bindParam(':other_details', $other_details);
        $stmt->bindParam(':weight', $weight);
        $stmt->bindParam(':created_by', $patients->created_by);

        if ($stmt->execute()) {
            $newPetId = $conn->lastInsertId();
            $sqlFetch = "SELECT * FROM patients WHERE id = :id";
            $stmtFetch = $conn->prepare($sqlFetch);
            $stmtFetch->bindParam(':id', $newPetId, PDO::PARAM_INT);
            $stmtFetch->execute();
            $newPet = $stmtFetch->fetch(PDO::FETCH_ASSOC);

            $response = [
                'status' => 1,
                'message' => 'Record created successfully.',
                'pet' => $newPet
            ];
        } else {
            $errorInfo = $stmt->errorInfo(); 
            $response = [
                'status' => 0,
                'message' => 'Failed to create record.',
                'error' => $errorInfo
            ];
        }

        echo json_encode($response);
        break;

        case 'PUT':
            $patients = json_decode(file_get_contents('php://input'));
        
            // Check if the owner_id exists in clients table
            $ownerId = $patients->owner_id;
            $sqlCheckOwner = "SELECT COUNT(*) FROM clients WHERE id = :owner_id";
            $stmtCheckOwner = $conn->prepare($sqlCheckOwner);
            $stmtCheckOwner->bindParam(':owner_id', $ownerId, PDO::PARAM_INT);
            $stmtCheckOwner->execute();
            $ownerExists = $stmtCheckOwner->fetchColumn();
        
            if ($ownerExists == 0) {
                echo json_encode(['status' => 0, 'message' => 'Invalid owner ID.']);
                exit;
            }

            $distinct_features = !empty($patients->pet_distinct_features) ? $patients->pet_distinct_features : "";
            $other_details     = !empty($patients->pet_other_details) ? $patients->pet_other_details : "";
            $weight            = isset($patients->pet_weight) && is_numeric($patients->pet_weight) ? $patients->pet_weight : 0;
        
            // If owner exists, update the patient record
            $sql = "UPDATE patients SET
                    name = :pet_name,
                    species = :pet_species,
                    gender = :pet_gender,
                    breed = :pet_breed,
                    weight = :pet_weight,
                    age = :pet_age,
                    birthdate = :pet_birthdate,
                    distinct_features = :pet_distinct_features,
                    other_details = :pet_other_details
                    WHERE id = :pet_id"; // Ensure the WHERE clause uses the correct column name
            
        
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':pet_id', $patients->pet_id, PDO::PARAM_INT);  // Ensure pet_id is being used for the update
            $stmt->bindParam(':pet_name', $patients->pet_name);
            $stmt->bindParam(':pet_species', $patients->pet_species);
            $stmt->bindParam(':pet_gender', $patients->pet_gender);
            $stmt->bindParam(':pet_breed', $patients->pet_breed);
            $stmt->bindParam(':pet_age', $patients->pet_age);
            $stmt->bindParam(':pet_birthdate', $patients->pet_birthdate);
            $stmt->bindParam(':pet_weight', $weight);
            $stmt->bindParam(':pet_distinct_features', $distinct_features);
            $stmt->bindParam(':pet_other_details', $other_details);

        
            // Execute the update statement
            if($stmt->execute()) {
                echo json_encode(['status' => 1, 'message' => 'Record updated successfully.']);
            } else {
                $errorInfo = $stmt->errorInfo();
                echo json_encode(['status' => 0, 'message' => 'Failed to edit record.', 'error' => $errorInfo]);
            }
            break;
        
    case 'DELETE':
        $sql = "DELETE FROM patients WHERE id = :id";
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
