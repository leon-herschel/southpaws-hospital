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
    if (!empty($data['type'])) {
        $type = $data['type'];
        $content = isset($data['content']) ? $data['content'] : '';

        // If updating background_photo with a new path, delete the old photo first
        if (in_array($type, ['background_photo', 'homepage_cover_photo']) && !empty($content)) {
            // Fetch current photo path for the same type being updated
            $stmt = $conn->prepare("SELECT content FROM public_content WHERE type = :type");
            $stmt->execute(['type' => $type]);
            $oldPhotoPath = $stmt->fetchColumn();
            
            // Delete the old photo file if it exists and is different from the new one
            if (!empty($oldPhotoPath) && $oldPhotoPath !== $content) {
                $oldFilePath = __DIR__ . '/../public/' . $oldPhotoPath;
                if (file_exists($oldFilePath) && is_file($oldFilePath)) {
                    unlink($oldFilePath);
                }
            }
        }

        $stmt = $conn->prepare("UPDATE public_content SET content = :content WHERE type = :type");
        $stmt->execute([':content' => $content, ':type' => $type]);

        echo json_encode(["success" => true, "message" => ucfirst(str_replace('_', ' ', $type)) . " updated successfully."]);
        exit();
    }

    // Handle homepage or about photo upload
    if (!empty($_FILES['photo'])) {
        $type = $_POST['type'] ?? 'background_photo';
        $file = $_FILES['photo'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("File upload error.");
        }

        $uploadsDir = __DIR__ . '/../public/uploads/';
        if (!file_exists($uploadsDir)) mkdir($uploadsDir, 0755, true);

        // Generate unique filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $prefix = $type === 'homepage_cover_photo' ? 'homepage_cover' : 'about_photo';
        $filename = $prefix . '_' . time() . '.' . $ext;
        $targetPath = $uploadsDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            throw new Exception("Failed to move uploaded file.");
        }

        // Get the current photo path for the same type being uploaded
        $stmt = $conn->prepare("SELECT content FROM public_content WHERE type = :type");
        $stmt->execute(['type' => $type]);
        $oldPhotoPath = $stmt->fetchColumn();
        
        // Delete the old photo file if it exists
        if (!empty($oldPhotoPath)) {
            $oldFilePath = __DIR__ . '/../public/' . $oldPhotoPath;
            if (file_exists($oldFilePath) && is_file($oldFilePath)) {
                unlink($oldFilePath);
            }
        }

        // Update DB with relative path
        $relativePath = 'uploads/' . $filename;
        $stmt = $conn->prepare("UPDATE public_content SET content = :content WHERE type = :type");
        $stmt->execute([':content' => $relativePath, ':type' => $type]);

        echo json_encode(["success" => true, "message" => "Background photo uploaded successfully.", "file_path" => $relativePath]);
        exit();
    }

    // If nothing matched
    echo json_encode(["success" => false, "error" => "No valid data received."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
