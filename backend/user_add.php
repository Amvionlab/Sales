<?php
include 'config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require 'PHPMailer/vendor/autoload.php';

// Process form submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $uploadDir = 'C:/xampp/htdocs/TMS/src/photo/';
    $attachmentPath = '';

    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] == UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['attachment']['tmp_name'];
        $fileName = basename($_FILES['attachment']['name']); // Ensure file name is safe
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = array('pdf', 'jpg', 'jpeg', 'png');

        if (in_array($fileExtension, $allowedExtensions)) {
            $filePath = $uploadDir . $fileName;

            // Move the file to the specified directory
            if (move_uploaded_file($fileTmpPath, $filePath)) {
                $attachmentPath = 'src/photo/' . $fileName; // Storing relative path
            } else {
                throw new Exception('File upload failed.');
            }
        } else {
            throw new Exception('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.');
        }
    }

    $firstname = $_POST['firstname'];
    $lastname = $_POST['lastname'];
    $password = $_POST['password']; 
    $usernameD = $_POST['username'];
    $email = $_POST['email'];
    $usertype = $_POST['usertype'];
    $mobile = $_POST['mobile'];
    $location = $_POST['location'];
    $employee_id = $_POST['employee_id'];
    $domain = $_POST['domain'];
    $sub_domain = $_POST['sub_domain'];
    $active="1";

    $checkStmt = $conn->prepare("SELECT COUNT(*) FROM user WHERE username = ?");
    $checkStmt->bind_param("s", $usernameD);
    $checkStmt->execute();
    $checkStmt->bind_result($count);
    $checkStmt->fetch();
    $checkStmt->close();

    if ($count > 0) {
        $response = array('success' => true, 'message' => 'Username already exists.');
        echo json_encode($response);
        exit;
    }



    $stmt = $conn->prepare("INSERT INTO user (firstname, lastname, username, email, usertype, mobile, location, employee_id, domain, sub_domain, photo, is_active, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssssssssss", $firstname, $lastname, $usernameD, $email, $usertype, $mobile, $location, $employee_id, $domain, $sub_domain, $attachmentPath, $active, $password);

    if ($stmt->execute()) {
        $lstId = mysqli_insert_id($conn);
        $rq = mysqli_fetch_array(mysqli_query($conn, "select * from smtp"));
        $username = $rq['username'];
        $passwordD = $rq['password'];
        $host = $rq['host'];
        $smtpsecure = $rq['smtpsecure'];
        $port = $rq['port'];
        $fromname = $rq['fromname'];
        $from = $rq['frommail'];
        $sub = "Amvion Login Details";
        $to = $email;

        $mailtxt = '<table align="center" border="0" cellspacing="3" cellpadding="3" width="100%" style="background:#f5f5f5; color: black; margin-top:10px;">
            <tbody>
            <tr>
            <td colspan="2" style="font-weight:bold;text-align:center;font-size:17px;">SAMPAT - Ticket Management System - Login Details</td>
            </tr>
            <tr>
            <td><span style="font-weight:bold;">Dear ' . $firstname . '</span><br><br> Welcome to SAMPAT - Ticket Management System. <br><br>Username: ' . $usernameD . '<br>Password: ' . $password . '<br><br> Kindly login with credentials.<br><br>Regards,<br>SAMPAT - TMS</td>
            </tr>
            </tbody>
            </table>';

        

        $mail = new PHPMailer();
        $mail->IsSMTP();
        $mail->SMTPDebug = 0;
        $mail->Host = $host;
        $mail->SMTPSecure = $smtpsecure;
        $mail->Port = $port;
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = $passwordD;

        $mail->FromName = $fromname;
        $mail->From = $from;
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $sub;
        $mail->Body = $mailtxt;

        if (!$mail->send()) {
            $response = array('success' => false, 'message' => 'User added, but email could not be sent.');
        } else {
            $response = array('success' => true, 'message' => 'User added successfully and email sent.');
        }
        echo json_encode($response);
    } else {
        $response = array('success' => false, 'message' => 'Database error: ' . $stmt->error);
        echo json_encode($response);
    }

    $stmt->close();
} else {
    $response = array('success' => false, 'message' => 'Invalid request method.');
    echo json_encode($response);
}

$conn->close();