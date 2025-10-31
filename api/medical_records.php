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
        // Fetch all medical records
        $sql = "SELECT * FROM medical_records";
        $stmt = $conn->prepare($sql);

        if ($stmt->execute()) {
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['records' => $records]);
        } else {
            echo json_encode(['error' => 'Failed to fetch medical records']);
        }
        break;

case 'POST':
    // Handle POST request to add a new medical record
    $data = json_decode(file_get_contents('php://input'));

    // Prepare the SQL query to insert data into the database
    $sql = "INSERT INTO medical_records (
                patient_id, chief_complaint, history, diagnostic_plan, differentials, 
                treatment_plan, veterinarian, heart_rate,
                lymph_nodes, respiratory_rate, abdomen, bcs, cardiovascular, general_appearance,
                respiratory, mm, genitourinary, ears, integument, eyes, musculoskeletal, nose, neuro, 
                created_by, created_at
            ) 
            VALUES (
                :patient_id, :chief_complaint, :history, :diagnostic_plan, :differentials, 
                :treatment_plan, :veterinarian, :heart_rate,
                :lymph_nodes, :respiratory_rate, :abdomen, :bcs, :cardiovascular, :general_appearance,
                :respiratory, :mm, :genitourinary, :ears, :integument, :eyes, :musculoskeletal, :nose, :neuro, 
                :created_by, CURRENT_TIMESTAMP
            )";

    // Prepare the statement
    $stmt = $conn->prepare($sql);

    // Bind the parameters
    $stmt->bindParam(':patient_id', $data->patient_id);
    $stmt->bindParam(':chief_complaint', $data->chief_complaint);
    $stmt->bindParam(':history', $data->history);
    $stmt->bindParam(':diagnostic_plan', $data->diagnostic_plan);
    $stmt->bindParam(':differentials', $data->differentials);
    $stmt->bindParam(':treatment_plan', $data->treatment_plan);
    $stmt->bindParam(':veterinarian', $data->veterinarian);
    $stmt->bindParam(':heart_rate', $data->heart_rate);
    $stmt->bindParam(':lymph_nodes', $data->lymph_nodes);
    $stmt->bindParam(':respiratory_rate', $data->respiratory_rate);
    $stmt->bindParam(':abdomen', $data->abdomen);
    $stmt->bindParam(':bcs', $data->bcs);
    $stmt->bindParam(':cardiovascular', $data->cardiovascular);
    $stmt->bindParam(':general_appearance', $data->general_appearance);
    $stmt->bindParam(':respiratory', $data->respiratory);
    $stmt->bindParam(':mm', $data->mm);
    $stmt->bindParam(':genitourinary', $data->genitourinary);
    $stmt->bindParam(':ears', $data->ears);
    $stmt->bindParam(':integument', $data->integument);
    $stmt->bindParam(':eyes', $data->eyes);
    $stmt->bindParam(':musculoskeletal', $data->musculoskeletal);
    $stmt->bindParam(':nose', $data->nose);
    $stmt->bindParam(':neuro', $data->neuro);
    $stmt->bindParam(':created_by', $data->created_by); // Bind created_by

    // Execute the query and check if the data is inserted
    if ($stmt->execute()) {
        echo json_encode(['status' => 1, 'message' => 'Medical record added successfully.']);
    } else {
        echo json_encode(['status' => 0, 'message' => 'Failed to add medical record.']);
    }
    break;

    case 'PUT':
        // Handle PUT request to update an existing medical record (optional)
        $data = json_decode(file_get_contents('php://input'));

        // SQL query to update the record
        $sql = "UPDATE medical_records SET 
                chief_complaint = :chief_complaint,
                history = :history,
                diagnostic_plan = :diagnostic_plan,
                differentials = :differentials,
                treatment_plan = :treatment_plan,
                veterinarian = :veterinarian,
                heart_rate = :heart_rate,
                lymph_nodes = :lymph_nodes,
                respiratory_rate = :respiratory_rate,
                abdomen = :abdomen,
                bcs = :bcs,
                cardiovascular = :cardiovascular,
                general_appearance = :general_appearance,
                respiratory = :respiratory,
                mm = :mm,
                genitourinary = :genitourinary,
                ears = :ears,
                integument = :integument,
                eyes = :eyes,
                musculoskeletal = :musculoskeletal,
                nose = :nose,
                neuro = :neuro,
                date = :date 
                WHERE id = :id";

        $stmt = $conn->prepare($sql);

        // Bind the parameters
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':chief_complaint', $data->chief_complaint);
        $stmt->bindParam(':history', $data->history);
        $stmt->bindParam(':diagnostic_plan', $data->diagnostic_plan);
        $stmt->bindParam(':differentials', $data->differentials);
        $stmt->bindParam(':treatment_plan', $data->treatment_plan);
        $stmt->bindParam(':veterinarian', $data->veterinarian);
        $stmt->bindParam(':heart_rate', $data->heart_rate);
        $stmt->bindParam(':lymph_nodes', $data->lymph_nodes);
        $stmt->bindParam(':respiratory_rate', $data->respiratory_rate);
        $stmt->bindParam(':abdomen', $data->abdomen);
        $stmt->bindParam(':bcs', $data->bcs);
        $stmt->bindParam(':cardiovascular', $data->cardiovascular);
        $stmt->bindParam(':general_appearance', $data->general_appearance);
        $stmt->bindParam(':respiratory', $data->respiratory);
        $stmt->bindParam(':mm', $data->mm);
        $stmt->bindParam(':genitourinary', $data->genitourinary);
        $stmt->bindParam(':ears', $data->ears);
        $stmt->bindParam(':integument', $data->integument);
        $stmt->bindParam(':eyes', $data->eyes);
        $stmt->bindParam(':musculoskeletal', $data->musculoskeletal);
        $stmt->bindParam(':nose', $data->nose);
        $stmt->bindParam(':neuro', $data->neuro);
        $stmt->bindParam(':date', $data->date);

        // Execute the query and check if the data is updated
        if ($stmt->execute()) {
            echo json_encode(['status' => 1, 'message' => 'Medical record updated successfully.']);
        } else {
            echo json_encode(['status' => 0, 'message' => 'Failed to update medical record.']);
        }
        break;

    case 'DELETE':
        // Handle DELETE request to remove a medical record (optional)
        $data = json_decode(file_get_contents('php://input'));
        $sql = "DELETE FROM medical_records WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            echo json_encode(['status' => 1, 'message' => 'Medical record deleted successfully.']);
        } else {
            echo json_encode(['status' => 0, 'message' => 'Failed to delete medical record.']);
        }
        break;
}
?>
