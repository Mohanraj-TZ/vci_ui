import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from "../api";

export default function EditDamagedItemPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Damaged item ID from route

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState('');
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [formData, setFormData] = useState({
    invoice_no: '',
    pcb_board_purchase_item_id: '',
    serial_no: '',
    quantity: 1,
    remarks: '',
    status: 'pending',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all invoices for dropdown
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

  // Fetch existing damaged item data
  useEffect(() => {
    const fetchDamagedItem = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/damaged-items/${id}/edit`);
        const data = response.data.data;

        setFormData({
          invoice_no: data.invoice_no,
          pcb_board_purchase_item_id: data.pcb_board_purchase_item_id,
          serial_no: data.serial_no,
          quantity: data.quantity,
          remarks: data.remarks,
          status: data.status,
        });
        setSelectedInvoiceNo(data.invoice_no);

        // Fetch serial numbers for this invoice
        const invoiceResponse = await axios.get(`${API_BASE_URL}/pcb-purchases/${data.invoice_no}`);
        const items = invoiceResponse.data.items || [];
        setSerialNumbers(items.map(item => ({ value: item.id, label: item.serial_no })));

      } catch (error) {
        toast.error('Failed to fetch damaged item details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDamagedItem();
  }, [id]);

  const handleChange = (e, action) => {
    if (action?.name === 'serial_no') {
      setFormData(prev => ({
        ...prev,
        serial_no: e ? e.label : '',
        pcb_board_purchase_item_id: e ? e.value : ''
      }));
    } else if (action?.name === 'invoice_no') {
      setSelectedInvoiceNo(e.value);
      setFormData(prev => ({ ...prev, invoice_no: e.value, serial_no: '', pcb_board_purchase_item_id: '' }));

      // Fetch serial numbers for selected invoice
      const fetchInvoiceSerials = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`${API_BASE_URL}/pcb-purchases/${e.value}`);
          const items = response.data.items || [];
          setSerialNumbers(items.map(item => ({ value: item.id, label: item.serial_no })));
        } catch (error) {
          toast.error('Failed to fetch serial numbers.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchInvoiceSerials();

    } else {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (action?.name) setFormErrors(prev => ({ ...prev, [action.name]: null }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errors = {};
    if (!formData.invoice_no) errors.invoice_no = 'Invoice Number is required';
    if (!formData.serial_no) errors.serial_no = 'Serial No is required';
    if (formData.quantity < 1) errors.quantity = 'Quantity must be at least 1';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await axios.put(`${API_BASE_URL}/damaged-items/${id}`, formData);
      toast.success('Damaged item updated successfully!');
      setTimeout(() => navigate('/purchaseDamage'), 1000);
    } catch (error) {
      if (error.response?.status === 422 && error.response.data.errors) {
        setFormErrors(error.response.data.errors);
      }
      toast.error(error.response?.data?.message || 'Failed to update damaged item');
    }
  };

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Edit Damaged Item</h4>
        <Button variant="outline-secondary" onClick={() => navigate('/purchaseDamage')}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Invoice Number</Form.Label>
            <Select
              name="invoice_no"
              options={invoices.map(inv => ({ value: inv.invoice_no, label: inv.invoice_no }))}
              value={selectedInvoiceNo ? { value: selectedInvoiceNo, label: selectedInvoiceNo } : null}
              onChange={handleChange}
              placeholder="Select Invoice"
            />
            {formErrors.invoice_no && <div className="text-danger small">{formErrors.invoice_no}</div>}
          </Col>

          <Col md={6}>
            <Form.Label>Serial Number</Form.Label>
            <Select
              name="serial_no"
              options={serialNumbers}
              value={serialNumbers.find(sn => sn.label === formData.serial_no) || null}
              onChange={handleChange}
              isLoading={isLoading}
              placeholder="Select Serial Number"
              isClearable
            />
            {formErrors.serial_no && <div className="text-danger small">{formErrors.serial_no}</div>}
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label>Quantity</Form.Label>
            <Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleChange} min={1} />
            {formErrors.quantity && <div className="text-danger small">{formErrors.quantity}</div>}
          </Col>

          <Col md={6}>
            <Form.Label>Status</Form.Label>
            <Form.Select name="status" value={formData.status} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="replaced">Replaced</option>
              <option value="returned">Returned</option>
              <option value="in-transit">In-transit</option>
            </Form.Select>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <Form.Label>Remarks</Form.Label>
            <Form.Control as="textarea" rows={3} name="remarks" value={formData.remarks} onChange={handleChange} />
          </Col>
        </Row>

        <div className="d-flex justify-content-end">
          <Button variant="secondary" className="me-2" onClick={() => navigate('/damaged-items-list')}>Cancel</Button>
          <Button type="submit" variant="success">Update</Button>
        </div>
      </Form>

      {isLoading && (
        <div className="d-flex justify-content-center my-3">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="ms-2">Loading serial numbers...</p>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
