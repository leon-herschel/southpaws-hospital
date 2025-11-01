<?php
include 'cors.php';
include 'DbConnect.php';
require_once 'vendor/autoload.php'; 

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

$dotenvDomain = Dotenv::createImmutable(__DIR__, '.env.domain');
$dotenvDomain->load();

$dotenvAcc = Dotenv::createImmutable(__DIR__, '.env.acc');
$dotenvAcc->load();

// env variables
$FRONTEND_URL = rtrim($_ENV['FRONTEND_URL'], '/');
$MAIL_HOST = $_ENV['MAIL_HOST'];
$MAIL_USERNAME = $_ENV['MAIL_USERNAME'];
$MAIL_PASSWORD = $_ENV['MAIL_PASSWORD'];
$MAIL_PORT = $_ENV['MAIL_PORT'];
$MAIL_FROM_NAME = $_ENV['MAIL_FROM_NAME'];
$MAIL_FROM_ADDRESS = $_ENV['MAIL_FROM_ADDRESS'];

$objDB = new DbConnect;
try {
    $conn = $objDB->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $user = json_decode(file_get_contents('php://input'));
        $email = $user->email ?? '';

        if (!$email) {
            echo json_encode(['status' => 0, 'message' => 'Email is required.']);
            exit();
        }

        // Check if the email exists in the database
        $sql = "SELECT * FROM internal_users WHERE email = :email";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($userData) {
            // Generate a password reset token
            $resetToken = bin2hex(random_bytes(16));
            $resetLink = "{$FRONTEND_URL}/reset-password?token=$resetToken";

            // Store the reset token
            $sql = "UPDATE internal_users SET reset_token = :reset_token WHERE email = :email";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':reset_token', $resetToken);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            // Send password reset email
            $mail = new PHPMailer(true);
            try {
                // Server settings
                $mail->isSMTP();
                $mail->Host = $MAIL_HOST;
                $mail->SMTPAuth = true;
                $mail->Username = $MAIL_USERNAME;
                $mail->Password = $MAIL_PASSWORD;
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = $MAIL_PORT;

                // Recipients
                $mail->setFrom($MAIL_FROM_ADDRESS, $MAIL_FROM_NAME);
                $mail->addAddress($email);

                // Email content
                $mail->isHTML(true);
                $mail->Subject = 'Reset Your Password | South Paws Veterinary Hospital';
                $mail->Body = '
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <p>Hello,</p>
                        <p>We received a request to reset the password for your account. If this was you, please click the button below to create a new password:</p>
                        <p style="margin: 20px 0;">
                            <a href="' . $resetLink . '" 
                            style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                                    text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset My Password
                            </a>
                        </p>
                        <p>If you didn’t request a password reset, you can safely ignore this email. 
                        The link will expire soon for your security.</p>
                        <br>
                        <p style="font-size: 14px; color: #777;">Thank you,<br>South Paws Veterinary Hospital</p>
                    </div>
                ';
                $mail->AltBody = "We received a password reset request for your account. Click this link to reset your password: $resetLink\n\nIf you didn’t request this, please ignore the email.";

                $mail->send();
                echo json_encode(['status' => 1, 'message' => 'A password reset link has been sent to your email.']);
            } catch (Exception $e) {
                echo json_encode(['status' => 0, 'message' => 'Failed to send email.']);
            }
        } else {
            echo json_encode(['status' => 0, 'message' => 'Email not found.']);
        }
        break;
}
