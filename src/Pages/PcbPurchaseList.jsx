import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../api";
import Breadcrumb from "./Components/Breadcrumb";
import Pagination from "./Components/Pagination";
import Search from "./Components/Search";
import ActionButtons from "./Components/ActionButtons";

export default function PurchaseListPage() {
  const navigate = useNavigate();
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // Warranty modal state
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [warrantyData, setWarrantyData] = useState(null);

  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
const [invoiceNo, setInvoiceNo] = useState("");

  // const fetchPurchases = () => {
  //   setLoading(true);
  //   axios
  //     .get(`${API_BASE_URL}/purchase`)
  //     .then((res) => setPurchaseData(Array.isArray(res.data) ? res.data : []))
  //     .catch(() => toast.error("Failed to fetch purchase list."))
  //     .finally(() => setLoading(false));
  // };

  const fetchPurchases = () => {
  setLoading(true);
  axios
    .get(`${API_BASE_URL}/purchase`, {
      params: { from_date: fromDate, to_date: toDate, invoice_no: invoiceNo }
        // params: { from_date: fromDate, to_date: toDate }
    })
    .then((res) => setPurchaseData(Array.isArray(res.data) ? res.data : []))
    .catch(() => toast.error("Failed to fetch filtered purchases"))
    .finally(() => setLoading(false));
};

  useEffect(() => { fetchPurchases(); }, []);

  const handleWarrantyDetails = async (purchaseId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/pcb-warranty/${purchaseId}`);
      setWarrantyData(res.data);
      setShowWarrantyModal(true);
    } catch {
      toast.error("Failed to fetch warranty details");
    }
  };

  const handleEdit = (item) => navigate(`/purchase/${item.id}/edit`);
  const handleReturn = (invoice_no) =>
    navigate(`/pcb-purchase-return/add?invoice=${encodeURIComponent(invoice_no)}`);


  const handleDownloadPdf = () => {
  const url = `${API_BASE_URL}/pcb-purchase-report/pdf?from_date=${fromDate}&to_date=${toDate}&invoice_no=${invoiceNo}`;
  window.open(url, "_blank"); // Opens PDF in new tab
};

const handleDownloadExcel = async () => {
  try {
    const url = `${API_BASE_URL}/pcb-purchase-report/csv`;
    const params = { from_date: fromDate, to_date: toDate, invoice_no: invoiceNo };
    const { data } = await axios.get(url, { params, responseType: 'blob' });

    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fname = `pcb_purchase_report_${fromDate || 'all'}_${toDate || 'all'}.csv`;

    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fname);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e) {
    toast.error('Failed to download CSV');
  }
};



  const handleDelete = (purchaseId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this Purchase Order",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
      customClass: { popup: "custom-compact" },
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${API_BASE_URL}/purchase/${purchaseId}`)
          .then((res) => { toast.success(res.data.message || "Purchase deleted successfully"); fetchPurchases(); })
          .catch(() => toast.error("Failed to delete purchase"));
      }
    });
  };

  const handleGenerateInvoice = (purchaseId) => {
    const pdfWindow = window.open(`${API_BASE_URL}/pcb-purchase-invoice/${purchaseId}`, "_blank");
    pdfWindow ? toast.success("Invoice generated successfully!") : toast.error("Failed to generate invoice.");
  };

  const handleSort = (column) => {
    if (sortColumn === column) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else { setSortColumn(column); setSortDirection("asc"); }
  };

  const filteredData = purchaseData
    .filter((item) => {
      const keyword = search.toLowerCase();
      return (
        item.vendor?.toLowerCase().includes(keyword) ||
        item.invoice_no?.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword) ||
        String(item.quantity).toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      return typeof aValue === "number"
        ? (sortDirection === "asc" ? aValue - bValue : bValue - aValue)
        : sortDirection === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
    });

  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const renderHeader = (label, columnKey) => (
    <th onClick={() => handleSort(columnKey)}
        style={{ cursor: "pointer", userSelect: "none", backgroundColor: "#2E3A59", color: "white" }}>
      {label} {sortColumn === columnKey && (sortDirection === "asc" ? "▲" : "▼")}
    </th>
  );

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <Breadcrumb title="Purchase Order" />

      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2">
          <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
            <Form.Select
              size="sm"
              style={{ width: "100px" }}
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            >
              {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </Form.Select>
          </div>
          <div className="col-md-6 text-md-end">
            <Button variant="outline-secondary" size="sm" className="me-2" onClick={fetchPurchases}>
              <i className="bi bi-arrow-clockwise"></i>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/purchase/add")}
              style={{ backgroundColor: '#2FA64F', borderColor: '#2FA64F', color: '#fff', padding: '0.25rem 0.5rem', fontSize: '0.8rem', minWidth: '90px', height: '28px' }}
            >
              <i className="bi bi-plus-lg me-1"></i> Add Purchase
            </Button>
            <Search search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} setPage={setPage} />
          </div>
        </div>


        <div className="row mb-3">
  <div className="col-md-2">
    <Form.Label>From Date</Form.Label>
    <Form.Control
      type="date"
      size="sm"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
    />
  </div>
  <div className="col-md-2">
    <Form.Label>To Date</Form.Label>
    <Form.Control
      type="date"
      size="sm"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
    />
  </div>
  {/* <div className="col-md-2">
    <Form.Label>Invoice No</Form.Label>
    <Form.Control
      type="text"
      size="sm"
      placeholder="Enter Invoice No"
      value={invoiceNo}
      onChange={(e) => setInvoiceNo(e.target.value)}
    />
  </div> */}
  <div className="col-md-8 d-flex align-items-end">
    <Button
      size="sm"
      variant="secondary"
      className="me-2"
      onClick={fetchPurchases}
    >
      Apply Filter
    </Button>
    <Button
      size="sm"
      variant="success"
          className="me-2"
      onClick={handleDownloadPdf}
    >
      Download PDF
    </Button>
        <Button
    size="sm"
    variant="success"
    onClick={handleDownloadExcel}
  >
    Download Excel
  </Button>
  
  </div>
