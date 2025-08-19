import { Modal, Spinner, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';
import { useState } from 'react';

const ProductModal = ({ show, onHide, loading, products, onAdd, existingSerials }) => {
const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddClick = () => {
    const selectedProducts = products.filter(p => selectedIds.includes(p.id));
    onAdd(selectedProducts);
    setSelectedIds([]);
    onHide();
  };

  // Filter products: remove those whose serial_no already exists
  const filteredProducts = products.filter(
    prod => !existingSerials.includes(prod.serial_no)
  );

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Product List</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-4 text-muted">No new products available to add.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  {/* <th>Batch</th> */}
                  <th>Category</th>
                  <th>Serial No</th>
                  <th>Test</th>
                  <th>Sale Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.id}>
                    {/* <td>{prod.batch?.batch || "-"}</td> */}
                    <td>{prod.category?.category || "-"}</td>
                    <td>{prod.serial_no}</td>
                    <td>{prod.test}</td>
                    <td>{prod.sale_status}</td>
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedIds.includes(prod.id)}
                        onChange={() => toggleSelect(prod.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleAddClick}
          disabled={selectedIds.length === 0}
        >
          Add
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductModal;