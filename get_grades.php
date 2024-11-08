<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

$db = new mysqli("localhost", "username", "password", "canvas_db");

if ($db->connect_error) {
  die(json_encode(["error" => "Database connection failed"]));
}

$userId = $_GET['userId'];

$stmt = $db->prepare("SELECT g.*, c.name as class_name FROM grades g JOIN classes c ON g.class_id = c.id WHERE g.student_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$grades = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode($grades);

$stmt->close();
$db->close();