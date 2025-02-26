import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { baseURL } from "../../config.js";
import { FaFilter } from "react-icons/fa";
import "./customer.css";
import ReactPaginate from "react-paginate";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { UserContext } from "../UserContext/UserContext";

const Form = () => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    mobile: "",
    mail: "",
    department: "",
    contact_person: "",
  });
  const { user } = useContext(UserContext);
  console.log("DashBoard context value:", user);
  const [ticketsPerPage, setTicketsPerPage] = useState(10); // default to 10 rows per page
  const [currentPage, setCurrentPage] = useState(0);
  let i = 1;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState({
    id: false,
    name: false,
    location: false,
    mobile: false,
    email: false,
  });

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${baseURL}/backend/fetchCustomers.php`);
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
    const fileExtension = file ? file.name.split(".").pop().toLowerCase() : "";

    if (file && allowedExtensions.includes(fileExtension)) {
      setAttachment(file);
      setAttachmentError("");
    } else {
      setAttachment(null);
      setAttachmentError(
        "Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed."
      );
    }
  };

  const handleRowsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10); // Parse the input value as an integer
    if (!isNaN(value) && value >= 1) {
      setTicketsPerPage(value);
      setCurrentPage(0); // Update state only if value is a valid number >= 1
    } else {
      setTicketsPerPage(1);
      setCurrentPage(0); // Default to 1 if input is cleared or set to invalid value
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    for (const key in formData) {
      form.append(key, formData[key]);
    }
    if (attachment) {
      form.append("attachment", attachment);
    }

    try {
      const response = await fetch(`${baseURL}/backend/customer_add.php`, {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }
      setSubmissionStatus({ success: true, message: result.message });
      toast.success("Customer added");
      location.reload();
    } catch (error) {
      setSubmissionStatus({
        success: false,
        message:
          "There was a problem with your fetch operation: " + error.message,
      });
    }
  };

  const handleFilterChange = (e, field, type) => {
    const value = e.target.value.toLowerCase(); // convert filter value to lowercase
    setFilters((prevFilters) => ({
      ...prevFilters,
      [field]: { type, value },
    }));
  };

  useEffect(() => {
    let filtered = [...users];
    Object.keys(filters).forEach((field) => {
      const { type, value } = filters[field];
      if (value) {
        filtered = filtered.filter((ticket) => {
          const fieldValue = ticket[field];

          if (fieldValue == null) {
            if (type === "contain" || type === "equal to") return false;
            if (type === "not contain") return true;
            if (type === "more than" || type === "less than") return false;
          }

          const fieldValueStr = fieldValue.toString().toLowerCase();
          const valueStr = value.toLowerCase();

          if (type === "contain") return fieldValueStr.includes(valueStr);
          if (type === "not contain") return !fieldValueStr.includes(valueStr);
          if (type === "equal to") return fieldValueStr === valueStr;
          if (type === "more than")
            return parseFloat(fieldValue) > parseFloat(value);
          if (type === "less than")
            return parseFloat(fieldValue) < parseFloat(value);
          return true;
        });
      }
    });
    setFilteredUsers(filtered);
  }, [filters, users]);

  const exportCSV = () => {
    // Get table headers
    const tableHeaders = Array.from(
      document.querySelectorAll(".header .head")
    ).map((header) => header.textContent.trim());

    // Get table data values
    const tableData = Array.from(document.querySelectorAll("table tr")).map(
      (row) =>
        Array.from(row.querySelectorAll("td")).map((cell) =>
          cell.textContent.trim()
        )
    );

    // Filter out rows that contain filter content
    const filteredTableData = tableData.filter(
      (row) =>
        !row.some(
          (cell) =>
            cell.includes("Contains") ||
            cell.includes("Does Not Contain") ||
            cell.includes("Equal To") ||
            cell.includes("More Than") ||
            cell.includes("Less Than")
        )
    );

    // Create CSV content
    const csvContent = [
      tableHeaders.join(","),
      ...filteredTableData.map((row) => row.join(",")),
    ].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const table = document.querySelector(".filter-table");
    if (!table) return;

    // Extract table headers
    const headers = Array.from(document.querySelectorAll(".header .head")).map(
      (header) => header.textContent.trim()
    );

    // Extract table data values
    const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
      Array.from(row.querySelectorAll("td")).map((td) => td.innerText.trim())
    );

    // Filter out rows that contain filter content
    const filteredRows = rows.filter(
      (row) =>
        !row.some(
          (cell) =>
            cell.includes("Contains") ||
            cell.includes("Does Not Contain") ||
            cell.includes("Equal To") ||
            cell.includes("More Than") ||
            cell.includes("Less Than")
        )
    );

    const data = [headers, ...filteredRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "Analytics.xlsx");
  };

  const exportPDF = () => {
    const table = document.querySelector(".filter-table");
    if (!table) return;

    // Create a copy of the table
    const tableClone = table.cloneNode(true);

    // Remove filter dropdowns and inputs from the cloned table
    tableClone.querySelectorAll(".filter").forEach((filter) => filter.remove());

    // Center-align all table cell contents
    tableClone.querySelectorAll("th, td").forEach((cell) => {
      cell.style.textAlign = "center";
    });

    // Append the cloned table to the body (temporarily)
    document.body.appendChild(tableClone);

    // Use html2canvas to convert the cloned table to an image
    html2canvas(tableClone).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("Analytics.pdf");

      // Remove the cloned table from the document
      document.body.removeChild(tableClone);
    });
  };

  const offset = currentPage * ticketsPerPage;
  const currentTickets = filteredUsers.slice(offset, offset + ticketsPerPage);

  return (
    <div className="bg-second max-h-5/6 w-full relative text-xs mx-auto p-1 lg:overflow-y-hidden h-auto ticket-scroll">
      <div
        className={`box w-full relative m-2 mb-4 bg-box p-3 rounded-lg font-mont transition-height duration-300 ${
          showForm ? "h-auto block" : " h-0 overflow-hidden hidden"
        }`}
        style={{
          transition: "ease-in-out 1s",
        }}
      >
        <div className="ticket-table mt-2 ">
          <form onSubmit={handleSubmit} className="space-y-4 text-label">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ml-10 pr-10 mb-0">
              <div className="font-mont font-semibold text-2xl mb-4">
                Customer Details:
              </div>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ml-10 pr-10 mb-0">
              <div className="flex items-center mb-2 mr-4">
                <label className="text-sm font-semibold text-prime mr-2 w-32">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="flex-grow text-xs bg-second border p-1 border-none rounded-md outline-none transition ease-in-out delay-150 focus:shadow-[0_0_6px_#5fdd33]"
                />
              </div>
              <div className="flex items-center mb-2 mr-4">
                <label className="text-sm font-semibold text-prime mr-2 w-32">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="Enter Location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="flex-grow text-xs bg-second border p-1 border-none rounded-md outline-none transition ease-in-out delay-150 focus:shadow-[0_0_6px_#5fdd33]"
                />
              </div>
              <div className="flex items-center mb-2 mr-4">
                <label className="text-sm font-semibold text-prime mr-2 w-32">
                  Mobile
                </label>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Enter Mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  className="flex-grow text-xs bg-second border p-1 border-none rounded-md outline-none transition ease-in-out delay-150 focus:shadow-[0_0_6px_#5fdd33]"
                />
              </div>
              <div className="flex items-center mb-2 mr-4">
                <label className="text-sm font-semibold text-prime mr-2 w-32">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="flex-grow text-xs bg-second border p-1 border-none rounded-md outline-none transition ease-in-out delay-150 focus:shadow-[0_0_6px_#5fdd33]"
                />
              </div>
              <div className="flex items-center mb-2 mr-4">
                <label className="text-sm font-semibold text-prime mr-2 w-32">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  placeholder="Enter Department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="flex-grow text-xs bg-second border p-1 border-none rounded-md outline-none transition ease-in-out delay-150 focus:shadow-[0_0_6px_#5fdd33]"
                />
              </div>
              <div className="flex items-center mb-2 mr-4">
                <label className="text-sm font-semibold text-prime mr-2 w-32">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contact_person"
                  placeholder="Enter Contact Person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  required
                  className="flex-grow text-xs bg-second border p-1 border-none rounded-md outline-none transition ease-in-out delay-150 focus:shadow-[0_0_6px_#5fdd33]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 ml-20 pr-20">
              <div className="ml-4 mt-1 md:ml-0 md:w-full flex justify-center items-center">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center rounded-lg cursor-pointer  dark:hover:bg-bray-800 w-full md:w-1/2"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className={
                        attachment
                          ? "w-8 h-8 text-flo dark:text-gray-500"
                          : "w-8 h-8 text-gray-500 dark:text-gray-500"
                      }
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentcolor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p
                      className={
                        attachment
                          ? " text-sm text-flo font-bold"
                          : " text-sm text-prime font-bold"
                      }
                    >
                      {attachment ? attachment.name : "Click to upload"}
                    </p>
                  </div>
                  <input
                    id="dropzone-file"
                    name="attachment"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="mt-1 bg-prime font-mont font-semibold text-lg text-white py-2 px-8 rounded-md shadow-md focus:outline-none"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full relative m-2 bg-box p-3 rounded-lg font-mont">
        <div className="flex justify-end flex-wrap space-x-2 mt-4 ">
          <button
            onClick={exportCSV}
            className="bg-flo font-mont font-semibold text-sm text-white py-1 px-4 rounded-md shadow-md focus:outline-none"
          >
            CSV
          </button>
          <button
            onClick={exportExcel}
            className="bg-flo font-mont font-semibold text-sm text-white py-1 px-4 rounded-md shadow-md focus:outline-none"
          >
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="bg-flo font-mont font-semibold text-sm text-white py-1 px-4 rounded-md shadow-md focus:outline-none"
          >
            PDF
          </button>
        </div>

        {/* Table displaying fetched user data */}
        <div className="ticket-table mt-8">
          <h2 className="text-2xl font-bold text-prime mb-4">
            <span>Customer Data </span>
            <span className="items-end">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-prime font-mont font-semibold text-sm text-white py-2 px-8 rounded-md shadow-md focus:outline-none"
              >
                {showForm ? "Close" : "+ Add Customer"}
              </button>
            </span>
          </h2>
          <div className="flex justify-end items-center space-x-2 my-1">
            <label
              htmlFor="rowsPerPage"
              className="text-sm font-medium text-gray-700"
            >
              Rows per page:
            </label>
            <input
              type="number"
              id="rowsPerPage"
              placeholder={ticketsPerPage}
              onChange={handleRowsPerPageChange}
              className="w-16 px-1 py-1 border rounded text-gray-900"
              min="0"
            />
          </div>

          <table className=" min-w-full bg-second rounded-lg overflow-hidden filter-table">
            <thead className="bg-prime text-white">
              <tr>
                {[
                  "Id",
                  "Name",
                  "Location",
                  "Mobile",
                  "Email",
                  "Department",
                  "Contact_person",
                ].map((header, index) => (
                  <td key={index} className="w-1/6 py-2 px-4">
                    <div className="flex items-center justify-left gap-2">
                      <div className="header flex">
                        <span className="head">{header}</span>
                        <span>
                          <FaFilter
                            className="cursor-pointer ml-1 mt-0.5"
                            onClick={() =>
                              setShowFilter((prevState) => ({
                                ...prevState,
                                [header.toLowerCase().replace(" ", "")]:
                                  !prevState[
                                    header.toLowerCase().replace(" ", "")
                                  ],
                              }))
                            }
                          />
                        </span>
                      </div>
                    </div>
                    {showFilter[header.toLowerCase().replace(" ", "")] && (
                      <div className="mt-2 bg-prime p-2 rounded shadow-md filter">
                        <select
                          onChange={(e) =>
                            handleFilterChange(
                              e,
                              header.toLowerCase().replace(" ", ""),
                              e.target.value
                            )
                          }
                          className="mb-2 p-1 border text-prime rounded w-full"
                        >
                          <option value="contain">Contains</option>
                          <option value="not contain">Does Not Contain</option>
                          <option value="equal to">Equal To</option>
                          <option value="more than">More Than</option>
                          <option value="less than">Less Than</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Enter value"
                          onChange={(e) =>
                            handleFilterChange(
                              e,
                              header.toLowerCase().replace(" ", ""),
                              filters[header.toLowerCase().replace(" ", "")]
                                ?.type || "contain"
                            )
                          }
                          className="p-1 border rounded text-prime w-full"
                        />
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTickets.map((user) => (
                <tr key={user.id} className="hover:bg-gray-100">
                  <td className="border-t py-4 px-4">{i++ + offset}</td>
                  <td
                    className="border-t py-4 px-4"
                    style={{ textAlign: "left" }}
                  >
                    {user.name}
                  </td>
                  <td
                    className="border-t py-4 px-4"
                    style={{ textAlign: "left" }}
                  >
                    {user.location}
                  </td>
                  <td
                    className="border-t py-4 px-4"
                    style={{ textAlign: "left" }}
                  >
                    {user.mobile}
                  </td>
                  <td
                    className="border-t py-4 px-4"
                    style={{ textAlign: "left" }}
                  >
                    {user.email}
                  </td>
                  <td
                    className="border-t py-4 px-4"
                    style={{ textAlign: "left" }}
                  >
                    {user.department}
                  </td>
                  <td
                    className="border-t py-4 px-4"
                    style={{ textAlign: "left" }}
                  >
                    {user.contact_person}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="pagination mt-4 flex justify-center">
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={Math.ceil(filteredUsers.length / ticketsPerPage)}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={"pagination-container"}
            pageClassName={"pagination-page"}
            pageLinkClassName={"pagination-link"}
            previousClassName={"pagination-previous"}
            nextClassName={"pagination-next"}
            breakClassName={"pagination-break"}
            activeClassName={"pagination-active"}
          />
        </div>
      </div>
    </div>
  );
};

export default Form;
