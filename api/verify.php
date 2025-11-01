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

if (isset($_GET['token'])) {
    $token = $_GET['token'];
    $sql = "SELECT id FROM internal_users WHERE verification_token = :token AND is_verified = 0";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $updateSql = "UPDATE internal_users SET is_verified = 1, verification_token = NULL WHERE verification_token = :token";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bindParam(':token', $token);
        
        if ($updateStmt->execute()) {
            // ✅ Redirect to React login page with success message
            header("Location: https://southpaws.scarlet2.io/login?message=Verification%20Successful");
            exit;
        } else {
            // ✅ Redirect with verification failure message
            header("Location: https://southpaws.scarlet2.io/login?message=Verification%20Failed");
            exit;
        }
    } else {
        // ✅ Redirect with invalid/expired token message
        header("Location: https://southpaws.scarlet2.io/login?message=Invalid%20or%20Expired%20Token");
        exit;
    }
} else {
    // ✅ Redirect with missing token message
    header("Location: https://southpaws.scarlet2.io/login?message=Missing%20Verification%20Token");
    exit;
}
?>
