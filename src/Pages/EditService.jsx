    import React, { useState, useEffect } from "react";
    import { Form, Button, Table, Row, Col, Alert } from "react-bootstrap";
    import axios from "axios";
    import { useParams, useNavigate } from "react-router-dom";

    const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error("Failed to parse date string:", dateString, error);
        return "";
    }
    };

    export default function EditService() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        challan_no: "",
        challan_date: "",
        courier_name: "",
        description: "",
        quantity: "",
        remarks: "",
        status: "",
        sent_date: "",
        received_date: "",
        from_place: "",
        to_place: "",
        // created_by: 5,
    });

    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [statusOptions] = useState([
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
    ]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Function to show a temporary message toast
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    };

useEffect(() => {
    const fetchData = async () => {
        try {
            // 1. Fetch categories
            const catRes = await axios.get("http://127.0.0.1:8000/api/categories");
const fetchedCategories = catRes.data.map(c => ({
    value: c.id,
    label: c.category  // <-- actual field name from API
}));
            setCategories(fetchedCategories);

            // 2. Fetch service data
            const serviceRes = await axios.get(`http://127.0.0.1:8000/api/service-vci/${id}`);
            const serviceData = serviceRes.data.data;

            // 3. Map category_id -> category_name
const formattedItems = (serviceData.items || []).map(item => ({
    ...item,
    category_name: fetchedCategories.find(c => c.value === item.category_id)?.label || "",
    tested_date: formatDateForInput(item.tested_date),
}));
            setItems(formattedItems);

            // 4. Set form data
            setFormData({
                challan_no: serviceData.challan_no || "",
                challan_date: formatDateForInput(serviceData.challan_date),
                courier_name: serviceData.courier_name || "",
                description: serviceData.description || "",
                quantity: serviceData.quantity || "",
                remarks: serviceData.remarks || "",
                status: serviceData.status || "",
                sent_date: formatDateForInput(serviceData.sent_date),
                received_date: formatDateForInput(serviceData.received_date),
                from_place: serviceData.from_place || "",
                to_place: serviceData.to_place || "",
                // created_by: serviceData.created_by 
            });

        } catch (err) {
            console.error(err);
            showMessage("danger", "Failed to load service data");
        } finally {
            setLoading(false);
        }
    };

    fetchData();
}, [id]);


    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;
        setItems(updatedItems);
    };

    const handleItemSelectChange = (index, value) => {
        const updatedItems = [...items];
        updatedItems[index]['category_id'] = value;
        setItems(updatedItems);
    };

    const addItemRow = () => {
        setItems([
        ...items,
        {
            category_id: "",
            vci_serial_no: "",
            hsn_code: "",
            tested_date: "",
            issue_found: "",
            action_taken: "",
            remarks: "",
            testing_assigned_to: "",
            testing_status: "",
            // created_by: 5,
        },
        ]);
    };

    const removeItemRow = (index) => {
        const updatedItems = [...items];
        updatedItems.splice(index, 1);
        setItems(updatedItems);
    };