</div>


        <div className="table-responsive">
          <table className="table table-sm custom-table align-middle mb-0">
            <thead style={{ backgroundColor: "#2E3A59", color: "white", fontSize: "0.82rem", height: "40px", verticalAlign: "middle" }}>
              <tr>
                <th style={{ width: "60px", textAlign: "center", backgroundColor: "#2E3A59",
                    color: "white", }}>S.No</th>
                {renderHeader("Vendor", "vendor")}
                {renderHeader("Invoice No", "invoice_no")}
                {renderHeader("Invoice Date", "invoice_date")}
                {renderHeader("Category", "category")}
                {renderHeader("Quantity", "quantity")}
                {renderHeader("Status", "status")}
                {renderHeader("Warranty Status", "warranty_status")}
                {renderHeader("Expired Service Cost", "expired_service_cost")}
                <th style={{ width: "140px",backgroundColor: "#2E3A59",
                    color: "white", }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center py-4"><Spinner animation="border" /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-4 text-muted">
                  <img src="/empty-box.png" alt="No data" style={{ width: "80px", height: "100px", opacity: 0.6 }} />
                </td></tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                    <td>{item.vendor}</td>
                    <td>{item.invoice_no}</td>
                    <td>{item.invoice_date}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity}</td>
                    <td>{item.status}</td>
                    <td>{item.warranty_status}</td>
                    <td>{item.expired_service_cost}</td>
                    <td className="text-center" style={{ width: "130px" }}>
                      <ActionButtons
                        onPdf={() => handleGenerateInvoice(item.id)}
                        onEdit={() => handleEdit(item)}
                        onDelete={() => handleDelete(item.id)}
                        onReturn={() => handleReturn(item.invoice_no)}
                        onWarranty={() => handleWarrantyDetails(item.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} setPage={setPage} perPage={perPage} totalEntries={filteredData.length} />
      </Card>

      {/* Warranty Modal */}
      {showWarrantyModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Warranty Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowWarrantyModal(false)}></button>
              </div>
              <div className="modal-body">
                {warrantyData?.items?.length ? (
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>From Serial</th>
                        <th>To Serial</th>
                        <th>Warranty Start</th>
                        <th>Warranty End</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warrantyData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.category}</td>
                          <td>{item.from_serial}</td>
                          <td>{item.to_serial}</td>
                          <td>{item.warranty_start_date}</td>
                          <td>{item.warranty_end_date}</td>
                          <td>{item.warranty_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div>No warranty data found.</div>}
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowWarrantyModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} />
    </div>
  );
}
