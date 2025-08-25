import React, { useEffect, useState, useRef } from 'react';
import { Button, Form, Row, Col, Table } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Select, { components } from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal } from 'react-bootstrap';
import EditProductModal from './EditProductModal';
import { API_BASE_URL } from "../api";


export default function EditSalePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [customers, setCustomers] = useState([]);
  // const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [originalSerials, setOriginalSerials] = useState([]);
  const [availableSerials, setAvailableSerials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [quantityError, setQuantityError] = useState('');
  const [loadingSerials, setLoadingSerials] = useState(false);
  const errorTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    customer_id: '',
    // batch_id: '',
    category_id: '',
    quantity: '',
    shipment_name: '',
    shipment_date: '',
    delivery_date: '',
    tracking_no: '',
    from_serial: '',
    serial_numbers: [],
    notes: '',
  });


  function AvailableSerialsModal({ show, handleClose, serials, onSelect }) {
    const handleSerialClick = (serial) => {
      onSelect(serial);
      handleClose(); // Close modal after adding
    };

    return (
      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Available Serials</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {serials.length === 0 ? (
            <p>No serials found.</p>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {serials.map((sn, idx) => (
                <div
                  key={sn.serial_no}
                  onClick={() => handleSerialClick(sn)}
                  className="border rounded px-2 py-1"
                  style={{ cursor: 'pointer', background: '#f8f9fa' }}
                >
                  {sn.serial_no}
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  //


  const handleSerialChange = (index, value) => {
    const updatedSerials = [...formData.serial_numbers];
    updatedSerials[index] = { ...updatedSerials[index], serial_no: value };
    setFormData(prev => ({ ...prev, serial_numbers: updatedSerials }));
  };

  const handleRemoveSerial = (removeIdx) => {
    const updatedSerials = formData.serial_numbers.filter((_, idx) => idx !== removeIdx);
    setFormData(prev => ({
      ...prev,
      serial_numbers: updatedSerials,
      quantity: updatedSerials.length
    }));
  };


  const handleAddSerial = (serial) => {
    const alreadySelected = formData.serial_numbers.find(s => s.serial_no === serial.serial_no);
    if (alreadySelected) return;

    const updatedSerials = [...formData.serial_numbers, serial];
    setFormData(prev => ({
      ...prev,
      serial_numbers: updatedSerials,
      quantity: updatedSerials.length
    }));
  };

  const updatedFormData = {
    ...formData,
    selected_serials: formData.serial_numbers.map(p => p.serial_no),
  };


  //

  const handleCustomerChange = (selected) => {
    setFormData(prev => ({
      ...prev,
      customer_id: selected?.value || ''
    }));
  };

  const fetchSerialNumbers = async () => {
    const {  category_id, quantity, from_serial } = formData;
    if ( !category_id || !quantity) return;
    setLoadingSerials(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/available-serials`, {
        // batch_id,
        category_id,
        from_serial,
        quantity: parseInt(quantity, 10),
        include_serials: originalSerials.map(p => p.serial_no),

      });
      const uniqueAvailable = response.data.available_serials.filter(
        sn => !originalSerials.some(p => p.serial_no === sn.serial_no)
      );


      setAvailableSerials(uniqueAvailable);

      setFormData(prev => ({ ...prev, serial_numbers: [] }));
    } catch (error) {
      console.error('Serial fetch failed:', error);
      setLoadingSerials(false);
    }
  };

  useEffect(() => {
    // When from_serial changes, reset serial_numbers to empty to force reselect
    setFormData(prev => ({ ...prev, serial_numbers: [] }));
  }, [formData.from_serial]);


  useEffect(() => {
    axios.get(`${API_BASE_URL}/form-dropdowns`)
      .then(res => {
        const { customers,categories } = res.data.data;
        setCustomers(customers);
        // setBatches(batches);
        setCategories(categories);
      })
      .catch(err => console.error('Dropdown fetch error:', err));

    axios.get(`${API_BASE_URL}/sales/${id}/edit`)
      .then(res => {
        const sale = res.data.sale;
        const currentSerials = res.data.current_product_ids || [];

        setFormData({
          customer_id: sale.customer_id,
          // batch_id: sale.batch_id,
          category_id: sale.category_id,
          quantity: sale.quantity,
          shipment_name: sale.shipment_name,
          shipment_date: sale.shipment_date,
          delivery_date: sale.delivery_date,
          tracking_no: sale.tracking_no || '',
          from_serial: sale.from_serial || '',
          serial_numbers: currentSerials,
          notes: sale.notes || '',
        });

        setOriginalSerials(currentSerials);
        setAvailableSerials(res.data.available_products || []);
      })
      .catch(err => console.error('Error loading sale data:', err));
  }, [id]);

  useEffect(() => {
    if (!formData.quantity) return; // nothing to do if qty empty

    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty <= 0) return;

    const current = formData.serial_numbers || [];
    const combinedSerials = [...originalSerials, ...availableSerials];
    const uniqueSerials = Array.from(new Map(combinedSerials.map(item => [item.serial_no, item])).values());
    uniqueSerials.sort((a, b) => a.serial_no.localeCompare(b.serial_no));

    let filteredSerials = uniqueSerials;
    if (formData.from_serial?.trim()) {
      filteredSerials = uniqueSerials.filter(sn => sn.serial_no >= formData.from_serial.trim());
    }

    const toAdd = filteredSerials.slice(0, qty);
    setFormData(prev => ({ ...prev, serial_numbers: toAdd }));

  }, [formData.from_serial]);




  useEffect(() => {
    if (formData.category_id && formData.from_serial && formData.quantity) {
      fetchSerialNumbers();
    }
  }, [formData.category_id, formData.from_serial, formData.quantity]);


  useEffect(() => {
    // If quantity is empty or invalid, clear error and exit
    if (formData.quantity === '') {
      setQuantityError('');
      return;
    }

    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setQuantityError('');
      return;
    }

    const current = formData.serial_numbers || [];
    const combinedSerials = [...originalSerials, ...availableSerials];
    const uniqueSerials = Array.from(new Map(combinedSerials.map(item => [item.serial_no, item])).values());
    uniqueSerials.sort((a, b) => a.serial_no.localeCompare(b.serial_no));

    let filteredSerials = uniqueSerials;
    if (formData.from_serial && formData.from_serial.trim() !== '') {
      const fromSerial = formData.from_serial.trim();
      filteredSerials = uniqueSerials.filter(sn => sn.serial_no >= fromSerial);
    }

    const availableCount = filteredSerials.filter(
      sn => !current.some(c => c.serial_no === sn.serial_no)
    ).length;

    const totalAvailable = current.length + availableCount;

    if (qty > totalAvailable) {
      setTimeout(() => {
        setQuantityError(`Only ${totalAvailable} serials are available starting from ${formData.from_serial || 'first'}, but you requested ${qty}.`);
      }, 100);

      // Add only as many as possible, but DO NOT change quantity value!
      const needed = totalAvailable - current.length;
      const toAdd = filteredSerials
        .filter(sn => !current.some(c => c.serial_no === sn.serial_no))
        .slice(0, needed);

      setFormData(prev => ({
        ...prev,
        serial_numbers: [...current, ...toAdd],
        // quantity: prev.quantity, // <-- keep unchanged
      }));
    } else {
      setQuantityError('');

      if (current.length > qty) {
        // Trim serials down to qty
        const trimmed = current.slice(0, qty);
        setFormData(prev => ({
          ...prev,
          serial_numbers: trimmed,
          // quantity: prev.quantity,  //<-- keep unchanged
        }));
      } else if (current.length < qty) {
        // Add serials up to qty, but not changing quantity input
        const needed = qty - current.length;
        const toAdd = filteredSerials
          .filter(sn => !current.some(c => c.serial_no === sn.serial_no))
          .slice(0, needed);

        if (toAdd.length > 0) {
          setFormData(prev => ({
            ...prev,
            serial_numbers: [...current, ...toAdd],
            // quantity: prev.quantity, 
          }));
        }
      }
    }
  }, [formData.quantity, formData.from_serial, availableSerials, originalSerials]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const requiredQty = parseInt(formData.quantity || 0, 10);
    const currentSerials = formData.serial_numbers || [];
    const available = availableSerials || [];


    if (requiredQty <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }

    // Check if quantity exceeds available serial numbers
    if (requiredQty > currentSerials.length) {
      toast.error(`Quantity (${requiredQty}) exceeds available serial numbers (${currentSerials.length}).`);
      return; // Prevent submission
    }

    // Remove duplicates based on serial_no
    const merged = [...currentSerials, ...available];
    const uniqueSerialsMap = {};
    const uniqueSerials = [];

    for (const item of merged) {
      if (!uniqueSerialsMap[item.serial_no]) {
        uniqueSerialsMap[item.serial_no] = true;
        uniqueSerials.push(item);
      }
    }

    const finalSerials = uniqueSerials.slice(0, requiredQty);

    axios.put(`${API_BASE_URL}/salesUpdate/${id}`, updatedFormData)
      .then(() => {
        toast.success('Sale updated successfully!');
        setTimeout(() => navigate('/salesOrder'), 1500);
      })
      .catch(err => {
        console.error('Error updating sale:', err);
        toast.error('Failed to update sale.');


        // if (err.response && err.response.status === 422) {
        //   const { message, invalid_serials } = err.response.data;

        //   if (invalid_serials && invalid_serials.length > 0) {
        //     toast.error(`${message} (${invalid_serials.join(', ')})`, { autoClose: 5000 });
        //   } else {
        //     toast.error(message || 'Validation error occurred.', { autoClose: 5000 });
        //   }
        // } else {
        //   toast.error('Failed to update sale.', { autoClose: 5000 });
        // }
      });
  };

  const customerOptions = customers.map(c => ({
    value: c.id,
    label: c.name,
    subLabel: c.company || 'Valkontech'
  }));

  return (
    <div className="w-100 py-4 px-4 bg-white" style={{ minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-semibold mb-0">Edit Sale</h4>
        <Button variant="outline-secondary" onClick={() => navigate('/salesOrder')}>
          <i className="bi bi-arrow-left" /> Back
        </Button>
      </div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group controlId="customer_id" className="mb-3">
              <Form.Label>Customer</Form.Label>
              <Select
                options={customerOptions}
                value={customerOptions.find(opt => opt.value === formData.customer_id) || null}
                onChange={handleCustomerChange}
                isClearable
                placeholder="Select Customer"
                components={{ SingleValue: CustomSingleValue, Option: CustomOption }}
                className="form-control form-control-sm p-0"
                classNamePrefix="react-select-sm"
              />
            </Form.Group>
          </Col>

          {/* <Col md={4}>
            <Form.Label>Batch</Form.Label>
            <Form.Select size="sm" name="batch_id" value={formData.batch_id} onChange={handleChange}>
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.batch}</option>
              ))}
            </Form.Select>
          </Col> */}

          <Col md={4}>
            <Form.Label>Category</Form.Label>
            <Form.Select size="sm" name="category_id" value={formData.category_id} onChange={handleChange}>
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        <Row className="mb-3 g-2">
          <Col md={4}>
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              size="sm"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              isInvalid={!!quantityError}
            />
            {quantityError && (
              <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                {quantityError}
              </div>
            )}
          </Col>

          <Col md={4}>
            <Form.Label>From Serial</Form.Label>
            <Form.Control
              size="sm"
              name="from_serial"
              value={formData.from_serial}
              onChange={handleChange}
              placeholder="e.g. SN-1003"
            />
          </Col>

          <Col md={4}>
            <Form.Label>Shipment Name</Form.Label>
            <Form.Control size="sm" name="shipment_name" value={formData.shipment_name} onChange={handleChange} />
          </Col>
        </Row>
        Product Serial No. (Already Sold for this Sale)
        <Form.Label className="mb-2 text-dark fw-normal">
          <Button variant="outline-secondary" className="ms-2" onClick={() => setShowModal(true)}>
            Add Product
          </Button>
        </Form.Label>
        <div className="w-100 d-flex flex-wrap gap-2 mb-3">
          {/* Already added serials */}
          {formData.serial_numbers.map((item, idx) => (
            <div
              key={idx}
              className="d-flex align-items-center border rounded-3 px-2 py-1"
              style={{ width: '105px', backgroundColor: '#F8F9FA', position: 'relative' }}
            >
              <Form.Control
                type="text"
                size="sm"
                value={item.serial_no}
                onChange={(e) => handleSerialChange(idx, e.target.value)}
                className="shadow-none bg-transparent border-0 p-0 flex-grow-1"
                style={{ minWidth: 0 }}
              />
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
            <Form.Control size="sm" type="date" name="shipment_date" value={formData.shipment_date} onChange={handleChange} />
          </Col>
          <Col md={4}>
            <Form.Label>Delivery Date</Form.Label>
            <Form.Control size="sm" type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} />
          </Col>
          <Col md={4}>
            <Form.Label>Tracking No.</Form.Label>
            <Form.Control size="sm" name="tracking_no" value={formData.tracking_no} onChange={handleChange} />
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Notes</Form.Label>
          <Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleChange} />
        </Form.Group>

        <div className="text-end mt-3">
          <Button type="submit" variant="success">Update</Button>
        </div>
      </Form>
      <EditProductModal
        show={showModal}
        onHide={() => setShowModal(false)}
        loading={false} // optional: you can handle loading state
        products={availableSerials}
        onAdd={(selected) => {
          const updatedSerials = [
            ...formData.serial_numbers,
            ...selected.filter(
              item => !formData.serial_numbers.some(existing => existing.serial_no === item.serial_no)
            )
          ];
          setFormData(prev => ({
            ...prev,
            serial_numbers: updatedSerials,
            quantity: updatedSerials.length
          }));
          setShowModal(false);
        }}
        existingSerials={formData.serial_numbers.map(p => p.serial_no)}
      />


    </div>
  );
}

const CustomSingleValue = (props) => (
  <components.SingleValue {...props}>{props.data.label}</components.SingleValue>
);

const CustomOption = (props) => {
  const { data, innerRef, innerProps } = props;
  return (
    <div ref={innerRef} {...innerProps} className="d-flex align-items-center px-2 py-2" style={{ cursor: 'pointer' }}>
      <div className="rounded-circle bg-light border text-secondary d-flex align-items-center justify-content-center me-3" style={{ width: 30, height: 30 }}>
        {data.label.charAt(0)}
      </div>
      <div>
        <div className="fw-semibold">{data.label}</div>
        <div className="text-muted small">{data.subLabel}</div>
      </div>
    </div>
  );
};