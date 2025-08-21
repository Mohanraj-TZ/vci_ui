import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from "../api";

// Helper function to format date to 'YYYY-MM-DD'
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddDamagedItemPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('');
  const [formData, setFormData] = useState({
    invoice_no: '',
    pcb_board_purchase_item_id: '',
    serial_no: '',
    quantity: 1,
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/pcb-purchases/invoices`);
        setInvoices(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch invoice list.');
      }
    };
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (selectedInvoiceNo) {
      setIsLoading(true);
      const fetchInvoiceDetails = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/pcb-purchases/${selectedInvoiceNo}`);
          const { purchase } = response.data;

          // Autofill form data from the selected invoice.
          setFormData(prev => ({
            ...prev,
            invoice_no: purchase.invoice_no,
            sent_date: formatDate(purchase.sent_date),
            received_date: formatDate(purchase.received_date),
            warranty_start_date: formatDate(purchase.warranty_start_date),
            warranty_end_date: formatDate(purchase.warranty_end_date),
            transportation: purchase.transportation,
            status: purchase.status,
            warranty_status: purchase.warranty_status
          }));
        } catch (error) {
          toast.error('Failed to fetch invoice details.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchInvoiceDetails();
    }
  }, [selectedInvoiceNo]);

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'invoice_no') {
      setSelectedInvoiceNo(value);
      // Reset relevant fields when a new invoice is selected
      setFormData(prev => ({
        ...prev,
        pcb_board_purchase_item_id: '',
        serial_no: '',
        invoice_no: value
      }));
      setFormErrors(prev => ({
        ...prev,
        pcb_board_purchase_item_id: null,
        serial_no: null,
        invoice_no: null
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const errors = {};
    if (!formData.invoice_no) errors.invoice_no = 'Invoice Number is required';
    if (!formData.pcb_board_purchase_item_id) errors.pcb_board_purchase_item_id = 'Purchase Item ID is required';
    if (!formData.serial_no.trim()) errors.serial_no = 'Serial No is required';
    if (formData.quantity < 1) errors.quantity = 'Quantity must be at least 1';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await axios.post(`${API_BASE_URL}/pcb-purchases/damaged-items`, formData);
      toast.success('Damaged item added successfully!');
      setTimeout(() => navigate('/damaged-items-list'), 1000);
    } catch (error) {
      if (error.response?.status === 422 && error.response.data.errors) {
        setFormErrors(error.response.data.errors);
      }
      toast.error(error.response?.data?.message || 'Failed to save damaged item');
    }
  };

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Add Damaged Item</h4>
        <Button variant="outline-secondary" onClick={() => navigate('/purchaseDamage')}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Invoice Number</Form.Label>
            <Form.Select
              name="invoice_no"
              value={selectedInvoiceNo}
              onChange={handleChange}
            >
              <option value="">Select Invoice</option>
              {invoices.map(invoice => (
                <option key={invoice.id} value={invoice.invoice_no}>{invoice.invoice_no}</option>
              ))}
            </Form.Select>
            {formErrors.invoice_no && <div className="text-danger small">{formErrors.invoice_no}</div>}
          </Col>

          <Col md={6}>
            <Form.Label>Purchase Item ID</Form.Label>
        <Form.Control
  type="text"
  name="pcb_board_purchase_item_id"
  value={formData.pcb_board_purchase_item_id}
  onChange={handleChange}
  placeholder="Enter Purchase Item ID"
/>
            {formErrors.pcb_board_purchase_item_id && <div className="text-danger small">{formErrors.pcb_board_purchase_item_id}</div>}
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Serial No</Form.Label>
            <Form.Control
              type="text"
              name="serial_no"
              value={formData.serial_no}
              onChange={handleChange}
              placeholder="Enter serial number"
              disabled={isLoading}
            />
            {formErrors.serial_no && <div className="text-danger small">{formErrors.serial_no}</div>}
          </Col>
          <Col md={6}>
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min={1}
              disabled={isLoading}
            />
            {formErrors.quantity && <div className="text-danger small">{formErrors.quantity}</div>}
          </Col>
        </Row>

        {isLoading && (
          <div className="d-flex justify-content-center my-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="ms-2">Autofilling data...</p>
          </div>
        )}

        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>Status</Form.Label>
            <Form.Select name="status" value={formData.status} onChange={handleChange} disabled={isLoading}>
              <option value="pending">Pending</option>
              <option value="replaced">Replaced</option>
              <option value="returned">Returned</option>
              <option value="in-transit">In-transit</option>
            </Form.Select>
          </Col>
{/*           <Col md={4}>
            <Form.Label>Action Date</Form.Label>
            <Form.Control type="date" name="action_date" value={formData.action_date} onChange={handleChange} disabled={isLoading} />
          </Col> */}
          <Col md={4}>
            <Form.Label>Sent Date</Form.Label>
            <Form.Control type="date" name="sent_date" value={formData.sent_date} onChange={handleChange} disabled={isLoading} />
          </Col>

<Col md={4}>
            <Form.Label>Received Date</Form.Label>
            <Form.Control type="date" name="received_date" value={formData.received_date} onChange={handleChange} disabled={isLoading} />
          </Col>
        </Row>

        <Row className="mb-3">
          
          <Col md={4}>
            <Form.Label>Warranty Start Date</Form.Label>
            <Form.Control type="date" name="warranty_start_date" value={formData.warranty_start_date} onChange={handleChange} disabled={isLoading} />
          </Col>
          <Col md={4}>
            <Form.Label>Warranty End Date</Form.Label>
            <Form.Control type="date" name="warranty_end_date" value={formData.warranty_end_date} onChange={handleChange} disabled={isLoading} />
          </Col>

  <Col md={4}>
            <Form.Label>Warranty Status</Form.Label>
            <Form.Control type="text" name="warranty_status" value={formData.warranty_status} onChange={handleChange} disabled={isLoading} />
          </Col>
        </Row>

        <Row className="mb-3">
        
          <Col md={4}>
            <Form.Label>Transportation</Form.Label>
            <Form.Control type="text" name="transportation" value={formData.transportation} onChange={handleChange} disabled={isLoading} />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <Form.Label>Remarks</Form.Label>
            <Form.Control as="textarea" rows={3} name="remarks" value={formData.remarks} onChange={handleChange} disabled={isLoading} />
          </Col>
        </Row>

        <div className="d-flex justify-content-end">
          <Button variant="secondary" className="me-2" onClick={() => navigate('/damaged-items-list')}>Cancel</Button>
          <Button type="submit" variant="success" disabled={isLoading}>Save</Button>
        </div>
      </Form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}