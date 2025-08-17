import React, { useState, useEffect } from "react";
import { Form, Button, Table, Card, Row, Col, Alert } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Placeholder for API_BASE_URL
const API_BASE_URL = "http://localhost:8000/api";

export default function AddService() {
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
    // created_by: null,
  });

  const [items, setItems] = useState([
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
      // created_by: null,
    },
  ]);

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const statusOptions = [
    { value: "in_transit", label: "In Transit" },
    { value: "completed", label: "Completed" },
  ];

  const placeOptions = [
    { value: "Mahle", label: "Mahle" },
    { value: "Tamilzourous", label: "Tamilzourous" },
    { value: "Valkontek", label: "Valkontek" },
  ];

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Fetch categories on component load
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/form-dropdowns`)
      .then((res) => {
        const cats = res.data?.data?.categories || [];
        setCategories(cats.map((c) => ({ value: c.id, label: c.category })));
      })
      .catch((err) => {
        showToast("Failed to load categories", "danger");
        console.error("Category load error:", err);
      });
  }, []);

  // Autofill "to_place" when "from_place" is "Mahle"
  useEffect(() => {
    if (formData.from_place === "Mahle") {
      setFormData((prev) => ({ ...prev, to_place: "Tamilzourous" }));
    }
  }, [formData.from_place]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    // Auto-update status based on sent/received dates
    if (name === "sent_date" && value) {
      updatedFormData.status = "in_transit";
    }
    if (name === "received_date" && value) {
      updatedFormData.status = "completed";
    }

    setFormData(updatedFormData);
    // Clear the error for the field being changed
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

const validateForm = () => {
  let newErrors = {};
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

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

  // 🚫 No future dates allowed
  ["challan_date", "sent_date", "received_date"].forEach((dateField) => {
    if (formData[dateField] && formData[dateField] > today) {
      newErrors[dateField] = "Future dates are not allowed";
    }
  });

  // 🚫 Challan Date must be same as Sent Date
  if (formData.challan_date && formData.sent_date && formData.challan_date !== formData.sent_date) {
    newErrors.sent_date = "Sent Date must match Challan Date";
  }

  // 🚫 Sent Date & Received Date can't be same
  if (formData.sent_date && formData.received_date && formData.sent_date === formData.received_date) {
    newErrors.received_date = "Sent Date and Received Date cannot be the same";
  }

  // 🚫 From Place & To Place can't be same
  if (formData.from_place && formData.to_place && formData.from_place === formData.to_place) {
    newErrors.to_place = "From Place and To Place cannot be the same";
  }

  // ✅ Quantity check
  if (formData.quantity) {
    const filledItems = items.filter(
      (item) => item.category_id && item.vci_serial_no
    );
    if (filledItems.length !== parseInt(formData.quantity, 10)) {
      newErrors.quantity = `You entered quantity ${formData.quantity}, but only ${filledItems.length} items are completely filled.`;
    }
  }

  // ✅ Validate service items
  items.forEach((item, index) => {
    if (!item.category_id || !item.vci_serial_no) {
      if (!newErrors.items) newErrors.items = {};
      newErrors.items[index] = "Category and VCI Serial No are required";
    }
  });

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const payload = { ...formData, items };
      
      axios
        .post(`${API_BASE_URL}/service-vci`, payload)
        .then(() => {
          showToast("Service saved successfully", "success");
          // Reset form on success
          setFormData({
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
          setItems([
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
          setTimeout(() => navigate("/serviceProduct"), 1000);
        })
        .catch((error) => {
          // Check for a validation error response from the server (status 422 is common)
          if (error.response && error.response.data && error.response.data.errors) {
            const apiErrors = error.response.data.errors;
            const newErrors = {};
            let delay = 0;

            // Iterate through each field with an error
            Object.keys(apiErrors).forEach((field) => {
              const messages = apiErrors[field];
              messages.forEach((message) => {
                setTimeout(() => {
                  showToast(message, "danger");
                }, delay);
                delay += 500;
              });
              newErrors[field] = messages[0];
            });
            setErrors(newErrors);
          } else {
            showToast("Failed to save service. Please try again later.", "danger");
          }
        });
    } else {
      // MODIFIED: Loop through client-side errors and show toasts for each one
      let delay = 0;
      Object.keys(errors).forEach(field => {
        if (field !== 'items') {
          setTimeout(() => {
            showToast(`${errors[field]} for ${field.replace(/_/g, ' ')}`, "danger");
          }, delay);
          delay += 500;
        }
      });

      // Handle item-specific errors
      if (errors.items) {
        Object.keys(errors.items).forEach(itemIndex => {
          setTimeout(() => {
            showToast(`Item ${parseInt(itemIndex) + 1}: ${errors.items[itemIndex]}`, "danger");
          }, delay);
          delay += 500;
        });
      }
    }
  };

  return (
    <div className="container-fluid bg-white p-4">
      {toast.show && (
        <Alert variant={toast.type} onClose={() => setToast({ ...toast, show: false })} dismissible className="position-fixed top-0 end-0 m-3" style={{ zIndex: 1050 }}>
          {toast.message}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Add New Service</h5>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i> Back
        </Button>
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
  disabled={formData.status === "in_transit" || formData.status === "completed"}
>
  <option value="">Select Status</option>
  {statusOptions
    .filter(option => option.value !== "completed" || formData.received_date) // ✅ Only show "Completed" if received_date exists
    .map(option => (
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
            />
            <Form.Control.Feedback type="invalid">
              {errors.received_date}
            </Form.Control.Feedback>
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
            <Form.Label>From Place*</Form.Label>
            <Form.Select
              name="from_place"
              value={formData.from_place}
              onChange={(e) => handleSelectChange("from_place", e.target.value)}
              isInvalid={!!errors.from_place}
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

        <h6 className="fw-semibold mb-2">Service Items</h6>
        <div className="table-responsive">
          <Table bordered hover size="sm" className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Category*</th>
                <th>VCI Serial No*</th>
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
                  <td>
                    <Form.Select
                      value={item.category_id}
                      onChange={(e) =>
                        handleItemChange(idx, "category_id", e.target.value)
                      }
                      isInvalid={
                        errors.items && errors.items[idx] && !item.category_id
                      }
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
                    <Form.Control
                      value={item.vci_serial_no}
                      onChange={(e) =>
                        handleItemChange(idx, "vci_serial_no", e.target.value)
                      }
                      isInvalid={
                        errors.items &&
                        errors.items[idx] &&
                        !item.vci_serial_no
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
  <Form.Select
    value={item.issue_found}
    onChange={(e) =>
      handleItemChange(idx, "issue_found", e.target.value)
    }
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
          <Button variant="secondary" size="sm" onClick={addItemRow}>
            Add Row
          </Button>
        </div>
        <div className="mt-3 text-end">
          <Button type="submit" variant="success">
            Save Service
          </Button>
        </div>
      </Form>
    </div>
  );
}
