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

if ($method === 'GET') {
    try {
        $history = [];
        //Auto-clean old user and appointment logs based on retention setting
        try {
            $retentionStmt = $conn->query("SELECT log_retention_days FROM global_settings WHERE id = 1");
            $retentionDays = intval($retentionStmt->fetchColumn() ?? 0);

            if ($retentionDays > 0) {
                $cleanup1 = $conn->prepare('DELETE FROM user_logs WHERE event_time < DATE_SUB(NOW(), INTERVAL :days DAY)');
                $cleanup1->execute([':days' => $retentionDays]);

                $cleanup2 = $conn->prepare('DELETE FROM audit_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL :days DAY)');
                $cleanup2->execute([':days' => $retentionDays]);
            }
        } catch (Exception $e) {
            error_log("Log cleanup failed: " . $e->getMessage());
        }

        // Define table configurations
        $tables = [
            'brands' => ['name' => 'name', 'type' => 'Brand', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'categories' => ['name' => 'name', 'type' => 'Category', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'clients' => ['name' => 'name', 'type' => 'Client', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'generic_cms' => ['name' => 'generic_name', 'type' => 'Generic', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'products' => ['name' => 'product_name', 'type' => 'Product', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'suppliers' => ['name' => 'supplier_name', 'type' => 'Supplier', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => true],
            'orders' => ['name' => 'receipt_number', 'type' => 'Order', 'date_column' => 'order_date', 'has_created_by' => false, 'has_updated_by' => false, 'has_confirmed_by' => true],
            'services' => ['name' => 'name', 'type' => 'Service', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => false],
            'surgical_consent' => ['name' => 'surgical_procedure', 'type' => 'Surgical Consent', 'date_column' => 'created_at', 'has_created_by' => false, 'has_updated_by' => false],
            'immunization_form' => ['name' => 'client_id', 'type' => 'Immunization Form', 'date_column' => 'created_at', 'has_created_by' => true, 'has_updated_by' => false]
        ];

        foreach ($tables as $table => $config) {
            $column_name = $config['name']; 
            $type = $config['type'];
            $date_column = $config['date_column'];
            $hasCreatedBy = $config['has_created_by'];
            $hasUpdatedBy = $config['has_updated_by'];
            $hasConfirmedBy = $config['has_confirmed_by'] ?? false;

            $sql = "SELECT 
                        $table.$column_name AS record_name, 
                        '$type' AS type, 
                        $table.$date_column AS created_at";

            if ($hasCreatedBy) {
                $sql .= ", CONCAT(u1.first_name, ' ', u1.last_name) AS created_by";
            } else {
                $sql .= ", NULL AS created_by";
            }

            if ($hasUpdatedBy) {
                $sql .= ", CONCAT(u2.first_name, ' ', u2.last_name) AS updated_by";
            } else {
                $sql .= ", NULL AS updated_by";
            }

            if ($hasConfirmedBy) {
                $sql .= ", CONCAT(u3.first_name, ' ', u3.last_name) AS confirmed_by";
            } else {
                $sql .= ", NULL AS confirmed_by";
            }

            $sql .= " FROM $table";

            if ($hasCreatedBy) $sql .= " LEFT JOIN internal_users u1 ON $table.created_by = u1.id";
            if ($hasUpdatedBy) $sql .= " LEFT JOIN internal_users u2 ON $table.updated_by = u2.id";
            if ($hasConfirmedBy) $sql .= " LEFT JOIN internal_users u3 ON $table.confirmed_by = u3.id";

            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $history = array_merge($history, $records);
        }

        // Fetch audit_logs (Appointments)
        $auditSql = "
            SELECT 
                a.description AS record_name,
                'Appointment' AS type,
                a.timestamp AS created_at,
                CASE WHEN a.action = 'update' THEN CONCAT(u.first_name, ' ', u.last_name) ELSE NULL END AS updated_by,
                CASE WHEN a.action = 'create' THEN CONCAT(u.first_name, ' ', u.last_name) ELSE NULL END AS created_by,
                CASE WHEN a.action = 'confirm' THEN CONCAT(u.first_name, ' ', u.last_name) ELSE NULL END AS confirmed_by
            FROM audit_logs a
            LEFT JOIN internal_users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
        ";
        $auditStmt = $conn->prepare($auditSql);
        $auditStmt->execute();
        $auditLogs = $auditStmt->fetchAll(PDO::FETCH_ASSOC);
        $history = array_merge($history, $auditLogs);

        // Sort all by date (DESC)
        usort($history, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        echo json_encode(['status' => 1, 'data' => $history], JSON_PRETTY_PRINT);
        exit;

    } catch (Exception $e) {
        echo json_encode(['status' => 0, 'message' => 'Failed to fetch history: ' . $e->getMessage()]);
    }

} else {
    http_response_code(405);
    echo json_encode(['status' => 0, 'message' => 'Method not allowed']);
}
