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


$sql = "SELECT name FROM services WHERE archived = 0 AND status = 'Available'";
$stmt = $conn->prepare($sql);
$stmt->execute();
$services = $stmt->fetchAll(PDO::FETCH_COLUMN);

$presetColors = [
    "#f8b195", "#f67280", "#f6c2b0", "#f4a261", "#fcd5ce",
    "#ffe5d9", "#f9dcc4", "#fec89a", "#fcbf49", "#ffdfba",
    "#f0efeb", "#e0e1dd", "#d8e2dc", "#cddafd", "#d0f4de",
    "#c3f0ca", "#caf0f8", "#ade8f4", "#a0c4ff", "#bdb2ff",
    "#ffc6ff", "#ffadad", "#ffd6a5", "#fdffb6", "#caffbf",
    "#9bf6ff", "#a3c4f3", "#d5a6bd", "#c9ada7", "#d6ccc2",
    "#c3bef0", "#e2f0cb", "#f1faee", "#dcedc1", "#f0ead2",
    "#f6f7d7", "#e2c2b9", "#d2d4dc", "#f9f9f9", "#e4fde1"
];

$colorMap = [];

foreach ($services as $index => $name) {
    $key = strtolower(trim($name));
    $colorMap[$key] = $presetColors[$index % count($presetColors)];
}

echo json_encode($colorMap);
