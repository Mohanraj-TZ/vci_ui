import React, { useEffect, useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';
import { API_BASE_URL } from "../api";
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

export default function AddPurchasePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formErrors, setFormErrors] = useState({});
  const [dropdowns, setDropdowns] = useState({ vendors: [], categories: [] });
  const [formData, setFormData] = useState({
    vendor_id: null,
    invoice_no: '',
    invoice_date: ''
  });
  const [categoryBlocks, setCategoryBlocks] = useState([
    { category_id: null, from_serial: '', to_serial: '' }
  ]);
  const [loading, setLoading] = useState(true);

  // Helper function to get the authentication headers
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

  const customSelectStyles = {
    control: base => ({ ...base, backgroundColor: '#fff', borderColor: '#ced4da', minHeight: '38px' }),
    menu: base => ({ ...base, backgroundColor: '#fff', zIndex: 9999 }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#f8f9fa' : '#fff', color: '#000' }),
  };

  // Fetch dropdowns (vendors & categories) with authentication
  const fetchDropdownData = async () => {
    try {
      // Corrected: Passing authentication headers to the axios.get call
      const res = await axios.get(`${API_BASE_URL}/form-dropdowns`, getAuthHeaders());
      setDropdowns(res.data.data);
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
      toast.error(err.response?.data?.message || 'Failed to load dropdowns');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  // If editing, fetch purchase data with authentication
  const fetchPurchaseData = async () => {
    if (!id) return;
    try {
      // Corrected: Passing authentication headers to the axios.get call
      const res = await axios.get(`${API_BASE_URL}/pcbshow/${id}`, getAuthHeaders());
      if (res.data && res.data.data) {
        const p = res.data.data;
        setFormData({
          vendor_id: p.vendor_id,
          invoice_no: p.invoice_no,
          invoice_date: p.invoice_date
        });
        if (p.items && p.items.length > 0) {
          setCategoryBlocks(
            p.items.map(item => ({
              category_id: item.category_id,
              from_serial: item.from_serial,
              to_serial: item.to_serial
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load purchase data:', err);
      toast.error(err.response?.data?.message || 'Failed to load purchase data');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  // Check for authentication token on component load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Please log in to access this page.", { toastId: 'auth-error' });
      navigate('/login');
      return;
    }
    const init = async () => {
      setLoading(true);
      await fetchDropdownData();
      await fetchPurchaseData();
      setLoading(false);
    };
    init();
  }, [id, navigate]);

  // Handle changes
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (selected, field) => {
    setFormData(prev => ({ ...prev, [field]: selected ? selected.value : null }));
    setFormErrors(prev => ({ ...prev, [field]: null }));
  };

  const updateCategoryBlock = (index, field, value) => {
    setCategoryBlocks(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
    setFormErrors(prev => ({ ...prev, [`${field}_${index}`]: null }));
  };

  const addCategoryBlock = () => {
    setCategoryBlocks(prev => [...prev, { category_id: null, from_serial: '', to_serial: '' }]);
  };

  const removeCategoryBlock = (index) => {
    setCategoryBlocks(prev => prev.filter((_, i) => i !== index));
  };

  // Submit with authentication
  const handleSubmit = async e => {
    e.preventDefault();

    const errors = {};
    if (!formData.vendor_id) errors.vendor_id = 'Vendor is required';
    if (!formData.invoice_no.trim()) errors.invoice_no = 'Invoice number is required';
    if (!formData.invoice_date) errors.invoice_date = 'Invoice date is required';

    categoryBlocks.forEach((block, idx) => {
      if (!block.category_id) errors[`category_${idx}`] = 'Category is required';
      if (!block.from_serial) errors[`from_serial_${idx}`] = 'From Serial is required';
      if (!block.to_serial) errors[`to_serial_${idx}`] = 'To Serial is required';
    });

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const payload = {
        vendor_id: formData.vendor_id,
        invoice_no: formData.invoice_no,
        invoice_date: formData.invoice_date,
        categories: categoryBlocks
      };

      if (id) {
        // Corrected: Passing authentication headers to the axios.put call
        await axios.put(`${API_BASE_URL}/pcbupdate/${id}`, payload, getAuthHeaders());
        toast.success('Purchase updated successfully!');
      } else {
        // Corrected: Passing authentication headers to the axios.post call
        await axios.post(`${API_BASE_URL}/pcbstore`, payload, getAuthHeaders());
        toast.success('Purchase added successfully!');
      }
      setTimeout(() => navigate('/purchaseOrder'), 1000);
    } catch (error) {
      if (error.response?.status === 422 && error.response.data.errors) {
        setFormErrors(error.response.data.errors);
      }
      toast.error(error.response?.data?.message || 'Failed to save purchase');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4" style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">{id ? 'Edit Purchase' : 'Add Purchase'}</h4>
        <Button variant="outline-secondary" onClick={() => navigate('/purchaseOrder')}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3 pt-4">
          <Col md={4}>
            <Form.Label>Vendor</Form.Label>
            <Select
              styles={customSelectStyles}
              value={dropdowns.vendors.find(v => v.id === formData.vendor_id) ? { label: dropdowns.vendors.find(v => v.id === formData.vendor_id).name, value: formData.vendor_id } : null}
              options={dropdowns.vendors.map(v => ({ label: v.name, value: v.id }))}
              onChange={sel => handleSelectChange(sel, 'vendor_id')}
              placeholder="Select vendor"
            />
            {formErrors.vendor_id && <div className="text-danger small">{formErrors.vendor_id}</div>}
          </Col>
          <Col md={4}>
            <Form.Label>Invoice Number</Form.Label>
            <Form.Control
              type="text"
              name="invoice_no"
              value={formData.invoice_no}
              onChange={handleChange}
            />
            {formErrors.invoice_no && <div className="text-danger small">{formErrors.invoice_no}</div>}
          </Col>
          <Col md={4}>
            <Form.Label>Invoice Date</Form.Label>
            <Form.Control
              type="date"
              name="invoice_date"
              value={formData.invoice_date}
              onChange={handleChange}
            />
            {formErrors.invoice_date && <div className="text-danger small">{formErrors.invoice_date}</div>}
          </Col>
        </Row>

        {categoryBlocks.map((block, index) => (
          <Row className="mb-3" key={index}>
            <Col md={4}>
              <Form.Label>Category</Form.Label>
              <Select
                styles={customSelectStyles}
                value={dropdowns.categories.find(c => c.id === block.category_id) ? { label: dropdowns.categories.find(c => c.id === block.category_id).name || dropdowns.categories.find(c => c.id === block.category_id).category, value: block.category_id } : null}
                options={dropdowns.categories.map(c => ({ label: c.name || c.category, value: c.id }))}
                onChange={sel => updateCategoryBlock(index, 'category_id', sel ? sel.value : null)}
                placeholder="Select category"
              />
              {formErrors[`category_${index}`] && <div className="text-danger small">{formErrors[`category_${index}`]}</div>}
            </Col>
            <Col md={3}>
              <Form.Label>From Serial</Form.Label>
              <Form.Control
                type="text"
                value={block.from_serial}
                onChange={e => updateCategoryBlock(index, 'from_serial', e.target.value)}
              />
              {formErrors[`from_serial_${index}`] && <div className="text-danger small">{formErrors[`from_serial_${index}`]}</div>}
            </Col>
            <Col md={3}>
              <Form.Label>To Serial</Form.Label>
              <Form.Control
                type="text"
                value={block.to_serial}
                onChange={e => updateCategoryBlock(index, 'to_serial', e.target.value)}
              />
              {formErrors[`to_serial_${index}`] && <div className="text-danger small">{formErrors[`to_serial_${index}`]}</div>}
            </Col>
            <Col md={2} className="d-flex align-items-end">
              {index > 0 && (
                <Button variant="danger" onClick={() => removeCategoryBlock(index)}>Remove</Button>
              )}
            </Col>
          </Row>
        ))}

        <div className="mb-3">
          <Button variant="outline-primary" onClick={addCategoryBlock}>
            + Add Another Category
          </Button>
        </div>

        <div className="d-flex justify-content-end">
          <Button variant="secondary" className="me-2" onClick={() => navigate('/purchaseOrder')}>Cancel</Button>
          <Button type="submit" variant="success">{id ? 'Update Purchase' : 'Save Purchase'}</Button>
        </div>
      </Form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
