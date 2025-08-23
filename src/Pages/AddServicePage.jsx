import React, { useState, useEffect } from "react";
import { Form, Button, Table, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../api";

// Assuming you have 'react-toastify/dist/ReactToastify.css' imported in your main App.js or index.js file.
// import 'react-toastify/dist/ReactToastify.css';

export default function AddService() {
  const navigate = useNavigate();

  // State for the main service form data
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

  // State for the dynamic list of service items
  const [items, setItems] = useState([
    {
      category_id: "",
      vci_serial_no: "",
      is_urgent: "No", // ✅ string
      hsn_code: "",
      tested_date: "",
      issue_found: "",
      action_taken: "",
      remarks: "",
      testing_assigned_to: "", // New field for who the testing is assigned to
      testing_status: "", // New field for the status of testing
    },
  ]);

  // State for dropdown options and form validation
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  // Pre-defined options for various form fields
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

  // Fetches categories for the dropdown from a mock API endpoint
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    axios
      .get(`${API_BASE_URL}/form-dropdowns`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then((res) => {
        const cats = res.data?.data?.categories || [];
        setCategories(cats.map((c) => ({ value: c.id, label: c.category })));
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          navigate('/login');
        } else {
          toast.error("Failed to load categories");
        }
        console.error("Category load error:", err);
      });
  }, [navigate]);

  // Autofills "to_place" when "from_place" is "Mahle"
  useEffect(() => {
    if (formData.from_place === "Mahle") {
      setFormData((prev) => ({ ...prev, to_place: "Tamilzourous" }));
    }
  }, [formData.from_place]);

  /**
   * Handles changes for the main form inputs.
   * @param {Object} e - The event object.
   */
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
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /**
   * Handles changes for select inputs in the main form.
   * @param {string} name - The name of the select input.
   * @param {string} value - The new value.
   */
  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /**
   * Handles changes for inputs within the service items table.
   * @param {number} index - The index of the item being changed.
   * @param {string} field - The field name being changed.
   * @param {string} value - The new value.
   */
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  /**
   * Handles changes for checkbox inputs within the service items table.
   * @param {number} index - The index of the item being changed.
   * @param {string} field - The field name being changed.
   * @param {boolean} checked - The new checked state.
   */
  const handleItemCheckboxChange = (index, field, checked) => {
    const updatedItems = [...items];
    updatedItems[index][field] = checked;
    setItems(updatedItems);
  };

  // Adds a new row to the service items table
  const addItemRow = () => {
    setItems([
      ...items,
      {
        category_id: "",
        vci_serial_no: "",
        is_urgent: "No", // ✅ string
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

  // Removes a row from the service items table
  const removeItemRow = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  /**
   * Validates the form data on the client side.
   * @returns {boolean} - True if the form is valid, otherwise false.
   */
  const validateForm = () => {
    let newErrors = {};
    let hasError = false;
    const today = new Date().toISOString().split("T")[0];

    const requiredFields = [
      { name: "challan_no", message: "Challan No. is required" },
      { name: "challan_date", message: "Challan Date is required" },
      { name: "courier_name", message: "Courier Name is required" },
      { name: "sent_date", message: "Sent Date is required" },
      { name: "from_place", message: "From Place is required" },
      { name: "to_place", message: "To Place is required" },
    ];

    requiredFields.forEach(({ name, message }) => {
      if (!formData[name]) {
        newErrors[name] = message;
        toast.error(message);
        hasError = true;
      }
    });

    // Validation for future dates
    ["challan_date", "sent_date", "received_date"].forEach((dateField) => {
      if (formData[dateField] && formData[dateField] > today) {
        newErrors[dateField] = "Future dates are not allowed";
        toast.error("Future dates are not allowed");
        hasError = true;
      }
    });

    if (
      formData.from_place &&
      formData.to_place &&
      formData.from_place === formData.to_place
    ) {
      newErrors.to_place = "From Place and To Place cannot be the same";
      toast.error("From Place and To Place cannot be the same");
      hasError = true;
    }

    // New validation: Quantity must match the number of filled rows
    if (formData.quantity && parseInt(formData.quantity) !== items.length) {
      const message = `Quantity must match the number of item rows (${items.length})`;
      newErrors.quantity = message;
      toast.error(message);
      hasError = true;
    }

    // Validation for service items
    items.forEach((item, index) => {
      if (!item.category_id || !item.vci_serial_no) {
        if (!newErrors.items) newErrors.items = {};
        const message = `Row ${index + 1}: Category and VCI Serial No are required`;
        newErrors.items[index] = message;
        toast.error(message);
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const { status, ...payload } = formData;

      const itemsWithArrayIssueFound = items.map(item => {
        if (item.issue_found && typeof item.issue_found === 'string') {
          return {
            ...item,
            issue_found: [item.issue_found]
          };
        }
        return item;
      });

      payload.items = itemsWithArrayIssueFound;

      axios
        .post(`${API_BASE_URL}/service-vci`, payload)
        .then(() => {
          toast.success("Service saved successfully!");
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
          });
          setItems([
            {
              category_id: "",
              vci_serial_no: "",
              is_urgent: "No",
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
          if (
            error.response &&
            error.response.data &&
            error.response.data.errors
          ) {
            const errors = error.response.data.errors;

            // Iterate over the errors object
            for (const field in errors) {
              const errorMessages = errors[field];
              if (Array.isArray(errorMessages)) {
                errorMessages.forEach(message => {
                  toast.error(message);
                });
              } else {
                toast.error(errorMessages);
              }
            }
            setErrors(errors);
          } else if (
            error.response &&
            error.response.data &&
            error.response.data.message
          ) {
            toast.error(error.response.data.message);
          } else {
            toast.error("An unexpected error occurred!");
          }
        });
    } else {
      toast.warning("Please correct the validation errors!");
    }
  };
  return (
    <div className="container-fluid bg-white p-4">
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
                formData.status === "in_transit" ||
                formData.status === "completed"
              }
              autoComplete="off"
            >
              <option value="">Select Status</option>
              {statusOptions
                .filter(
                  (option) =>
                    option.value !== "completed" || formData.received_date
                )
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
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              isInvalid={!!errors.quantity}
              autoComplete="off"
            />
            <Form.Control.Feedback type="invalid">
              {errors.quantity}
            </Form.Control.Feedback>
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
                      autoComplete="off"
                    />
                  </td>
                  <td className="text-center">
                    <Form.Check
                      type="checkbox"
                      checked={item.is_urgent === "Yes"}
                      onChange={(e) =>
                        handleItemCheckboxChange(
                          idx,
                          "is_urgent",
                          e.target.checked ? "Yes" : "No"
                        )
                      }
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