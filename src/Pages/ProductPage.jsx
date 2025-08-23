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
import { API_BASE_URL } from "../api";
import Breadcrumb from "./Components/Breadcrumb";
import Pagination from "./Components/Pagination";
import Search from "./Components/Search";
import * as XLSX from "xlsx";
import Select from "react-select";
import { useNavigate } from 'react-router-dom';

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
  const [pcbSerialOptions, setPcbSerialOptions] = useState([]);
  const navigate = useNavigate();

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
    fromserial_no: "",
    toserial_no: "",
    manufacture_no: "",
    firmware_version: "",
    hsn_code: "",
    sale_status: "Available", // Set default to 'Available'
    test: "",
  });

  const MySwal = withReactContent(Swal);

  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Please log in to access this page.", { toastId: 'auth-error' });
      navigate('/login');
      setLoading(false);
      return;
    }
    const authConfig = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    try {
      const [pRes, cRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products`, authConfig),
        axios.get(`${API_BASE_URL}/categories`, authConfig),
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.", { toastId: 'auth-expired' });
        navigate('/login');
      } else {
        toast.error("Failed to fetch data!");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [navigate]);

  useEffect(() => {
    fetchPcbSerialNumbers();
  }, []);

  const fetchPcbSerialNumbers = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }
    const authConfig = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    try {
      const res = await axios.get(`${API_BASE_URL}/pcb-board-purchase-items`, {
        ...authConfig,
        params: { exclude_status: "Reserved" }
      });
      const formattedOptions = res.data.map(item => ({
        value: item.serial_no,
        label: item.serial_no
      }));
      setPcbSerialOptions(formattedOptions);
    } catch (err) {
      console.error("Failed to fetch PCB serial numbers:", err);
      toast.error("Failed to fetch PCB serial numbers!");
    }
  };

  const handleAddNewClick = () => {
    setIsEditing(false);
    setProductData({
      id: null,
      category_id: "",
      serial_no: "",
      fromserial_no: "",
      toserial_no: "",
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
    const cleanSerial = product.serial_no ? product.serial_no.trim() : "";
    if (cleanSerial && !pcbSerialOptions.some(opt => opt.value === cleanSerial)) {
      setPcbSerialOptions(prev => [
        ...prev,
        { value: cleanSerial, label: cleanSerial }
      ]);
    }
    setProductData({
      ...product,
      serial_no: cleanSerial,
      fromserial_no: product.fromserial_no ? product.fromserial_no.trim() : "",
      toserial_no: product.toserial_no ? product.toserial_no.trim() : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2FA64F",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        popup: "custom-compact"
      }
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('authToken');
    const authConfig = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`, authConfig);
      toast.success("Product deleted!");
      fetchAllData();
    } catch (error) {
      console.error("Error deleting product:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.", { toastId: 'auth-expired' });
        navigate('/login');
      } else {
        toast.error("Failed to delete product!");
      }
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
      { key: "manufacture_no", label: "Manufacture Number" },
      { key: "firmware_version", label: "Firmware Version" },
      { key: "hsn_code", label: "HSN Code" },
      { key: "test", label: "Test Status" },
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
    if (!isEditing) {
      const serial = (productData.serial_no || "").trim();
      const fromS = (productData.fromserial_no || "").trim();
      const toS = (productData.toserial_no || "").trim();
      const singleFilled = !!serial;
      const anyRangeFilled = !!fromS || !!toS;
      const fullRangeFilled = !!fromS && !!toS;

      if (singleFilled && anyRangeFilled) {
        toast.error("Please provide either Single Serial No OR From & To Serial, not both.");
        return;
      }
      if (!singleFilled && !fullRangeFilled) {
        toast.error("Please provide Single Serial No OR both From & To Serial.");
        return;
      }
      if (!singleFilled && anyRangeFilled && !fullRangeFilled) {
        toast.error("Please select both From Serial and To Serial.");
        return;
      }
    }

    const token = localStorage.getItem('authToken');
    const authConfig = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    const payload = productData;

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/products/${productData.id}`, payload, authConfig);
        toast.success("Product updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/products`, payload, authConfig);
        toast.success("Product added successfully!");
      }
      setShowModal(false);
      fetchAllData();
    } catch (error) {
      console.error("Error saving product:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.", { toastId: 'auth-expired' });
        navigate('/login');
      } else {
        toast.error(`Failed to save product: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const searchTerm = search.toLowerCase();
    return (
      p.serial_no?.toLowerCase().includes(searchTerm) ||
      p.batch?.batch?.toLowerCase().includes(searchTerm) ||
      p.category?.category?.toLowerCase().includes(searchTerm) ||
      p.manufacture_no?.toLowerCase().includes(searchTerm) ||
      p.firmware_version?.toLowerCase().includes(searchTerm) ||
      p.hsn_code?.toLowerCase().includes(searchTerm) ||
      p.test?.toLowerCase().includes(searchTerm) ||
      p.sale_status?.toLowerCase().includes(searchTerm)
    );
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDownloadExcel = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Please log in to download.", { toastId: 'auth-error' });
      navigate('/login');
      return;
    }
    const authConfig = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    try {
      const pcbRes = await axios.get(`${API_BASE_URL}/excelist`, authConfig);
      const catRes = await axios.get(`${API_BASE_URL}/categories`, authConfig);

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
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.", { toastId: 'auth-expired' });
        navigate('/login');
      } else {
        toast.error("Excel download failed!");
      }
    }
  };

  const handleDownloadSampleExcel = () => {
    const dataToExport = filteredProducts.map(p => ({
      'Category Name': p.category?.category || "",
      'Serial No': p.serial_no,
      'Manufacture No': p.manufacture_no,
      'Firmware Version': p.firmware_version,
      'HSN Code': p.hsn_code,
      'Sale Status': p.sale_status,
      'Test': p.test,
    }));
    const headers = [
      "Category Name",
      "Serial No",
      "Manufacture No",
      "Firmware Version",
      "HSN Code",
      "Sale Status",
      "Test",
    ];
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
    if (!file) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Please log in to upload.", { toastId: 'auth-error' });
      navigate('/login');
      return;
    }
    const authConfig = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

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

        const res = await axios.post(`${API_BASE_URL}/products/bulk`, parsedData, authConfig);
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
        if (error.response?.status === 401) {
          toast.error("Session expired. Please log in again.", { toastId: 'auth-expired' });
          navigate('/login');
        } else {
          toast.error("Something went wrong during import.");
        }
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

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
      <Card className="border-0 shadow-sm rounded-3 p-2 px-4 mt-2 bg-white">
        <div className="row mb-2">
          <div className="col-md-6 d-flex align-items-center mb-2 mb-md-0">
            <label className="me-2 fw-semibold mb-0">Records Per Page:</label>
            <Form.Select
              size="sm"
              style={{ width: "100px" }}
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
<div className="col-md-6 text-md-end">
    {/* Refresh and Add Product buttons on the top row */}
    <div className="d-flex justify-content-end align-items-center mb-2 flex-wrap gap-2">
        <Button
            variant="outline-secondary"
            size="sm"
            onClick={fetchAllData}
            style={{ fontSize: "0.8rem", minWidth: "32px", height: "28px" }}
        >
            <i className="bi bi-arrow-clockwise"></i>
        </Button>
        <Button
            size="sm"
            onClick={handleAddNewClick}
            style={{
                backgroundColor: '#2FA64F',
                borderColor: '#2FA64F',
                color: '#fff',
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                minWidth: '90px',
                height: '28px',
            }}
            className="btn-success text-white"
        >
            + Add Product
        </Button>
    </div>
    {/* All file-related buttons on the second row */}
    <div className="d-flex justify-content-end align-items-center mb-2 flex-wrap gap-2">
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
            className="btn-success text-white"
        >
            Download Sample
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
            className="btn-success text-white"
        >
            Download Excel
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
            className="btn-success text-white"
        >
            Upload product
        </Button>
    </div>
    {/* The search bar on the final row */}
    <div className="d-flex justify-content-end align-items-center flex-wrap gap-2">
        <Search
            search={search}
            setSearch={setSearch}
            perPage={perPage}
            setPerPage={setPerPage}
            setPage={setPage}
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
                    <img src="/empty-box.png" alt="No products" style={{ width: "60px", opacity: 0.6 }} />
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
        <Offcanvas.Header className="border-bottom">
          <Offcanvas.Title className="fw-semibold">
            {isEditing ? "Edit Product" : "Add Product"}
          </Offcanvas.Title>
          <div className="ms-auto">
            <Button
              variant="outline-secondary"
              onClick={() => setShowModal(false)}
              className="rounded-circle border-0 d-flex align-items-center justify-content-center"
              style={{ width: "32px", height: "32px" }}
            >
              <i className="bi bi-x-lg fs-6"></i>
            </Button>
          </div>
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
              <Form.Label>Single Serial No.</Form.Label>
              <Select
                options={pcbSerialOptions}
                value={
                  pcbSerialOptions.find(opt => opt.value === productData.serial_no) || null
                }
                onChange={(selected) => {
                  setProductData({
                    ...productData,
                    serial_no: selected ? selected.value : ""
                  });
                }}
                isClearable
                isSearchable
                placeholder="Select Serial No."
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "31px",
                    fontSize: "0.8rem"
                  }),
                  menu: (base) => ({
                    ...base,
                    fontSize: "0.8rem"
                  })
                }}
              />
            </Form.Group>
            {!isEditing &&
              <>
                <Form.Group className="col-md-6">
                  <Form.Label>From Serial Number</Form.Label>
                  <Select
                    options={pcbSerialOptions}
                    value={pcbSerialOptions.find(opt => opt.value === productData.fromserial_no) || null}
                    onChange={(selected) => {
                      setProductData(prev => ({
                        ...prev,
                        fromserial_no: selected ? selected.value : ""
                      }));
                    }}
                    isClearable
                    isSearchable
                    placeholder="Select From Serial"
                    styles={{
                      control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.8rem" }),
                      menu: (base) => ({ ...base, fontSize: "0.8rem" }),
                    }}
                  />
                </Form.Group>
                <Form.Group className="col-md-6">
                  <Form.Label>To Serial Number</Form.Label>
                  <Select
                    options={pcbSerialOptions}
                    value={pcbSerialOptions.find(opt => opt.value === productData.toserial_no) || null}
                    onChange={(selected) => {
                      setProductData(prev => ({
                        ...prev,
                        toserial_no: selected ? selected.value : ""
                      }));
                    }}
                    isClearable
                    isSearchable
                    placeholder="Select To Serial"
                    styles={{
                      control: (base) => ({ ...base, minHeight: "31px", fontSize: "0.8rem" }),
                      menu: (base) => ({ ...base, fontSize: "0.8rem" }),
                    }}
                  />
                </Form.Group>
              </>
            }
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
          </Form>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button className="btn-common btn-cancel" variant="light" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" className="btn-common btn-save" onClick={handleSave} size="sm">
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