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

$email = $data['email'];
$password = password_hash($data['password'], PASSWORD_DEFAULT);
$name = $data['name'];
$role = $data['role'];

$stmt = $db->prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $email, $password, $name, $role);

if ($stmt->execute()) {
  $user_id = $db->insert_id;
  $user = [
    "id" => $user_id,
    "email" => $email,
    "name" => $name,
    "role" => $role
  ];
  echo json_encode($user);
} else {
  echo json_encode(null);
}

$stmt->close();
$db->close();