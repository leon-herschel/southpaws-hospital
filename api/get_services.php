<?php
include 'cors.php';
header("Content-Type: application/json");



include 'DbConnect.php';
$objDB = new DbConnect;


try {
    $conn = $objDB->connect();

    $stmt = $conn->prepare("SELECT id, name, price, duration FROM services");
    $stmt->execute();

    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($services);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>