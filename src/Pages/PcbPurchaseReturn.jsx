import React, { useEffect, useState } from "react";
import { Button, Spinner, Form, Card } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import ActionButtons from "./Components/ActionButtons";
import Breadcrumb from "./Components/Breadcrumb";
import Search from "./Components/Search";
import Pagination from "./Components/Pagination";

export default function PcbPurchaseReturn() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("asec");
  const [sortDirection, setSortDirection] = useState("desc");

  const navigate = useNavigate();

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/pcb-purchase-return`);
      setReturns(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to fetch return data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleGenerateReturnInvoice = (returnId) => {
    const pdfWindow = window.open(
      `${API_BASE_URL}/pcb-purchase-return-invoice/${returnId}`,
      "_blank"
    );
    if (pdfWindow) {
      toast.success("Return invoice generated successfully!");
    } else {
      toast.error("Failed to generate return invoice.");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete thisreturn?",
      icon: "warning",
      showCancelButton: true,
     confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        popup: "custom-compact"
      }
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/pcb-purchase-return/${id}`);
      toast.success("Return deleted successfully!");
      fetchReturns();
    } catch (err) {
      toast.error("Failed to delete return.");
    }
  };

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedReturns = [...returns]
    .filter((r) =>
      r.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      // r.batch_name?.toLowerCase().includes(search.toLowerCase()) ||
      // r.category_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
      r.invoice_date?.toLowerCase().includes(search.toLowerCase()) ||
      r.quantity?.toString().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const valueA = a[sortColumn] ?? "";
      const valueB = b[sortColumn] ?? "";
      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

  const paginatedReturns = sortedReturns.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const renderSortArrow = (column) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="px-4 " style={{ fontSize: "0.75rem" }}>
      <Breadcrumb title="Purchase Return" />

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
          <div className="col-md-6 text-md-end" style={{ fontSize: '0.8rem' }}>
            <div className="mt-2 d-inline-block mb-2" style={{ fontSize: '0.8rem' }}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={fetchReturns}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/pcb-purchase-return/add")}
                style={{
                  backgroundColor: '#2FA64F',
                  borderColor: '#2FA64F',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  minWidth: '90px',
                  height: '28px',
                }}
                className="btn-success text-white"
              >
                + Add Return
              </Button>
            </div>
            <Search
              search={search}
              setSearch={setSearch}
              perPage={perPage}
              setPerPage={setPerPage}
              setPage={setPage}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table  custom-table align-middle mb-0">
            <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
              <tr>
                <th
                  style={{ width: "70px", textAlign: "center", cursor: "pointer", backgroundColor: "#2E3A59", color: "white" }}
                  onClick={() => handleSort("id")}
                >
                  S.No{renderSortArrow("id")}
                </th>
                <th onClick={() => handleSort("vendor_name")} style={{
                  cursor: "pointer", backgroundColor: "#2E3A59",
                  color: "white"
                }}>
                  Vendor{renderSortArrow("vendor_name")}
                </th>
                {/* <th onClick={() => handleSort("batch_name")} style={{ cursor: "pointer", backgroundColor: "#2E3A59",
                    color: "white" }}>
                  Batch{renderSortArrow("batch_name")}
                </th> */}
                {/* <th onClick={() => handleSort("category_name")} style={{
                  cursor: "pointer", backgroundColor: "#2E3A59",
                  color: "white"
                }}>
                  Category{renderSortArrow("category_name")}
                </th> */}
                <th onClick={() => handleSort("invoice_no")} style={{
                  cursor: "pointer", backgroundColor: "#2E3A59",
                  color: "white"
                }}>
                  Invoice No{renderSortArrow("invoice_no")}
                </th>
                <th onClick={() => handleSort("invoice_date")} style={{
                  cursor: "pointer", backgroundColor: "#2E3A59",
                  color: "white"
                }}>
                  Invoice Date{renderSortArrow("invoice_date")}
                </th>
                <th onClick={() => handleSort("quantity")} style={{
                  cursor: "pointer", backgroundColor: "#2E3A59",
                  color: "white"
                }}>
                  Quantity{renderSortArrow("quantity")}
                </th>
                <th style={{ width: "130px", backgroundColor: "#2E3A59", color: "white" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedReturns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No returns"
                      style={{ width: "80px", height: "100px", opacity: 0.6 }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td>{item.vendor_name}</td>
                    {/* <td>{item.batch_name}</td> */}
                    {/* <td>{item.category_name}</td> */}
                    <td>{item.invoice_no}</td>
                    <td>{item.invoice_date}</td>
                    <td>{item.quantity}</td>
                    <td className="text-center" style={{ width: "130px" }}>
                      <div className="d-flex justify-content-center">
                        <ActionButtons
                          onPdf={() => handleGenerateReturnInvoice(item.id)}
                          onEdit={() => navigate(`/pcb-purchase-return/edit/${item.id}`)}
                          onDelete={() => handleDelete(item.id)}
                        />
                      </div>
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
          totalEntries={sortedReturns.length}
        />
      </Card>

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}
