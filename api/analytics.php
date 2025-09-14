<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include 'DbConnect.php';
$objDB = new DbConnect;
$conn = $objDB->connect();

$days = isset($_GET['days']) ? intval($_GET['days']) : 30;
$start = isset($_GET['start']) ? $_GET['start'] : null;
$end = isset($_GET['end']) ? $_GET['end'] : null;

try {
    // Determine date range for appointments over time
    if ($start && $end) {
        $startDate = $start;
        $endDate = $end;
    } else {
        $endDate = date('Y-m-d');
        $startDate = date('Y-m-d', strtotime("-" . max(1, $days-1) . " days", strtotime($endDate)));
    }

    // Appointments over time 
    $sql = "SELECT DATE(`date`) AS appt_date, COUNT(*) AS cnt
            FROM appointments
            WHERE `date` BETWEEN :startDate AND :endDate
            GROUP BY appt_date
            ORDER BY appt_date ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':startDate', $startDate);
    $stmt->bindParam(':endDate', $endDate);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $labels = [];
    $counts_by_date = [];
    $period = new DatePeriod(
        new DateTime($startDate),
        new DateInterval('P1D'),
        (new DateTime($endDate))->modify('+1 day')
    );
    $map = [];
    foreach ($rows as $r) { $map[$r['appt_date']] = (int)$r['cnt']; }
    foreach ($period as $dt) {
        $d = $dt->format('Y-m-d');
        $labels[] = $d;
        $counts_by_date[] = isset($map[$d]) ? $map[$d] : 0;
    }

    // Top services
    $sql2 = "SELECT `service` FROM appointments WHERE `date` BETWEEN :startDate AND :endDate";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bindParam(':startDate', $startDate);
    $stmt2->bindParam(':endDate', $endDate);
    $stmt2->execute();
    $services = $stmt2->fetchAll(PDO::FETCH_COLUMN) ?: [];

    $service_counts = [];
    foreach ($services as $s) {
        if (!$s) continue;
        $parts = preg_split('/,[;]?/', $s);
        foreach ($parts as $p) {
            $p = trim($p);
            if ($p === '') continue;
            if (!isset($service_counts[$p])) $service_counts[$p] = 0;
            $service_counts[$p]++;
        }
    }
    arsort($service_counts);
    $top_services = array_slice($service_counts, 0, 10, true);
    $top_services_labels = array_keys($top_services);
    $top_services_values = array_values($top_services);

    // Peak hours 
    $sql3 = "SELECT HOUR(`time`) AS hr, COUNT(*) AS cnt
             FROM appointments
             WHERE `time` IS NOT NULL AND `date` BETWEEN :startDate AND :endDate
             GROUP BY hr
             ORDER BY hr ASC";
    $stmt3 = $conn->prepare($sql3);
    $stmt3->bindParam(':startDate', $startDate);
    $stmt3->bindParam(':endDate', $endDate);
    $stmt3->execute();
    $rows3 = $stmt3->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $hour_labels = [];
    $hour_counts = array_fill(0, 24, 0);
    for ($h = 0; $h < 24; $h++) { $hour_labels[] = sprintf('%02d:00', $h); }
    foreach ($rows3 as $r) {
        $hr = intval($r['hr']);
        $hour_counts[$hr] = intval($r['cnt']);
    }

    // Cancellation rate
    $sql4 = "SELECT
            SUM(CASE WHEN LOWER(status) = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
            SUM(CASE WHEN LOWER(status) IN ('done', 'cancelled') THEN 1 ELSE 0 END) AS total
         FROM appointments
         WHERE `date` BETWEEN :startDate AND :endDate";
    $stmt4 = $conn->prepare($sql4);
    $stmt4->bindParam(':startDate', $startDate);
    $stmt4->bindParam(':endDate', $endDate);
    $stmt4->execute();
    $c = $stmt4->fetch(PDO::FETCH_ASSOC) ?: ['cancelled' => 0, 'total' => 0];
    $cancelled = (int)($c['cancelled'] ?? 0);
    $total_appts = (int)($c['total'] ?? 0);
    $cancellation_rate = $total_appts > 0 ? round(($cancelled / $total_appts) * 100, 2) : 0;

    $response = [
        'success' => 1,
        'range' => ['start' => $startDate, 'end' => $endDate],
        'appointments_over_time' => [
            'labels' => $labels ?? [],
            'data' => $counts_by_date ?? []
        ],
        'top_services' => [
            'labels' => $top_services_labels ?? [],
            'data' => $top_services_values ?? []
        ],
        'peak_hours' => [
            'labels' => $hour_labels ?? [],
            'data' => $hour_counts ?? []
        ],
        'cancellation' => [
            'cancelled' => $cancelled,
            'total' => $total_appts,
            'rate_percent' => $cancellation_rate
        ]
    ];

    header('Content-Type: application/json');
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => 0,
        'message' => $e->getMessage(),
        'appointments_over_time' => ['labels' => [], 'data' => []],
        'top_services' => ['labels' => [], 'data' => []],
        'peak_hours' => ['labels' => [], 'data' => []],
        'cancellation' => ['cancelled' => 0, 'total' => 0, 'rate_percent' => 0]
    ]);
}
