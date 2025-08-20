import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeGroup = {
    product: ["batch", "category", "productTest", "sold"],
    metadata: ["state", "district", "countries"],
    components: ["Spareparts", "PurchaseSpareparts", "ReturnSpareParts"],
  };

  const activeColor = "#28a745";

  const isActive = (link) =>
    location.pathname.includes(link) ||
    activeGroup[link]?.some((child) => location.pathname.includes(child));

  const [productOpen, setProductOpen] = useState(isActive("product"));
  const [metadataOpen, setMetadataOpen] = useState(isActive("metadata"));
  const [componentsOpen, setComponentsOpen] = useState(isActive("components"));
  const [serviceVCIOpen, setServiceVCIOpen] = useState(false);

  useEffect(() => {
    setProductOpen(isActive("product"));
    setMetadataOpen(isActive("metadata"));
    setComponentsOpen(isActive("components"));
  }, [location.pathname]);

  const handleLinkClick = (link) => navigate(`/${link}`);

  const linkClass = (link) =>
    `sidebar-link d-flex align-items-center gap-2 text-decoration-none rounded ${isActive(link) ? "active-parent active-link" : ""
    }`;

  const subLinkClass = (link) =>
    `sidebar-sublink d-block text-decoration-none ps-4 ${location.pathname === `/${link}` ? "active" : ""
    }`;

  return (
    <aside
      className="d-flex flex-column sidebar-container"
      style={{
        width: collapsed ? "80px" : "260px",
        height: "100vh",
        backgroundColor: "#2E3A59",
        fontFamily: "Product Sans, sans-serif",
        overflow: "hidden",
        transition: "width 0.3s",
         fontSize: "15px",
      }}
    >
      {/* Logo */}
      <div
        className="d-flex justify-content-center pt-3 pb-4 "
        style={{ flexShrink: 0 }}
      >
        <img
          src={collapsed ? "/TZ_Logo.png" : "/logo.png"}
          alt="Tamilzorous Logo"
          className="img-fluid"
          style={{
            width: collapsed ? "40px" : "210px",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Scrollable content */}
      <nav
        className="small px-4"
        style={{
          flexGrow: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Home */}
        <div className="mb-1 sidebar-link-titles">{!collapsed && "Home"}</div>

        <div className="mb-1">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("overview");
            }}
            className="d-flex align-items-center"
            style={{
              backgroundColor: isActive("overview") ? "#278C582E" : "transparent",
              borderRadius: "8px",
              padding: "12px",
              textDecoration: "none",
              marginBottom: "8px",
              transition: "background-color 0.2s",
            }}
          >
            <img
              src={isActive("overview") ? "/Overviiew_G.png" : "/squares.png"}
              alt="Overview"
              style={{
                width: "18px",
                height: "18px",
                filter: isActive("overview") ? "none" : "brightness(0) invert(1)",
                transition: "filter 0.2s",
              }}
            />
            {!collapsed && (
              <span
                style={{
                  color: isActive("overview") ? "#28a745" : "#ffffff",
                  marginLeft: "12px",
                  fontSize: "15px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  transition: "color 0.2s",
                }}
              >
                Overview
              </span>
            )}
          </a>

        </div>

       

        {/* Purchase */}
        <div className="sidebar-link-titles">{!collapsed && "Purchase"}</div>

        <div className="mb-1">
          {/* Vendor */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("Vendor");
            }}
            className="d-flex align-items-center"
            style={{
              backgroundColor: isActive("Vendor") ? "#278C582E" : "transparent",
              borderRadius: "8px",
              padding: "12px 12px",
              textDecoration: "none",
            }}
          >
            <img
              src={isActive("Vendor") ? "/VendorG.png" : "/Vendor.png"}
              alt="Vendor"
              style={{
                width: "18px",
                filter: isActive("Vendor") ? "none" : "brightness(0) invert(1)",
              }}
            />
            {!collapsed && (
              <span
                style={{
                  color: isActive("Vendor") ? "#28a745" : "white",
                  marginLeft: "10px",
                }}
              >
                Vendor
              </span>
            )}
          </a>

          {/* Purchase Order */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("purchaseOrder");
            }}
            className="d-flex align-items-center"
            style={{
              backgroundColor: isActive("purchaseOrder") ? "#278C582E" : "transparent",
              borderRadius: "8px",
              padding: "12px 12px",
              textDecoration: "none", // optional for anchor
            }}
          >
            <img
              src={
                isActive("purchaseOrder")
                  ? "/Purchase_Order_G.png"
                  : "/Purchase Order 1.png"
              }
              alt="Purchase Order"
              style={{
                width: "18px",
                filter: isActive("purchaseOrder")
                  ? "none"
                  : "brightness(0) invert(1)",
              }}
            />
            {!collapsed && (
              <span
                style={{
                  color: isActive("purchaseOrder") ? "#28a745" : "white",
                  marginLeft: "10px",
                }}
              >
                Purchase Order
              </span>
            )}
          </a>



          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("purchaseReturn");
            }}
            className="d-flex align-items-center"
            style={{
              backgroundColor: isActive("purchaseReturn") ? "#278C582E" : "transparent",
              borderRadius: "8px",
              padding: "12px",
              textDecoration: "none",
            }}
          >
            <img
              src={
                isActive("purchaseReturn")

                  ? "/Purchase_Order_G.png"
                  : "/Purchase Order 1.png"
              }
              alt="Purchase Return"
              style={{
                width: "18px",
                filter: isActive("purchaseReturn") ? "none" : "brightness(0) invert(1)",
              }}
            />
            {!collapsed && (
              <span
                style={{
                  color: isActive("purchaseReturn") ? "#28a745" : "#ffffff",
                  marginLeft: "10px",
                }}
              >
                Purchase Return
              </span>
            )}
          </a>





        </div>

        {/* Sales */}
        <div className="sidebar-link-titles">{!collapsed && "Sales"}</div>

        <div className="mb-1">
          {/* Customer */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("VciCustomer");
            }}
            className="d-flex align-items-center"
            style={{
              backgroundColor: isActive("VciCustomer") ? "#278C582E" : "transparent",
              borderRadius: "8px",
              padding: "12px",
              color: isActive("VciCustomer") ? "#28a745" : "white",
              textDecoration: "none",
            }}
          >
            <img
              src="/VendorG.png"
              alt="Customer"
              style={{
                width: "18px",
                filter: isActive("VciCustomer") ? "none" : "brightness(0) invert(1)",
              }}
            />
            {!collapsed && (
              <span style={{ marginLeft: "10px" }}>
                Customer
              </span>
            )}
          </a>

          {/* Sales Order */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("salesOrder");
            }}
            className="d-flex align-items-center"
            style={{
              backgroundColor: isActive("salesOrder") ? "#278C582E" : "transparent",
              borderRadius: "8px",
              padding: "12px",
              color: isActive("salesOrder") ? "#28a745" : "white",
              textDecoration: "none",
              marginTop: "6px",
            }}
          >
            <img
              src={isActive("salesOrder") ? "/Sale_Order_G.png" : "/Sale 1.png"}
              alt="Sales Order"
              style={{
                width: "18px",
                filter: isActive("salesOrder") ? "none" : "brightness(0) invert(1)",
              }}
            />
            {!collapsed && (
              <span style={{ marginLeft: "10px" }}>
                Sales Order
              </span>
            )}
          </a>

          {/* Sales Return */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("salesReturn");
            }}
            className="d-flex align-items-center"
            style={{
              backgroundColor: isActive("salesReturn") ? "#278C582E" : "transparent",
              borderRadius: "8px",
              padding: "12px",
              color: isActive("salesReturn") ? "#28a745" : "white",
              textDecoration: "none",
              marginTop: "6px",
            }}
          >
            <img
              src={isActive("salesReturn") ? "/SaleReturn_G.png" : "/Sale_Return.png"}
              alt="Sales Return"
              style={{
                width: "18px",
                filter: isActive("salesReturn") ? "none" : "brightness(0) invert(1)",
              }}
            />
            {!collapsed && (
              <span style={{ marginLeft: "10px" }}>
                Sales Return
              </span>
            )}
          </a>
        </div>

        {/* Service */}
        <div className="sidebar-link-titles">{!collapsed && "Service"}</div>

      {/* Service VCI Dropdown */}
