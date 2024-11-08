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
$password = $data['password'];

$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
  $user = $result->fetch_assoc();
  if (password_verify($password, $user['password'])) {
    unset($user['password']);
    echo json_encode($user);
  } else {
    echo json_encode(null);
  }
} else {
  echo json_encode(null);
}

$stmt->close();
$db->close();