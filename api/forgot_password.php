<?php
include 'cors.php';

include 'DbConnect.php';
$objDB = new DbConnect;

try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

require 'vendor/autoload.php';  // Include the PHPMailer autoload file

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $user = json_decode(file_get_contents('php://input'));
        $email = $user->email;

        // Check if the email exists in the database
        $sql = "SELECT * FROM internal_users WHERE email = :email";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($userData) {
            // Generate a password reset token
            $resetToken = bin2hex(random_bytes(16)); // Random token for password reset
            $resetLink = "https://southpaws.scarlet2.io/reset-password?token=$resetToken";  // Corrected local password reset URL

            // Store the reset token in the database with an expiration time (optional)
            $sql = "UPDATE internal_users SET reset_token = :reset_token WHERE email = :email";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':reset_token', $resetToken);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            // Send the password reset email using PHPMailer
            $mail = new PHPMailer(true);

            try {
                // Server settings
                $mail->isSMTP();
                $mail->Host = 'smtp.gmail.com'; // Replace with your SMTP host
                $mail->SMTPAuth = true;
                $mail->Username = 'alfr.impas.swu@phinmaed.com';  // Replace with your Gmail address
                $mail->Password = 'ljfy lyeb rxam wkql';  // Replace with your Gmail password or App Password
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = 587;

                // Recipients
                $mail->setFrom('alfr.impas.swu@phinmaed.com', 'SouthPaws'); // Replace with your email and name
                $mail->addAddress($email);

                // Content
                $mail->isHTML(true);
                $mail->Subject = 'Password Reset Request';
                $mail->Body = '<p>Click the link below to reset your password:</p><p><a href="' . $resetLink . '">Reset Password</a></p>';
                $mail->AltBody = 'Click the link below to reset your password: ' . $resetLink;

                $mail->send();
                echo json_encode(['status' => 1, 'message' => 'A password reset link has been sent to your email.']);
            } catch (Exception $e) {
                echo json_encode(['status' => 0, 'message' => 'Failed to send email. Mailer Error: ' . $mail->ErrorInfo]);
            }
        } else {
            echo json_encode(['status' => 0, 'message' => 'Email not found.']);
        }
        break;
}
?>
