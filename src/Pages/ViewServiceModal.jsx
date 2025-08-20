import React, { useEffect, useState } from "react";
import { Modal, Row, Col, Card, Spinner } from "react-bootstrap";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const ViewServiceModal = ({ show, onHide, challanNo }) => {
  const [fullDetails, setFullDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    if (show && challanNo) {
      setLoading(true);
      setFullDetails(null);

      axios
        .get(`${API_BASE_URL}/serviceVci/${challanNo}`)
        .then((res) => {
          if (res.data.status === "success") {
            setFullDetails(res.data.data);
          } else {
            console.error("API error:", res.data.message);
          }
        })
        .catch((err) => console.error("Request failed:", err))
        .finally(() => setLoading(false));
    }
  }, [show, challanNo]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton style={{ backgroundColor: "#2E3A59", color: "white" }}>
        <Modal.Title>Service VCI Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="text-center my-4">
            <Spinner animation="border" /> <p>Loading...</p>
          </div>
        )}

        {!loading && !fullDetails && <p className="text-danger">No data found.</p>}

        {!loading && fullDetails && (
          <>
            <h5>Challan Info</h5>
            <Row>
              <Col><strong>No:</strong> {fullDetails.service.challan_no}</Col>
              <Col><strong>Date:</strong> {fullDetails.service.challan_date}</Col>
            </Row>
              <Row>
              <Col><strong>Sent Date</strong> {fullDetails.service.sent_date}</Col>
              <Col><strong>Received Date:</strong> {fullDetails.service.received_date}</Col>
            </Row>
            <Row>
              <Col><strong>From:</strong> {fullDetails.service.from_place}</Col>
              <Col><strong>To:</strong> {fullDetails.service.to_place}</Col>
            </Row>
            <Row>
              <Col><strong>Status:</strong> {fullDetails.service.status}</Col>
              <Col><strong>Transportation:</strong> {fullDetails.service.courier_name}</Col>
            </Row>

            <hr />
            <h5>Items</h5>
            {fullDetails.items.length === 0 ? (
              <p>No items found.</p>
            ) : (
              fullDetails.items.map((item) => (
                <Card key={item.id} className="mb-3 p-2">
                  <h6>VCI Serial: {item.vci_serial_no}</h6>
                  <p><strong>Issue:</strong> {item.issue_found || "N/A"}</p>
                  <p><strong>Action Taken:</strong> {item.action_taken || "N/A"}</p>

                  <h6>Spare Parts</h6>
                  {item.spare_parts?.length ? (
                    <ul>
                      {item.spare_parts.map((sp, i) => (
                        <li key={i}>
                          {sp.sparepart_name} - Qty: {sp.quantity}, Status: {sp.status}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No spare parts</p>
                  )}
                </Card>
              ))
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ViewServiceModal;
