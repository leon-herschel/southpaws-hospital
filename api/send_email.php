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
    $mail->Host       = 'smtp.gmail.com'; 
    $mail->SMTPAuth   = true;
    $mail->Username   = 'rexe.anoos.swu@phinmaed.com';
    $mail->Password   = 'btuisgprmghsircp';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    // Sender & Recipient
    $mail->setFrom('rexe.anoos.swu@phinmaed.com', 'South Paws Veterinary Hospital');
    $mail->addAddress($data['email'], $data['name']);

    // Content
    $mail->isHTML(true);
    $mail->Subject = "Appointment Confirmation - South Paws Veterinary Hospital";

    $mail->Body = "
        <h2>Appointment Confirmation</h2>
        <p>Dear {$data['name']},</p>
        <p>Your appointment has been confirmed.</p>
        <ul>
          <li><b>Reference Number:</b> {$data['reference_number']}</li>
          <li><b>Pet Name:</b> {$data['pet_name']}</li>
          <li><b>Date & Time:</b> {$data['date']} at {$formattedTime}</li>
          <li><b>Service(s):</b> {$data['service']}</li>
          <li><b>Doctor:</b> {$doctorName}</li>
        </ul>
        <p>Thank you,<br>South Paws Veterinary Hospital</p>
    ";

    $mail->AltBody = "Appointment Confirmation\n
        Reference Number: {$data['reference_number']}
        Pet Name: {$data['pet_name']}
        Date & Time: {$data['date']} at {$formattedTime}
        Service(s): {$data['service']}
        Doctor: {$doctorName}
    ";

    $mail->send();
    echo json_encode(["success" => true, "message" => "Email sent successfully"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $mail->ErrorInfo]);
}
