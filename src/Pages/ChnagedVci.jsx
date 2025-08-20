import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Card, Form, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { API_BASE_URL } from "../api";
import Breadcrumb from "./Components/Breadcrumb";
import Pagination from "./Components/Pagination";
import Search from "./Components/Search";

// Add CSS styles within the same file using a style block
const styles = `
    .table-header-changed-vci {
        background-color: #2E3A59;
        color: white;
        font-size: 0.82rem;
        height: 40px;
        vertical-align: middle;
    }
`;

export default function ChangedVciPage() {
    const [changedVcis, setChangedVcis] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");

    const navigate = useNavigate();
    const MySwal = withReactContent(Swal);
    const authToken = localStorage.getItem("authToken");

    useEffect(() => {
        if (!authToken) {
            navigate("/login");
            toast.error("Please log in to access this page.");
        } else {
            axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
            fetchChangedVcis();
        }
    }, [authToken, navigate]);

    // Inject styles into the document head
    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    const fetchChangedVcis = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/urgent-services`);
            const groupedData = {};

            if (Array.isArray(res.data.data)) {
                res.data.data.forEach((item) => {
                    const groupKey = `${item.created_at}-${item.created_by || "unknown"}`;
                    if (!groupedData[groupKey]) {
                        groupedData[groupKey] = {
                            id: groupKey,
                            created_by: item.created_by,
                            created_at: item.created_at,
                            status: item.status,
                            remarks: item.remarks,
                            from_place: item.from_place,
                            to_place: item.to_place,
                            challan_no: item.challan_no || "—",
                            challan_date: item.challan_date || "—",
                            courier_name: item.courier_name || "—",
                            description: item.description || "—",
                            quantity: 1,
                            items: [
                                {
                                    id: item.id,
                                    original_serial_no: item.original_serial_no,
                                    pcb_serial_no: item.pcb_serial_no,
                                    is_urgent: item.is_urgent === 'Yes', // Correctly check for urgency
                                },
                            ],
                        };
                    } else {
                        groupedData[groupKey].items.push({
                            id: item.id,
                            original_serial_no: item.original_serial_no,
                            pcb_serial_no: item.pcb_serial_no,
                            is_urgent: item.is_urgent === 'Yes', // Correctly check for urgency
                        });
                        groupedData[groupKey].quantity += 1;
                    }
                });
            }
            setChangedVcis(Object.values(groupedData));
            toast.success("Changed VCI details fetched successfully!");
        } catch (err) {
            toast.error("Failed to fetch Changed VCI details.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (itemId) => {
        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "Do you really want to delete this VCI entry?",
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
            await axios.delete(`${API_BASE_URL}/urgent-services/${itemId}`);
            toast.success("VCI entry deleted successfully!");
            fetchChangedVcis();
        } catch {
            toast.error("Failed to delete VCI entry.");
        }
    };

    const handleShowModal = (data) => {
        setModalData(data);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalData(null);
    };

    const handleSort = (field) => {
        const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortDirection(direction);
    };

    const filteredVcis = changedVcis.filter(
        (vci) =>
            (vci.challan_no && vci.challan_no.toLowerCase().includes(search.toLowerCase())) ||
            (vci.courier_name && vci.courier_name.toLowerCase().includes(search.toLowerCase())) ||
            (vci.challan_date && vci.challan_date.toLowerCase().includes(search.toLowerCase())) ||
            (vci.description && vci.description.toLowerCase().includes(search.toLowerCase())) ||
            (vci.status && vci.status.toLowerCase().includes(search.toLowerCase())) ||
            (vci.from_place && vci.from_place.toLowerCase().includes(search.toLowerCase())) ||
            (vci.to_place && vci.to_place.toLowerCase().includes(search.toLowerCase())) ||
            (vci.remarks && vci.remarks.toLowerCase().includes(search.toLowerCase())) ||
            (vci.items &&
                vci.items.some(
                    (item) =>
                        (item.original_serial_no && item.original_serial_no.toLowerCase().includes(search.toLowerCase())) ||
                        (item.pcb_serial_no && item.pcb_serial_no.toLowerCase().includes(search.toLowerCase()))
                ))
    );

    const sortedVcis = [...filteredVcis].sort((a, b) => {
        if (!sortField) return 0;
        const valA = a[sortField]?.toLowerCase?.() || "";
        const valB = b[sortField]?.toLowerCase?.() || "";
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    const paginatedVcis = sortedVcis.slice((page - 1) * perPage, page * perPage);

    return (
        <div className="px-4" style={{ fontSize: "0.75rem" }}>
            <Breadcrumb title="Changed VCI Details" />
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
                        <div className="mt-2 d-inline-block mb-2" style={{ fontSize: "0.8rem" }}>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-2"
                                onClick={fetchChangedVcis}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
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
                    <table
                        className="table table-sm align-middle mb-0 custom-table"
                        style={{ fontSize: "0.75rem" }}
                    >
                        <thead className="table-header-changed-vci">
                            <tr>
                                <th
                                    style={{
                                        width: "50px",
                                        textAlign: "center",
                                        whiteSpace: "nowrap",
                                        cursor: "default",
                                    }}
                                >
                                    S.No
                                </th>
                                <th onClick={() => handleSort("challan_no")} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                                    Challan No {sortField === "challan_no" && (sortDirection === "asc" ? "▲" : "▼")}
                                </th>
                                <th onClick={() => handleSort("challan_date")} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                                    Challan Date {sortField === "challan_date" && (sortDirection === "asc" ? "▲" : "▼")}
                                </th>
                                <th onClick={() => handleSort("courier_name")} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                                    Courier Name {sortField === "courier_name" && (sortDirection === "asc" ? "▲" : "▼")}
                                </th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th onClick={() => handleSort("status")} style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                                    Status {sortField === "status" && (sortDirection === "asc" ? "▲" : "▼")}
                                </th>
                                <th>From</th>
                                <th>To</th>
                                <th>Remarks</th>
                                <th>Serial Numbers</th>
                                <th style={{ textAlign: "center", width: "110px", whiteSpace: "nowrap" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="12" className="text-center py-4">
                                        <Spinner animation="border" />
                                    </td>
                                </tr>
                            ) : paginatedVcis.length === 0 ? (
                                <tr>
                                    <td colSpan="12" className="text-center py-4 text-muted">
                                        <img
                                            src="/empty-box.png"
                                            alt="No records found"
                                            style={{ width: "70px", height: "90px", opacity: 0.6 }}
                                        />
                                        <p className="mt-2">No records found.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedVcis.map((vci, index) => (
                                    <tr key={vci.id}>
                                        <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                                        <td>{vci.challan_no}</td>
                                        <td>{vci.challan_date}</td>
                                        <td>{vci.courier_name}</td>
                                        <td>{vci.description}</td>
                                        <td>{vci.quantity}</td>
                                        <td>{vci.status}</td>
                                        <td>{vci.from_place}</td>
                                        <td>{vci.to_place}</td>
                                        <td>{vci.remarks}</td>
                                        <td>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => handleShowModal(vci.items)}
                                                className="p-0"
                                            >
                                                <i className="bi bi-list-ul"></i> View
                                            </Button>
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant=""
                                                size="sm"
                                                onClick={() => handleEdit(vci)}
                                                className="me-1"
                                                style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </Button>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleDelete(vci.items[0].id)}
                                                style={{
                                                    borderColor: "#2E3A59",
                                                    color: "#2E3A59",
                                                    backgroundColor: "transparent",
                                                }}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
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
                    totalEntries={filteredVcis.length}
                />
            </Card>

            {/* Modal for displaying serial numbers */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Serial Numbers</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalData && modalData.length > 0 ? (
                        <ul className="list-unstyled">
                            {modalData.map((item, i) => (
                                <li key={i} className="mb-2">
                                    <span className="fw-semibold text-danger">
                                        VCI: {item.original_serial_no || "—"}
                                    </span>{" "}
                                    <i className="bi bi-arrow-right"></i>{" "}
                                    <span className="fw-semibold text-success">
                                        PCB: {item.pcb_serial_no || "—"}
                                    </span>
                                    {item.is_urgent && (
                                        <span className="text-danger fw-semibold ms-2">(Urgent)</span>
                                    )}
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        className="ms-2"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No serial numbers to display.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
