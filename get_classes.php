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
$role = $_GET['role'];

if ($role === 'student') {
  $stmt = $db->prepare("SELECT c.* FROM classes c JOIN enrollments e ON c.id = e.class_id WHERE e.student_id = ?");
  $stmt->bind_param("i", $userId);
} else if ($role === 'teacher') {
  $stmt = $db->prepare("SELECT * FROM classes WHERE teacher_id = ?");
  $stmt->bind_param("i", $userId);
} else {
  die(json_encode(["error" => "Invalid role"]));
}

$stmt->execute();
$result = $stmt->get_result();
$classes = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode($classes);

$stmt->close();
$db->close();