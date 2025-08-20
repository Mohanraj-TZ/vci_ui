import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Spinner,
  Form,
  Card,
  Offcanvas,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import * as XLSX from "xlsx";
import { API_BASE_URL } from "../api";
import Breadcrumb from "./Components/Breadcrumb";
import Pagination from "./Components/Pagination";
import Search from "./Components/Search";

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [importing, setImporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Add the auth token to Axios headers
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  } else {
    console.error("No authentication token found. User is not logged in.");
    // Optional: Redirect the user to the login page
    // window.location.href = "/login";
  }

  const downloadPurchaseAndCategoryExcel = (purchaseData, categoryData) => {
    const purchaseSheet = XLSX.utils.json_to_sheet(purchaseData);
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, purchaseSheet, "PCB Purchase Details");
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Category Details");
    XLSX.writeFile(workbook, "Purchase_and_Category.xlsx");
  };

  const [productData, setProductData] = useState({
    id: null,
    category_id: "",
    serial_no: "",
    manufacture_no: "",
    firmware_version: "",
    hsn_code: "",
    sale_status: "Available",
    test: "",
  });

  const MySwal = withReactContent(Swal);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products`),
        axios.get(`${API_BASE_URL}/categories`),
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
    } catch {
      toast.error("Failed to fetch data!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = () => {
    setIsEditing(false);
    setProductData({
      id: null,
      category_id: "",
      serial_no: "",
      manufacture_no: "",
      firmware_version: "",
      hsn_code: "",
      sale_status: "Available",
      test: "",
    });
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setProductData({ ...product });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      didOpen: (popup) => {
        const title = popup.querySelector(".swal2-title");
        const content = popup.querySelector(".swal2-html-container");
        const confirmBtn = popup.querySelector(".swal2-confirm");
        const cancelBtn = popup.querySelector(".swal2-cancel");
        const container = popup.querySelector(".swal2-popup");

        if (title) title.style.fontSize = "0.9rem";
        if (content) content.style.fontSize = "0.8rem";
        if (confirmBtn) confirmBtn.style.fontSize = "0.85rem";
        if (cancelBtn) cancelBtn.style.fontSize = "0.85rem";

        if (container) {
          container.style.width = "150px";
          container.style.height = "100px";
          container.style.maxHeight = "90vh";
          container.style.padding = "0.5rem 0.5rem";
        }
      },
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`);
      toast.success("Product deleted!");
      fetchAllData();
    } catch {
      toast.error("Failed to delete product!");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...productData, [name]: value };

    if (name === "test") {
      if (value === "Issue") {
        updatedData.sale_status = "Reserved";
      } else if (productData.test === "Issue" && value === "Ok") {
        updatedData.sale_status = "";
      }
    }
    setProductData(updatedData);
  };

  const validateForm = () => {
    const requiredFields = [
      { key: "category_id", label: "Category" },
      { key: "serial_no", label: "Serial Number" },
      { key: "manufacture_no", label: "Manufacture Number" },
      { key: "firmware_version", label: "Firmware Version" },
      { key: "hsn_code", label: "HSN Code" },
      { key: "test", label: "Test Status" },
      { key: "sale_status", label: "Sale Status" },
    ];
    for (const field of requiredFields) {
      const value = productData[field.key];
      if (!value || (typeof value === "string" && !value.trim())) {
        toast.warn(`${field.label} is required!`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/products/${productData.id}`, productData);
        toast.success("Product updated!");
      } else {
        await axios.post(`${API_BASE_URL}/products`, productData);
        toast.success("Product added!");
      }

      setShowModal(false);
      fetchAllData();
    } catch {
      toast.error("Failed to save product!");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const pcbRes = await axios.get(`${API_BASE_URL}/excelist`);
      const catRes = await axios.get(`${API_BASE_URL}/categories`);
      

const purchaseData = pcbRes.data.map((p) => ({
  'Serial Number': p.serial_no || "",
  'Invoice No': p.invoice_no || "",
  'Invoice Date': p.invoice_date || "",
  'Vendor': p.vendor || "",
  'Category': p.category || "",
}));
      const categoryData = catRes.data.map((c) => ({
        ID: c.id,
        Category: c.category,
      }));

      downloadPurchaseAndCategoryExcel(purchaseData, categoryData);
      toast.success("Excel file downloaded successfully!");
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Excel download failed!");
    }
  };
  
const handleDownloadSampleExcel = () => {
    // Correctly map the data to get the category name.
    // The `p.category?.category` syntax safely accesses the nested category name.
    const dataToExport = filteredProducts.map(p => ({
        'Category Name': p.category?.category || "", // <-- Changed from category_id to 'Category Name' and p.category?.category
        'Serial No': p.serial_no,
        'Manufacture No': p.manufacture_no,
        'Firmware Version': p.firmware_version,
        'HSN Code': p.hsn_code,
        'Sale Status': p.sale_status,
        'Test': p.test,
    }));

    // Define the headers to match the new object keys.
    const headers = [
        "Category Name", // <-- Changed the header to match
        "Serial No",
        "Manufacture No",
        "Firmware Version",
        "HSN Code",
        "Sale Status",
        "Test",
    ];

    // If there's no data, create a blank sheet with headers.
    if (dataToExport.length === 0) {
        dataToExport.push({});
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product_Sample");
    XLSX.writeFile(wb, "Product_Sample_Template.xlsx");

    toast.success("Sample Excel file downloaded successfully!");
};
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      setImporting(true);
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet);

        if (!parsedData || parsedData.length === 0) {
          toast.error("No data found in the Excel file.");
          return;
        }

        const res = await axios.post(`${API_BASE_URL}/products/bulk`, parsedData);
        const { message, success_count, failed_count, failed } = res.data;

        toast.success(`${message} — ${success_count} products imported successfully`);

        if (failed_count > 0 && failed.length > 0) {
          failed.forEach(item => {
            toast.error(`Serial: ${item.serial_no} — ${item.error}`);
          });
        }

        setShowImportModal(false);
        fetchAllData();
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Something went wrong during import.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  let filteredProducts = products.filter((p) => {
    const searchTerm = search.toLowerCase();
    const isMatchingSearch = (
      p.serial_no?.toLowerCase().includes(searchTerm) ||
      p.category?.category?.toLowerCase().includes(searchTerm) ||
      p.manufacture_no?.toLowerCase().includes(searchTerm) ||
      p.firmware_version?.toLowerCase().includes(searchTerm) ||
      p.hsn_code?.toLowerCase().includes(searchTerm) ||
      p.test?.toLowerCase().includes(searchTerm) ||
      p.sale_status?.toLowerCase().includes(searchTerm)
    );
    const isMatchingCategory = !selectedCategory || String(p.category_id) === String(selectedCategory);
    return isMatchingSearch && isMatchingCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (obj) => {
      if (sortField === "category") return obj.category?.category || "";
      return obj[sortField] || "";
    };
    const aVal = getValue(a).toLowerCase();
    const bVal = getValue(b).toLowerCase();
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedProducts = sortedProducts.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="px-4" style={{ fontSize: "0.75rem" }}>
      <Breadcrumb title="Products" />
      <Card className="border-0 shadow-sm rounded-3 p-3 mt-2 bg-white">
        <div className="row mb-2">
          {/* NEW: Category filter dropdown */}
          <div className="col-md-2 d-flex align-items-center mb-2 mb-md-0">
            <Form.Select
              size="sm"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1); // Reset to the first page when the filter changes
              }}
              style={{ fontSize: "0.8rem" }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-4 d-flex align-items-center mb-2 mb-md-0">
            <label className="me-2 fw-semibold mb-0" style={{ fontSize: "0.8rem" }}>
              Records Per Page:
            </label>
            <Form.Select
              size="sm"
              style={{ width: "90px", fontSize: "0.8rem", padding: "4px 8px" }}
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-6 text-md-end" style={{ fontSize: "0.8rem" }}>
            <div className="mt-2 d-inline-block mb-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2 p-1"
                onClick={fetchAllData}
                style={{ fontSize: "0.8rem", minWidth: "32px", height: "28px" }}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              {/* NEW: Download Sample button */}
              <Button
                size="sm"
                onClick={handleDownloadSampleExcel}
                style={{
                  backgroundColor: "#2E3A59",
                  borderColor: "#2E3A59",
                  color: "#fff",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem",
                  minWidth: "90px",
                  height: "28px",
                }}
                className="btn-success text-white me-2"
              >
                Download Sample
              </Button>
              <Button
                size="sm"
                onClick={() => setShowImportModal(true)}
                style={{
                  backgroundColor: "#2E3A59",
                  borderColor: "#2E3A59",
                  color: "#fff",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem", 
                  minWidth: "90px",
                  height: "28px",
                }}
                className="btn-success text-white me-2"
              >
                Upload product
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadExcel}
                style={{
                  backgroundColor: "#2E3A59",
                  borderColor: "#2E3A59",
                  color: "#fff",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem",
                  minWidth: "90px",
                  height: "28px",
                }}
                className="btn-success text-white me-2"
              >
                Download Excel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNewClick}
                style={{
                  backgroundColor: "#2FA64F",
                  borderColor: "#2FA64F",
                  color: "#fff",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem",
                  minWidth: "90px",
                  height: "28px",
                }}
                className="btn-success text-white"
              >
                + Add Product
              </Button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <Search
                search={search}
                setSearch={setSearch}
                perPage={perPage}
                setPerPage={setPerPage}
                setPage={setPage}
                style={{ fontSize: "0.8rem" }}
              />
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
            <thead
              style={{
                backgroundColor: "#2E3A59",
                color: "white",
                fontSize: "0.82rem",
                height: "40px",
                verticalAlign: "middle",
              }}
            >
              <tr>
                <th
                  style={{
                    width: "70px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#2E3A59",
                    color: "white",
                    padding: "6px 8px",
                    verticalAlign: "middle",
                  }}
                >
                  S.No
                </th>
                {[
                  { key: "category", label: "Category" },
                  { key: "serial_no", label: "Serial No" },
                  { key: "manufacture_no", label: "Manufacture No" },
                  { key: "firmware_version", label: "Firmware" },
                  { key: "hsn_code", label: "HSN Code" },
                  { key: "test", label: "Test" },
                  { key: "sale_status", label: "Sale Status" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#2E3A59",
                      color: "white",
                      padding: "6px 8px",
                      verticalAlign: "middle",
                    }}
                  >
                    {label} {sortField === key && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                ))}
                <th
                  style={{
                    width: "130px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#2E3A59",
                    color: "white",
                    padding: "6px 8px",
                    verticalAlign: "middle",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-3" style={{ fontSize: "0.85rem" }}>
                    <Spinner animation="border" size="sm" />
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, index) => (
                  <tr key={p.id} style={{ height: "36px" }}>
                    <td className="text-center" style={{ padding: "6px 8px", verticalAlign: "middle" }}>
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>{p.category?.category || "—"}</td>
                    <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>{p.serial_no}</td>
                    <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>{p.manufacture_no}</td>
                    <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>{p.firmware_version}</td>
                    <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>{p.hsn_code}</td>
                    <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>{p.test}</td>
                    <td style={{ padding: "6px 8px", verticalAlign: "middle" }}>{p.sale_status}</td>
                    <td className="text-center" style={{ padding: "6px 8px", verticalAlign: "middle" }}>
                      <Button
                        size="sm"
                        variant=""
                        onClick={() => handleEdit(p)}
                        className="me-1"
                        style={{
                          borderColor: "#2E3A59",
                          color: "#2E3A59",
                          padding: "3px 6px",
                          fontSize: "0.8rem",
                        }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(p.id)}
                        style={{
                          borderColor: "#2E3A59",
                          color: "#2E3A59",
                          backgroundColor: "transparent",
                          padding: "3px 6px",
                          fontSize: "0.8rem",
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalEntries={filteredProducts.length}
        />
      </Card>
      <Offcanvas
        show={showModal}
        onHide={() => setShowModal(false)}
        placement="end"
        backdrop="static"
        className="custom-offcanvas "
        style={{ fontSize: "0.85rem" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-semibold">
            {isEditing ? "Edit Product" : "Add New Product"}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form className="row g-3">
            <Form.Group className="col-md-6">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category_id"
                value={productData.category_id}
                onChange={handleChange}
                size="sm"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="col-md-6">
              <Form.Label>Serial No.</Form.Label>
              <Form.Control
                name="serial_no"
                value={productData.serial_no}
                onChange={handleChange}
                placeholder="Enter Serial No."
                size="sm"
              />
            </Form.Group>
            <Form.Group className="col-md-6">
              <Form.Label>Manufacture No.</Form.Label>
              <Form.Control
                name="manufacture_no"
                value={productData.manufacture_no}
                onChange={handleChange}
                placeholder="Enter Manufacture No."
                size="sm"
              />
            </Form.Group>
            <Form.Group className="col-md-6">
              <Form.Label>Firmware Version</Form.Label>
              <Form.Control
                name="firmware_version"
                value={productData.firmware_version}
                onChange={handleChange}
                placeholder="Enter Firmware Version"
                size="sm"
              />
            </Form.Group>
            <Form.Group className="col-md-6">
              <Form.Label>HSN Code</Form.Label>
              <Form.Control
                name="hsn_code"
                value={productData.hsn_code}
                onChange={handleChange}
                placeholder="Enter HSN Code"
                size="sm"
              />
            </Form.Group>
            <Form.Group className="col-md-6">
              <Form.Label>Test Status</Form.Label>
              <Form.Select
                name="test"
                value={productData.test}
                onChange={handleChange}
                size="sm"
              >
                <option value="">Select Test Status</option>
                <option value="Ok">OK</option>
                <option value="Issue">Issue</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="col-md-6">
              <Form.Label>Sale Status</Form.Label>
              <Form.Select
                name="sale_status"
                value={productData.sale_status}
                onChange={handleChange}
                disabled={productData.test === "Issue"}
                size="sm"
              >
                <option value="">Select Sale Status</option>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Reserved">Reserved</option>
              </Form.Select>
            </Form.Group>
          </Form>
          <div className="d-flex justify-content-end mt-4">
            <Button variant="success" onClick={handleSave} size="sm" style={{ minWidth: "120px" }}>
              {isEditing ? "Update" : "Save"}
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
      <Offcanvas
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        placement="end"
        className="custom-offcanvas"
        style={{ fontSize: "0.85rem" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-semibold">
            upload product
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <p>
            Please upload a `.xlsx`, `.xls` file containing columns:{" "}
          </p>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Upload Excel File</Form.Label>
            <Form.Control type="file" onChange={handleImport} accept=".xlsx, .xls" />
          </Form.Group>
          {importing && (
            <div className="text-center mt-4">
              <Spinner animation="border" size="sm" />
              <p>Importing...</p>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}