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
        // Counting total clients
        $sqlCount = "SELECT COUNT(*) AS total_clients FROM clients";
        $stmtCount = $conn->prepare($sqlCount);
        $stmtCount->execute();
        $resultCount = $stmtCount->fetch(PDO::FETCH_ASSOC);
        $total_clients = $resultCount['total_clients'];

        // Fetching clients data with pets
        $sqlClients = "SELECT clients.*, 
                      patients.id AS pet_id,
                      patients.owner_id AS owner_id,
                      patients.name AS pet_name, 
                      patients.species AS pet_species, 
                      patients.breed AS pet_breed, 
                      patients.weight AS pet_weight,
                      patients.age AS pet_age, 
                      patients.birthdate AS pet_birthdate, 
                      patients.distinct_features AS pet_distinct_features, 
                      patients.other_details AS pet_other_details
               FROM clients
               LEFT JOIN patients ON clients.id = patients.owner_id
               WHERE clients.archived = 0"; // ✅ Exclude archived clients

        // Check if a client ID is passed
        $path = explode('/', $_SERVER['REQUEST_URI']);
        if (isset($path[3]) && is_numeric($path[3])) {
            $sqlClients .= " AND clients.id = :id"; // ✅ Use AND instead of WHERE
        }        

        // Fetch all the clients and their pets
        $stmtClients = $conn->prepare($sqlClients);
        
        if (isset($path[3]) && is_numeric($path[3])) {
            // Bind the client ID if it is provided in the path
            $stmtClients->bindParam(':id', $path[3]);
        }

        $stmtClients->execute();
        $clientsData = $stmtClients->fetchAll(PDO::FETCH_ASSOC);

        // Grouping pets for each client
        $clients = [];
        foreach ($clientsData as $row) {
            $client_id = $row['id'];
            // Check if the client already exists in the clients array
            if (!isset($clients[$client_id])) {
                // If not, initialize a new client entry
                $clients[$client_id] = [
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'address' => $row['address'],
                    'cellnumber' => $row['cellnumber'],
                    'email' => $row['email'],
                    'age' => $row['age'],
                    'gender' => $row['gender'],
                    'pets' => [] // Initialize an empty pets array
                ];
            }

            // If pet data is available, add it to the pets array for the client
            if ($row['pet_id']) {
                $clients[$client_id]['pets'][] = [
                    'pet_id' => $row['pet_id'],
                    'owner_id' => $row['owner_id'], 
                    'pet_name' => $row['pet_name'],
                    'pet_species' => $row['pet_species'],
                    'pet_breed' => $row['pet_breed'],
                    'pet_weight' => $row['pet_weight'],
                    'pet_age' => $row['pet_age'],
                    'pet_birthdate' => $row['pet_birthdate'],
                    'pet_distinct_features' => $row['pet_distinct_features'],
                    'pet_other_details' => $row['pet_other_details']
                ];
            }
        }

        // Prepare the response with total clients and clients array
        $response = [
            'total_clients' => $total_clients,
            'clients' => array_values($clients) // Convert associative array to indexed array
        ];

        // Send the response as JSON
        echo json_encode($response);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true); // Decode JSON input

        try {
            // Start transaction
            $conn->beginTransaction();

            // Insert client
            $sqlClient = "INSERT INTO clients (name, address, cellnumber, email, age, gender, created_at, created_by) 
                          VALUES (:name, :address, :cellnumber, :email, :age, :gender, :created_at, :created_by)";
            $stmtClient = $conn->prepare($sqlClient);

            $created_at = date('Y-m-d H:i:s');

            // Ensure 'age' is not empty, set a default if missing
            $age = isset($data['age']) && !empty($data['age']) ? $data['age'] : 'Unknown'; // Use a default if age is missing
            $stmtClient->bindParam(':name', $data['name']);
            $stmtClient->bindParam(':address', $data['address']);
            $stmtClient->bindParam(':cellnumber', $data['cellnumber']);
            $stmtClient->bindParam(':email', $data['email']);
            $stmtClient->bindParam(':age', $age);
            $stmtClient->bindParam(':gender', $data['gender']);
            $stmtClient->bindParam(':created_at', $created_at);
            $stmtClient->bindParam(':created_by', $data['created_by']);

            if ($stmtClient->execute()) {
                $client_id = $conn->lastInsertId(); // Get the new client ID

                // Insert patients if any
                if (!empty($data['patients'])) {
                    $sqlPatient = "INSERT INTO patients (owner_id, name, species, breed, weight, age, birthdate, distinct_features, other_details, created_by, created_at) 
                                   VALUES (:owner_id, :name, :species, :breed, :weight, :age, :birthdate, :distinct_features, :other_details, :created_by, :created_at)";
                    $stmtPatient = $conn->prepare($sqlPatient);

                    foreach ($data['patients'] as $patient) {
                        // Ensure each patient has an 'age'
                        $patientAge = isset($patient['age']) && !empty($patient['age']) ? $patient['age'] : 'Unknown'; // Default age if missing

                        $stmtPatient->bindParam(':owner_id', $client_id);
                        $stmtPatient->bindParam(':name', $patient['name']);
                        $stmtPatient->bindParam(':species', $patient['species']);
                        $stmtPatient->bindParam(':breed', $patient['breed']);
                        $stmtPatient->bindParam(':weight', $patient['weight']);
                        $stmtPatient->bindParam(':age', $patientAge);
                        $stmtPatient->bindParam(':birthdate', $patient['birthdate']);
                        $stmtPatient->bindParam(':distinct_features', $patient['distinct_features']);
                        $stmtPatient->bindParam(':other_details', $patient['other_details']);
                        $stmtPatient->bindParam(':created_by', $data['created_by']);
                        $stmtPatient->bindParam(':created_at', $created_at);

                        // Execute for each patient
                        $stmtPatient->execute();
                    }
                }

                // Commit the transaction
                $conn->commit();

                // Response
                $response = [
                    'status' => 1,
                    'message' => 'Client and patients added successfully.',
                    'client_id' => $client_id,
                ];
            } else {
                // Rollback if client insertion fails
                $conn->rollBack();
                $response = ['status' => 0, 'message' => 'Failed to add client.'];
            }
        } catch (Exception $e) {
            // Rollback transaction on error
            $conn->rollBack();
            $response = ['status' => 0, 'message' => 'An error occurred: ' . $e->getMessage()];
        }

        echo json_encode($response);
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true); // Decode JSON input as associative array
        $sql = "UPDATE clients SET 
                name = :name, 
                address = :address, 
                cellnumber = :cellnumber, 
                email = :email, 
                age = :age, 
                gender = :gender
                WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':name', $input['name']);
        $stmt->bindParam(':address', $input['address']);
        $stmt->bindParam(':cellnumber', $input['cellnumber']);
        $stmt->bindParam(':email', $input['email']);
        $stmt->bindParam(':age', $input['age']);
        $stmt->bindParam(':gender', $input['gender']);
        $stmt->bindParam(':id', $input['id']);
        if ($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Record updated successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to edit record.'];
        }
        echo json_encode($response);
        break;

    case 'DELETE':
        $path = explode('/', $_SERVER['REQUEST_URI']);
        $client_id = $path[3]; // Get client ID from URL path
    
        try {
            // Start a transaction to ensure atomicity
            $conn->beginTransaction();
    
            // First, delete associated patients
            $sqlDeletePatients = "DELETE FROM patients WHERE owner_id = :client_id";
            $stmtDeletePatients = $conn->prepare($sqlDeletePatients);
            $stmtDeletePatients->bindParam(':client_id', $client_id);
    
            if ($stmtDeletePatients->execute()) {
                // Then, delete the client
                $sqlDeleteClient = "DELETE FROM clients WHERE id = :client_id";
                $stmtDeleteClient = $conn->prepare($sqlDeleteClient);
                $stmtDeleteClient->bindParam(':client_id', $client_id);
    
                if ($stmtDeleteClient->execute()) {
                    // Commit transaction if both deletions succeed
                    $conn->commit();
                    $response = ['status' => 1, 'message' => 'Record and associated patients deleted successfully.'];
                } else {
                    // Rollback if client deletion fails
                    $conn->rollBack();
                    $response = ['status' => 0, 'message' => 'Failed to delete client.'];
                }
            } else {
                // Rollback if patients deletion fails
                $conn->rollBack();
                $response = ['status' => 0, 'message' => 'Failed to delete associated patients.'];
            }
        } catch (Exception $e) {
            // Rollback in case of any errors
            $conn->rollBack();
            $response = ['status' => 0, 'message' => 'An error occurred: ' . $e->getMessage()];
        }
    
        echo json_encode($response);
        break;
}
?>
