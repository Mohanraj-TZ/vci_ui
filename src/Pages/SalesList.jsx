import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form, Modal, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ActionButtons from "./Components/ActionButtons";
import { API_BASE_URL } from "../api";
import Breadcrumb from "./Components/Breadcrumb";
import Search from "./Components/Search";
import Pagination from "./Components/Pagination";
import { useSearchParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

const MySwal = withReactContent(Swal);

export default function SalesListPage() {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const location = useLocation();
  // const queryParams = new URLSearchParams(location.search);
  // const invoice = queryParams.get("invoice"); // get invoice number
  // Warranty modal state
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [warrantyData, setWarrantyData] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/sales`);
      if (res.data.success) {
        setSalesData(res.data.data);
      }
    } catch {
      toast.error("Failed to fetch sales data.");
    } finally {
      setLoading(false);
    }
  };


  
  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this sale?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        popup: "custom-compact",
      },
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/sales/${id}/del`);
      toast.success("Sale deleted successfully!");

      const newData = salesData.filter((item) => item.id !== id);
      setSalesData(newData);
      if ((page - 1) * perPage >= newData.length && page > 1) {
        setPage(page - 1);
      }
    } catch {
      toast.error("Failed to delete sale.");
    }
  };

  const handleSort = (field) => {
    const direction =
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  // Fetch warranty data and show modal
  const handleWarranty = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/sales/${id}/warranty`);
      if (res.data.success) {
        setSelectedSale(res.data.sale);
        setWarrantyData(res.data.warranty);
        setShowWarrantyModal(true);
      } else {
        toast.error("No warranty details found.");
      }
    } catch {
      toast.error("Failed to fetch warranty details.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = salesData.filter((item) => {
    const values = Object.values(item).join(" ").toLowerCase();
    return values.includes(search.toLowerCase());
  });

    const handleReturn = (invoice_no) => {
  navigate(`/returns/add?invoice=${encodeURIComponent(invoice_no)}`);
};


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
      <Breadcrumb title="Sales List" />

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
          <div className="col-md-6 text-md-end" style={{ fontSize: "0.8rem" }}>
            <div
              className="mt-2 d-inline-block mb-2"
              style={{ fontSize: "0.8rem" }}
            >
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={fetchSales}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/sales/add")}
                style={{
                  backgroundColor: "#2FA64F",
                  borderColor: "#2FA64F",
                  color: "#fff",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem",
                  minWidth: "90px",
                  height: "28px",
                }}
              >
                + Add New
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
          <table className="table custom-table align-middle mb-0">
            <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
              <tr>
                <th
                  style={{
                    width: "70px",
                    textAlign: "center",
                    backgroundColor: "#2E3A59",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  S.No
                </th>
                {[
                  { label: "Customer", field: "customer_name" },
                  { label: "Invoice No", field: "invoice_no" },
                  { label: "Shipment", field: "shipment_date" },
                  { label: "Delivery", field: "delivery_date" },
                  { label: "Category", field: "category_name" },
                  { label: "Qty", field: "quantity" },
                ].map(({ label, field }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#2E3A59",
                      color: "white",
                    }}
                  >
                    {label}{" "}
                    {sortField === field &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                ))}
                <th
                  style={{
                    cursor: "pointer",
                    backgroundColor: "#2E3A59",
                    color: "white",
                    paddingLeft: "30px",
                  }}
                >
                  Action
                </th>
                <th
                  style={{
                    cursor: "pointer",
                    backgroundColor: "#2E3A59",
                    color: "white",
                    paddingLeft: "30px",
                  }}
                >
                  Delivery Challan
                </th>
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
                    <td>{item.customer_name}</td>
                    <td>{item.invoice_no}</td>
                    <td>{item.shipment_date}</td>
                    <td>{item.delivery_date}</td>
                    <td>{item.category_name}</td>
                    <td>{item.quantity}</td>
                    <td className="text-center" style={{ width: "130px" }}>
                      <div className="d-flex justify-content-center">
                        <ActionButtons
                          onPdf={() =>
                            window.open(
                              `${API_BASE_URL}/sales/${item.id}/invoices`,
                              "_blank"
                            )
                          }
                          onEdit={() => navigate(`/sales/edit/${item.id}`)}
                          onDelete={() => handleDelete(item.id)}
                          onWarranty={() => handleWarranty(item.id)}
                              onReturn={() => handleReturn(item.invoice_no)}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <Button
                        variant=""
                        size="sm"
                        onClick={() =>
                          window.open(
                            `${API_BASE_URL}/delivery-challan/${item.id}/pdf`,
                            "_blank"
                          )
                        }
                        style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                      >
                        <i className="bi bi-file-earmark-pdf"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="">
          <Pagination
            page={page}
            setPage={setPage}
            perPage={perPage}
            totalEntries={sortedData.length}
          />
        </div>
      </Card>

      {/* Warranty Modal */}
      <Modal
        show={showWarrantyModal}
        onHide={() => setShowWarrantyModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Warranty Details - Invoice #{selectedSale?.invoice_no}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSale && (
            <>
              <p>
                <strong>Customer:</strong> {selectedSale.customer?.name}
              </p>
              <p>
                <strong>Shipment:</strong> {selectedSale.shipment_date}
              </p>
              <p>
                <strong>Delivery:</strong> {selectedSale.delivery_date}
              </p>

              <Table bordered hover size="sm" className="mt-3">
                <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
                  <tr>
                    <th>#</th>
                    <th>Serial No</th>
                    <th>Product</th>
                    <th>Warranty Start</th>
                    <th>Warranty End</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {warrantyData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No warranty records found
                      </td>
                    </tr>
                  ) : (
                    warrantyData.map((w, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{w.serial_no}</td>
                        <td>{w.product_name}</td>
                        <td>{w.start_date}</td>
                        <td>{w.end_date}</td>
                        <td>
                          {w.active ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-danger">Expired</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
