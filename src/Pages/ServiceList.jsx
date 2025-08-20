import React, { useEffect, useState } from "react";
import { Button, Spinner, Card, Form, Modal, Row, Col, Alert } from "react-bootstrap";
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
import { useLocation } from "react-router-dom";

const RepairModal = ({ show, onHide, onRepair, spareParts, selectedVci }) => {
    const [challanNo, setChallanNo] = useState("");
    const [fromPlace, setFromPlace] = useState("");
    const [toPlace, setToPlace] = useState("");
    const [status, setStatus] = useState("pending");
    const [faultFoundDate, setFaultFoundDate] = useState("");
    const [repairDate, setRepairDate] = useState("");
    const [repairForms, setRepairForms] = useState([]);
    const [errors, setErrors] = useState({});
    const location = useLocation();
    const urgentItems = location.state?.urgentItems || [];

    useEffect(() => {
        if (urgentItems.length > 0) {
            console.log("Received urgent items:", urgentItems);
            // Pre-fill the form if needed
        }
    }, [urgentItems]);


    const placeOptions = [
        { value: "Mahle", label: "Mahle" },
        { value: "Tamilzourous", label: "Tamilzourous" },
        { value: "Valkontek", label: "Valkontek" },
    ];

useEffect(() => {
  if (show && Array.isArray(selectedVci)) {
    setRepairForms(
      selectedVci.map((vci) => ({
        vci_serial_no: vci.vci_serial_no,
        issue_found: "Yes",
        parts: [{ spareparts_id: "", quantity_used: 1 }],
      }))
    );
    setChallanNo("");
    setFromPlace("");
    setToPlace("");
    setFaultFoundDate("");
    setRepairDate("");
    setErrors({});
  }
}, [show, selectedVci]);

    // ✅ New useEffect for autofill logic
    useEffect(() => {
        if (fromPlace === "Mahle") {
            setToPlace("Tamilzourous");
        }
    }, [fromPlace]);

    const handlePartChange = (formIndex, partIndex, field, value) => {
        const newForms = [...repairForms];
        newForms[formIndex].parts[partIndex][field] = value;
        setRepairForms(newForms);
    };

    const handleAddPart = (formIndex) => {
        const newForms = [...repairForms];
        newForms[formIndex].parts.push({ spareparts_id: "", quantity_used: 1 });
        setRepairForms(newForms);
    };

    const handleRemovePart = (formIndex, partIndex) => {
        const newForms = [...repairForms];
        if (newForms[formIndex].parts.length > 1) {
            newForms[formIndex].parts.splice(partIndex, 1);
        }
        setRepairForms(newForms);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let newErrors = {};

        if (!fromPlace) {
            newErrors.fromPlace = "From Place is required";
        }
        if (!toPlace) {
            newErrors.toPlace = "To Place is required";
        }
        if (fromPlace && toPlace && fromPlace === toPlace) {
            newErrors.toPlace = "From Place and To Place cannot be the same";
        }
        if (!challanNo) {
            newErrors.challanNo = "Challan No is required";
        }

        repairForms.forEach((form, index) => {
            if (form.parts.some(p => !p.spareparts_id)) {
                newErrors[`items.${index}.parts`] = "Each repaired VCI must have at least one spare part selected.";
            }
        });

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstErrorKey = Object.keys(newErrors)[0];
            toast.error(newErrors[firstErrorKey]);
            return;
        }

        onRepair({
            challan_no: challanNo,
            from_place: fromPlace,
            to_place: toPlace,
            fault_found_date: faultFoundDate,
            repair_date: repairDate,
            status,
            created_by: 2,
            items: repairForms,
        });
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton style={{ backgroundColor: "#2E3A59", color: "white" }}>
                <Modal.Title>service VCI</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col>
                            <Form.Label>Challan No</Form.Label>
                            <Form.Control
                                value={challanNo}
                                onChange={e => setChallanNo(e.target.value)}
                                isInvalid={!!errors.challanNo}
                                required
                            />
                            <Form.Control.Feedback type="invalid">{errors.challanNo}</Form.Control.Feedback>
                        </Col>
                        <Col>
                            <Form.Label>From Place*</Form.Label>
                            <Form.Select
                                name="from_place"
                                value={fromPlace}
                                onChange={(e) => setFromPlace(e.target.value)}
                                isInvalid={!!errors.fromPlace}
                                required
                            >
                                <option value="">Select From Place</option>
                                {placeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.fromPlace}</Form.Control.Feedback>
                        </Col>
                        <Col>
                            <Form.Label>To Place*</Form.Label>
                            <Form.Select
                                name="to_place"
                                value={toPlace}
                                onChange={(e) => setToPlace(e.target.value)}
                                isInvalid={!!errors.toPlace}
                                required
                            >
                                <option value="">Select To Place</option>
                                {placeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.toPlace}</Form.Control.Feedback>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col>
                            <Form.Label>Fault Found Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={faultFoundDate}
                                onChange={(e) => setFaultFoundDate(e.target.value)}
                                required
                            />
                        </Col>
                        <Col>
                            <Form.Label>Repair Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={repairDate}
                                onChange={(e) => setRepairDate(e.target.value)}
                            />
                        </Col>
                    </Row>
                    {repairForms.map((form, idx) => (
                        <div key={idx} className="border p-3 mb-3 rounded">
                            <h6>VCI Serial: {form.vci_serial_no}</h6>
                            {form.parts.map((part, pIdx) => (
                                <Row key={pIdx} className="mb-2">
                                    <Col xs={6}>
                                        <Form.Select
                                            value={part.spareparts_id}
                                            onChange={(e) =>
                                                handlePartChange(idx, pIdx, "spareparts_id", e.target.value)
                                            }
                                        >
                                            <option value="">Select spare part</option>
                                            {spareParts.map((sp) => (
                                                <option key={sp.id} value={sp.id}>
                                                    {sp.name} ({sp.quantity} available)
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col xs={4}>
                                        <Form.Control
                                            type="number"
                                            value={part.quantity_used}
                                            min="1"
                                            onChange={(e) =>
                                                handlePartChange(idx, pIdx, "quantity_used", e.target.value)
                                            }
                                        />
                                    </Col>
                                    <Col xs={2}>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleRemovePart(idx, pIdx)}
                                            disabled={form.parts.length === 1}
                                        >
                                            -
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                            <Button variant="outline-primary" onClick={() => handleAddPart(idx)}>
                                Add Part
                            </Button>
                        </div>
                    ))}
                    <Button type="submit" variant="primary">
                        Save Repair Challan
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default function ServiceVciListPage() {
    const navigate = useNavigate();

    const [serviceData, setServiceData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState("");

    const [sortColumn, setSortColumn] = useState("id");
    const [sortDirection, setSortDirection] = useState("asc");

    const [showRepairModal, setShowRepairModal] = useState(false);
    const [spareParts, setSpareParts] = useState([]);
    const [selectedVci, setSelectedVci] = useState(null);

const fetchServices = () => {
  setLoading(true);
  axios
    .get(`${API_BASE_URL}/service-vci`)
    .then((res) => {
      const rows = (res.data.data || []).map((svc) => ({
        ...svc,
        serialNumbers: svc.service_vci_items?.map((it) => it.vci_serial_no) || [],
        urgent: svc.is_urgent?.toLowerCase() === "yes" ? "yes" : "no", // ✅ normalize
      }));
      setServiceData(rows);
    })
    .catch(() => toast.error("Failed to fetch service VCI list."))
    .finally(() => setLoading(false));
};
    const fetchSpareParts = () => {
        axios
            .get(`${API_BASE_URL}/spareparts`)
            .then((res) => {
                setSpareParts(res.data.data || []);
            })
            .catch(() => toast.error("Failed to fetch spare parts."));
    };

    const handleShowTrackingModal = (item) => {
        navigate(`/tracking-by-challan/${item.id}`);
    };

    const handleShowRepairModal = (item) => {
        const serviceVciId = item.id;
        axios
            .get(`${API_BASE_URL}/repairs/vci-issues/${serviceVciId}`)
            .then((res) => {
                const vciItemsWithIssues = res.data.data || [];
                if (vciItemsWithIssues.length === 0) {
                    toast.error("No VCI item found to repair for this service.");
                    return;
                }
                setSelectedVci(vciItemsWithIssues);
                fetchSpareParts();
                setShowRepairModal(true);
            })
            .catch(() => {
                toast.error("Failed to fetch VCI issues for this service.");
            });
    };

const handleUrgentChange = () => {
  const urgentItems = serviceData.filter(item => item.urgent === 'yes');

  if (urgentItems.length > 0) {
    navigate("/service-vci/add", { state: { urgentItems } });
  } else {
    toast.info("No urgent VCI items found.");
  }
};

const handleIndividualUrgentChange = async (itemId) => {
  try {
    const itemToUpdate = serviceData.find(item => item.id === itemId);
    if (!itemToUpdate) {
      toast.error("VCI item not found.");
      return;
    }
    const newUrgentStatus = itemToUpdate.urgent === 'yes' ? 'no' : 'yes';

await axios.put(`${API_BASE_URL}/urgentvci/${itemId}`, { is_urgent: newUrgentStatus });
    toast.success(`VCI status updated to '${newUrgentStatus}' successfully!`);
    fetchServices(); // Refresh the data
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to update urgent status.");
  }
};

    const handleRepair = (formData) => {
        axios
            .post(`${API_BASE_URL}/repairs`, {
                challan_no: formData.challan_no,
                from_place: formData.from_place,
                to_place: formData.to_place,
                fault_found_date: formData.fault_found_date,
                repair_date: formData.repair_date,
                status: formData.status || "pending",
                created_by: formData.created_by,
                items: formData.items.map((it) => ({
                    vci_serial_no: it.vci_serial_no,
                    issue_found: "Yes",
                    category_id: selectedVci.find(v => v.vci_serial_no === it.vci_serial_no)?.category_id,
                    parts: it.parts.map((p) => ({
                        spareparts_id: p.spareparts_id,
                        quantity_used: p.quantity_used,
                    })),
                })),
            })
            .then((res) => {
                toast.success(res.data.message || "Repair challan created successfully!");
                fetchServices();
            })
            .catch((err) => {
                const errorMessage = err.response?.data?.message || "Failed to create repair challan.";
                toast.error(errorMessage);
            });
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleEdit = (item) => {
        navigate(`/service-vci/${item.id}/edit`);
    };

    const handleDelete = (serviceId) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .delete(`${API_BASE_URL}/service-vci/${serviceId}`)
                    .then((res) => {
                        toast.success(res.data.message || "Record deleted successfully");
                        fetchServices();
                    })
                    .catch((err) => {
                        toast.error(err.response?.data?.message || "Failed to delete");
                    });
            }
        });
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const filteredData = serviceData
        .filter((item) => {
            const keyword = search.toLowerCase();
            return (
                item.challan_no?.toLowerCase().includes(keyword) ||
                String(item.quantity || "").includes(keyword) ||
                (item.status || "").toLowerCase().includes(keyword)
            );
        })
        .sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];
            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
            }
            return sortDirection === "asc"
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });

    const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

    const renderHeader = (label, columnKey) => (
        <th
            onClick={() => handleSort(columnKey)}
            style={{
                cursor: "pointer",
                userSelect: "none",
                backgroundColor: "#2E3A59",
                color: "white",
            }}
        >
            {label} {sortColumn === columnKey && (sortDirection === "asc" ? "▲" : "▼")}
        </th>
    );

    return (
        <div className="px-4 py-2">
            <Breadcrumb title="Service VCI List" />

            <Card className="border-0 shadow-sm rounded-3 p-3 mt-3 bg-white">
                <div className="row mb-3">
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

                    <div className="col-md-6 text-md-end">
                        <div className="mt-2 d-inline-block mb-2">
                            {/* ✅ ADDED THE URGENT CHANGE BUTTON HERE */}
                            {/* <Button
                                size="sm"
                                onClick={handleUrgentChange}
                                style={{
                                    backgroundColor: "#FF5733",
                                    borderColor: "#FF5733",
                                    color: "#fff",
                                }}
                                className="me-2"
                            >
                                Urgent VCI Change
                            </Button> */}

                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-1"
                                onClick={fetchServices}
                            >
                                <span style={{ fontSize: "0.9rem", verticalAlign: "middle" }}>↻</span>
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => navigate("/service-vci/add")}
                                style={{
                                    backgroundColor: "#2FA64F",
                                    borderColor: "#2FA64F",
                                    color: "#fff",
                                }}
                            >
                                <span className="me-1" style={{ fontSize: "1.2rem", verticalAlign: "middle" }}>
                                </span>{" "}
                                + Add Service VCI
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
                    <table className="table align-middle mb-0">
                        <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
                            <tr>
                                <th
                                    style={{
                                        width: "60px",
                                        textAlign: "center",
                                        backgroundColor: "#2E3A59",
                                        color: "white",
                                    }}
                                >
                                    S.No
                                </th>
                                {renderHeader("Challan No", "challan_no")}
                                {renderHeader("Challan Date", "challan_date")}
                                {renderHeader("Quantity", "quantity")}
                                {renderHeader("Status", "status")}
                                    {renderHeader("Urgent", "urgent")}

                                <th
                                    style={{
                                        width: "140px",
                                        backgroundColor: "#2E3A59",
                                        color: "white",
                                    }}
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">
                                        <Spinner animation="border" />
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4 text-muted">
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
                                        <td className="text-center">{(page - 1) * perPage + index + 1}</td>
                                        <td>{item.challan_no}</td>
                                        <td>{item.challan_date}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.status}</td>
<td style={{ color: item.urgent === 'yes' ? 'red' : 'inherit', fontWeight: item.urgent === 'yes' ? 'bold' : 'normal' }}>
  {item.urgent}
</td>
                                        <td className="text-center" style={{ width: "130px" }}>
                                            <ActionButtons
                                                onTrack={() => handleShowTrackingModal(item)}
                                                trackDisabled={!item.service_vci_items?.length}
                                                onRepair={() => handleShowRepairModal(item)}
                                                onEdit={() => handleEdit(item)}
                                                onDelete={() => handleDelete(item.id)}
                                                onUrgent={() => handleIndividualUrgentChange(item.id)}
                                                urgentStatus={item.urgent}
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
                    totalEntries={filteredData.length}
                />
            </Card>
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} />
            <RepairModal
                show={showRepairModal}
                onHide={() => setShowRepairModal(false)}
                onRepair={handleRepair}
                spareParts={spareParts}
                selectedVci={selectedVci}
            />
        </div>
    );
}