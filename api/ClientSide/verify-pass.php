<?php
include '../cors.php';
header("Content-Type: application/json");

include('../DbConnect.php');
require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['passkey'])) {
    echo json_encode(["success" => false, "message" => "Passkey required"]);
    exit;
}

if ($data['passkey'] === $_ENV['STAFF_PORTAL_PASS']) {
    echo json_encode(["success" => true, "redirect" => "http://localhost:3000/login"]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid passkey"]);
}
