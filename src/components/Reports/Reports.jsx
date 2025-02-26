import React, { useState, useEffect, useContext } from "react";
import { CSVLink } from "react-csv";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TablePagination,
  Paper,
  TableSortLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext/UserContext.jsx";
import { useTicketContext } from "../UserContext/TicketContext.jsx";
import { baseURL } from "../../config.js";

function Analytics() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [statusNames, setStatusNames] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [filters, setFilters] = useState({});
  const { setTicketId } = useTicketContext();
  const [showFilter, setShowFilter] = useState({
    id: false,
    subject: false,
    priority: false,
    status: false,
    executive: false,
    created_date: false,
  });
  const [ticketsPerPage, setTicketsPerPage] = useState(100);
  const [page, setPage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [filteredText, setFilterText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [openedTickets, setOpenTickets] = useState([]);
  const { user } = useContext(UserContext);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const fetchStatusNames = async () => {
    try {
      const response = await fetch(`${baseURL}backend/get_status.php`);
      const data = await response.json();
      setStatusNames(data);
    } catch (error) {
      console.error("Error fetching status names:", error);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      let response;
      if (user && user.accessId === "2") {
        response = await fetch(
          `${baseURL}backend/status_count.php?user=${user.userId}`
        );
      } else if (user && user.accessId === "5") {
        response = await fetch(
          `${baseURL}backend/status_count.php?support=${user.userId}`
        );
      } else {
        response = await fetch(`${baseURL}backend/status_count.php`);
      }
      const data = await response.json();
      setStatusCounts(data);
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  };

  const fetchTickets = async (value) => {
    try {
      let response;
      if (user && user.accessId === "2") {
        response = await fetch(
          `${baseURL}backend/fetchTickets.php?user=${user.userId}`
        );
      } else if (user && user.accessId === "5") {
        response = await fetch(
          `${baseURL}backend/fetchTickets.php?support=${user.userId}`
        );
      } else {
        response = await fetch(`${baseURL}backend/fetchTickets.php`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets([]); // Ensure tickets is always an array
      }
      setFilteredTickets(data);
    } catch (error) {
      console.error("Error fetching ticket data:", error);
    }
  };

  useEffect(() => {
    fetchStatusNames();
    fetchStatusCounts();
    fetchTickets();
  }, []);
  console.log(tickets);

  useEffect(() => {
    let filtered = [...tickets];
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
    setFilteredTickets(filtered);
  }, [filters, tickets]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setTicketsPerPage(parseInt(event.target.value, 15));
    setPage(0);
  };

  const handleViewTicket = (ticketId) => {
    setTicketId(ticketId);
    navigate("/singleticket");
  };

  const headers = [
    "Id",
    "Type",
    "SLA",
    "Status",
    "Service",
    "Department",
    "Assignees",
    "Domain",
    "SubDomain",
    "Customer",
    "Created At",
    "Created By",
    "Scheduled Date",
    "Closed At",
  ];

  const csvData = filteredTickets.map((ticket) => ({
    Id: ticket.id,
    Type: ticket.type,
    SLA: ticket.sla,
    Status: ticket.status,
    Service: ticket.service,
    Department: ticket.department,
    Assignees: ticket.assignees,
    Domain: ticket.domain,
    SubDomain: ticket.subdomain,
    Customer: ticket.customer,
    "Created At": ticket.post_date,
    "Created By": ticket.name,
    "Scheduled Date": ticket.scheduled_date,
    "Closed At": ticket.closed_date,
  }));

  return (
    <div className="max-h-full max-w-full text-xs mx-auto bg-second overflow-hidden">
      {isVisible && (
        <div className="flex flex-wrap justify-between bg-box shadow-custom rounded-md p-3">
          {statusNames.map((status, index) => (
            <div
              key={index}
              className="bg-second shadow  w-64 p-5 rounded-xl mb-2"
            >
              <div className="flex justify-between items-center ">
                <div className="ml-1">
                  <h3 className="text-prime justify-center text-base font-semibold uppercase">
                    {status.status}
                  </h3>
                  <div className="flex mt-3">
                    <div className="bg-box rounded-3xl p-1 min-w-5 h-5 flex items-center shadow-green-500 shadow-sm justify-center">
                      <p className="text-sm text-green-500 font-semibold">
                        {(Array.isArray(statusCounts) &&
                          statusCounts.find(
                            (count) => count.status === status.id
                          )?.lone) ||
                          0}
                      </p>
                    </div>
                    <div className="bg-box rounded-3xl p-1 min-w-5 h-5 ml-2 flex items-center shadow-sm shadow-orange-400 justify-center">
                      <p className="text-sm text-orange-400 font-semibold">
                        {(Array.isArray(statusCounts) &&
                          statusCounts.find(
                            (count) => count.status === status.id
                          )?.ott) ||
                          0}
                      </p>
                    </div>
                    <div className="bg-box rounded-3xl p-1 min-w-5 h-5 ml-2 flex items-center shadow-sm shadow-red-700 justify-center">
                      <p className="text-sm text-red-700 font-semibold">
                        {(Array.isArray(statusCounts) &&
                          statusCounts.find(
                            (count) => count.status === status.id
                          )?.gtwo) ||
                          0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-prime text-white rounded-md min-w-8 max-w-10 h-7 flex items-center shadow-md justify-center -mt-9 -mr-1">
                  <p className="text-base font-semibold">
                    {(Array.isArray(statusCounts) &&
                      statusCounts.find((count) => count.status === status.id)
                        ?.count) ||
                      0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Paper className="bg-box p-2 m-1">
        <div className="w-full border-b p-1 h-10 flex text-sm justify-between items-center font-medium mb-2">
          <div className="flex capitalize ml-4 mt-3 text-base font-poppins">
            <p>Reports</p>
          </div>

          <TablePagination
            component="div"
            count={filteredTickets.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={ticketsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[15, 30, 50, 100, 500]}
          />
          {/* all */}
          {/* <div className="flex gap-4">
            <select
              className="border rounded text-xs capitalize "
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
            >
              <option value="All">All</option>
              {headers.map((header, i) => (
                <option key={i} value={header}>
                  {header.replace("_", " ")}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Enter text"
              className="border rounded p-1 text-xs"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setFilterText(e.target.value);
              }}
            />
          </div> */}
          <div className="flex gap-1">

          {user.accessId === '3' && (
  <button
    className="bg-box border transform hover:scale-110 transition-transform duration-200 ease-in-out text-prime text-xs font-semibold py-1 px-3 rounded m-2"
    onClick={() => window.open(`${baseURL}backend/sales.php`, '_blank')}
  >
    Assign Tickets
  </button>
)}
          {user.accessId === '3' && (
      <button
        className="bg-box border transform hover:scale-110 transition-transform duration-200 ease-in-out text-prime text-xs font-semibold py-1 px-3 rounded m-2"
        onClick={() => window.location.href = `${baseURL}backend/detailed_report.php?export=true`}
      >
        Detailed Report
      </button>
    )}
            <button
              className="bg-box border transform hover:scale-110 transition-transform duration-200 ease-in-out text-prime text-xs font-semibold py-1 px-3 rounded m-2"
              onClick={toggleVisibility}
            >
              SUMMARY
            </button>
            <CSVLink
              data={csvData}
              headers={headers}
              filename={"tickets.csv"}
              className="bg-box transform hover:scale-110 transition-transform duration-200 ease-in-out border text-prime text-xs font-semibold py-1 px-3 rounded m-2"
            >
              CSV
            </CSVLink>
          </div>
        </div>

        <TableContainer sx={{ maxHeight: "calc(100vh - 120px)" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {headers.map((header, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      whiteSpace: "nowrap",
                      fontWeight: "600",
                      padding: "1px",
                      fontSize: "11px",
                    }}
                  >
                    <TableSortLabel>{header}</TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets
                .slice(
                  page * ticketsPerPage,
                  page * ticketsPerPage + ticketsPerPage
                )
                .map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell sx={{ padding: "3px", fontSize: "11px" }}>
                      {ticket.id}
                    </TableCell>
                    <TableCell sx={{ padding: "3px", fontSize: "11px" }}>
                      {ticket.type}
                    </TableCell>
                    <TableCell sx={{ padding: "3px", fontSize: "11px" }}>
                      {ticket.sla}
                    </TableCell>
                    <TableCell sx={{ padding: "3px", fontSize: "11px" }}>
                      {ticket.status}
                    </TableCell>
                    <TableCell sx={{ padding: "3px", fontSize: "11px" }}>
                      {ticket.service}
                    </TableCell>
                    <TableCell sx={{ padding: "3px", fontSize: "11px" }}>
                      {ticket.department}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: "100px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        padding: "3px",
                        fontSize: "11px",
                      }}
                      title={ticket.assignees}
                    >
                      {ticket.assignees}
                    </TableCell>
                    <TableCell sx={{ padding: "3px", fontSize: "11px" }}>
                      {ticket.domain}
                    </TableCell>
                    <TableCell sx={{ padding: "3px", fontSize: "11px" }}>
                      {ticket.subdomain}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: "100px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        padding: "3px",
                        fontSize: "11px",
                      }}
                    >
                      {ticket.customer}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: "3px",
                        whiteSpace: "nowrap",
                        fontSize: "11px",
                      }}
                    >
                      {ticket.post_date}
                    </TableCell>
                    <TableCell sx={{ padding: "3px", fontSize: "11px" }}>
                      {ticket.raisedby}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: "3px",
                        whiteSpace: "wrap",
                        fontSize: "11px",
                      }}
                    >
                      {ticket.scheduled_date}
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: "3px",
                        whiteSpace: "wrap",
                        fontSize: "11px",
                      }}
                    >
                      {ticket.closed_date}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
}

export default Analytics;
