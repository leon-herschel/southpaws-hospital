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


date_default_timezone_set('Asia/Manila');

require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__, '.env.acc');
$dotenv->load();

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ---------------------------------------------------------------------
// FETCH APPOINTMENTS 2 HOURS AWAY
// ---------------------------------------------------------------------

$sql = "
    SELECT a.*, iu.first_name, iu.last_name
    FROM appointments a
    LEFT JOIN internal_users iu ON a.doctor_id = iu.id
    WHERE TIMESTAMP(a.date, a.time) BETWEEN DATE_ADD(NOW(), INTERVAL 2 HOUR)
                                       AND DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 HOUR), INTERVAL 5 MINUTE)
      AND a.is_reminder_sent = 0
";
$stmt = $conn->prepare($sql);
$stmt->execute();
$appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!$appointments) {
    echo json_encode(["success" => true, "message" => "No reminders to send"]);
    exit();
}

// ---------------------------------------------------------------------
// LOOP THROUGH APPOINTMENTS AND SEND EMAIL
// ---------------------------------------------------------------------

foreach ($appointments as $data) {

    $formattedDate = date("F j, Y", strtotime($data['time']));
    $formattedTime = date("g:i A", strtotime($data['time']));
    $doctorName = $data['first_name'] && $data['last_name'] 
        ? $data['first_name'] . ' ' . $data['last_name'] 
        : "Unknown Doctor";

    $mail = new PHPMailer(true);

    try {
        // SMTP CONFIG
        $mail->isSMTP();
        $mail->Host       = $_ENV['MAIL_HOST'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['MAIL_USERNAME'];
        $mail->Password   = $_ENV['MAIL_PASSWORD'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $_ENV['MAIL_PORT'];
        $mail->setFrom($_ENV['MAIL_FROM_ADDRESS'], $_ENV['MAIL_FROM_NAME']);

        $mail->setFrom($_ENV['MAIL_USERNAME'], 'South Paws Veterinary Hospital');
        $mail->addAddress($data['email'], $data['name']);

        $mail->isHTML(true);
        $mail->Subject = "Reminder: Your Appointment is in 2 Hours";

        // EMBED LOGO
        $mail->addEmbeddedImage(__DIR__ . '/public/southpawslogo.png', 'cliniclogo');

        // EMAIL BODY
        $mail->Body = "
        <div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>
            <table width='100%' style='margin-bottom: 20px;'>
                <tr>
                    <td style='text-align: left;'>
                        <h2 style='color: #004080; margin: 0;'>Appointment Reminder</h2>
                    </td>
                    <td style='text-align: right;'>
                        <img src='cid:cliniclogo' width='210' style='display: block;'>
                    </td>
                </tr>
            </table>
            
            <p>Dear {$data['name']},</p>
            <p>
                This is a friendly reminder that your appointment at 
                <strong>South Paws Veterinary Hospital</strong> is scheduled in <strong>2 hours</strong>.
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
                Please arrive at least <strong>10 to 15 minutes</strong> before your appointment.
            </p>

            <p>See you soon!</p>

            <p style='margin-top: 20px;'>
                Warm regards,<br>
                <strong>South Paws Veterinary Hospital</strong>
            </p>
        </div>
        ";

        $mail->send();

        // MARK AS SENT
        $update = $conn->prepare("UPDATE appointments SET is_reminder_sent = 1 WHERE id = ?");
        $update->execute([$data['id']]);

    } catch (Exception $e) {
        // Continue sending other reminders even if one fails
    }
}

echo json_encode(["success" => true, "message" => "All reminders sent successfully"]);
