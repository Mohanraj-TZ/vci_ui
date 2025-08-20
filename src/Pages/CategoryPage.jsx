import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Spinner, Modal, Form, Card, Offcanvas } from "react-bootstrap";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { API_BASE_URL } from "../api";
import Breadcrumb from "./Components/Breadcrumb";
import Pagination from "./Components/Pagination";
import Search from "./Components/Search";

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [sortField, setSortField] = useState("asc");
  const [sortDirection, setSortDirection] = useState("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const MySwal = withReactContent(Swal);
const authToken = localStorage.getItem('authToken');
if (authToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
} else {
    console.error("No authentication token found. User is not logged in.");
}
    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            // If the token is missing, redirect to the login page
            navigate('/login');
            toast.error("Please log in to access this page.");
        }
        // ... rest of your useEffect logic
    },);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to fetch categories!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setCategoryName("");
    setEditingCategoryId(null);
  };

  const handleEdit = (category) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.category);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast.warning("Category name is required!");
      return;
    }

    const duplicate = categories.some(
      (c) =>
        c.category.toLowerCase() === categoryName.trim().toLowerCase() &&
        c.id !== editingCategoryId
    );
    if (duplicate) {
      toast.error("Category already exists!");
      return;
    }

    const payload = { category: categoryName.trim() };
    let updatedId = editingCategoryId;

    try {
      if (editingCategoryId) {
        await axios.put(`${API_BASE_URL}/categories/${editingCategoryId}`, payload);
        toast.success("Category updated successfully!");
      } else {
        const res = await axios.post(`${API_BASE_URL}/categories`, payload);
        toast.success("Category added successfully!");
        updatedId = res.data.id;
      }


      const res = await axios.get(`${API_BASE_URL}/categories`);
      let updatedList = Array.isArray(res.data) ? res.data : [];


      if (sortField) {
        updatedList.sort((a, b) => {
          const valA = a[sortField]?.toLowerCase?.() || "";
          const valB = b[sortField]?.toLowerCase?.() || "";
          if (valA < valB) return sortDirection === "asc" ? -1 : 1;
          if (valA > valB) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });
      }


      const index = updatedList.findIndex((c) => c.id === updatedId);
      if (index !== -1) {
        const newPage = Math.floor(index / perPage) + 1;
        setPage(newPage);
      }

      setCategories(updatedList);
      handleModalClose();
    } catch {
      toast.error("Failed to save category!");
    }
  };


  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this category?",
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

    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`);
      toast.success("Category deleted!");
      await fetchCategories();
    } catch {
      toast.error("Failed to delete category!");
    }
  };

  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(direction);
  };

  const filteredCategories = categories.filter((c) =>
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const valA = a[sortField]?.toLowerCase?.() || "";
    const valB = b[sortField]?.toLowerCase?.() || "";
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedCategories = sortedCategories.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <div className="px-4 " style={{ fontSize: "0.75rem" }}>
      <Breadcrumb title="Category" />

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
          <div className="col-md-6 text-md-end" style={{ fontSize: '0.8rem' }}>
            <div className="mt-2 d-inline-block mb-2" style={{ fontSize: '0.8rem' }}>
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={fetchCategories}
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
              >
                + Add Category
              </Button>
            </div>
            <Search
              search={search}
              setSearch={setSearch}
              perPage={perPage}
              setPerPage={setPerPage}
              setPage={setPage}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0 custom-table" style={{ fontSize: "0.75rem" }}>
            <thead style={{ backgroundColor: "#2E3A59", color: "white", fontSize: "0.82rem", height: "40px", verticalAlign: "middle" }}>
              <tr>
                <th
                  style={{
                    width: "70px",
                    textAlign: "center",
                    backgroundColor: "#2E3A59",
                    color: "white",
                    cursor: "default",
                    whiteSpace: "nowrap",
                  }}
                >
                  S.No
                </th>

                <th
                  onClick={() => handleSort("category")}
                  style={{
                    width: "150px",
                    backgroundColor: "#2E3A59",
                    color: "white",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  VCI Category {sortField === "category" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>

                <th
                  style={{
                    width: "110px",
                    textAlign: "center",
                    backgroundColor: "#2E3A59",
                    color: "white",
                    whiteSpace: "nowrap",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4 text-muted">
                    <img
                      src="/empty-box.png"
                      alt="No categories found"
                      style={{ width: "70px", height: "90px", opacity: 0.6 }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((category, index) => (
                  <tr key={category.id}>
                    <td className="text-center" style={{ width: "70px", whiteSpace: "nowrap" }}>
                      {(page - 1) * perPage + index + 1}
                    </td>

                    <td
                      style={{
                        width: "150px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={category.category}
                    >
                      {category.category}
                    </td>

                    <td className="text-center" style={{ width: "110px", whiteSpace: "nowrap" }}>
                      <Button
                        variant=""
                        size="sm"
                        className="me-1"
                        onClick={() => handleEdit(category)}
                        style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        style={{
                          borderColor: "#2E3A59",
                          color: "#2E3A59",
                          backgroundColor: "transparent",
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
          totalEntries={filteredCategories.length}
        />
      </Card>

      <Offcanvas
        show={showModal}
        onHide={handleModalClose}
        placement="end"
        backdrop="static"
        
        className="custom-offcanvas"// Adjust width as needed
      >
       <Offcanvas.Header className="border-bottom">
  <Offcanvas.Title className="fw-semibold">
    {editingCategoryId ? "Edit Category" : "Add New Category"}
  </Offcanvas.Title>
  <div className="ms-auto">
    <Button
      variant="outline-secondary"
      onClick={handleModalClose}
      className="rounded-circle border-0 d-flex align-items-center justify-content-center"
      style={{ width: "32px", height: "32px" }}
    >
      <i className="bi bi-x-lg fs-6"></i>
    </Button>
  </div>
</Offcanvas.Header>

        <Offcanvas.Body className="">
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">VCI Series</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Series"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button  className="btn-common btn-cancel" variant="light" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button variant="success"  className="btn-common btn-save"  onClick={handleSave}>
              {editingCategoryId ? "Update" : "Save"}
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

    </div>
  );
}
