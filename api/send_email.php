<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__, '.env.acc');
$dotenv->load();

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

// Get appointment data from React
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['email'])) {
    echo json_encode(["success" => false, "error" => "No email provided"]);
    exit;
}

$formattedDate = !empty($data['date']) ? date("F j, Y", strtotime($data['date'])) : "N/A";
$formattedTime = !empty($data['time']) ? date("g:i A", strtotime($data['time'])) : "N/A";

$doctorName = "Unknown Doctor";
if (!empty($data['doctor_id'])) {
    $stmt = $conn->prepare("SELECT first_name, last_name FROM internal_users WHERE id = ?");
    $stmt->execute([$data['doctor_id']]);
    $doctor = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($doctor) {
        $doctorName = $doctor['first_name'] . ' ' . $doctor['last_name'];
    }
}

$mail = new PHPMailer(true);

try {
    // SMTP Config (replace with your clinic's email settings)
$mail->isSMTP();
$mail->Host       = $_ENV['MAIL_HOST'];
$mail->SMTPAuth   = true;
$mail->Username   = $_ENV['MAIL_USERNAME'];
$mail->Password   = $_ENV['MAIL_PASSWORD'];
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port       = $_ENV['MAIL_PORT'];
$mail->setFrom($_ENV['MAIL_FROM_ADDRESS'], $_ENV['MAIL_FROM_NAME']);

    // Sender & Recipient
    $mail->setFrom($_ENV['MAIL_USERNAME'], 'South Paws Veterinary Hospital');
    $mail->addAddress($data['email'], $data['name']);

    // Content
    $mail->isHTML(true);
    $mail->Subject = "Appointment Confirmation at South Paws Veterinary Hospital";

$mail->Body = "
    <div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>
        <h2 style='color: #004080;'>Appointment Confirmation</h2>
        <p>Dear {$data['name']},</p>
        <p>
            We are pleased to confirm your appointment at <strong>South Paws Veterinary Hospital</strong>.
            Below are the details of your scheduled visit:
        </p>
        <table style='border-collapse: collapse; margin-top: 10px;'>
            <tr>
                <td style='padding: 4px 8px;'><strong>Reference Number:</strong></td>
                <td style='padding: 4px 8px;'>{$data['reference_number']}</td>
            </tr>
            <tr>
                <td style='padding: 4px 8px;'><strong>Pet Name:</strong></td>
                <td style='padding: 4px 8px;'>{$data['pet_name']}</td>
            </tr>
            <tr>
                <td style='padding: 4px 8px;'><strong>Date & Time:</strong></td>
                <td style='padding: 4px 8px;'>{$formattedDate} at {$formattedTime}</td>
            </tr>
            <tr>
                <td style='padding: 4px 8px;'><strong>Service(s):</strong></td>
                <td style='padding: 4px 8px;'>{$data['service']}</td>
            </tr>
            <tr>
                <td style='padding: 4px 8px;'><strong>Attending Veterinarian:</strong></td>
                <td style='padding: 4px 8px;'>{$doctorName}</td>
            </tr>
        </table>
        <p>
            Please arrive at least <strong>10 to 15 minutes</strong> before your scheduled time to ensure a smooth check-in.
            Should you need to reschedule or cancel, kindly contact us in advance.
        </p>
        <p>
            We look forward to seeing you and your beloved pet soon.
        </p>
        <p style='margin-top: 20px;'>
            Warm regards,<br>
            <strong>South Paws Veterinary Hospital</strong><br>
            <span style='font-size: 14px; color: #555;'>Committed to compassionate and quality veterinary care.</span>
        </p>
    </div>
";

$mail->AltBody = "
Appointment Confirmation for South Paws Veterinary Hospital

Dear {$data['name']},

We are pleased to confirm your appointment at South Paws Veterinary Hospital.

Reference Number: {$data['reference_number']}
Pet Name: {$data['pet_name']}
Date & Time: {$formattedDate} at {$formattedTime}
Service(s): {$data['service']}
Attending Veterinarian: {$doctorName}

Please arrive 10 to 15 minutes before your appointment.
If you need to reschedule or cancel, kindly inform us ahead of time.

We look forward to seeing you and your pet soon.

South Paws Veterinary Hospital
Committed to compassionate and quality veterinary care.
";

    $mail->send();
    echo json_encode(["success" => true, "message" => "Email sent successfully"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $mail->ErrorInfo]);
}
