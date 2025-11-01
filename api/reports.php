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

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$fromDate = $_GET['from'] ?? null;
$toDate = $_GET['to'] ?? null;

if ($method === 'GET') {
    try {
        switch ($action) {
            case 'sales':
                $sql = "SELECT 
                            o.receipt_number, -- ✅ Moved to be the first column
                            oi.product_name AS product_service, -- ✅ Renamed to fit both products & services
                            oi.type, -- ✅ Added column to indicate type (product/service)
                            oi.quantity, 
                            oi.price, 
                            oi.total, 
                            o.order_date AS transaction_date, 
                            COALESCE(c.name, uc.name, 'Guest') AS client_name
                        FROM order_items oi
                        LEFT JOIN orders o ON oi.order_id = o.id
                        LEFT JOIN clients c ON o.client_id = c.id
                        LEFT JOIN unregistered_clients uc ON o.unregistered_client_id = uc.id";

                if ($fromDate && $toDate) {
                    $sql .= " WHERE o.order_date >= :fromDate AND o.order_date < DATE_ADD(:toDate, INTERVAL 1 DAY)";
                }

                $stmt = $conn->prepare($sql);

                if ($fromDate && $toDate) {
                    $stmt->bindParam(':fromDate', $fromDate);
                    $stmt->bindParam(':toDate', $toDate);
                }

                $stmt->execute();
                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['status' => 1, 'data' => $result]);
                exit;

                case 'products':
                    $sql = "SELECT  
                                p.product_name, 
                                COALESCE(g.generic_name, 'N/A') AS generic_name, 
                                COALESCE(u.unit_name, 'N/A') AS unit_name, 
                                COALESCE(c.name, 'N/A') AS category_name, 
                                COALESCE(b.name, 'N/A') AS brand_name, 
                                COALESCE(NULLIF(i.expiration_date, '000000'), 'No Expiry Date') AS expiration_date,
                                p.created_at
                            FROM products p
                            LEFT JOIN generic_cms g ON p.generic_id = g.id
                            LEFT JOIN unit_of_measurement u ON p.unit_id = u.id
                            LEFT JOIN categories c ON p.category_id = c.id
                            LEFT JOIN brands b ON p.brand_id = b.id
                            LEFT JOIN inventory i ON p.id = i.product_id -- Join inventory table
                            WHERE p.archived = 0";
                
                    if ($fromDate && $toDate) {
                        $sql .= " AND p.created_at >= :fromDate AND p.created_at < DATE_ADD(:toDate, INTERVAL 1 DAY)";
                    }
                
                    $stmt = $conn->prepare($sql);
                
                    if ($fromDate && $toDate) {
                        $stmt->bindParam(':fromDate', $fromDate);
                        $stmt->bindParam(':toDate', $toDate);
                    }
                
                    $stmt->execute();
                    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(['status' => 1, 'data' => $result]);
                    exit;

                case 'services':
                    $sql = "SELECT 
                                s.name AS service_name, 
                                s.price,
                                s.consent_form, 
                                u.first_name AS created_by, -- ✅ Fetch name instead of ID
                                s.created_at 
                            FROM services s
                            LEFT JOIN internal_users u ON s.created_by = u.id";
                
                    // Ensure WHERE is properly placed
                    if ($fromDate && $toDate) {
                        $sql .= " WHERE s.created_at >= :fromDate AND s.created_at < DATE_ADD(:toDate, INTERVAL 1 DAY)";
                    }
                
                    $stmt = $conn->prepare($sql);
                
                    if ($fromDate && $toDate) {
                        $stmt->bindParam(':fromDate', $fromDate);
                        $stmt->bindParam(':toDate', $toDate);
                    }
                
                    $stmt->execute();
                    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(['status' => 1, 'data' => $result]);
                    exit;
                
                

                    case 'clients':
                        $sql = "SELECT 
                                    c.name, 
                                    c.email, 
                                    c.cellnumber,
                                    c.address,
                                    u.first_name AS created_by,
                                    c.created_at
                                FROM clients c
                                LEFT JOIN internal_users u ON c.created_by = u.id"; 
                    
                        if ($fromDate && $toDate) {
                            $sql .= " WHERE c.created_at >= :fromDate AND c.created_at < DATE_ADD(:toDate, INTERVAL 1 DAY)";
                        }
                    
                        $stmt = $conn->prepare($sql);
                    
                        if ($fromDate && $toDate) {
                            $stmt->bindParam(':fromDate', $fromDate);
                            $stmt->bindParam(':toDate', $toDate);
                        }
                    
                        $stmt->execute();
                        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                        echo json_encode(['status' => 1, 'data' => $result]);
                        exit;
                    
                    case 'appointments':
                        $sql = "SELECT
                                    a.name,
                                    a.date,
                                    a.time,
                                    a.contact,
                                    a.email,
                                    a.status,
                                    a.pet_name,
                                    a.pet_species,
                                    a.created_at
                                    FROM appointments a

                                    UNION ALL

                                    SELECT
                                    p.name,
                                    p.preferred_date AS date,
                                    p.preferred_time AS time,
                                    p.contact,
                                    p.email,
                                    p.status,
                                    p.pet_name,
                                    p.pet_species,
                                    p.created_at
                                    FROM pending_appointments p
                                    ";
                                    
                                    if ($fromDate && $toDate) {
                            $sql .= " WHERE a.created_at >= :fromDate AND a.created_at < DATE_ADD(:toDate, INTERVAL 1 DAY)";
                        }
                    
                        $stmt = $conn->prepare($sql);
                    
                        if ($fromDate && $toDate) {
        $sql = "
            SELECT * FROM (
                SELECT
                    a.name,
                    a.date,
                    a.time,
                    a.contact,
                    a.email,
                    a.status,
                    a.pet_name,
                    a.pet_species,
                    a.created_at
                FROM appointments a

                UNION ALL

                SELECT
                    p.name,
                    p.preferred_date AS date,
                    p.preferred_time AS time,
                    p.contact,
                    p.email,
                    p.status,
                    p.pet_name,
                    p.pet_species,
                    p.created_at
                FROM pending_appointments p
            ) AS combined
            WHERE combined.created_at >= :fromDate
              AND combined.created_at < DATE_ADD(:toDate, INTERVAL 1 DAY)
            ORDER BY combined.created_at DESC
        ";
    } else {
        $sql .= " ORDER BY created_at DESC";
    }

    $stmt = $conn->prepare($sql);

    if ($fromDate && $toDate) {
        $stmt->bindParam(':fromDate', $fromDate);
        $stmt->bindParam(':toDate', $toDate);
    }

    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 1, 'data' => $result]);
    exit;
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 0, 'message' => 'Failed to fetch data: ' . $e->getMessage()]);
        exit;
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
    exit;
}
