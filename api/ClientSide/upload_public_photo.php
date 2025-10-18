<?php
// ✅ CORS headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

include '../DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed: " . $e->getMessage()
    ]);
    exit();
}

// Check uploaded file
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "No file uploaded or upload error"]);
    exit();
}

// Target folder
$targetDir = "../public/uploads/";
if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);

// Generate unique filename
$filename = time() . "_" . basename($_FILES["photo"]["name"]);
$targetFile = $targetDir . $filename;

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($_FILES['photo']['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid file type"]);
    exit();
}

// Move uploaded file
if (move_uploaded_file($_FILES["photo"]["tmp_name"], $targetFile)) {
    // Save relative path to DB
    $relativePath = "uploads/" . $filename;

    try {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM public_content WHERE type='background_photo'");
        $stmt->execute();
        $exists = $stmt->fetchColumn();

        if ($exists) {
            $update = $conn->prepare("UPDATE public_content SET image_path=?, updated_at=NOW() WHERE type='background_photo'");
            $update->execute([$relativePath]);
        } else {
            $insert = $conn->prepare("INSERT INTO public_content (type, image_path, updated_at) VALUES ('background_photo', ?, NOW())");
            $insert->execute([$relativePath]);
        }

        echo json_encode([
            "success" => true,
            "message" => "Photo uploaded successfully",
            "path" => $relativePath
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to move uploaded file"]);
}
