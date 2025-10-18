<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../DbConnect.php';
$objDB = new DbConnect();

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// Handle mission/vision updates from JSON
$data = json_decode(file_get_contents("php://input"), true);

try {
    if (!empty($data['type']) && !empty($data['content'])) {
        $type = $data['type']; // 'mission' or 'vision'
        $content = $data['content'];

        $stmt = $conn->prepare("UPDATE public_content SET content = :content WHERE type = :type");
        $stmt->execute([':content' => $content, ':type' => $type]);

        echo json_encode(["success" => true, "message" => ucfirst($type) . " updated successfully."]);
        exit();
    }

    // Handle background photo upload
    if (!empty($_FILES['photo'])) {
        $file = $_FILES['photo'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("File upload error.");
        }

        $uploadsDir = __DIR__ . '/../../public/uploads/';
        if (!file_exists($uploadsDir)) mkdir($uploadsDir, 0755, true);

        // Generate unique filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'background_' . time() . '.' . $ext;
        $targetPath = $uploadsDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            throw new Exception("Failed to move uploaded file.");
        }

        // Update DB with relative path
        $relativePath = 'uploads/' . $filename;
        $stmt = $conn->prepare("UPDATE public_content SET image_path = :path WHERE type = 'background_photo'");
        $stmt->execute([':path' => $relativePath]);

        echo json_encode(["success" => true, "message" => "Background photo uploaded successfully.", "path" => $relativePath]);
        exit();
    }

    // If nothing matched
    echo json_encode(["success" => false, "error" => "No valid data received."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
