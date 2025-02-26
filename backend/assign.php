<?php
include 'config.php';

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Decode JSON input from the request body
    $input = json_decode(file_get_contents('php://input'), true);

    // Extract data from JSON input
    $id = $input['id'];
    $assignees = $input['assignees'];
    $doneby= $input['done'];

    // Convert assignees array to a comma-separated string
    $assigneesString = implode(',', $assignees);

    // Prepare SQL statement to update ticket assignees
    $query = "UPDATE ticket SET assignees = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("si", $assigneesString, $id);

    // Initialize response array
    $response = [];

    // Execute SQL statement and handle success/error
    if ($stmt->execute()) {
        $response['message'] = "Assignees updated successfully";
    } else {
        $response['message'] = "Failed to update assignees";
    }

    // Close statement and database connection
    $stmt->close();

    $query = "INSERT INTO ticket_assign (tid, done_by, assignto) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("sss", $id, $doneby, $assigneesString);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Log entry created successfully"]);
    } else {
        echo json_encode(["message" => "Failed to create log entry"]);
    }

    $stmt->close();
    $conn->close();

    // Send JSON response
    echo json_encode($response);
} else {
    // If request method is not POST, return an error message
    echo json_encode(["message" => "Invalid request method"]);
}