<div className="mb-1">
  <button
    onClick={() => setServiceVCIOpen(!serviceVCIOpen)}
    className="bg-transparent border-0 w-100 text-start p-0"
  >
    <div className="d-flex align-items-center">
      {!collapsed && (
        <span
          style={{
            color: isActive("serviceVCI") ? "#28a745" : "#ffffff",
            marginLeft: "10px",
          }}
        >
          Service VCI
        </span>
      )}
      {!collapsed && (
        <span
          className="ms-auto"
          style={{
            color: isActive("serviceVCI") ? "#28a745" : "#ffffff",
            marginLeft: "auto",
          }}
        >
          {serviceVCIOpen ? "▾" : "▸"}
        </span>
      )}
    </div>
  </button>

  {!collapsed && serviceVCIOpen && (
    <div className="ms-2">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handleLinkClick("serviceProduct");
        }}
        className={subLinkClass("serviceProduct")}
      >
        - Service Product
      </a>

    <a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    handleLinkClick("urgentVCI", "/urgentvci"); // Pass the path here
  }}
  className={subLinkClass("urgentVCI")}
>
  - Urgent VCI
</a>
<a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    handleLinkClick("changedVCI");
    navigate("/changedvci");   // 👈 points to ChangedVci.jsx
  }}
  className={subLinkClass("changedVCI")}
