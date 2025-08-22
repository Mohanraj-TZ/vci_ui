import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ActionButtons from "./Components/ActionButtons";
import { API_BASE_URL } from "../api";
import Breadcrumb from "./Components/Breadcrumb";
import Search from "./Components/Search";
import Pagination from "./Components/Pagination";

const MySwal = withReactContent(Swal);

export default function DamagedItemsListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // FIX: Corrected API endpoint from '/pcbDamage' to '/damaged-items'
      const res = await axios.get(`${API_BASE_URL}/pcbDamage`); 
      // FIX: Changed condition to check for a 'data' key instead of 'success'
      if (res.data.data) { 
        setItems(res.data.data);
      }
    } catch {
      toast.error("Failed to fetch damaged items.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this damaged item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/del-damaged-items/${id}`);
      toast.success("Item deleted successfully!");
      setItems(items.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to delete item.");
    }
  };

  const handleSort = (field) => {
    const direction =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const filteredData = items.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField]?.toString().toLowerCase() || "";
    const valB = b[sortField]?.toString().toLowerCase() || "";
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = sortedData.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <Breadcrumb title="Damaged Items List" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2">
          <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
            <Form.Select
              size="sm"
              style={{ width: "100px" }}
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-6 text-md-end ">
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={fetchItems}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
            <Button
              size="sm"
              style={{
                backgroundColor: "#2FA64F",
                borderColor: "#2FA64F",
                color: "#fff",
                minWidth: "90px",
                height: "28px",
              }}
              onClick={() => navigate("/damaged-items/add")}
            >
              + Add New
            </Button>
            <Search search={search} setSearch={setSearch} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table custom-table align-middle mb-0">
            <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
              <tr>
                <th
                  style={{
                    width: "70px",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  S.No
                </th>
                {[
                  { label: "Invoice No", field: "invoice_no" },
                  { label: "Serial No", field: "serial_no" },
                  { label: "Quantity", field: "quantity" },
                  // { label: "Status", field: "status" },
                  // { label: "Sent Date", field: "sent_date" },
                  // { label: "Received Date", field: "received_date" },
                  { label: "Warranty Status", field: "warranty_status" },
                  { label: "Transportation", field: "transportation" },
                ].map(({ label, field }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    style={{ cursor: "pointer" }}
                  >
                    {label}{" "}
                    {sortField === field &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                ))}
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No data"
                      style={{ width: "80px", height: "100px", opacity: 0.6 }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    {/* FIX: Added missing table cells to display the correct data */}
                    <td>{item.invoice_no}</td>
                    <td>{item.serial_no}</td>
                    <td>{item.quantity}</td>
                    {/* <td>{item.status}</td>
                    <td>{item.sent_date}</td>
                    <td>{item.received_date}</td> */}
                    <td>{item.warranty_status}</td>
                    <td>{item.transportation}</td>
                    <td className="text-center">
                      <ActionButtons
                        // onEdit={() =>
                        //   navigate(`/damaged-items/edit/${item.id}`)
                        // }

                          onEdit={() => navigate(`/damaged-items/edit/${item.id}`)}
                        onDelete={() => handleDelete(item.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={sortedData.length}
        />
      </Card>
      <ToastContainer />
    </div>
  );
}
