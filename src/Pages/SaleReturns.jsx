import React, { useEffect, useState } from 'react';
import { Form, Button, Row, Col, Table, Card } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from "../api";


export default function SaleReturns() {
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [saleId, setSaleId] = useState(null);
    const [serials, setSerials] = useState([]);
    const [reason, setReason] = useState('');
    const [saleInfo, setSaleInfo] = useState(null);

       const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const navigate = useNavigate();
       const location = useLocation();


    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            // If no token is found, redirect to login
            toast.error("Authentication token missing. Please log in again.", { toastId: 'auth-error' });
            navigate('/login');
            return {};
        }
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    };

    useEffect(() => {
        // Check for token at the start
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.error("Please log in to access this page.", { toastId: 'auth-error' });
            navigate('/login');
            return;
        }

        // Fetch invoices
        axios.get(`${API_BASE_URL}/invoice`, getAuthHeaders())
            .then(res => {
                const invoiceOptions = res.data.map(item => ({
                    label: item.invoice_no,
                    value: item.id
                }));
                setInvoices(invoiceOptions);
            })
            .catch(() => toast.error('Failed to load invoices'));
    }, [navigate]);



    

    const handleInvoiceChange = (option) => {
        setSelectedInvoice(option);
        setSerials([]);
        setSaleId(null);

        axios.get(`${API_BASE_URL}/sale-return/invoice/${option.label}`, getAuthHeaders())
            .then(res => {
                const data = res.data.products.map(item => ({
                    ...item,
                    checked: false,
                    remark: ''
                }));
                setSerials(data);
                setSaleId(res.data.sale_id);

                setSaleInfo({
                    customer_name: res.data.customer.first_name,
                    // batch_name: res.data.batch,
                    category_name: res.data.category,
                    shipment_name: res.data.shipment_name,
                    shipment_date: res.data.shipment_date,
                    delivery_date: res.data.delivery_date,
                });
            })
            .catch(() => toast.error('No serial numbers found for this invoice'));
    };


    useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invoiceFromUrl = params.get("invoice") || "";
    if (invoiceFromUrl) {
        const option = { label: invoiceFromUrl, value: invoiceFromUrl };
        setSelectedInvoice(option);
        handleInvoiceChange(option);  // ✅ use existing function
    }
}, [location.search]);

    const handleCheckboxChange = (idx) => {
        const updated = [...serials];
        updated[idx].checked = !updated[idx].checked;
        setSerials(updated);
    };

    const handleRemarkChange = (idx, value) => {
        const updated = [...serials];
        updated[idx].remark = value;
        setSerials(updated);
    };

    const handleSubmit = () => {
        const selectedProducts = serials.filter(item => item.checked);
        if (selectedProducts.length === 0) {
            toast.error('Please select at least one product to return.');
            return;
        }

        const payload = {
            sale_id: saleId,
            reason,
            products: selectedProducts.map(item => ({
                sale_item_id: item.sale_item_id,
                product_id: item.product_id,
                remark: item.remark
            }))
        };

        axios.post(`${API_BASE_URL}/sale-return-store`, payload, getAuthHeaders())
            .then(() => {
                toast.success('Return processed successfully!');
                navigate('/salesReturn');
                setSelectedInvoice(null);
                setSaleId(null);
                setSerials([]);
                setReason('');
            })
            .catch(err => {
                toast.error('Failed to process return');
                console.error(err.response?.data || err.message);
            });
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-4 fw-bold text-dark">Sales Return</h4>
                <Button variant="outline-secondary" onClick={() => navigate('/salesReturn')}>
                    <i className="bi bi-arrow-left" /> Back
                </Button>
            </div>
            <Card className="shadow-sm border-0">
                <Card.Body>
                    {/* Top 2-column Layout */}
                    <Row className="mb-4">
                        {/* Left Side: Invoice & Reason */}
                        <Col md={6}>
                            <section className="mb-4">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Invoice No.</Form.Label>
                                    <Select
                                        options={invoices}
                                        value={selectedInvoice}
                                        onChange={handleInvoiceChange}
                                        placeholder="Search invoice..."
                                        classNamePrefix="react-select"
                                    />
                                </Form.Group>
                            </section>

                            <section>
                                <h6 className="fw-semibold mb-2">Reason for Return</h6>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Write reason if any..."
                                />
                            </section>
                        </Col>

                        {/* Right Side: Product Details */}
                        <Col md={6}>
                            <section>
                                <h6 className="fw-semibold mb-2">Product Details</h6>
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
                                            <span className="text-dark fw-semibold">Customer:</span> {saleInfo?.customer_name || ''}
                                        </Col>
                                        {/* <Col md={6}>
                                            <span className="text-dark fw-semibold">Batch:</span> {saleInfo?.batch_name || ''}
                                        </Col> */}
                                        <Col md={6}><span className="text-dark fw-semibold">Category:</span>{saleInfo?.category_name || ''}</Col>
                                        <Col md={6}>
                                            <span className="text-dark fw-semibold">Shipment Name:</span> {saleInfo?.shipment_name || ''}
                                        </Col>
                                        <Col md={6}>
                                            <span className="text-dark fw-semibold">Shipment Date:</span> {saleInfo?.shipment_date || ''}
                                        </Col>
                                        <Col md={6}>
                                            <span className="text-dark fw-semibold">Delivery Date:</span> {saleInfo?.delivery_date || ''}
                                        </Col>
                                    </Row>
                                </div>
                            </section>
                        </Col>
                    </Row>

                    {/* Returnable Products Table */}
                    {serials.length > 0 && (
                        <section className="mb-4">
                            <h6 className="fw-semibold mb-2">Returnable Products</h6>
                            <div className="table-responsive">
                                <Table bordered hover size="sm" className="align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Serial No</th>
                                            <th>Remark</th>
                                            <th className="text-center">Return?</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {serials.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td>{item.serial_no}</td>
                                                <td>
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        value={item.remark}
                                                        onChange={(e) => handleRemarkChange(idx, e.target.value)}
                                                        placeholder="Enter remark"
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={item.checked}
                                                        onChange={() => handleCheckboxChange(idx)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </section>
                    )}

                    {/* Action Buttons */}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button variant="success" onClick={handleSubmit}>
                            Submit Return
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}