import React, { useState } from "react";
import { Container, Form, Button, Spinner, Row, Col, Card } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../api";
import { FaBox, FaShoppingCart, FaTruck, FaUser, FaTools } from "react-icons/fa";

const SerialStockCheckPage = () => {
  const [serialNo, setSerialNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);  // Initializing error state to null

  const handleCheckStock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeline([]);
    setError(null);  // Reset error on new request

    try {
      const res = await axios.get(`${API_BASE_URL}/products/validate-stock/${serialNo}`);
      const data = res.data;

      if (data?.status && data.timeline) {
        const tl = [];

        if (data.timeline.purchase) {
          const purchase = data.timeline.purchase;
          tl.push({
            title: "Purchase",
            icon: <FaShoppingCart />,
            desc: [
              { label: "Invoice", value: purchase.invoice_no || "N/A" },
              { label: "Category", value: purchase.category || "N/A" },
              { label: "Vendor", value: purchase.vendor?.name || "N/A" },
              { label: "Company", value: purchase.vendor?.company_name || "N/A" },
              { label: "Sent Date", value: purchase.sent_date || "N/A" },
              { label: "Received Date", value: purchase.received_date || "N/A" },
              { label: "Transportation", value: purchase.transportation || "N/A" },
            ],
            date: purchase.invoice_date,
          });
        }

        if (data.timeline.product) {
          const product = data.timeline.product.details;
          tl.push({
            title: "Product",
            icon: <FaBox />,
            desc: [
              { label: "Serial No", value: product.serial_no || "N/A" },
              { label: "HSN Code", value: product.hsn_code || "N/A" },
              { label: "Firmware Version", value: product.firmware_version || "N/A" },
              { label: "Sale Status", value: product.sale_status || "N/A" },
              { label: "Test Status", value: product.test || "N/A" },
              { label: "Category", value: product.category?.category || "N/A" },
            ],
            date: product.created_at,
          });
        }

        if (data.timeline.sale) {
          const sale = data.timeline.sale;
          tl.push({
            title: "Sale",
            icon: <FaTruck />,
            desc: [
              { label: "Invoice No", value: sale.invoice_no || "N/A" },
              { label: "Invoice Date", value: sale.invoice_date || "N/A" },
              { label: "Category", value: sale.category_name || "N/A" },
              { label: "Quantity", value: sale.quantity || "N/A" },
              { label: "Shipment Date", value: sale.shipment_date || "N/A" },
              { label: "Delivery Date", value: sale.delivery_date || "N/A" },
              { label: "Transportation", value: sale.shipment_name || "N/A" },
              { label: "Customer Name", value: sale.customer?.name || "N/A" },
              { label: "Customer Address", value: sale.customer?.address || "N/A" },
            ],
            date: sale.invoice_date,
          });
        }

        if (data.timeline.service && data.timeline.service.length > 0) {
          data.timeline.service.forEach((svc, idx) => {
            tl.push({
              title: `Service Step ${idx + 1}`,
              icon: <FaTools />,
              desc: [
                { label: "From → To", value: `${svc.from_place} → ${svc.to_place}` },
                { label: "Challan", value: svc.challan_no },
                { label: "Issue", value: svc.action_taken },
                { label: "Status", value: svc.testing_status },
                { label: "Sent Date", value: svc.sent_date || "N/A" },
                { label: "Received Date", value: svc.received_date || "N/A" },
                { label: "Transportation", value: svc.courier_name || "N/A" },
              ],
              date: svc.timestamps?.created_at,
            });
          });
        }

        setTimeline(tl);
        toast.success("Timeline fetched successfully!");
      } else {
        setError(
          <div style={{ textAlign: "center" }}>
            <img
              src="/empty-box.png"
              alt="No data"
              style={{ width: "80px", height: "100px", opacity: 0.6 }}
            />
            <p style={{ color: "#2E3A59", fontSize: "1rem", marginTop: "10px" }}>
              No timeline data found for the given serial number.
            </p>
          </div>
        );
      }
    } catch (err) {
      setError(
        <div style={{ textAlign: "center" }}>
          <img
            src="/empty-box.png"
            alt="Error"
            style={{ width: "80px", height: "100px", opacity: 0.6 }}
          />
          <p style={{ color: "#2E3A59", fontSize: "1rem", marginTop: "10px" }}>
            No data available for the given serial number.
          </p>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return isNaN(d) ? "N/A" : d.toLocaleString();
  };

  return (
    <Container className="mt-4">
      <h3 className="text-center mb-4 fw-bold" style={{ color: "#2FA64F" }}>Stock Timeline</h3>

      <Form onSubmit={handleCheckStock} className="mb-4">
        <Row className="justify-content-center g-2">
          <Col md={5}>
            <Form.Control
              type="text"
              placeholder="Enter Serial Number"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              required
            />
          </Col>
          <Col md="auto">
            <Button type="submit" disabled={loading} style={{ backgroundColor: "#2FA64F", borderColor: "#2FA64F" }}>
              {loading ? <Spinner animation="border" size="sm" /> : "Check Stock"}
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Show error (image and message) if setError is not null */}
      {error && <div>{error}</div>}

      {/* Display Timeline */}
      {timeline.length > 0 && (
        <div className="timeline-container position-relative">
          <div className="timeline-line"></div>
          {timeline.map((item, index) => (
            <div key={index} className={`timeline-item ${index % 2 === 0 ? "left" : "right"}`}>
              <div className="timeline-icon" style={{ background: "#2FA64F" }}>{item.icon}</div>
              <Card className="timeline-card shadow-sm">
                <Card.Body>
                  <div className="timeline-title fw-bold" style={{ color: "#2E3A59" }}>{item.title}</div>
                  <Row>
                    <Col md={6}>
                      {item.desc.slice(0, Math.ceil(item.desc.length / 2)).map((data, idx) => (
                        <div key={idx} className="timeline-data" style={{ color: "#2E3A59" }}>
                          <strong>{data.label}:</strong> <span>{data.value}</span>
                        </div>
                      ))}
                    </Col>
                    <Col md={6}>
                      {item.desc.slice(Math.ceil(item.desc.length / 2)).map((data, idx) => (
                        <div key={idx} className="timeline-data" style={{ color: "#2E3A59" }}>
                          <strong>{data.label}:</strong> <span>{data.value}</span>
                        </div>
                      ))}
                    </Col>
                  </Row>
                  <div className="timeline-date" style={{ color: "#2E3A59" }}>{formatDate(item.date)}</div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .timeline-container {
          position: relative;
          margin: 50px 0;
          padding: 0 50px;
        }
        .timeline-line {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          width: 4px;
          height: 100%;
          background: #dee2e6;
          border-radius: 2px;
          z-index: 0;
        }
        .timeline-item {
          position: relative;
          width: 50%;
          padding: 20px 25px;
          box-sizing: border-box;
        }
        .timeline-item.left {
          left: 0;
          text-align: right;
        }
        .timeline-item.right {
          left: 50%;
          text-align: left;
        }
        .timeline-item .timeline-icon {
          position: absolute;
          top: 15px;
          width: 30px;
          height: 30px;
          background: #2E3A59;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 14px;
          z-index: 1;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
        }
        .timeline-item.left .timeline-icon {
          right: -15px;
        }
        .timeline-item.right .timeline-icon {
          left: -15px;
        }
        .timeline-card {
          border-radius: 10px;
          padding: 10px;
          background: #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .timeline-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
        }
        .timeline-title {
          font-size: 0.85rem;
          margin-bottom: 8px;
          color: #2E3A59;
          text-transform: uppercase;
        }
        .timeline-data {
          font-size: 0.8rem;
          margin-bottom: 6px;
        }
        .timeline-data strong {
          color: #2E3A59;
        }
        .timeline-date {
          font-size: 0.7rem;
          color: #2E3A59;
          margin-top: 8px;
        }
      `}</style>
    </Container>
  );
};

export default SerialStockCheckPage; 