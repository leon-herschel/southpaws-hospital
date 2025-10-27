<?php
include 'cors.php';

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

require 'vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__, '.env.acc');
$dotenv->load();

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['token'])) {
            $token = $_GET['token'];

            $sql = "SELECT id, verification_token_created_at FROM internal_users WHERE verification_token = :token AND is_verified = 0";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':token', $token);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                $expirationTime = 24 * 60 * 60;
                $createdAt = strtotime($user['verification_token_created_at']);

                if ((time() - $createdAt) > $expirationTime) {
                    $response = ['status' => 0, 'message' => 'Verification token has expired.'];
                } else {
                    $updateSql = "UPDATE internal_users SET is_verified = 1, verification_token = NULL, verification_token_created_at = NULL WHERE verification_token = :token";
                    $updateStmt = $conn->prepare($updateSql);
                    $updateStmt->bindParam(':token', $token);

                    if ($updateStmt->execute()) {
                        $response = ['status' => 1, 'message' => 'Account verified successfully.'];
                    } else {
                        $response = ['status' => 0, 'message' => 'Failed to verify account.'];
                    }
                }
            } else {
                $response = ['status' => 0, 'message' => 'Invalid or expired token.'];
            }

            echo json_encode($response);
            break;
        }

        $sql = "SELECT id, email, first_name, last_name, user_role, is_doctor, created_at, is_verified FROM internal_users";
        $path = explode('/', $_SERVER['REQUEST_URI']);
        if (isset($path[3]) && is_numeric($path[3])) {
            $sql .= " WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $path[3]);
            $stmt->execute();
            $users = $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode($users);
        break;

    case 'POST':
        $user = json_decode(file_get_contents('php://input'));

        if (empty($user->email) || empty($user->first_name) || empty($user->password)) {
            echo json_encode(['status' => 0, 'message' => 'Required fields are missing.']);
            break;
        }

        if (!filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['status' => 0, 'message' => 'Invalid email format.']);
            break;
        }

        $hashedPassword = password_hash($user->password, PASSWORD_BCRYPT);

        $checkEmailSql = "SELECT COUNT(*) as count FROM internal_users WHERE email = :email";
        $checkStmt = $conn->prepare($checkEmailSql);
        $checkStmt->bindParam(':email', $user->email);
        $checkStmt->execute();
        $emailExists = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;

        if ($emailExists) {
            echo json_encode(['status' => 0, 'message' => 'Email already exists.']);
            break;
        }

        $verificationToken = bin2hex(random_bytes(16));
        date_default_timezone_set('Asia/Manila'); // ✅ Ensures Philippine Time (PHT)
        $verificationTokenCreatedAt = date('Y-m-d H:i:s');
        $sql = "INSERT INTO internal_users(email, first_name, last_name, password, user_role, created_at, is_verified, verification_token, verification_token_created_at, is_doctor) 
        VALUES (:email, :first_name, :last_name, :password, :user_role, :created_at, 0, :verification_token, :verification_token_created_at, :is_doctor)";
        $stmt = $conn->prepare($sql);
        $created_at = date('Y-m-d H:i:s');
        $stmt->bindParam(':email', $user->email);
        $stmt->bindParam(':first_name', $user->first_name);
        $stmt->bindParam(':last_name', $user->last_name);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':user_role', $user->user_role);
        $stmt->bindParam(':created_at', $created_at);
        $stmt->bindParam(':verification_token', $verificationToken);
        $stmt->bindParam(':verification_token_created_at', $verificationTokenCreatedAt);
        $stmt->bindParam(':is_doctor', $user->is_doctor);

        if ($stmt->execute()) {
            $mail = new PHPMailer(true);

            try {
                $mail->SMTPDebug = 2;
                $mail->isSMTP();
                $mail->Host       = $_ENV['MAIL_HOST'];
$mail->SMTPAuth   = true;
$mail->Username   = $_ENV['MAIL_USERNAME'];
$mail->Password   = $_ENV['MAIL_PASSWORD'];
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port       = $_ENV['MAIL_PORT'];
$mail->setFrom($_ENV['MAIL_FROM_ADDRESS'], $_ENV['MAIL_FROM_NAME']);

                $mail->setFrom($_ENV['MAIL_USERNAME'], 'South Paws Veterinary Hospital');
                $mail->addAddress($user->email, $user->first_name);

                $verificationLink = "http://localhost:80/api/verify.php?token=$verificationToken";

                $mail->isHTML(true);
                $mail->Subject = 'Verify Your Account';
                $mail->Body = "
                    <h1>Welcome, {$user->first_name}!</h1>
                    <p>Thank you for registering with us. Here are your login details:</p>
                    <p><strong>Email:</strong> {$user->email}</p>
                    <p><strong>Password:</strong> {$user->password}</p>
                    <p>To activate your account, please click the link below:</p>
                    <a href='$verificationLink'>Verify Your Account</a>
                    <p><strong>Note:</strong> This link will expire in 24 hours. If it expires, you will need to request a new verification link.</p>
                    <p>For security reasons, change your password after you log in.</p>
                ";

                $mail->send();
                $response = ['status' => 1, 'message' => 'User created successfully. Login credentials sent via email.'];
            } catch (Exception $e) {
                $response = ['status' => 0, 'message' => 'Failed to send email: ' . $mail->ErrorInfo];
            }
        } else {
            $response = ['status' => 0, 'message' => 'Failed to create user.'];
        }
        echo json_encode($response);
        break;

    case 'PUT':
        $user = json_decode(file_get_contents('php://input'));

        if (isset($user->password)) {
            $hashedPassword = password_hash($user->password, PASSWORD_BCRYPT);
        } else {
            $hashedPassword = null;
        }

        $sql = "UPDATE internal_users SET 
            email = :email, 
            first_name = :first_name, 
            last_name = :last_name, 
            user_role = :user_role, 
            is_doctor = :is_doctor" .
            ($hashedPassword ? ", password = :password" : "") .
            " WHERE id = :id";


        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':email', $user->email);
        $stmt->bindParam(':first_name', $user->first_name);
        $stmt->bindParam(':last_name', $user->last_name);
        $stmt->bindParam(':user_role', $user->user_role);
        $stmt->bindParam(':id', $user->id);
        $stmt->bindParam(':is_doctor', $user->is_doctor);

        if ($hashedPassword) {
            $stmt->bindParam(':password', $hashedPassword);
        }

        if ($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'User updated successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to update user.'];
        }

        echo json_encode($response);
        break;

    case 'DELETE':
        $sql = "DELETE FROM internal_users WHERE id = :id";
        $path = explode('/', $_SERVER['REQUEST_URI']);
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $path[3]);
        if ($stmt->execute()) {
            $response = ['status' => 1, 'message' => 'User deleted successfully.'];
        } else {
            $response = ['status' => 0, 'message' => 'Failed to delete user.'];
        }
        echo json_encode($response);
        break;
}
?>