>
  - Changed VCI
</a>

    </div>
  )}
</div>

      
       {/* Basics */}
       <div className="sidebar-link-titles pb-2">{!collapsed && "Basics"}</div>

{/* Metadata Dropdown */}
<div>
    <button
      onClick={() => setMetadataOpen(!metadataOpen)}
      className="bg-transparent border-0 w-100 text-start p-0"
    >
      <div
        className="d-flex align-items-center"
        style={{
          backgroundColor: isActive("metadata") ? "#278C582E" : "transparent",
          borderRadius: "8px",
          padding: "12px",
        }}
      >
        <img
          src={isActive("metadata") ? "/Metadata_G.png" : "/Metadata.png"}
          alt="Metadata"
          style={{
            width: "18px",
            filter: isActive("metadata") ? "none" : "brightness(0) invert(1)",
          }}
        />
        {!collapsed && (
          <span
            style={{
              color: isActive("metadata") ? "#28a745" : "#ffffff",
              marginLeft: "10px",
            }}
          >
            Metadata
          </span>
        )}
        {!collapsed && (
          <span
            className="ms-auto"
            style={{
              color: isActive("metadata") ? "#28a745" : "#ffffff",
              marginLeft: "auto",
            }}
          >
            {metadataOpen ? "▾" : "▸"}
          </span>
        )}
      </div>
    </button>



    {!collapsed && metadataOpen && (
      <div className="ms-2">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick("countries");
          }}
          className={subLinkClass("countries")}
        >
          - Countries
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick("state");
          }}
          className={subLinkClass("state")}
        >
          - State
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick("district");
          }}
          className={subLinkClass("district")}
        >
          - District
        </a>
      </div>
    )}
  </div>

