import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, Table, Spinner, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../api';

export default function EditPurchaseReturnPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [purchaseData, setPurchaseData] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnId, setReturnId] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      axios
        .get(`${API_BASE_URL}/purchase-return-by-id/${id}`)
        .then((res) => {
          setPurchaseData(res.data.purchase);
          setReturnId(res.data.return_id ?? null);
          setReason(res.data.purchase.reason || '');
          setReturnItems(
            res.data.items.map((item) => ({
              ...item,
              selected: item.selected || false,
              remark: item.remark || '',
              quality_check: item.quality_check || '',
            }))
          );
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || 'Failed to load purchase return details.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const selectedItems = returnItems.filter((i) => i.selected);

    const payload = {
      pcb_board_purchase_id: purchaseData.id,
      reason: reason,
      items: selectedItems.map((item) => ({
        id: item.id,
        remark: item.remark,
        quality_check: item.quality_check,
      })),
    };

    axios
      .put(`${API_BASE_URL}/purchase-returns/${returnId}`, payload)
      .then(() => {
        toast.success('Return updated successfully!', { autoClose: 3000 });
        setTimeout(() => navigate(-1), 1500);
      })
      .catch((err) => {
        toast.error('Failed: ' + (err.response?.data?.message || err.message));
        setSubmitting(false);
      });
  };

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-dark mb-0">
          Edit Purchase Return
          {purchaseData?.invoice_no && ` - ${purchaseData.invoice_no}`}
        </h4>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-4">
              {/* Left Column: Reason */}
              <Col md={6}>
                <h6 className="fw-semibold mb-3">Reason for Return</h6>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Write reason if any..."
                />
              </Col>

              {/* Right Column: Purchase Details */}
              <Col md={6}>
                <h6 className="fw-semibold mb-3">Purchase Details</h6>
                <div
                  style={{
                    backgroundColor: '#e3e3e6',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}
                >
               <Row className="gx-4 gy-2 text-muted">
  <Col md={6}>
    <span className="text-dark fw-semibold">Vendor:</span> {purchaseData.vendor_name}
  </Col>
  {/* <Col md={6}>
    <span className="text-dark fw-semibold">Category:</span> {purchaseData.category_name}
  </Col> */}
  <Col md={6}>
    <span className="text-dark fw-semibold">Invoice No:</span> {purchaseData.invoice_no}
  </Col>
  <Col md={6}>
    <span className="text-dark fw-semibold">Invoice Date:</span> {purchaseData.invoice_date}
  </Col>
  <Col md={6}>
    <span className="text-dark fw-semibold">Mobile:</span> {purchaseData.mobile}
  </Col>
  <Col md={6}>
    <span className="text-dark fw-semibold">Email:</span> {purchaseData.email}
  </Col>
  <Col md={6}>
    <span className="text-dark fw-semibold">Address:</span> {purchaseData.address}
  </Col>
  <Col md={6}>
    <span className="text-dark fw-semibold">City:</span> {purchaseData.city}
  </Col>
</Row>

                </div>
              </Col>
            </Row>

            {/* Returned Items Table */}
            {/* Returned Items Table */}
{returnItems.length > 0 && (
  <section className="mb-4">
    <h6 className="fw-semibold mb-2">Returned Product Serials</h6>
    <div className="table-responsive">
      <Table bordered hover size="sm" className="align-middle">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Serial No</th>
            <th>Category</th> {/* Added Category Column */}
            <th>Remark</th>
            <th className="text-center">Returned?</th>
          </tr>
        </thead>
        <tbody>
          {returnItems.map((item, idx) => (
            <tr key={item.id}>
              <td>{idx + 1}</td>
              <td>{item.serial_no}</td>
              <td>{item.category_name}</td> {/* Show category for each row */}
              <td>
                <Form.Control
                  size="sm"
                  value={item.remark}
                  onChange={(e) => {
                    const updated = [...returnItems];
                    updated[idx].remark = e.target.value;
                    setReturnItems(updated);
                  }}
                />
              </td>
              <td className="text-center">
                <Form.Check
                  type="checkbox"
                  checked={item.selected || false}
                  onChange={(e) => {
                    const updated = [...returnItems];
                    updated[idx].selected = e.target.checked;
                    setReturnItems(updated);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  </section>
)}

            {/* Buttons */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}