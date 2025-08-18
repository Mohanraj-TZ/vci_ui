import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../api";
import { Card, Spinner, ListGroup, Alert, Button, Container, Row, Col } from "react-bootstrap";
import Breadcrumb from "./Components/Breadcrumb";

const TrackingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challanData, setChallanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);

    // useEffect(() => {
    //     const fetchCategories = async () => {
    //         try {
    //             const response = await axios.get(`${API_BASE_URL}/categories`);
    //             if (response.data.status === 'success') {
    //                 setCategories(response.data.data);
    //             } else {
    //                 toast.error("Failed to fetch categories");
    //             }
    //         } catch (err) {
    //             toast.error("Error fetching categories");
    //         }
    //     };
    //     fetchCategories();
    // }, []);

    useEffect(() => {
        const fetchTrackingData = async () => {
            if (!id) {
                setLoading(false);
                setError("No challan ID provided in the URL.");
                return;
            }

            try {
                const response = await axios.get(`${API_BASE_URL}/service-vci/${id}/track`);

                if (response.data.status === 'success') {
                    setChallanData(response.data.data);
                } else {
                    setError(response.data.message || "Failed to fetch tracking details.");
                    toast.error(response.data.message || "Failed to fetch tracking details.");
                }
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch tracking details.");
                toast.error(err.response?.data?.message || "Failed to fetch tracking details.");
                setLoading(false);
            }
        };

        fetchTrackingData();
    }, [id]);

    if (loading) {
        return <div className="text-center py-5"><Spinner animation="border" /></div>;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    if (!challanData) {
        return <Alert variant="warning">No tracking data found for this challan.</Alert>;
    }

    // Helper function to find the category name using the correct key 'category'
    const getCategoryName = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.category : 'N/A';
    };

    return (
        <Container className="px-4 py-2">
            <Button variant="secondary" className="mb-3" onClick={() => navigate(-1)}>
                &larr; Back
            </Button>

            <Breadcrumb title={`Tracking Challan: ${challanData.challan_no}`} />
            
            <Row>
                {/* Left Side: Challan Details */}
                <Col md={6} className="mb-4">
                    <Card>
                        <Card.Header className="#2E3A59 text-dark">
                            <h4 className="mb-0">Challan Details</h4>
                        </Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>Challan No:</strong> {challanData.challan_no}</ListGroup.Item>
                                <ListGroup.Item><strong>Challan Date:</strong> {challanData.challan_date}</ListGroup.Item>
                                <ListGroup.Item><strong>From:</strong> {challanData.from_place}</ListGroup.Item>
                                <ListGroup.Item><strong>To:</strong> {challanData.to_place}</ListGroup.Item>
                                <ListGroup.Item><strong>Total VCI Items:</strong> {challanData.vci_items?.length || 0}</ListGroup.Item>
                                <ListGroup.Item><strong>Status:</strong> <span className={`badge ${challanData.status === 'Completed' ? 'bg-success' : 'bg-info'}`}>{challanData.status}</span></ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Side: VCI Details */}
                <Col md={6}>
                    {challanData.vci_items && challanData.vci_items.length > 0 ? (
                        <>
                            <h4 className="mb-4">VCI Items Tracking</h4>
                            {challanData.vci_items.map((vci) => (
                                <Card key={vci.vci_details.id} className="mb-4 shadow-sm">
                                    <Card.Header className="bg-light">
                                        <h5 className="mb-0">VCI Serial No: <span className="text-dark">{vci.vci_details.vci_serial_no}</span></h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <ListGroup variant="flush">
                                                    <ListGroup.Item>
                                                        <strong>Category:</strong> {getCategoryName(vci.vci_details.category_id)}
                                                    </ListGroup.Item>
                                                    <ListGroup.Item>
                                                        <strong>Send date:</strong> {challanData.challan_date ? new Date(challanData.challan_date).toLocaleString() : 'N/A'}
                                                    </ListGroup.Item>
                                                    <ListGroup.Item>
                                                        <strong>Received date:</strong> {vci.vci_details.updated_at ? new Date(vci.vci_details.updated_at).toLocaleString() : 'N/A'}
                                                    </ListGroup.Item>
                                                </ListGroup>
                                            </Col>
                                            <Col md={6}>
                                                <ListGroup variant="flush">
                                                    <ListGroup.Item>
                                                        <strong>Testing Status:</strong> <span className={`badge ${vci.vci_details.testing_status === 'Passed' ? 'bg-success' : 'bg-danger'}`}>{vci.vci_details.testing_status}</span>
                                                    </ListGroup.Item>
                                                    <ListGroup.Item>
                                                        <strong>Issue Found:</strong> {vci.vci_details.issue_found || 'None'}
                                                    </ListGroup.Item>
                                                </ListGroup>
                                            </Col>
                                        </Row>
                                        
                                        <Row className="mt-4">
                                            <Col md={12}>
                                                {vci.movement_history && vci.movement_history.length > 0 && (
                                                    <div className="mb-3">
                                                        <h6>Movement History</h6>
                                                        <ListGroup variant="flush">
                                                            {vci.movement_history.map((movement, mIdx) => (
                                                                <ListGroup.Item key={mIdx} className="d-flex justify-content-between align-items-center">
                                                                    <span>
                                                                        From <strong>{movement.from_place}</strong> to <strong>{movement.to_place}</strong>
                                                                    </span>
                                                                    <small className="text-muted">{new Date(movement.movement_date).toLocaleString()}</small>
                                                                </ListGroup.Item>
                                                            ))}
                                                        </ListGroup>
                                                    </div>
                                                )}

                                                {vci.repair_history && vci.repair_history.length > 0 && (
                                                    <div className="mt-4">
                                                        <h6>Repair History</h6>
                                                        {vci.repair_history.map((repair, rIdx) => (
                                                            <div key={rIdx} className="border p-3 mb-2 rounded bg-light">
                                                                <p className="mb-1"><strong>Repair Challan:</strong> {repair.challan_no}</p>
                                                                <p className="mb-1"><strong>Repair Date:</strong> {new Date(repair.repair_date).toLocaleString()}</p>
                                                                <p className="mb-1"><strong>Status:</strong> <span className="badge bg-secondary">{repair.status}</span></p>
                                                                {repair.parts_used && repair.parts_used.length > 0 && (
                                                                    <div className="mt-2">
                                                                        <strong>Parts Used:</strong>
                                                                        <ListGroup variant="flush" className="mt-1">
                                                                            {repair.parts_used.map((part, pIdx) => (
                                                                                <ListGroup.Item key={pIdx} className="p-1 border-0">
                                                                                    {part.component_name}: {part.quantity_used} pcs
                                                                                </ListGroup.Item>
                                                                            ))}
                                                                        </ListGroup>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ))}
                        </>
                    ) : (
                        <Alert variant="info">No VCI items found for this challan.</Alert>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default TrackingPage;