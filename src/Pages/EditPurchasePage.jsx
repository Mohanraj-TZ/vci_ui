import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from "../api";
import { FixedSizeList as List } from 'react-window'; // ✅ for large data rendering

export default function EditPurchasePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState(null);
  const [serials, setSerials] = useState([]);
  const [newSerialsInput, setNewSerialsInput] = useState('');
  const [error, setError] = useState('');
  const [dropdowns, setDropdowns] = useState({ vendors: [], categories: [] });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

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


  useEffect(() => {
    // Check for token at the start
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Please log in to access this page.", { toastId: 'auth-error' });
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        await fetchDropdownData();
        // Corrected: Passing authentication headers to the axios.get call
        const res = await axios.get(`${API_BASE_URL}/purchase/${id}/edit`, getAuthHeaders());
        if (res.data.status) {
          setPurchase(res.data.data.purchase);
  
          // Convert Laravel response to serials list for UI
          const allSerials = [];
          (res.data.data.categories || []).forEach(cat => {
            cat.serials.forEach(s => {
              allSerials.push({
                serial_no: s.serial_no || '',
                remark: s.remark || '',
                quality_check: s.quality_check || '',
                category_id: cat.category_id,
                category: cat.category
              });
            });
          });
  
          setSerials(allSerials);
        } else {
          setError('Purchase not found');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching data');
        setLoading(false);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };
    fetchData();
  }, [id, navigate]);
  
  const handleInputChange = (index, field, value) => {
    setSerials(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handlePurchaseChange = (e) => {
    const { name, value } = e.target;
    setPurchase(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteSerial = (indexToRemove) => {
    setSerials(prev => prev.filter((_, index) => index !== indexToRemove));
    toast.success('Serial removed');
  };

  const handleAddNewSerials = async () => {
    if (!selectedCategoryFilter) {
      toast.error('Please select a category before adding serials');
      return;
    }
  
    const input = newSerialsInput.trim();
    if (!input) return;
  
    const rawEntries = input
      .split(/[\n,]/)
      .map(sn => sn.trim())
      .filter(sn => sn !== '');
  
    const inputDuplicates = rawEntries.filter((item, idx) => rawEntries.indexOf(item) !== idx);
    if (inputDuplicates.length > 0) {
      toast.error(`Duplicate serials in input: ${[...new Set(inputDuplicates)].join(', ')}`);
      return;
    }
  
    const uniqueEntries = rawEntries.filter(sn => !serials.some(s => s.serial_no === sn));
    if (uniqueEntries.length === 0) {
      toast.warning('No valid or unique serials entered.');
      return;
    }
  
    try {
      // Corrected: Passing authentication headers to the axios.post call
      const res = await axios.post(`${API_BASE_URL}/check-serials`, { serials: uniqueEntries }, getAuthHeaders());
      if (res.data.status && res.data.duplicates?.length > 0) {
        toast.error(`These serials already exist: ${res.data.duplicates.join(', ')}`);
        return;
      }
  
      // Assign category info
      const categoryObj = dropdowns.categories.find(c => c.id === parseInt(selectedCategoryFilter));
  
      const newEntries = uniqueEntries.map(sn => ({
        serial_no: sn,
        remark: '',
        quality_check: '',
        category_id: categoryObj.id,
        category: categoryObj.category
      }));
  
      setSerials(prev => [...prev, ...newEntries]);
      setNewSerialsInput('');
      toast.success(`${newEntries.length} serial(s) added to category "${categoryObj.category}".`);
    } catch (err) {
      console.error('Failed to validate serials:', err);
      toast.error(err.response?.data?.message || 'Failed to validate serials. Please try again.');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purchase) return;
  
    // Group serials by category
    const grouped = {};
    serials.forEach(s => {
      if (!grouped[s.category_id]) grouped[s.category_id] = [];
      grouped[s.category_id].push(s.serial_no);
    });
  
    // Build from_serial / to_serial per category
    const categoriesPayload = Object.keys(grouped).map(catId => {
      const sorted = grouped[catId].sort();
      return {
        category_id: parseInt(catId),
        from_serial: sorted[0],
        to_serial: sorted[sorted.length - 1]
      };
    });
  
    const payload = {
      vendor_id: purchase.vendor_id,
      invoice_no: purchase.invoice_no,
      invoice_date: purchase.invoice_date,
      categories: categoriesPayload
    };
  
    try {
      // Corrected: Passing authentication headers to the axios.put call
      const res = await axios.put(`${API_BASE_URL}/purchase/${id}`, payload, getAuthHeaders());
      if (res.data.status) {
        toast.success('Updated successfully!');
        setTimeout(() => navigate('/purchaseOrder'), 1000);
      } else {
        toast.error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update failed:', err);
      const errorData = err.response?.data || {};
      toast.error(errorData.message || 'Something went wrong');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };
  

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!purchase) {
    return <div className="p-4 text-danger">{error || 'No purchase data found'}</div>;
  }

  // Virtualized row for performance
  const RowItem = ({ index, style }) => {
    const item = serials[index];
    return (
      <Row className="mb-2" style={style}>
        <Col md={3}>
          <Form.Control value={item.serial_no} readOnly />
        </Col>
        <Col md={3}>
          <Form.Control
            size="sm"
            placeholder="Remark"
            value={item.remark || ''}
            onChange={(e) => handleInputChange(index, 'remark', e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select
            size="sm"
            value={item.quality_check || ''}
            onChange={(e) => handleInputChange(index, 'quality_check', e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="ok">OK</option>
            <option value="Issue">Issue</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteSerial(index)}
          >
            <i className="bi bi-trash"></i>
          </Button>
        </Col>
      </Row>
    );
  };

  return (
    <div className="w-100 py-4 px-4 bg-white" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Edit Purchase</h4>
        <Button variant="outline-secondary" onClick={() => navigate('/purchaseOrder')}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-muted mb-1">Vendor</Form.Label>
              <Form.Select
                name="vendor_id"
                size="sm"
                value={purchase.vendor_id || ''}
                onChange={handlePurchaseChange}
              >
                <option value="">-- Select Vendor --</option>
                {dropdowns.vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-muted mb-1">Invoice No</Form.Label>
              <Form.Control
                size="sm"
                name="invoice_no"
                value={purchase.invoice_no || ''}
                onChange={handlePurchaseChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Label className="text-muted mb-1">Invoice Date</Form.Label>
            <Form.Control
              size="sm"
              type="date"
              name="invoice_date"
              value={purchase.invoice_date || ''}
              onChange={handlePurchaseChange}
            />
          </Col>
          <Col md={6}></Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
          <Form.Group>
            <Form.Label className="text-muted mb-1">Category</Form.Label>
            <Form.Select
              name="category_id"
              size="sm"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="">-- All Categories --</option>
              {dropdowns.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="text-muted mb-1">Total Serials</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                readOnly
                value={serials.length}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3 col-md-6">
          <Form.Label className="text-muted mb-1">Add New Serial Numbers</Form.Label>
          <Form.Control
            as="textarea"
            size="sm"
            rows={2}
            placeholder="Enter new serials separated by new lines or commas"
            value={newSerialsInput}
            onChange={(e) => setNewSerialsInput(e.target.value)}
          />
          <Button size="sm" className="mt-2" variant="success" onClick={handleAddNewSerials}>
            Add Serials
          </Button>
        </Form.Group>

        <div className="mb-3">
          <Form.Label className="fw-bold">Serial Details</Form.Label>
          <List
            height={400}
            itemCount={serials.length}
            itemSize={50}
            width="100%"
          >
            {RowItem}
          </List>
        </div>

        <ToastContainer position="top-right" autoClose={3000} />

        <div className="d-flex justify-content-end">
          <Button variant="secondary" className="me-2" onClick={() => navigate('/purchaseOrder')}>
            Cancel
          </Button>
          <Button type="submit" variant="success">Update</Button>
        </div>
      </Form>
    </div>
  );
}
