<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

try {
    // Fetch mission, vision, and background_photo
    $stmt = $conn->prepare("SELECT type, content, image_path FROM public_content WHERE type IN ('mission', 'vision', 'background_photo')");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $mission = "";
    $vision = "";
    $background_photo = "";

    foreach ($rows as $row) {
        if ($row['type'] === 'mission') $mission = $row['content'];
        if ($row['type'] === 'vision') $vision = $row['content'];
        if ($row['type'] === 'background_photo') $background_photo = $row['image_path']; // store image path
    }

    echo json_encode([
        "success" => true,
        "mission" => $mission,
        "vision" => $vision,
        "background_photo" => $background_photo
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Query failed: " . $e->getMessage()]);
}
