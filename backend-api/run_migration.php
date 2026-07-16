<?php
include "db.php";

$sql = file_get_contents("db_upgrade_support_requests.sql");

if ($conn->multi_query($sql)) {
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->next_result());
    echo "Migration successful!\n";
} else {
    echo "Migration failed: " . $conn->error . "\n";
}
$conn->close();
?>
