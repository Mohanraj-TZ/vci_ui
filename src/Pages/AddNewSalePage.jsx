import React, { useEffect, useState, useRef } from 'react';
import { Button, Form, Row, Col, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select, { components } from 'react-select';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductModal from './ProductModal';
import { API_BASE_URL } from '../api';
import dayjs from 'dayjs';

export default function AddNewSalePage() {
  const hasFetched = useRef(false);
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  // const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serialError, setSerialError] = useState('');
  const [errors, setErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    customer_id: '',
    // batch_id: '',
    category_id: '',
    quantity: '',
    from_serial: '',
    shipment_name: '',
    serial_numbers: [],
    shipment_date: '',
    delivery_date: '',
    tracking_no: '',
    notes: '',
    warranty_start: '',
    warranty_end: '',
    warranty_status: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);


  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
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

  const validateForm = () => {
    const newFormErrors = {};

    if (!formData.customer_id) newFormErrors['customer_id'] = "Customer is required";
    // if (!formData.batch_id) newFormErrors['batch_id'] = "Batch is required";
    if (!formData.category_id) newFormErrors['category_id'] = "Category is required";
    if (!formData.quantity) newFormErrors['quantity'] = "Quantity is required";
    if (!formData.shipment_name) newFormErrors['shipment_name'] = "Shipment Name is required";
    if (!formData.shipment_date) newFormErrors['shipment_date'] = "Shipment Date is required";
    if (!formData.delivery_date) newFormErrors['delivery_date'] = "Delivery Date is required";
    if (!formData.tracking_no) newFormErrors['tracking_no'] = "Tracking Number is required";
    if (!formData.warranty_start) newFormErrors['warranty_start'] = "Warranty start date is required";
    if (!formData.warranty_end) newFormErrors['warranty_end'] = "Warranty end date is required";

    if (formData.serial_numbers.length === 0) {
      newFormErrors['serial_numbers'] = "Serial numbers are required";
    } else {
      formData.serial_numbers.forEach((serial, idx) => {
        if (!serial || serial.trim() === '') {
          newFormErrors[`serial-${idx}`] = "Serial is required";
        }
      });
    }

    setFormErrors(newFormErrors);
    return Object.keys(newFormErrors).length === 0;
  };


  const handleAddProducts = (selectedProducts) => {
    const newSerials = selectedProducts.map(p => p.serial_no);
    const updatedSerials = [...formData.serial_numbers, ...newSerials];

    setFormData(prev => ({
      ...prev,
      serial_numbers: updatedSerials,
      quantity: updatedSerials.length
    }));
  };


  const handleAddClick = async () => {
    // if (!formData.batch_id || !formData.category_id) {
    //   toast.error("Please select both Batch and Category first.");
    //   return;
    // }

    setShowModal(true);
    setLoadingProducts(true);

    try {
      const res = await axios.get(`${API_BASE_URL}/products`, {
        params: {
          batch_id: formData.batch_id,
          category_id: formData.category_id,
          sale_status: 'Available'
        }
      });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch filtered products:", error);
      toast.error("Failed to fetch products!");
    } finally {
      setLoadingProducts(false);
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
    // Fetch dropdown data only once
    if (hasFetched.current) return;
    hasFetched.current = true;

    axios.get(`${API_BASE_URL}/form-dropdowns`, getAuthHeaders())
      .then(res => {
        if (res.data?.data) {
          setCustomers(res.data.data.customers);
          // setBatches(res.data.data.batches);
          setCategories(res.data.data.categories);
        }
      })
      .catch(err => {
        console.error('Error loading dropdowns:', err);
        // Handle unauthorized or other errors from the API
        if (err.response?.status === 401) {
          toast.error("Session expired. Please log in again.", { toastId: 'auth-error' });
          navigate('/login');
        } else {
          toast.error("Failed to load form data.");
        }
      });
  }, []);

  const handleChange = async (e) => {
  const { name, value } = e.target;
  let updated = { ...formData, [name]: value };

  // Remove field-specific errors
  if (formErrors[name]) {
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }

  // Update warranty status if start or end date changed
  if (name === 'warranty_start' || name === 'warranty_end') {
    if (updated.warranty_start && updated.warranty_end) {
      const today = new Date();
      const start = new Date(updated.warranty_start);
      const end = new Date(updated.warranty_end);

      updated.warranty_status = today >= start && today <= end ? 'active' : 'expired';
    } else {
      updated.warranty_status = '';
    }
  }

  setFormData(updated);

  // Fetch serials if relevant fields changed
  if (['quantity', 'from_serial', 'category_id'].includes(name)) {
    const { quantity, from_serial, category_id } = updated;

    if (quantity && category_id) {
      try {
        const payload = { quantity, category_id };
        if (from_serial?.trim() !== '') payload.from_serial = from_serial;

        const response = await axios.post(`${API_BASE_URL}/products/serials`, payload);
        const serials = response.data?.data || [];

        setFormData(prev => ({
          ...prev,
          serial_numbers: serials,
          quantity: serials.length // always sync quantity with serials
        }));

        if (serials.length === 0) {
          setSerialError("No serial numbers found.");
        } else if (serials.length < parseInt(quantity)) {
          setSerialError(`Only ${serials.length} products available, but you requested ${quantity}.`);
        } else {
          setSerialError("");
        }
      } catch (err) {
        console.error('Error fetching serials:', err);
        setSerialError("Failed to load serial numbers.");
        setFormData(prev => ({ ...prev, serial_numbers: [], quantity: 0 }));
      }
    }
  }
};


  const handleCustomerChange = (selected) => {
    const value = selected?.value || '';
    setFormData(prev => ({
      ...prev,
      customer_id: value
    }));

    if (formErrors['customer_id']) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors['customer_id'];
        return newErrors;
      });
    }
  };


  const handleSerialChange = (index, value) => {
    const updatedSerials = [...formData.serial_numbers];
    updatedSerials[index] = value;
    setFormData(prev => ({ ...prev, serial_numbers: updatedSerials }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    axios.post(`${API_BASE_URL}/saleStore`, formData, getAuthHeaders())
      .then(() => {
        toast.success('Sale added successfully!');
        navigate('/salesOrder');
      })
      .catch(err => {
        console.error('Error posting sale:', err);
        toast.error('Failed to save sale.');


        if (err.response && err.response.status === 422) {
          const res = err.response.data;

          if (res.errors) {
            setErrors(res.errors);
          } else if (res.message) {
            setErrors(prev => ({
              ...prev,
              quantity: res.message
            }));
          }

        } else {
          console.error("Other error:", err);
        }
      });
  };

  const handleRemoveSerial = (removeIdx) => {
    setFormData(prev => {
      const updatedSerials = prev.serial_numbers.filter((_, idx) => idx !== removeIdx);
      return {
        ...prev,
        serial_numbers: updatedSerials,
        quantity: updatedSerials.length
      };
    });
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
    subLabel: c.company || 'Valkontech'
  }));

  return (
    <div className="w-100 py-4 px-4 bg-white" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-semibold mb-0">Add New Sale</h4>
        <Button variant="outline-secondary" onClick={() => navigate('/salesOrder')}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={4} >
            <Form.Group controlId="customer_id" className="mb-3">
              <Form.Label>Customer</Form.Label>
              <Select
                options={customerOptions}
                value={customerOptions.find(opt => opt.value === formData.customer_id) || null}
                onChange={handleCustomerChange}
                isClearable
                placeholder="SelectCustomer"
                components={{
                  SingleValue: CustomSingleValue,
                  Option: CustomOption
                }}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '32px',
                    height: '32px',
                    fontSize: '0.875rem',
                    boxShadow: 'none', borderColor: '#ced4da'
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    paddingTop: '0px',
                    paddingBottom: '0px',
                  }),
                  indicatorsContainer: (base) => ({
                    ...base,
                    height: '32px',
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: '2px 6px',
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    padding: '2px 6px',
                  }),
                  input: (base) => ({
                    ...base,
                    margin: '0px',
                    padding: '0px',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    display: 'flex',
                    alignItems: 'center',
                  })
                }}
              />
              {formErrors['customer_id'] && (
                <div className="text-danger small">{formErrors['customer_id']}</div>
              )}
            </Form.Group>
          </Col>

          {/* <Col md={4}>
            <Form.Label>Batch</Form.Label>
            <Form.Select size="sm" name="batch_id" value={formData.batch_id} onChange={handleChange} style={{ boxShadow: 'none', borderColor: '#ced4da' }}
              isInvalid={!!formErrors['batch_id']}
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.batch}</option>

              ))}

            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {formErrors['batch_id']}
            </Form.Control.Feedback>
          </Col> */}

          <Col md={4}>
            <Form.Label>Category</Form.Label>
            <Form.Select size="sm" name="category_id" value={formData.category_id} onChange={handleChange} style={{ boxShadow: 'none', borderColor: '#ced4da' }}
              isInvalid={!!formErrors['category_id']}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category}</option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {formErrors['category_id']}
            </Form.Control.Feedback>
          </Col>
        </Row>

        <Row className="mb-3 g-2">
          <Col md={4} sm={6} xs={12}>
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              size="sm"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              isInvalid={!!formErrors['quantity']}
              placeholder="Enter Quantity"
              style={{ boxShadow: 'none', borderColor: '#ced4da' }}
            />
            {errors.quantity && <div className="text-danger small mt-1">{errors.quantity}</div>}
            {serialError && <div className="text-danger small mt-1">{serialError}</div>}
          </Col>
          <Col md={4} sm={6} xs={12}>
            <Form.Label>From Serial Number</Form.Label>
            <Form.Control size="sm" name="from_serial" value={formData.from_serial} onChange={handleChange} placeholder="Enter From Serial" style={{ boxShadow: 'none', borderColor: '#ced4da' }} />
          </Col>
          <Col md={4} sm={6} xs={12}>
            <Form.Label>Shipment Name</Form.Label>
            <Form.Control size="sm" name="shipment_name" value={formData.shipment_name} onChange={handleChange} placeholder="Enter Shipment Name" style={{ boxShadow: 'none', borderColor: '#ced4da' }}
              isInvalid={!!formErrors['shipment_name']}
            />
            <Form.Control.Feedback type="invalid">
              {formErrors['shipment_name']}
            </Form.Control.Feedback>
          </Col>
        </Row>

        <Row className="mb-3 g-2">
          <Col md={4}>
            <Form.Label>Warranty Start</Form.Label>
            <Form.Control
              size="sm"
              type="date"
              name="warranty_start"
              value={formData.warranty_start}
              onChange={handleChange}
              isInvalid={!!formErrors['warranty_start']}
              style={{ boxShadow: 'none', borderColor: '#ced4da' }}
            />
            <Form.Control.Feedback type="invalid">{formErrors['warranty_start']}</Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <Form.Label>Warranty End</Form.Label>
            <Form.Control
              size="sm"
              type="date"
              name="warranty_end"
              value={formData.warranty_end}
              onChange={handleChange}
              isInvalid={!!formErrors['warranty_end']}
              style={{ boxShadow: 'none', borderColor: '#ced4da' }}
            />
            <Form.Control.Feedback type="invalid">{formErrors['warranty_end']}</Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <Form.Label>Warranty Status</Form.Label>
            <Form.Control
              size="sm"
              type="text"
              name="warranty_status"
              value={formData.warranty_status}
              readOnly
              style={{
                boxShadow: 'none',
                borderColor: formData.warranty_status === 'active' ? '#28a745' : '#dc3545',
                color: formData.warranty_status === 'active' ? '#28a745' : '#dc3545'
              }}
            />
          </Col>
        </Row>

        <div className='mb-3'>
          <Form.Label className="mb-2 text-dark fw-normal">Product Serial No.</Form.Label>
          <Button variant="outline-secondary" className='ms-3' onClick={handleAddClick}>
            Add Product
          </Button>
        </div>

        <div className="w-100 d-flex flex-wrap gap-2 mb-3">
          {formData.serial_numbers.map((value, idx) => (
            <div
              key={idx}
              className="d-flex align-items-center border rounded-3 px-2 py-1"
              style={{ width: '105px', backgroundColor: '#F8F9FA', position: 'relative' }}
            >
              <Form.Control
                type="text"
                size="sm"
                value={value}
                onChange={(e) => handleSerialChange(idx, e.target.value)}
                className="shadow-none bg-transparent border-0 p-0 flex-grow-1"
                style={{ minWidth: 0 }}
              />
              {formErrors[`serial-${idx}`] && (
                <div className="text-danger small mt-1 ms-1">
                  {formErrors[`serial-${idx}`]}
                </div>
              )}
              <Button
                variant="link"
                size="sm"
                onClick={() => handleRemoveSerial(idx)}
                style={{
                  color: '#dc3545',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  marginLeft: '2px',
                  padding: 0
                }}
              >
                ×
              </Button>
            </div>
          ))}
        </div>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Label>Shipment Date</Form.Label>
            <Form.Control size="sm" type="date" name="shipment_date" value={formData.shipment_date} onChange={handleChange} style={{ boxShadow: 'none', borderColor: '#ced4da' }}
              isInvalid={!!formErrors['shipment_date']}
            />
            <Form.Control.Feedback type="invalid">
              {formErrors['shipment_date']}
            </Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <Form.Label>Delivery Date</Form.Label>
            <Form.Control size="sm" type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} style={{ boxShadow: 'none', borderColor: '#ced4da' }}
              isInvalid={!!formErrors['delivery_date']}
            />
            <Form.Control.Feedback type="invalid">
              {formErrors['delivery_date']}
            </Form.Control.Feedback>
          </Col>
          <Col md={4}>
            <Form.Label>Tracking No.</Form.Label>
            <Form.Control size="sm" name="tracking_no" value={formData.tracking_no} onChange={handleChange} style={{ boxShadow: 'none', borderColor: '#ced4da' }}
              isInvalid={!!formErrors['tracking_no']}
            />
            <Form.Control.Feedback type="invalid">
              {formErrors['tracking_no']}
            </Form.Control.Feedback>

          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Notes</Form.Label>
          <Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleChange} style={{ boxShadow: 'none', borderColor: '#ced4da' }} />
        </Form.Group>

        <div className="text-end mt-3">
          <Button type="submit" variant="success">Save</Button>
        </div>

      </Form>

      <ProductModal
        show={showModal}
        onHide={() => setShowModal(false)}
        loading={loadingProducts}
        products={products}
        onAdd={handleAddProducts}
        existingSerials={formData.serial_numbers}
      />
    </div>
  );
}

const CustomSingleValue = (props) => (
  <components.SingleValue {...props}>
    {props.data.label}
  </components.SingleValue>
);

const CustomOption = (props) => {
  const { data, innerRef, innerProps } = props;
  return (
    <div
      ref={innerRef}
      {...innerProps}
      className="d-flex align-items-center px-2 py-2"
      style={{ cursor: 'pointer' }}
    >
      <div
        className="rounded-circle bg-light border text-secondary d-flex align-items-center justify-content-center me-3"
        style={{ width: 30, height: 30 }}
      >
        {data.label.charAt(0)}
      </div>
      <div>
        <div className="fw-semibold">{data.label}</div>
        <div className="text-muted small">{data.subLabel}</div>
      </div>
    </div>
  );
};