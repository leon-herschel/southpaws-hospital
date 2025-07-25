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
        // Counting total appointments
        $sqlCount = "SELECT COUNT(*) AS total_appointments FROM appointments";
        $stmtCount = $conn->prepare($sqlCount);
        $stmtCount->execute();
        $resultCount = $stmtCount->fetch(PDO::FETCH_ASSOC);
        $total_appointments = $resultCount['total_appointments'];
    
        // Fetching appointments data
        $sqlAppointments = "SELECT * FROM appointments";
        $path = explode('/', $_SERVER['REQUEST_URI']);
        if (isset($path[3]) && is_numeric($path[3])) {
            $sqlAppointments .= " WHERE id = :id";
            $stmtAppointments = $conn->prepare($sqlAppointments);
            $stmtAppointments->bindParam(':id', $path[3]);
            $stmtAppointments->execute();
            $appointments = array($stmtAppointments->fetch(PDO::FETCH_ASSOC)); // Wrap single appointment in an array
        } else {
            $stmtAppointments = $conn->prepare($sqlAppointments);
            $stmtAppointments->execute();
            $appointments = $stmtAppointments->fetchAll(PDO::FETCH_ASSOC);
        }
    
        // Constructing response
        $response = array(
            'total_appointments' => $total_appointments,
            'appointments' => $appointments
        );
    
        // Encode the response as JSON and send it to the client
        echo json_encode($response);
        break;
        

    case 'POST':
        $client = json_decode(file_get_contents('php://input'));
        $sql = "INSERT INTO clients(id, name, address, cellnumber, email, age, gender, created_at, created_by) VALUES (null, :name, :address, :cellnumber, :email, :age, :gender, :created_at, :created_by)";
        $stmt = $conn->prepare($sql);
        date_default_timezone_set('Asia/Manila'); // ✅ Ensures Philippine Time (PHT)
        $created_at = date('Y-m-d H:i:s');
        $created_by = "1";
        $stmt->bindParam(':name', $client->name);
        $stmt->bindParam(':address', $client->address);
        $stmt->bindParam(':cellnumber', $client->cellnumber);
        $stmt->bindParam(':email', $client->email);
        $stmt->bindParam(':age', $client->age);
        $stmt->bindParam(':gender', $client->gender);
        $stmt->bindParam(':created_at', $created_at);
        $stmt->bindParam(':created_by', $created_by);

        if($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Record created successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to create record.'];
        }
        echo json_encode($response);
        break;

    case 'PUT':
        $user = json_decode(file_get_contents('php://input'));
        $sql = "UPDATE users SET name = :name, email =:email, mobile = :mobile, updated_at = :updated_at WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $created_at = date('Y-m-d H:i:s');
        $stmt->bindParam(':id', $user->id);
        $stmt->bindParam(':name', $user->name);
        $stmt->bindParam(':email', $user->email);
        $stmt->bindParam(':mobile', $user->mobile);
        $stmt->bindParam(':updated_at', $updated_at);
        if($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'Record updated successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to edit record.'];
        }
        echo json_encode($response);
        break;


    case 'DELETE':
        $sql = "DELETE FROM users WHERE id = :id";
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