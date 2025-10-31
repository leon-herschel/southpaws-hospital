<?php
session_start();

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

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['status' => 0, 'message' => 'User not logged in.']);
            exit;
        }

        $userId = $_SESSION['user_id'];
        $sql = "SELECT id, email, first_name, last_name, user_role 
                FROM internal_users WHERE id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $user['user_role'] = (int)$user['user_role'];
            echo json_encode($user);
        } else {
            echo json_encode(['status' => 0, 'message' => 'User not found.']);
        }
        break;
    
    case 'POST':
        $user = json_decode(file_get_contents('php://input'));

        // Only admins can create a new user
        if (isset($_SESSION['user_role']) && in_array($_SESSION['user_role'], [3, 4])) {
            $hashedPassword = password_hash($user->password, PASSWORD_BCRYPT);
            $sql = "INSERT INTO internal_users(email, first_name, last_name, password, user_role, created_at) 
                    VALUES (:email, :first_name, :last_name, :password, :user_role, :created_at)";
            $stmt = $conn->prepare($sql);
            $created_at = date('Y-m-d H:i:s');
            $stmt->bindParam(':email', $user->email);
            $stmt->bindParam(':first_name', $user->first_name);
            $stmt->bindParam(':last_name', $user->last_name);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':user_role', $user->user_role);
            $stmt->bindParam(':created_at', $created_at);
        
            if ($stmt->execute()) {
                $response = ['status' => 1, 'message' => 'User created successfully.'];
            } else {
                $response = ['status' => 0, 'message' => 'Failed to create user.'];
            }
        } else {
            $response = ['status' => 0, 'message' => 'Unauthorized action. Only admins can create users.'];
        }
        echo json_encode($response);
        break;

    case 'PUT':
        $user = json_decode(file_get_contents('php://input'));

        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['status' => 0, 'message' => 'User not logged in.']);
            exit;
        }

        $sessionUserId = $_SESSION['user_id'];
        $sessionUserRole = $_SESSION['user_role'];

        // Only self-update or admin/super admin update
        if ($sessionUserRole == 3 || $sessionUserRole == 4 || $sessionUserId == $user->id) {

            // 🔹 Fetch the current user data
            $stmt = $conn->prepare("SELECT password, user_role FROM internal_users WHERE id = :id");
            $stmt->bindParam(':id', $user->id, PDO::PARAM_INT);
            $stmt->execute();
            $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$existingUser) {
                echo json_encode(['status' => 0, 'message' => 'User not found.']);
                exit;
            }

            // 🔹 Prevent modifying Super Admin role
            if ($existingUser['user_role'] == 4 && $sessionUserRole != 4) {
                echo json_encode(['status' => 0, 'message' => 'You cannot modify a Super Admin.']);
                exit;
            }

            // 🔹 Handle password update
            if (!empty($user->current_password) && !empty($user->new_password)) {
                if (!password_verify($user->current_password, $existingUser['password'])) {
                    echo json_encode(['status' => 0, 'message' => 'Current password is incorrect.']);
                    exit;
                }
                $hashedPassword = password_hash($user->new_password, PASSWORD_BCRYPT);
            }

            // 🔹 Build SQL
            if (!empty($user->new_password)) {
                $sql = "UPDATE internal_users SET 
                            email = :email, 
                            first_name = :first_name, 
                            last_name = :last_name, 
                            password = :password, 
                            user_role = :user_role 
                        WHERE id = :id";
                $stmt = $conn->prepare($sql);
                $stmt->bindParam(':password', $hashedPassword);
            } else {
                $sql = "UPDATE internal_users SET 
                            email = :email, 
                            first_name = :first_name, 
                            last_name = :last_name, 
                            user_role = :user_role 
                        WHERE id = :id";
                $stmt = $conn->prepare($sql);
            }

            // 🔹 Bind other params
            $stmt->bindParam(':email', $user->email);
            $stmt->bindParam(':first_name', $user->first_name);
            $stmt->bindParam(':last_name', $user->last_name);
            $stmt->bindParam(':user_role', $user->user_role);
            $stmt->bindParam(':id', $user->id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                // ✅ Update session if the logged-in user updated their own profile
                if ($sessionUserId == $user->id) {
                    $_SESSION['email'] = $user->email;
                    $_SESSION['first_name'] = $user->first_name;
                    $_SESSION['last_name'] = $user->last_name;
                    $_SESSION['user_role'] = $user->user_role;
                }

                echo json_encode(['status' => 1, 'message' => 'User updated successfully.']);
            } else {
                echo json_encode(['status' => 0, 'message' => 'Failed to update user.']);
            }
        } else {
            echo json_encode(['status' => 0, 'message' => 'Unauthorized update.']);
        }
        break;

    case 'DELETE':
        if (isset($_SESSION['user_role']) && ($_SESSION['user_role'] == 3 || $_SESSION['user_role'] == 4)) {
            $path = explode('/', $_SERVER['REQUEST_URI']);
            $userIdToDelete = $path[3];

            // 🔹 Check role of user being deleted
            $stmt = $conn->prepare("SELECT user_role FROM internal_users WHERE id = :id");
            $stmt->bindParam(':id', $userIdToDelete, PDO::PARAM_INT);
            $stmt->execute();
            $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($targetUser && $targetUser['user_role'] == 4) {
                echo json_encode(['status' => 0, 'message' => 'Super Admin accounts cannot be deleted.']);
                exit;
            }

            $sql = "DELETE FROM internal_users WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':id', $userIdToDelete);

            if ($stmt->execute()) {
                $response = ['status' => 1, 'message' => 'User deleted successfully.'];
            } else {
                $response = ['status' => 0, 'message' => 'Failed to delete user.'];
            }
        } else {
            $response = ['status' => 0, 'message' => 'Unauthorized action.'];
        }
        echo json_encode($response);
        break;
    }
