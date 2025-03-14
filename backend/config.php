<?php



header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("X-Frame-Options: SAMEORIGIN");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");

// Permissions-Policy Header
header("Permissions-Policy: geolocation=(), midi=(), microphone=(), camera=(), magnetometer=(), gyroscope=(), fullscreen=(), payment=()");

header("Referrer-Policy: no-referrer-when-downgrade");

header("Content-Type: application/json");
function loadEnv($filePath)
{
    if (!file_exists($filePath)) {
        throw new Exception("File not found: $filePath");
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if (!array_key_exists($name, $_ENV)) {
            putenv("$name=$value");
            $_ENV[$name] = $value;
        }
    }
}

// Load the .env file
loadEnv(__DIR__ . '/.env');

// Accessing the environment variables
$dbHost = getenv('DB1_HOST');
$dbUsername = getenv('DB1_USERNAME');
$dbPassword = getenv('DB1_PASSWORD');
$dbName = getenv('DB1_DATABASE');
$dbPort = getenv('DB1_PORT');
$salt = getenv('SALT');

// Create a connection to the database
$conn = mysqli_connect($dbHost, $dbUsername, $dbPassword, $dbName, $dbPort);

if (!$conn) {
    die("Connection to database failed: " . mysqli_connect_error());
}

try {
    $pdo = new PDO('mysql:host=' . $dbHost . ';dbname=' . $dbName, $dbUsername, $dbPassword);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Get IP address and host
$ipaddress = getenv("REMOTE_ADDR") ?: $_SERVER['REMOTE_ADDR'];
$hst = $_SERVER['HTTP_HOST'];
$localIP = getHostByName(getHostName());
?>
