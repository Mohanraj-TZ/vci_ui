import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Form, Button, Table, Card, Row, Col, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from "../api";

export default function PurchaseReturnPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [invoiceList, setInvoiceList] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [purchaseData, setPurchaseData] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState('');
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
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

    // This useEffect combines the auth check and invoice fetch, running only once on component mount.
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.error("Please log in to access this page.", { toastId: 'auth-error' });
            navigate('/login');
            return;
        }

        setLoadingInvoices(true);
        axios.get(`${API_BASE_URL}/purchases/invoices`, getAuthHeaders())
            .then(res => {
                const options = res.data.map(inv => ({
                    label: inv.invoice_no,
                    value: inv.invoice_no
                }));
                setInvoiceList(options);
            })
            .catch(() => toast.error('Failed to fetch invoices'))
            .finally(() => setLoadingInvoices(false));
    }, [navigate]); // Added `navigate` to the dependency array

    // Fetch invoice from URL if provided
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const invoiceFromUrl = params.get('invoice') || '';
        if (invoiceFromUrl) {
            const option = { label: invoiceFromUrl, value: invoiceFromUrl };
            setSelectedInvoice(option);
            fetchDetails(invoiceFromUrl);
        }
    }, [location.search]);

    const fetchDetails = (invoice) => {
        setLoadingDetails(true);
        axios.get(`${API_BASE_URL}/purchase-return/${invoice}`, getAuthHeaders())
            .then(res => {
                setPurchaseData(res.data.purchase);
                const items = res.data.items.map(item => ({
                    ...item,
                    selected: false,
                    remark: ''
                }));
                setReturnItems(items);
                setReason('');
            })
            .catch(() => toast.error('Failed to fetch purchase details'))
            .finally(() => setLoadingDetails(false));
    };

    const handleSubmit = () => {
        const selectedItems = returnItems.filter(i => i.selected);
        if (!selectedItems.length) {
            toast.warning('No items selected for return');
            return;
        }
        if (!purchaseData) {
            toast.error('No purchase data loaded');
            return;
        }

        const payload = {
            pcb_board_purchase_id: purchaseData.id,
            items: selectedItems.map(item => ({
                id: item.id,
                remark: item.remark
            }))
        };

        axios.post(`${API_BASE_URL}/purchase-returns`, payload, getAuthHeaders())
            .then(() => {
                toast.success('Returned successfully!');
                setSelectedInvoice(null);
                setPurchaseData(null);
                setReturnItems([]);
                setReason('');
                navigate('/purchaseReturn');
            })
            .catch((error) => {
                console.error("Error submitting return:", error.response || error.message);
                const errorMessage = error.response?.data?.message || 'Failed to submit return.';
                toast.error(errorMessage);
            });
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-4 fw-bold text-dark">Purchase Return</h4>
                <Button variant="outline-secondary" onClick={() => navigate('/purchaseReturn')}>
                    <i className="bi bi-arrow-left" /> Back
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body>
                    <Row className="mb-4">
                        {/* Left Column */}
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Invoice No.</Form.Label>
                                <Select
                                    options={invoiceList}
                                    value={selectedInvoice}
                                    onChange={(option) => {
                                        setSelectedInvoice(option);
                                        if (option) {
                                            fetchDetails(option.value);
                                        } else {
                                            setPurchaseData(null);
                                            setReturnItems([]);
                                            setReason('');
                                        }
                                    }}
                                    placeholder="Search invoice..."
                                    classNamePrefix="react-select"
                                    isLoading={loadingInvoices}
                                />
                            </Form.Group>

                            <Form.Group>
                                <h6 className="fw-semibold mb-2">Reason for Return</h6>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Write reason if any..."
                                />
                            </Form.Group>
                        </Col>

                        {/* Right Column */}
                        <Col md={6}>
                            <h6 className="fw-semibold mb-2">Purchase Details</h6>
                            <div
                                style={{
                                    backgroundColor: '#e3e3e6',
                                    padding: '14px 18px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                }}
                            >
                                {loadingDetails && <Spinner animation="border" size="sm" />}
                                {purchaseData && (
                                    <Row className="gx-4 gy-2 text-muted">
                                        <Col md={6}>
                                            <span className="text-dark fw-semibold">Vendor:</span> {purchaseData.first_name} {purchaseData.last_name}
                                        </Col>
                                        <Col md={6}>
                                            <span className="text-dark fw-semibold">Company:</span> {purchaseData.company_name || ''}
                                        </Col>
                                        <Col md={6}>
                                            <span className="text-dark fw-semibold">Category:</span> {purchaseData.category_name}
                                        </Col>
                                        <Col md={6}>
                                            <span className="text-dark fw-semibold">Invoice Date:</span> {purchaseData.invoice_date}
                                        </Col>
                                        {/* <Col md={6}>
                                            <span className="text-dark fw-semibold">Quantity:</span> {purchaseData.quantity}
                                        </Col> */}
                                    </Row>
                                )}
                            </div>
                        </Col>
                    </Row>

                    {/* Returnable Items Table */}
                    {returnItems.length > 0 && (
                        <section className="mb-4">
                            <h6 className="fw-semibold mb-2">Returnable Items</h6>
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
                                        {returnItems.map((item, index) => (
                                            <tr key={item.id}>
                                                <td>{index + 1}</td>
                                                <td>{item.serial_no}</td>
                                                <td>
                                                    <Form.Control
                                                        size="sm"
                                                        value={item.remark}
                                                        onChange={(e) => {
                                                            const updated = [...returnItems];
                                                            updated[index].remark = e.target.value;
                                                            setReturnItems(updated);
                                                        }}
                                                        placeholder="Enter remark"
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={item.selected}
                                                        onChange={(e) => {
                                                            const updated = [...returnItems];
                                                            updated[index].selected = e.target.checked;
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

                    {/* Action Buttons */}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button variant="outline-secondary" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button variant="success" onClick={handleSubmit}>Submit Return</Button>
                    </div>
                </Card.Body>
            </Card>

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}