{/* Components Dropdown */}
<div className="mb-1">
  <button
    onClick={() => setComponentsOpen(!componentsOpen)}
    className="bg-transparent border-0 w-100 text-start p-0"
  >
    <div
      className="d-flex align-items-center"
      style={{
        backgroundColor: isActive("components") ? "#278C582E" : "transparent",
        borderRadius: "8px",
        padding: "12px",
      }}
    >
      <img
        src={
          isActive("components")
            ? "/Components_G.png"
            : "/Componets.png"
        }
        alt="Components"
        style={{
          width: "18px",
          filter: isActive("components") ? "none" : "brightness(0) invert(1)",
        }}
      />
      {!collapsed && (
        <span
          style={{
            color: isActive("components") ? "#28a745" : "#ffffff",
            marginLeft: "10px",
          }}
        >
          Components
        </span>
      )}
      {!collapsed && (
        <span
          className="ms-auto"
          style={{
            color: isActive("components") ? "#28a745" : "#ffffff",
          }}
        >
          {componentsOpen ? "▾" : "▸"}
        </span>
      )}
    </div>
  </button>

  {!collapsed && componentsOpen && (
    <div className="ms-2">
      {/* <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setComponentsOpen(true);
          handleLinkClick("AddProducts");
        }}
        className={subLinkClass("AddProducts")}
      >
        - Add Products
      </a> */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setComponentsOpen(true);
          handleLinkClick("Spareparts");
        }}
        className={subLinkClass("Spareparts")}
      >
        - Spare Parts
      </a>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setComponentsOpen(true);
          handleLinkClick("PurchaseSpareparts");
        }}
        className={subLinkClass("PurchaseSpareparts")}
      >
        - Purchase Spare Parts
      </a>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setComponentsOpen(true);
          handleLinkClick("ReturnSpareParts");
        }}
        className={subLinkClass("ReturnSpareParts")}
      >
        - Return
      </a>
    </div>
  )}
</div>

{/* Product Dropdown */}
<div className="mb-2">
  <button
    onClick={() => setProductOpen(!productOpen)}
    className="bg-transparent border-0 w-100 text-start p-0"
  >
    <div
      className="d-flex align-items-center"
      style={{
        backgroundColor: isActive("product") ? "#278C582E" : "transparent",
        borderRadius: "8px",
        padding: "12px",
      }}
    >
      <img
        src={isActive("product") ? "/Product_G.png" : "/Product.png"}
        alt="Product"
        style={{
          width: "18px",
          filter: isActive("product") ? "none" : "brightness(0) invert(1)",
        }}
      />
      {!collapsed && (
        <span
          style={{
            color: isActive("product") ? "#28a745" : "#ffffff",
            marginLeft: "10px",
          }}
        >
          Product
        </span>
      )}
      {!collapsed && (
        <span
          className="ms-auto"
          style={{
            color: isActive("product") ? "#28a745" : "#ffffff",
          }}
        >
          {productOpen ? "▾" : "▸"}
        </span>
      )}
    </div>
  </button>


  {!collapsed && productOpen && (
    <div className="ms-2">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setProductOpen(true);
          handleLinkClick("batch");
        }}
        className={subLinkClass("batch")}
      >
        - Batch
      </a>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setProductOpen(true);
          handleLinkClick("category");
        }}
        className={subLinkClass("category")}
      >
        - Category
      </a>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setProductOpen(true);
          handleLinkClick("productTest");
        }}
        className={subLinkClass("productTest")}
      >
        - Product Test
      </a>
      <a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    setProductOpen(true);
    handleLinkClick("serialStock");
  }}
  className={subLinkClass("serialStock")}
>
  - Serial Stock
</a>

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setProductOpen(true);
          handleLinkClick("sold");
        }}
        className={subLinkClass("sold")}
      >
        - Sold
      </a>
    </div>
  )}
</div>
        
      </nav>

      {/* Active style */}
      <style>{`
        .active-parent {
          // background-color: #278C582E !important;
          border-radius: 4px;
        }
      `}</style>
    </aside>
  );
}
