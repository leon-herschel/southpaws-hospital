<?php
session_start(); 
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get physical exam findings for a specific pet (patient)
        $sql = "SELECT * FROM physical_exam_findings WHERE patient_id = :patient_id";
        $path = explode('/', $_SERVER['REQUEST_URI']);
        
        if (isset($path[3]) && is_numeric($path[3])) {
            $patientId = intval($path[3]);
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':patient_id', $patientId, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                $examFindings = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch physical exam findings for the pet
                echo json_encode(['exam_findings' => $examFindings]); // Return exam findings as a field in the response
            } else {
                echo json_encode(['error' => 'Failed to execute query']);
            }
        } else {
            echo json_encode(['error' => 'Invalid patient ID']);
        }
        break;
    
    case 'POST':
        // Add new physical exam findings for a pet
        $examFinding = json_decode(file_get_contents('php://input'));

        // Insert the physical exam findings details into the physical_exam_findings table
        $sql = "INSERT INTO physical_exam_findings 
                (patient_id, heart_rate, respiratory_rate, temperature, oral_cavity, lymph_nodes, abdomen, cardiovascular, general_appearance, mm, ears, eyes, nose, genitourinary, integument, musculoskeletal, neuro)
                VALUES 
                (:patient_id, :heart_rate, :respiratory_rate, :temperature, :oral_cavity, :lymph_nodes, :abdomen, :cardiovascular, :general_appearance, :mm, :ears, :eyes, :nose, :genitourinary, :integument, :musculoskeletal, :neuro)";
        $stmt = $conn->prepare($sql);

        $stmt->bindParam(':patient_id', $examFinding->patient_id);
        $stmt->bindParam(':heart_rate', $examFinding->heart_rate);
        $stmt->bindParam(':respiratory_rate', $examFinding->respiratory_rate);
        $stmt->bindParam(':temperature', $examFinding->temperature);
        $stmt->bindParam(':oral_cavity', $examFinding->oral_cavity);
        $stmt->bindParam(':lymph_nodes', $examFinding->lymph_nodes);
        $stmt->bindParam(':abdomen', $examFinding->abdomen);
        $stmt->bindParam(':cardiovascular', $examFinding->cardiovascular);
        $stmt->bindParam(':general_appearance', $examFinding->general_appearance);
        $stmt->bindParam(':mm', $examFinding->mm);
        $stmt->bindParam(':ears', $examFinding->ears);
        $stmt->bindParam(':eyes', $examFinding->eyes);
        $stmt->bindParam(':nose', $examFinding->nose);
        $stmt->bindParam(':genitourinary', $examFinding->genitourinary);
        $stmt->bindParam(':integument', $examFinding->integument);
        $stmt->bindParam(':musculoskeletal', $examFinding->musculoskeletal);
        $stmt->bindParam(':neuro', $examFinding->neuro);

        if ($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Physical exam findings created successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to create physical exam findings.'];
        }

        echo json_encode($response);
        break;

    case 'PUT':
        // Update physical exam findings for a pet
        $examFinding = json_decode(file_get_contents('php://input'));

        // SQL to update the physical exam findings
        $sql = "UPDATE physical_exam_findings SET 
                heart_rate = :heart_rate,
                respiratory_rate = :respiratory_rate,
                temperature = :temperature,
                oral_cavity = :oral_cavity,
                lymph_nodes = :lymph_nodes,
                abdomen = :abdomen,
                cardiovascular = :cardiovascular,
                general_appearance = :general_appearance,
                mm = :mm,
                ears = :ears,
                eyes = :eyes,
                nose = :nose,
                genitourinary = :genitourinary,
                integument = :integument,
                musculoskeletal = :musculoskeletal,
                neuro = :neuro
                WHERE id = :id";
        $stmt = $conn->prepare($sql);

        $stmt->bindParam(':heart_rate', $examFinding->heart_rate);
        $stmt->bindParam(':respiratory_rate', $examFinding->respiratory_rate);
        $stmt->bindParam(':temperature', $examFinding->temperature);
        $stmt->bindParam(':oral_cavity', $examFinding->oral_cavity);
        $stmt->bindParam(':lymph_nodes', $examFinding->lymph_nodes);
        $stmt->bindParam(':abdomen', $examFinding->abdomen);
        $stmt->bindParam(':cardiovascular', $examFinding->cardiovascular);
        $stmt->bindParam(':general_appearance', $examFinding->general_appearance);
        $stmt->bindParam(':mm', $examFinding->mm);
        $stmt->bindParam(':ears', $examFinding->ears);
        $stmt->bindParam(':eyes', $examFinding->eyes);
        $stmt->bindParam(':nose', $examFinding->nose);
        $stmt->bindParam(':genitourinary', $examFinding->genitourinary);
        $stmt->bindParam(':integument', $examFinding->integument);
        $stmt->bindParam(':musculoskeletal', $examFinding->musculoskeletal);
        $stmt->bindParam(':neuro', $examFinding->neuro);
        $stmt->bindParam(':id', $examFinding->id);

        if ($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Physical exam findings updated successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to update physical exam findings.'];
        }

        echo json_encode($response);
        break;

    case 'DELETE':
        // Delete physical exam findings for a pet
        $sql = "DELETE FROM physical_exam_findings WHERE id = :id";
        $path = explode('/', $_SERVER['REQUEST_URI']);
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $path[3]);
        
        if ($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Physical exam findings deleted successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to delete physical exam findings.'];
        }
        echo json_encode($response);
        break;
}
?>
