import React, { useState, useEffect } from "react";
import { Form, Button, Table, Row, Col, Alert } from "react-bootstrap";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000/api";

export default function EditUrgentVci() {
  const navigate = useNavigate();
  const { id } = useParams(); 

  const [allPcbSerials, setAllPcbSerials] = useState([]);
  const [formData, setFormData] = useState({
    challan_no: "",
    challan_date: "",
    courier_name: "",
    description: "",
    remarks: "",
    sent_date: "",
    received_date: "",
    from_place: "",
    to_place: "",
    quantity: "",
  });

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [serviceVciSerials, setServiceVciSerials] = useState([]);
  const [initialVciSerials, setInitialVciSerials] = useState([]);


  const statusOptions = [
    { value: "in_transit", label: "In Transit" },
    { value: "completed", label: "Completed" },
  ];

  const placeOptions = [
    { value: "Mahle", label: "Mahle" },
    { value: "Tamilzourous", label: "Tamilzourous" },
    { value: "Valkontek", label: "Valkontek" },
  ];

  const testingStatusOptions = [
    { value: "pending", label: "Pending" },
    { value: "testing", label: "Testing" },
    { value: "completed", label: "Completed" },
  ];

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch the data for the specific ID and all dropdown data
        const [
          urgentVciResponse,
          categoriesResponse,
          serialsResponse,
          pcbSerialsResponse,
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}/urgentvci/${id}`),
          axios.get(`${API_BASE_URL}/form-dropdowns`),
          axios.get(`${API_BASE_URL}/urgent-serials`),
          axios.get(`${API_BASE_URL}/defaultvci`),
        ]);

        const urgentData = urgentVciResponse.data;
        const cats = categoriesResponse.data?.data?.categories || [];
        const urgentSerials = serialsResponse.data.service_vci_serials || [];
        const allPcbSerialsData = pcbSerialsResponse.data?.vcis || [];

        // Set form and item data from the fetched record
        setFormData({
          challan_no: urgentData.challan_no,
          challan_date: urgentData.challan_date,
          courier_name: urgentData.courier_name,
          description: urgentData.description,
          remarks: urgentData.remarks,
          sent_date: urgentData.sent_date,
          received_date: urgentData.received_date,
          from_place: urgentData.from_place,
          to_place: urgentData.to_place,
          quantity: urgentData.quantity,
        });
        setItems(urgentData.items || []);

        // Populate dropdowns
        setCategories(cats.map((c) => ({ value: c.id, label: c.category })));
        setAllPcbSerials(allPcbSerialsData);

        // Filter the available urgent VCI serials by removing those already in the form
        const initialVciSerialsInForm = urgentData.items.map(item => ({ id: item.id, vci_serial_no: item.vci_serial_no }));
        setInitialVciSerials(initialVciSerialsInForm);
        const availableUrgentSerials = urgentSerials.filter(serial => 
            !initialVciSerialsInForm.some(initialSerial => initialSerial.vci_serial_no === serial.vci_serial_no)
        );
        setServiceVciSerials([...initialVciSerialsInForm.map(s => ({...s, challan_no: urgentData.challan_no})), ...availableUrgentSerials]);

      } catch (err) {
        showToast("Failed to load data for editing", "danger");
        console.error("Data load error:", err);
        navigate("/urgent-vci-list");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (formData.from_place === "Mahle") {
      setFormData((prev) => ({ ...prev, to_place: "Tamilzourous" }));
    }
  }, [formData.from_place]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const handleVciSerialChange = (index, value) => {
    const selectedVci = serviceVciSerials.find((s) => s.vci_serial_no === value);
    const updatedItems = [...items];
    updatedItems[index].vci_serial_no = value;
    setItems(updatedItems);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        category_id: "",
        vci_serial_no: "",
        is_urgent: "Yes",
        hsn_code: "",
        tested_date: "",
        issue_found: "",
        action_taken: "",
        remarks: "",
        testing_assigned_to: "",
        testing_status: "pending",
        pcb_serial_no: "",
        purchase_id: "",
      },
    ]);
  };

  const removeItemRow = (index) => {
    // Check if the item is one of the original items fetched from the database.
    const itemToRemove = items[index];
    const isInitialItem = initialVciSerials.some(initialSerial => initialSerial.vci_serial_no === itemToRemove.vci_serial_no);

    if (isInitialItem) {
        showToast("Cannot remove an item that was part of the original record. Please edit the details or delete the entire urgent service entry.", "danger");
        return;
    }
    
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
};

  const validateForm = () => {
    let newErrors = {};
    const today = new Date().toISOString().split("T")[0];

    const requiredFields = [
      "challan_no",
      "challan_date",
      "courier_name",
      "sent_date",
      "from_place",
      "to_place",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "This field is required";
      }
    });

    ["challan_date", "sent_date", "received_date"].forEach((dateField) => {
      if (formData[dateField] && formData[dateField] > today) {
        newErrors[dateField] = "Future dates are not allowed";
      }
    });

    if (formData.challan_date && formData.sent_date && formData.challan_date !== formData.sent_date) {
      newErrors.sent_date = "Sent Date must match Challan Date";
    }
    if (formData.sent_date && formData.received_date && formData.sent_date === formData.received_date) {
      newErrors.received_date = "Sent Date and Received Date cannot be the same";
    }
    if (formData.from_place && formData.to_place && formData.from_place === formData.to_place) {
      newErrors.to_place = "From Place and To Place cannot be the same";
    }

    items.forEach((item, index) => {
      if (!item.category_id || !item.vci_serial_no) {
        if (!newErrors.items) newErrors.items = {};
        newErrors.items[index] = "Category and VCI Serial No are required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (validateForm()) {
      const payload = {
        ...formData,
        items: items,
      };

      try {
        // Use the PUT route for updating
        const response = await axios.put(`${API_BASE_URL}/urgentvci/${id}`, payload);
        if (response.status === 200) {
          showToast("Urgent service updated successfully", "success");
          setTimeout(() => navigate("/urgent-vci-list"), 1000);
        } else {
          showToast("Failed to update urgent service", "danger");
        }
      } catch (error) {
        if (error.response && error.response.data && error.response.data.errors) {
          setErrors(error.response.data.errors);
          showToast("Please correct the errors", "danger");
        } else if (error.response && error.response.data && error.response.data.message) {
          showToast(error.response.data.message, "danger");
        } else {
          showToast("An unexpected error occurred", "danger");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      showToast("Please correct the validation errors", "danger");
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if(window.confirm("Are you sure you want to delete this urgent service entry? This action cannot be undone.")){
      setIsLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/urgentvci/${id}`);
        showToast("Urgent service deleted successfully", "success");
        setTimeout(() => navigate("/urgent-vci-list"), 1000);
      } catch (error) {
        showToast("Failed to delete the urgent service entry.", "danger");
        console.error("Delete error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="container-fluid bg-white p-4">
      {toast.show && (
        <Alert
          variant={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
          dismissible
          className="position-fixed top-0 end-0 m-3"
          style={{ zIndex: 1050 }}
        >
          {toast.message}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Edit Urgent Service</h5>
        <div>
        <Button
          variant="danger"
          onClick={handleDelete}
          className="me-2"
        >
          <i className="bi bi-trash"></i> Delete
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/urgent-vci-list")}
        >
          <i className="bi bi-arrow-left me-1"></i> Back
        </Button>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3 pt-3">
          <Col md={4}>
            <Form.Label>Challan No*</Form.Label>
            <Form.Control
              name="challan_no"
              value={formData.challan_no}
              onChange={handleChange}
              isInvalid={!!errors.challan_no}
              autoComplete="off"
            />
            <Form.Control.Feedback type="invalid">
              {errors.challan_no}
            </Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <Form.Label>Challan Date*</Form.Label>
            <Form.Control
              type="date"
              name="challan_date"
              value={formData.challan_date}
              onChange={handleChange}
              isInvalid={!!errors.challan_date}
              autoComplete="off"
            />
            <Form.Control.Feedback type="invalid">
              {errors.challan_date}
            </Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <Form.Label>Courier Name*</Form.Label>
            <Form.Control
              name="courier_name"
              value={formData.courier_name}
              onChange={handleChange}
              isInvalid={!!errors.courier_name}
              autoComplete="off"
            />
            <Form.Control.Feedback type="invalid">
              {errors.courier_name}
            </Form.Control.Feedback>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={(e) => handleSelectChange("status", e.target.value)}
              disabled
              autoComplete="off"
            >
              <option value="">Status is determined by dates</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>Sent Date*</Form.Label>
            <Form.Control
              type="date"
              name="sent_date"
              value={formData.sent_date}
              onChange={handleChange}
              isInvalid={!!errors.sent_date}
              autoComplete="off"
            />
            <Form.Control.Feedback type="invalid">
              {errors.sent_date}
            </Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <Form.Label>Received Date</Form.Label>
            <Form.Control
              type="date"
              name="received_date"
              value={formData.received_date}
              onChange={handleChange}
              isInvalid={!!errors.received_date}
              autoComplete="off"
            />
            <Form.Control.Feedback type="invalid">
              {errors.received_date}
            </Form.Control.Feedback>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>From Place*</Form.Label>
            <Form.Select
              name="from_place"
              value={formData.from_place}
              onChange={(e) => handleSelectChange("from_place", e.target.value)}
              isInvalid={!!errors.from_place}
              autoComplete="off"
            >
              <option value="">Select From Place</option>
              {placeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.from_place}
            </Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <Form.Label>To Place*</Form.Label>
            <Form.Select
              name="to_place"
              value={formData.to_place}
              onChange={(e) => handleSelectChange("to_place", e.target.value)}
              isInvalid={!!errors.to_place}
              autoComplete="off"
            >
              <option value="">Select To Place</option>
              {placeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.to_place}
            </Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              autoComplete="off"
              isInvalid={!!errors.quantity}
            />
            <Form.Control.Feedback type="invalid">
              {errors.quantity}
            </Form.Control.Feedback>
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
              autoComplete="off"
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
              autoComplete="off"
            />
          </Col>
        </Row>

        <h6 className="fw-semibold mb-2">Service Items</h6>
        <div className="table-responsive">
          <Table bordered hover size="sm" className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Category*</th>
                <th>VCI Serial No*</th>
                <th>PCB Serial No</th>
                <th>Urgent</th>
                <th>HSN Code</th>
                <th>Assigned To</th>
                <th>Tested Date</th>
                <th>Status</th>
                <th>Issue Found</th>
                <th>Action Taken</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <Form.Select
                      value={item.category_id}
                      onChange={(e) =>
                        handleItemChange(idx, "category_id", e.target.value)
                      }
                      isInvalid={
                        errors.items && errors.items[idx] && !item.category_id
                      }
                      autoComplete="off"
                    >
                      <option value="">Select</option>
                      {categories.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Select
                      value={item.vci_serial_no}
                      onChange={(e) => handleVciSerialChange(idx, e.target.value)}
                      isInvalid={
                        errors.items && errors.items[idx] && !item.vci_serial_no
                      }
                      autoComplete="off"
                    >
                      <option value="">Select VCI Serial</option>
                      {serviceVciSerials.map((s, sIdx) => (
                        <option key={sIdx} value={s.vci_serial_no}>
                          {s.vci_serial_no} {s.challan_no ? `(Challan: ${s.challan_no})` : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Select
                      value={item.pcb_serial_no}
                      onChange={(e) => handleItemChange(idx, "pcb_serial_no", e.target.value)}
                    >
                      <option value="">-- Select PCB Serial --</option>
                      {allPcbSerials.map((pcb, pcbIdx) => (
                        <option key={pcbIdx} value={pcb.serial_no}>
                          {pcb.serial_no}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                  <td className="text-center">
                    <Form.Check
                      type="checkbox"
                      checked={item.is_urgent === "Yes"}
                      disabled
                    />
                  </td>
                  <td>
                    <Form.Control
                      value={item.hsn_code}
                      onChange={(e) =>
                        handleItemChange(idx, "hsn_code", e.target.value)
                      }
                      autoComplete="off"
                    />
                  </td>
                  <td>
                    <Form.Control
                      value={item.testing_assigned_to}
                      onChange={(e) =>
                        handleItemChange(idx, "testing_assigned_to", e.target.value)
                      }
                      autoComplete="off"
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="date"
                      value={item.tested_date}
                      onChange={(e) =>
                        handleItemChange(idx, "tested_date", e.target.value)
                      }
                      autoComplete="off"
                    />
                  </td>
                  <td>
                    <Form.Select
                      value={item.testing_status}
                      onChange={(e) =>
                        handleItemChange(idx, "testing_status", e.target.value)
                      }
                      autoComplete="off"
                    >
                      <option value="">Select</option>
                      {testingStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Select
                      value={item.issue_found}
                      onChange={(e) =>
                        handleItemChange(idx, "issue_found", e.target.value)
                      }
                      autoComplete="off"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Control
                      value={item.action_taken}
                      onChange={(e) =>
                        handleItemChange(idx, "action_taken", e.target.value)
                      }
                      autoComplete="off"
                    />
                  </td>
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeItemRow(idx)}
                      disabled={initialVciSerials.some(s => s.vci_serial_no === item.vci_serial_no)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Button variant="secondary" size="sm" onClick={addItemRow}>
            Add Row
          </Button>
        </div>
        <div className="mt-3 text-end">
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Urgent Service"}
          </Button>
        </div>
      </Form>
    </div>
  );
}