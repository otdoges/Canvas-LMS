<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$db = new mysqli("localhost", "username", "password", "canvas_db");

if ($db->connect_error) {
  die(json_encode(["error" => "Database connection failed"]));
}

$data = json_decode(file_get_contents("php://input"), true);

$teacherId = $data['teacherId'];
$name = $data['name'];
$code = $data['code'];
$description = $data['description'];

$stmt = $db->prepare("INSERT INTO classes (teacher_id, name, code, description) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isss", $teacherId, $name, $code, $description);

if ($stmt->execute()) {
  $classId = $db->insert_id;
  $class = [
    "id" => $classId,
    "teacher_id" => $teacherId,
    "name" => $name,
    "code" => $code,
    "description" => $description
  ];
  echo json_encode($class);
} else {
  echo json_encode(null);
}

$stmt->close();
$db->close();