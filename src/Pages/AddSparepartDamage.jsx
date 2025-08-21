import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from "../api";

export default function AddSparepartsDamagedItemPage() {
  const navigate = useNavigate();
  const [selectedSparepart, setSelectedSparepart] = useState(null);

  const [formData, setFormData] = useState({
    sparepart_purchase_item_id: '',
    quantity: '',
    remarks: '',
    status: 'pending',
    action_date: '',
    sent_date: '',
    received_date: '',
    warranty_start_date: '',
    warranty_end_date: '',
    warranty_status: '',
    transportation: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [spareparts, setSpareparts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all spareparts on mount
  useEffect(() => {
    const fetchSpareparts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/get-spareparts`);
        if (res.data.success) {
          setSpareparts(res.data.data);
        }
      } catch (error) {
        toast.error("Failed to load spareparts");
      } finally {
        setLoading(false);
      }
    };
    fetchSpareparts();
  }, []);


  // Update form when sparepart selected
// inside your component
useEffect(() => {
  // Only run if user has entered an ID
  if (!formData.sparepart_purchase_item_id) {
    setSelectedSparepart(null);
    return;
  }

  // Find sparepart from the list
  const selected = spareparts.find(
    sp => sp.sparepart_purchase_item_id === Number(formData.sparepart_purchase_item_id)
  );
  setSelectedSparepart(selected || null);

  // If found, populate other fields automatically
  if (selected) {
    setFormData(prev => ({
      ...prev,
      quantity: selected.quantity,
      status: selected.status || 'pending',
      sent_date: selected.sent_date || '',
      received_date: selected.received_date || '',
      warranty_start_date: selected.warranty_start_date || '',
      warranty_end_date: selected.warranty_end_date || '',
      warranty_status: selected.warranty_status || '',
      transportation: selected.transportation || ''
    }));
  }
}, [formData.sparepart_purchase_item_id, spareparts]);


  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errors = {};
    if (!formData.sparepart_purchase_item_id) errors.sparepart_purchase_item_id = 'Please select a sparepart';
    if (!formData.quantity || formData.quantity < 1) errors.quantity = 'Quantity must be at least 1';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await axios.post(`${API_BASE_URL}/spareparts-damaged-items`, formData);
      toast.success('Sparepart damaged item added successfully!');
      setTimeout(() => navigate('/sparepartDamage'), 1000);
    } catch (error) {
      if (error.response?.status === 422 && error.response.data.errors) {
        setFormErrors(error.response.data.errors);
      }
      toast.error(error.response?.data?.message || 'Failed to save item');
    }
  };

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Add Sparepart Damaged Item</h4>
        <Button variant="outline-secondary" onClick={() => navigate('/sparepartDamage')}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">

          



       <Col md={6}>
    <Form.Label>Sparepart Purchase Item ID</Form.Label>
    <Form.Control
      type="number"
      name="sparepart_purchase_item_id"
      value={formData.sparepart_purchase_item_id}
      onChange={handleChange}
      min={1}
    />
    {formErrors.sparepart_purchase_item_id && (
      <div className="text-danger small">{formErrors.sparepart_purchase_item_id}</div>
    )}
  </Col>

          <Col md={6}>
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min={1}
            />
            {formErrors.quantity && <div className="text-danger small">{formErrors.quantity}</div>}
          </Col>
        </Row>

        {/* Optional fields */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>Status</Form.Label>
            <Form.Select name="status" value={formData.status} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="replaced">Replaced</option>
              <option value="returned">Returned</option>
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>Sent Date</Form.Label>
            <Form.Control type="date" name="sent_date" value={formData.sent_date} onChange={handleChange} />
          </Col>
          <Col md={4}>
            <Form.Label>Received Date</Form.Label>
            <Form.Control type="date" name="received_date" value={formData.received_date} onChange={handleChange} />
          </Col>
        </Row>

        {selectedSparepart?.sparepart_name === "OBD Connector" && (
          <Row className="mb-3">
            <Col md={4}>
              <Form.Label>Warranty Start Date</Form.Label>
              <Form.Control type="date" name="warranty_start_date" value={formData.warranty_start_date} onChange={handleChange} />
            </Col>
            <Col md={4}>
              <Form.Label>Warranty End Date</Form.Label>
              <Form.Control type="date" name="warranty_end_date" value={formData.warranty_end_date} onChange={handleChange} />
            </Col>
            <Col md={4}>
              <Form.Label>Warranty Status</Form.Label>
              <Form.Control type="text" name="warranty_status" value={formData.warranty_status} onChange={handleChange} />
            </Col>
          </Row>
        )}

        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>Transportation</Form.Label>
            <Form.Control type="text" name="transportation" value={formData.transportation} onChange={handleChange} />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <Form.Label>Remarks</Form.Label>
            <Form.Control as="textarea" rows={3} name="remarks" value={formData.remarks} onChange={handleChange} />
          </Col>
        </Row>

        <div className="d-flex justify-content-end mt-3">
          <Button variant="secondary" className="me-2" onClick={() => navigate('/spareparts-damaged-items-list')}>Cancel</Button>
          <Button type="submit" variant="success">Save</Button>
        </div>
      </Form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
