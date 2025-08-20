import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, Container, Table, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SaleReturnDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  // Helper function to get authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Authentication token missing. Please log in again.", { toastId: 'auth-error' });
      navigate('/login');
      return null; // Return null if no token is found
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers) {
      return; // Stop if no token is found
    }

    axios
      .get(`http://localhost:8000/api/sale-returns/view/${id}`, headers) // Pass the headers here
      .then((res) => {
        const data = res.data;
        setFormData({
          customer_name: data.customer_name,
          batch: data.batch,
          category: data.category,
          quantity: data.quantity,
          from_serial_no: data.from_serial_no,
          shipment_name: data.shipment_name,
          product_serial_no: data.product_serial_no,
          shipment_date: data.shipment_date,
          delivery_date: data.delivery_date,
          tracking_no: data.tracking_no,
          notes: data.notes,
        });
        setReturnReason(data.notes || '');

        setProducts(
          data.products.map((item) => ({
            ...item,
            remark: item.remark || '',
            selected: true,
          }))
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading data', err);
        const errorMessage = err.response?.data?.error || 'Failed to load sale return details.';
        toast.error(errorMessage);
        setLoading(false);
      });
  }, [id, navigate]);

  const handleSave = (e) => {
    e.preventDefault();

    if (submitting) return;

    const headers = getAuthHeaders();
    if (!headers) {
      return;
    }

    setSubmitting(true);

    const selectedProducts = products.filter(p => p.selected);

    const payload = {
      reason: returnReason,
      products: selectedProducts.map(p => ({
        sale_item_id: p.sale_item_id,
        product_id: p.product_id,
        remark: p.remark || '',
      }))
    };

    axios.put(`http://localhost:8000/api/update/${id}`, payload, headers) // Pass the headers here
      .then(() => {
        toast.success('Return updated successfully!', { autoClose: 3000 });
        setTimeout(() => navigate('/salesReturn'), 1500);
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Update failed';
        toast.error(msg, { autoClose: 3000 });
        console.error(err);
        setSubmitting(false);
      });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-4 fw-bold text-dark">Sale Return Details</h4>
        <Button variant="outline-secondary" onClick={() => navigate('/salesReturn')}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>

      <Form onSubmit={handleSave} className="border p-4 rounded shadow-sm bg-white">
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Customer</Form.Label>
              <Form.Control readOnly value={formData.customer_name} className="bg-light border-0 text-muted" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Batch</Form.Label>
              <Form.Control readOnly value={formData.batch} className="bg-light border-0 text-muted" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Category</Form.Label>
              <Form.Control readOnly value={formData.category} className="bg-light border-0 text-muted" />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Shipment Date</Form.Label>
              <Form.Control readOnly value={formData.shipment_date} className="bg-light border-0 text-muted" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Delivery Date</Form.Label>
              <Form.Control readOnly value={formData.delivery_date} className="bg-light border-0 text-muted" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Tracking No.</Form.Label>
              <Form.Control readOnly value={formData.tracking_no} className="bg-light border-0 text-muted" />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Group>
              <Form.Label>Return Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col>
            <h5 className="fw-semibold mb-3">Returned Product Serials</h5>
            <div className="table-responsive">
              <Table bordered size="sm">
                <thead>
                  <tr className="table-light">
                    <th>S.No</th>
                    <th>Serial No</th>
                    <th>Remark</th>
                    <th className="text-center">Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod, idx) => (
                    <tr key={prod.product_id}>
                      <td>{idx + 1}</td>
                      <td>{prod.serial_no}</td>
                      <td>
                        <Form.Control
                          size="sm"
                          value={prod.remark || ''}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].remark = e.target.value;
                            setProducts(updated);
                          }}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={prod.selected || false}
                          onChange={(e) => {
                            const updated = [...products];
                            updated[idx].selected = e.target.checked;
                            setProducts(updated);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col className="text-end">
            <Button type="submit" variant="success" className="me-2" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update'}
            </Button>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}