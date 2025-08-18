import React, { useState, useEffect } from "react";
import { Form, Button, Table, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = "http://localhost:8000/api";

export default function AddService() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

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
    },
  ]);

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/form-dropdowns`)
      .then((res) => {
        const cats = res.data?.data?.categories || [];
        setCategories(cats.map((c) => ({ value: c.id, label: c.category })));
      })
      .catch((err) => {
        toast.error("Failed to load categories");
        console.error("Category load error:", err);
      });
  }, []);

  useEffect(() => {
    if (formData.from_place === "Mahle") {
      setFormData((prev) => ({ ...prev, to_place: "Tamilzourous" }));
    }
  }, [formData.from_place]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    if (name === "sent_date" && value) {
      updatedFormData.status = "in_transit";
    }
    if (name === "received_date" && value) {
      updatedFormData.status = "completed";
    }

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
      if (formData[dateField] && new Date(formData[dateField]) > new Date(today)) {
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

    if (formData.quantity) {
      const filledItems = items.filter((item) => item.category_id && item.vci_serial_no);
      if (filledItems.length !== parseInt(formData.quantity, 10)) {
        newErrors.quantity = `You entered quantity ${formData.quantity}, but only ${filledItems.length} items are completely filled.`;
      }
    }

    let itemErrors = {};
    items.forEach((item, index) => {
      if (!item.category_id || !item.vci_serial_no) {
        itemErrors[index] = "Category and VCI Serial No are required";
      }

      if (item.tested_date) {
        if (new Date(item.tested_date) > new Date(today)) {
          itemErrors[index] = `Item ${index + 1}: Tested Date cannot be in the future.`;
        }
        if (formData.received_date && new Date(item.tested_date) < new Date(formData.received_date)) {
          itemErrors[index] = `Item ${index + 1}: Tested Date cannot be before the Received Date.`;
        }
      }
    });

    if (Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors;
    }

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
          toast.success("Service saved successfully!");
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
            },
          ]);
          setTimeout(() => navigate("/serviceProduct"), 1000);
        })
        .catch((error) => {
          if (error.response && error.response.data && error.response.data.errors) {
            const apiErrors = error.response.data.errors;
            Object.values(apiErrors).forEach((messages) => {
              messages.forEach((message) => {
                toast.error(message);
              });
            });
          } else {
            toast.error("Failed to save service. Please try again later.");
          }
        });
    } else {
      // Show validation errors as toasts
      Object.values(errors).forEach((error) => {
        if (typeof error === 'string') {
          toast.error(error);
        } else if (typeof error === 'object') {
          Object.values(error).forEach(message => {
            toast.error(message);
          });
        }
      });
    }
  };

  return (
    <div className="container-fluid bg-white p-4">
      <ToastContainer position="top-right" autoClose={3000} />
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
              max={today}
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
              disabled={
                formData.status === "in_transit" || formData.status === "completed"
              }
              autoComplete="off"
            >
              <option value="">Select Status</option>
              {statusOptions
                .filter((option) => option.value !== "completed" || formData.received_date)
                .map((option) => (
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
              max={today}
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
              max={today}
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
              autoComplete="off"
            />
          </Col>
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
                    <Form.Control
                      value={item.vci_serial_no}
                      onChange={(e) =>
                        handleItemChange(idx, "vci_serial_no", e.target.value)
                      }
                      isInvalid={
                        errors.items && errors.items[idx] && !item.vci_serial_no
                      }
                      autoComplete="off"
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
                        handleItemChange(
                          idx,
                          "testing_assigned_to",
                          e.target.value
                        )
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
                      max={today}
                      isInvalid={
                        errors.items && errors.items[idx] && item.tested_date &&
                        (new Date(item.tested_date) > new Date(today) || (formData.received_date && new Date(item.tested_date) < new Date(formData.received_date)))
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                       {errors.items && errors.items[idx]}
                     </Form.Control.Feedback>
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
                    <Form.Control
                      value={item.issue_found}
                      onChange={(e) =>
                        handleItemChange(idx, "issue_found", e.target.value)
                      }
                      autoComplete="off"
                    />
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
                    {items.length > 1 && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeItemRow(idx)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="outline-primary" onClick={addItemRow}>
            Add Item
          </Button>
          <div>
            <Button variant="secondary" className="me-2" onClick={() => navigate("/serviceProduct")}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              Save Service
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}