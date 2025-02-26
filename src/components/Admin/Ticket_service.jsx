import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { baseURL } from "../../config.js";
import { FaFilter } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

import ReactPaginate from "react-paginate";
import html2canvas from "html2canvas";
import { UserContext } from "../UserContext/UserContext.jsx";

const Form = () => {
  const [formData, setFormData] = useState({
    domain: "",
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
  });

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${baseURL}/backend/fetchTicket_service.php`
        );
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
      const response = await fetch(
        `${baseURL}/backend/ticket_service_add.php`,
        {
          method: "POST",
          body: form,
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }
      setSubmissionStatus({ success: true, message: result.message });
      toast.success("Ticket Service added");
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
      document.querySelectorAll(".header span")
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
    link.setAttribute("download", "Ticket_service.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const table = document.querySelector(".filter-table");
    if (!table) return;

    // Extract table headers
    const headers = Array.from(document.querySelectorAll(".header span")).map(
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
    XLSX.writeFile(workbook, "Ticket_service.xlsx");
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
      pdf.save("Ticket_service.pdf");

      // Remove the cloned table from the document
      document.body.removeChild(tableClone);
    });
  };
  const offset = currentPage * ticketsPerPage;
  const currentTickets = filteredUsers.slice(offset, offset + ticketsPerPage);

  return (
    <div className="bg-second max-h-5/6 w-full relative  text-xs mx-auto p-1 lg:overflow-y-hidden h-auto ticket-scroll">
      {showForm && (
        <div className="w-full relative  m-2 mb-4 bg-box p-3 rounded-lg font-mont ">
          <div className="ticket-table mt-2">
            <form onSubmit={handleSubmit} className="space-y-4 text-label">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 ml-10 pr-10 mb-0">
                <div className="font-mont font-semibold text-2xl mb-4">
                  Ticket Service Details:
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
                    placeholder="Enter Ticket Service Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="flex-grow text-xs bg-second border p-1 border-none rounded-md outline-none transition ease-in-out delay-150 focus:shadow-[0_0_6px_#5fdd33]"
                  />
                  <button
                    type="submit"
                    className="ml-5 bg-prime font-mont font-semibold text-md text-white py-2 px-8 rounded-md shadow-md focus:outline-none"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="w-full relative  m-2 bg-box p-3 rounded-lg font-mont">
        <div className="flex justify-end flex-wrap space-x-2 mt-4">
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
            <span>Ticket Service Data </span>
            <span className="items-end">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-prime font-mont font-semibold text-sm text-white py-2 px-8 rounded-md shadow-md focus:outline-none"
              >
                {showForm ? "Close" : "+ Add Ticket Service"}
              </button>
            </span>
          </h2>
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

          <table className=" min-w-full bg-second rounded-lg overflow-hidden filter-table">
            <thead className="bg-prime text-white">
              <tr>
                {["Id", "name"].map((header, index) => (
                  <td key={index} className="w-1/6 py-2 px-4">
                    <div className="flex items-center justify-center">
                      <div className="header flex">
                        <span>{header}</span>
                        <FaFilter
                          className="cursor-pointer ml-3"
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
                  <td className="border-t py-4 px-4">{user.name}</td>
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
