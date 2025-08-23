import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form } from "react-bootstrap";
import { useNavigate,useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const { id } = useParams();
const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [sparepartName, setSparepartName] = useState("");
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/damaged-items`);
      if (res.data.success) setData(res.data.data);
    } catch {
      toast.error("Failed to fetch damaged items data.");
    } finally {
      setLoading(false);
    }
  };
const handleDownloadPdf = async () => {
    try {
      toast.info("Preparing PDF for download...");

      const url = `${API_BASE_URL}/sparepartdamage/pdf`;

      const response = await axios.get(url, {
        responseType: 'blob',
        timeout: 30000,
      });

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.toLowerCase().includes('pdf')) {
        const errorText = await new Response(response.data).text();b
        if (errorText.includes("No purchases found")) {
          toast.error("No purchases found for the selected filters.");
        } else {
          console.error("Server response is not a PDF:", errorText);
          toast.error("Failed to download PDF report. Server returned an error.");
        }
        return;
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'purchase_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      if (axios.isCancel(error)) {
        toast.warn("PDF download request was canceled.");
      } else if (error.response) {
        if (error.response.data && error.response.data.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error(`Server error: ${error.response.status}. Failed to download PDF.`);
        }
      } else if (error.request) {
        toast.error("Network error: Failed to connect to the server.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const params = new URLSearchParams({
        search: search,
        page: page,
        perPage: perPage,
        sortField: sortField,
        sortDirection: sortDirection,
        from_date: fromDate,
        to_date: toDate,
        invoice_number: invoiceNumber,
        sparepart_name: sparepartName,
      });

      const response = await axios.get(
        `${API_BASE_URL}/damageditems/excel?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "damaged_items.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Excel report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel report.");
    }
  };


  const handleDelete = async (id) => {
  const result = await MySwal.fire({
    title: "Are you sure?",
    text: "Do you really want to delete this item?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#2FA64F",
    confirmButtonText: "Yes, delete it!",
    customClass: { popup: "custom-compact" }
  });
  if (!result.isConfirmed) return;

  try {

    await axios.delete(`${API_BASE_URL}/damaged-delItems/${id}`);

    toast.success("Item deleted successfully!");
    const newData = data.filter((item) => item.id !== id);
    setData(newData);

    if ((page - 1) * perPage >= newData.length && page > 1) setPage(page - 1);
  } catch {
    toast.error("Failed to delete item.");
  }
};


  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const filteredData = data.filter((item) =>
    Object.values(item).join(" ").toLowerCase().includes(search.toLowerCase())
  );
const getFilterParams = () => {
    const params = new URLSearchParams({
      search: search,
      page: page,
      perPage: perPage,
      sortField: sortField,
      sortDirection: sortDirection,
    });
    return params;
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
      <Breadcrumb title="Spareparts Damaged Items List" />

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
<div className="col-md-6 text-md-end" style={{ fontSize: '0.8rem' }}>
    <div className="d-flex align-items-center justify-content-end mb-2">
        <div className="me-2">
            <Button
                variant="outline-secondary"
                size="sm"
                onClick={fetchData}
            >
                <i className="bi bi-arrow-clockwise"></i>
            </Button>
            <Button
                size="sm"
                onClick={() => navigate("/damaged/add")}
                className="ms-2"
                style={{
                    backgroundColor: '#2FA64F',
                    borderColor: '#2FA64F',
                    color: '#fff',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem',
                    minWidth: '90px',
                    height: '28px',
                }}
            >
                + Add New
            </Button>
            <Button
                size="sm"
                onClick={handleDownloadPdf}
                className="ms-2"
                style={{
                    backgroundColor: '#dc3545',
                    borderColor: '#dc3545',
                    color: '#fff',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem',
                    minWidth: '90px',
                    height: '28px',
                }}
            >
                <i className="bi bi-file-earmark-pdf"></i> Download PDF
            </Button>
            <Button
                variant="success"
                size="sm"
                onClick={handleDownloadExcel}
                style={{ color: "white" }}
                className="ms-2"
            >
                <i className="bi bi-file-earmark-excel"></i> Excel
            </Button>
        </div>
        <Search search={search} setSearch={setSearch} perPage={perPage} setPerPage={setPerPage} setPage={setPage} />
    </div>
</div>
        </div>

        <div className="table-responsive">
          <table className="table custom-table align-middle mb-0">
            <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
              <tr>
                <th style={{ width: "70px", textAlign: "center", cursor: "pointer" }}>S.No</th>
                {[
                  // { label: "Purchase Item ID", field: "sparepart_purchase_item_id" },
                  { label: "Sparepart Name", field: "sparepart_name" },
                    //  { label: "Invoice No", field: "invoice_no" },

                  { label: "Quantity", field: "quantity" },
              
                  // { label: "Status", field: "status" },
               
                  // { label: "Sent Date", field: "sent_date" },
                  // { label: "Received Date", field: "received_date" },
                  // { label: "Warranty Start", field: "warranty_start_date" },
                  // { label: "Warranty End", field: "warranty_end_date" },
                  // { label: "Warranty Status", field: "warranty_status" },
                  { label: "Transportation", field: "transportation" },
                ].map(({ label, field }) => (
                  <th key={field} onClick={() => handleSort(field)} style={{ cursor: "pointer" }}>
                    {label} {sortField === field && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                ))}
                <th style={{ cursor: "pointer", paddingLeft: '30px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-4"><Spinner animation="border" /></td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-muted">
                    <img src="/empty-box.png" alt="No data" style={{ width: "80px", height: "100px", opacity: 0.6 }} />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                    <td>{item.sparepart_name}</td>
                     {/* <td>{item.invoice_no}</td> */}
                    <td>{item.quantity}</td>
                   
                    {/* <td>{item.status}</td>
               
                    <td>{item.sent_date}</td>
                    <td>{item.received_date}</td> */}
                    {/* <td>{item.warranty_start_date}</td>
                    <td>{item.warranty_end_date}</td>
                    <td>{item.warranty_status}</td> */}
                    <td>{item.transportation}</td>
                    <td className="text-center" style={{ width: "130px" }}>
                      <div className="d-flex justify-content-center">
                        <ActionButtons
                          onEdit={() => navigate(`/spareparts-damaged-items/${item.id}/edit`)}
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

        <Pagination page={page} setPage={setPage} perPage={perPage} totalEntries={sortedData.length} />
      </Card>
    </div>
  );
}
