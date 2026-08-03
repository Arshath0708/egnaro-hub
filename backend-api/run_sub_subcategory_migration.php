<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db.php';

$sql = file_get_contents("db_upgrade_sub_subcategories.sql");

if ($conn->multi_query($sql)) {
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->next_result());
    echo json_encode(["success" => true, "message" => "Migration successful!"]);
} else {
    echo json_encode(["success" => false, "message" => "Migration failed: " . $conn->error]);
}
$conn->close();
?>
