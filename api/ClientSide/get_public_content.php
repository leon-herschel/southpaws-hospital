<?php
include 'cors.php';
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
    $stmt = $conn->prepare("
        SELECT type, content, image_path 
        FROM public_content 
        WHERE type IN (
            'mission', 'vision', 'background_photo', 'homepage_cover_photo',
            'intro_header', 'intro_paragraph',
            'about_paragraph', 'values',
            'footer_description', 'footer_address', 'footer_map_link',
            'footer_number', 'footer_fb_link', 'footer_fb_text',
            'footer_weekdays', 'footer_hours'

        )
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = [];
    foreach ($rows as $row) {
        $data[$row['type']] = $row['content'] ?: $row['image_path'];
    }

    echo json_encode(["success" => true] + $data);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Query failed: " . $e->getMessage()]);
}
