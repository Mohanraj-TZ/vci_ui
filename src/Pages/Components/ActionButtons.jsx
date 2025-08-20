// src/components/ActionButtons.jsx
import React from "react";
import { Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function ActionButtons({ onPdf, onEdit, onDelete, onReturn, onTrack, onRepair, onWarranty }) {
  return (
    <>
      {onPdf && (
        <Button
          variant=""
          size="sm"
          className="me-1"
          onClick={onPdf}
          style={{
            borderColor: "#2E3A59",
            color: "#2E3A59",
            backgroundColor: "transparent",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
        >
          <i className="bi bi-file-earmark-pdf"></i>
        </Button>
      )}

      {onEdit && (
        <Button
          variant=""
          size="sm"
          className="me-1"
          onClick={onEdit}
          style={{
            borderColor: "#2E3A59",
            color: "#2E3A59",
            backgroundColor: "transparent",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
        >
          <i className="bi bi-pencil-square"></i>
        </Button>
      )}

      {onDelete && (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={onDelete}
          style={{
            borderColor: "#2E3A59",
            color: "#2E3A59",
            backgroundColor: "transparent",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
        >
          <i className="bi bi-trash"></i>
        </Button>
      )}

      {onReturn && (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={onReturn}
          title="Return Purchase"
          style={{
            borderColor: "#2E3A59",
            color: "#2E3A59",
            backgroundColor: "transparent",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
        >
          <i className="bi bi-arrow-return-left"></i>
        </Button>
      )}

      {onTrack && (
        <Button
          size="sm"
          variant="outline-primary"
          title="Track"
          onClick={onTrack}
          className="me-1"
          style={{
            borderColor: "#2E3A59",
            color: "#2E3A59",
            backgroundColor: "transparent",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
        >
          <i className="bi bi-geo-alt"></i>
        </Button>
      )}

      {onRepair && (
        <Button
          size="sm"
          variant="outline-warning"
          title="Repair"
          onClick={onRepair}
          className="me-1"
          style={{
            borderColor: "#2E3A59",
            color: "#2E3A59",
            backgroundColor: "transparent",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
        >
          <i className="bi bi-tools"></i>
        </Button>
      )}

      {/* Warranty Button */}
      {onWarranty && (
        <Button
          size="sm"
          variant="outline-primary"
          title="Warranty"
          onClick={onWarranty}
          className="me-1"
          style={{
            borderColor: "#2E3A59",
            color: "#2E3A59",
            backgroundColor: "transparent",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
        >
          <i className="bi bi-shield-check"></i>
        </Button>
      )}
    </>
  );
}
