<?php
session_start(); // Start the session
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = json_decode(file_get_contents('php://input'));

    if (!empty($user->email) && !empty($user->password)) {
        $email = $user->email;
        $password = $user->password;

      
        
            // Check database for other users
            $stmt = $conn->prepare("SELECT id, first_name, last_name, password, user_role, is_verified FROM internal_users WHERE email = :email");
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $userData = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Check if the account is verified
                if ($userData['is_verified'] == 0) {
                    $response = ['status' => 0, 'message' => 'Account not verified. Please verify your account.'];
                } elseif (password_verify($password, $userData['password'])) {
                    // Successful login
                    $_SESSION['user_id'] = $userData['id'];
                    $_SESSION['first_name'] = $userData['first_name'];
                    $_SESSION['last_name'] = $userData['last_name'];
                    $_SESSION['user_role'] = $userData['user_role'];
                    $_SESSION['email'] = $email;

                    $response = [
                        'status' => 1,
                        'message' => 'Login successful.',
                        'id' => $userData['id'],
                        'first_name' => $userData['first_name'],
                        'last_name' => $userData['last_name'],
                        'user_role' => $userData['user_role'],
                        'email' => $email
                    ];
                } else {
                    $response = ['status' => 0, 'message' => 'Invalid email or password.'];
                }
            } else {
                $response = ['status' => 0, 'message' => 'Invalid email or password.'];
            }
        
    } else {
        $response = ['status' => 0, 'message' => 'Missing email or password.'];
    }

    echo json_encode($response);
}

$conn = null;
?>
