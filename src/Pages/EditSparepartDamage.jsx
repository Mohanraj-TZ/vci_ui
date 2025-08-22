import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from "../api";

export default function EditSparepartsDamagedItemPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // get damaged item ID from URL

  const [formData, setFormData] = useState({
    sparepart_purchase_item_id: '',
    quantity: '',
    remarks: '',
    status: 'pending',
    warranty_start_date: '',
    warranty_end_date: '',
    warranty_status: '',
    transportation: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [spareparts, setSpareparts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch spareparts for dropdown
  useEffect(() => {
    const fetchSpareparts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/get-spareparts`);
        if (res.data.success) setSpareparts(res.data.data);
      } catch {
        toast.error("Failed to load spareparts");
      }
    };
    fetchSpareparts();
  }, []);

  // Fetch damaged item data
  useEffect(() => {
    const fetchDamagedItem = async () => {
      try {
       const res = await axios.get(`${API_BASE_URL}/damagedSp-items/${id}/edit`);

        if (res.data.success) {
          const item = res.data.data;
          setFormData({
            sparepart_purchase_item_id: item.sparepart_purchase_item_id,
            quantity: item.quantity,
            remarks: item.remarks || '',
            status: item.status || 'pending',
            warranty_start_date: item.warranty_start_date || '',
            warranty_end_date: item.warranty_end_date || '',
            warranty_status: item.warranty_status || '',
            transportation: item.transportation || ''
          });
        }
      } catch (error) {
        toast.error("Failed to load damaged item");
      } finally {
        setLoading(false);
      }
    };
    fetchDamagedItem();
  }, [id]);

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
    await axios.put(`${API_BASE_URL}/damagedSp-items/${id}`, formData);

      toast.success('Damaged sparepart updated successfully!');
      setTimeout(() => navigate('/sparepartDamage'), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Edit Sparepart Damaged Item</h4>
        <Button variant="outline-secondary" onClick={() => navigate('/sparepartDamage')}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Sparepart</Form.Label>
            <Form.Select
              name="sparepart_purchase_item_id"
              value={formData.sparepart_purchase_item_id}
              onChange={handleChange}
            >
              <option value="">Select Sparepart</option>
              {spareparts.map(sp => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} (Available: {sp.quantity})
                </option>
              ))}
            </Form.Select>
            {formErrors.sparepart_purchase_item_id && <div className="text-danger small">{formErrors.sparepart_purchase_item_id}</div>}
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

        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>Status</Form.Label>
            <Form.Select name="status" value={formData.status} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="replaced">Replaced</option>
              <option value="returned">Returned</option>
            </Form.Select>
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
          <Button type="submit" variant="success">Update</Button>
        </div>
      </Form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