const handleSubmit = async (e) => {
    e.preventDefault();

    // Strip category_name before sending
    const cleanItems = items.map(({ category_name, ...rest }) => rest);

    const payload = { ...formData, items: cleanItems };

    try {
        await axios.put(`http://127.0.0.1:8000/api/service-vci/${id}`, payload);
        showMessage("success", "Service updated successfully");
        setTimeout(() => navigate("/serviceProduct"), 1000);
    } catch (err) {
        console.error("Failed to update service:", err.response?.data || err);
        showMessage("danger", "Failed to update service");
    }
};



    if (loading) {
        return (
        <div className="container-fluid bg-white p-3 text-center">
            <h5 className="fw-semibold mb-3">Loading Service Data...</h5>
            <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
            </div>
        </div>
        );
    }

    return (
       <div className="container-fluid bg-white p-3">
    {message.text && (
        <Alert variant={message.type} className="mb-3">
            {message.text}
        </Alert>
    )}

    <div className="d-flex align-items-center mb-3">
        <h5 className="fw-semibold m-0">Edit Service</h5>
        <Button
            variant="outline-black"
            className="ms-auto"
            onClick={() => navigate(-1)}
        >
            ← Back
        </Button>
    </div>


        <Form onSubmit={handleSubmit}>
            {/* Main Fields */}
            <Row className="mb-3 pt-3">
            <Col md={4}>
                <Form.Label>Challan No</Form.Label>
                <Form.Control
                name="challan_no"
                value={formData.challan_no}
                onChange={handleChange}
                />
            </Col>
            <Col md={4}>
                <Form.Label>Challan Date</Form.Label>
                <Form.Control
                type="date"
                name="challan_date"
                value={formData.challan_date}
                onChange={handleChange}
                />
            </Col>
            <Col md={4}>
                <Form.Label>Courier Name</Form.Label>
                <Form.Control
                name="courier_name"
                value={formData.courier_name}
                onChange={handleChange}
                />
            </Col>
            </Row>

            <Row className="mb-3">
            <Col md={4}>
                <Form.Label>Status</Form.Label>
                <Form.Control
                as="select"
                name="status"
                value={formData.status}
                onChange={handleSelectChange}
                >
                <option value="">Select Status</option>
                {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                    {option.label}
                    </option>
                ))}
                </Form.Control>
            </Col>
            <Col md={4}>
                <Form.Label>Sent Date</Form.Label>
                <Form.Control
                type="date"
                name="sent_date"
                value={formData.sent_date}
                onChange={handleChange}
                />
            </Col>
            <Col md={4}>
                <Form.Label>Received Date</Form.Label>
                <Form.Control
                type="date"
                name="received_date"
                value={formData.received_date}
                onChange={handleChange}
                />
            </Col>
            </Row>

            <Row className="mb-3">
            <Col md={4}>
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                />
            </Col>
            <Col md={4}>
                <Form.Label>From Place</Form.Label>
                <Form.Control
                name="from_place"
                value={formData.from_place}
                onChange={handleChange}
                />
            </Col>
            <Col md={4}>
                <Form.Label>To Place</Form.Label>
                <Form.Control
                name="to_place"
                value={formData.to_place}
                onChange={handleChange}
                />
            </Col>
            </Row>

            <Row className="mb-3">
            <Col>
                <Form.Label>Description</Form.Label>
                <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleChange}
                />
            </Col>
            <Col>
                <Form.Label>Remarks</Form.Label>
                <Form.Control
                as="textarea"
                rows={2}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                />
            </Col>
            </Row>

            {/* Items Table */}
            <h6 className="fw-semibold mb-2">Service Items</h6>
            <div className="table-responsive">
            <Table bordered hover size="sm" className="align-middle">
                <thead className="table-light">
                <tr>
                    <th>Category</th>
                    <th>VCI Serial No</th>
                    <th>HSN Code</th>
                    <th>Tested Date</th>
                    <th>Issue Found</th>
                    <th>Action Taken</th>
                    <th></th>
                </tr>
                </thead>
            <tbody>
    {items.map((item, idx) => (
        <tr key={idx}>
        
            {/* Directly show stored category name or ID */}
<td>{item.category_name || ""}</td>
        
        <td>
            <Form.Control
            value={item.vci_serial_no}
            onChange={(e) =>
                handleItemChange(idx, "vci_serial_no", e.target.value)
            }
            />
        </td>
        <td>
            <Form.Control
            value={item.hsn_code}
            onChange={(e) =>
                handleItemChange(idx, "hsn_code", e.target.value)
            }
            />
        </td>
        <td>
            <Form.Control
            type="date"
            value={item.tested_date}
            onChange={(e) =>
                handleItemChange(idx, "tested_date", e.target.value)
            }
            />
        </td>
        <td>
            <Form.Control
            value={item.issue_found}
            onChange={(e) =>
                handleItemChange(idx, "issue_found", e.target.value)
            }
            />
        </td>
        <td>
            <Form.Control
            value={item.action_taken}
            onChange={(e) =>
                handleItemChange(idx, "action_taken", e.target.value)
            }
            />
        </td>
        <td>
            <Button
            variant="outline-danger"
            size="sm"
            onClick={() => removeItemRow(idx)}
            >
            <i className="bi bi-trash"></i>
            </Button>
        </td>
        </tr>
    ))}
    </tbody>

            </Table>
            {/* <Button variant="secondary" size="sm" onClick={addItemRow}>
                Add Row
            </Button> */}
            </div>

            <div className="mt-3 text-end">
            <Button type="submit" variant="success">
                Update Service
            </Button>
            </div>
        </Form>
        </div>
    );
    }
