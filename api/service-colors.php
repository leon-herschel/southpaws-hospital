<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();
$sql = "SELECT name FROM services WHERE archived = 0 AND status = 'Available'";
$stmt = $conn->prepare($sql);
$stmt->execute();
$services = $stmt->fetchAll(PDO::FETCH_COLUMN);

$presetColors = [
    "#df7c7eff", "#f3722c", "#f8961e", "#f9844a", "#90be6d",
    "#43aa8b", "#577590", "#277da1", "#4d908e", "#577590",
    "#ffb703", "#8ecae6", "#219ebc", "#a2d2ff", "#b5ead7",
    "#e4c1f9", "#ff99c8", "#fcf6bd", "#cdb4db", "#d0f4de",
    "#ffafcc", "#ffc8dd", "#caffbf", "#b9fbc0", "#a0c4ff",
    "#9bf6ff", "#ffd6a5", "#e9c46a", "#ffcad4", "#d8e2dc",
    "#cce3de", "#e29578", "#f0efeb", "#adb5bd", "#ffdab9",
    "#ffee93", "#e2ece9", "#bbd0ff", "#ffc09f", "#ffe066",
    "#e4c1f9", "#f6bd60", "#84a59d", "#9d8189", "#e8dab2"
];

$colorMap = [];

foreach ($services as $index => $name) {
    $key = strtolower(trim($name));
    $colorMap[$key] = $presetColors[$index % count($presetColors)];
}

echo json_encode($colorMap);
