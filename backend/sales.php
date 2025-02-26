<?php
// Include the config.php for database connection
include 'config.php';

// Fetch data from the customer table
$customerQuery = "SELECT * FROM customer WHERE tstatus = 0";
$result = $conn->query($customerQuery);

if ($result->num_rows > 0) {
    // Prepare the SQL statement for inserting into the ticket table
    $ticketQuery = $conn->prepare("INSERT INTO ticket (id, nature_of_call, ticket_type, ticket_service, domain, sub_domain, customer_name, customer_location, customer_department, contact_person, contact_number, contact_mail, sla_priority, issue_nature, status, path, created_by, assignees, post_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    // Bind parameters
    $ticketQuery->bind_param("issssssssssssssssss", $id, $nature_of_call, $ticket_type, $ticket_service, $domain, $sub_domain, $customer_name, $customer_location, $customer_department, $contact_person, $contact_number, $contact_mail, $sla_priority, $issue_nature, $status, $path, $created_by, $assignees, $post_date);

    // Loop through each row from the customer result
    while ($customer = $result->fetch_assoc()) {
        // Set up your values
        $tid = $customer['id'];
        $id = '';
        $nature_of_call = ''; // Specify value as needed
        $ticket_type = '1'; // Specify value as needed
        $ticket_service = ''; // Specify value as needed
        $domain = ''; // Specify value as needed
        $sub_domain = ''; // Specify value as needed
        $customer_location = ''; // Specify value as needed
        $customer_department = ''; // Specify value as needed
        $contact_person = ''; // Specify value as needed
        $contact_number = ''; // Specify value as needed
        $contact_mail = ''; // Specify value as needed
        $sla_priority = ''; // Specify value as needed
        $issue_nature = ''; // Specify value as needed
        $status = '2'; // Specify value as needed
        $path = ''; // Specify value as needed
        $created_by = ''; // Specify value as needed

        // Find the assignees user ID based on the first name from the customer table
        $employeeName = $customer['employee'];
        $userQuery = $conn->prepare("SELECT id FROM user WHERE firstname = ?");
        $userQuery->bind_param("s", $employeeName);
        $userQuery->execute();
        $userQuery->bind_result($assignees);
        $userQuery->fetch();
        $userQuery->close();
        $cusName = $customer['name'];
        $userQuery = $conn->prepare("SELECT id FROM customer WHERE name = ?");
        $userQuery->bind_param("s", $cusName);
        $userQuery->execute();
        $userQuery->bind_result($customer_name);
        $userQuery->fetch();
        $userQuery->close();

        $post_date = date('Y-m-d H:i:s'); // Current date

        // Execute the insert statement
        $ticketQuery->execute();

        // Update tstatus to 1 for the processed customer
        $updateQuery = $conn->prepare("UPDATE customer SET tstatus = 1 WHERE id = ?");
        $updateQuery->bind_param("i", $tid);
        $updateQuery->execute();
    }

    echo "Tickets inserted and customer tstatus updated successfully.";

    // Close prepared statements
    $ticketQuery->close();
    $updateQuery->close();
} else {
    echo "No records found or already processed.";
}

// Close the connection
$conn->close();
?>