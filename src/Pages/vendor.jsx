import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Spinner, Card } from "react-bootstrap";
import axios from "axios";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Select from 'react-select';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net";
import MiniCalendar from "./MiniCalendar";
import { API_BASE_URL } from "../api";
import Breadcrumb from "./Components/Breadcrumb";
import Pagination from "./Components/Pagination";
import Search from "./Components/Search";

function initialForm() {
    return {
        id: null,
        first_name: "",
        last_name: "",
        gender: "",
        mobile: "",
        altMobile: "",
        email: "",
        company_name: "",
        address: "",
        city: "",
        state: "",
        district: "",
        pincode: "",
        gst: "",
        dob: "",
    };
}

export default function vendor() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(initialForm());
    const [isEditing, setIsEditing] = useState(false);
    const [states, setStates] = useState([]);
    const [districtsForTable, setDistrictsForTable] = useState([]);
    const [districtsForForm, setDistrictsForForm] = useState([]);
    const [errors, setErrors] = useState({});
    const [showCalendar, setShowCalendar] = useState(false);
    const toastIdRef = useRef(null); 
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

    const tableRef = useRef(null);

    // const apiBase = "http://127.0.0.1:8000/api";

// Put this ABOVE your useEffect
const loadInitialData = async () => {
    setLoading(true);
    try {
        const statesRes = await axios.get(`${API_BASE_URL}/states`);
        setStates(Array.isArray(statesRes.data) ? statesRes.data : []);

        const districtsRes = await axios.get(`${API_BASE_URL}/districts`);
        setDistrictsForTable(Array.isArray(districtsRes.data) ? districtsRes.data : []);

        const vendorsRes = await axios.get(`${API_BASE_URL}/vendors`);
        setVendors(Array.isArray(vendorsRes.data.data) ? vendorsRes.data.data : vendorsRes.data);
        toast.success("Vendors loaded successfully!", { toastId: 'vendors-loaded', autoClose: 1500 });
    } catch (err) {
        console.error("Failed to load initial data:", err);
        toast.error("Failed to load data.", { autoClose: 1500 });
    } finally {
        setLoading(false);
    }
};

// Then your effect just calls it
useEffect(() => {
    loadInitialData();
}, []);


    useEffect(() => {
        if (!loading && vendors.length > 0) {
            $(tableRef.current).DataTable({
                destroy: true, 
                ordering: true,
                paging: true,
                searching: true,
                lengthChange: true,
                columnDefs: [{ targets: 0, className: "text-center" }],
            });
        }
        return () => {
            if ($.fn.DataTable.isDataTable(tableRef.current)) {
                $(tableRef.current).DataTable().destroy();
            }
        };
    }, [vendors, loading]);

    useEffect(() => {
        if (formData.state) {
            fetchDistrictsForForm(formData.state);
        } else {
            setDistrictsForForm([]); 
        }
    }, [formData.state]);

    const fetchDistrictsForForm = (stateId) => {
        if (!stateId) {
            setDistrictsForForm([]);
            return;
        }

        axios.get(`${API_BASE_URL}/districts/state/${stateId}`)
            .then((res) => {
                setDistrictsForForm(Array.isArray(res.data) ? res.data : []);
            })
            .catch((err) => {
                console.error("Error fetching districts for form:", err);
                setDistrictsForForm([]);
            });
    };
  


    const handleChange = (e, selectName = null) => {
        let name, value;

        if (selectName) {
            name = selectName;
            value = e ? e.value : "";
        } else {
            name = e.target.name;
            value = e.target.value;

            if (["first_name", "last_name", "city",].includes(name)) {
                if (!/^[A-Za-z\s]*$/.test(value)) {
                    setErrors(prev => ({ ...prev, [name]: "Only alphabets are allowed." }));
                    return;
                } else {
                    setErrors(prev => ({ ...prev, [name]: "" }));
                }
            }

            if ((name === "mobile")) {
                if (!/^\d*$/.test(value)) {
                    return;  
                }

                if (value.length > 10) {
                    return;
                }
                


                setFormData(prev => ({ ...prev, [name]: value }));

                if (value.length === 10) {
                    setErrors(prev => ({ ...prev, [name]: "" }));
                }
                return;
            }
            if (name === "altMobile") {
                if (!/^\d*$/.test(value)) {
                    return;  
                }
                if (value.trim() !== "" && !/^\d{10}$/.test(value)) {
                    setErrors(prev => ({ ...prev, altMobile: "Alternative mobile number must be 10 digits." }));
                } else {
                    setErrors(prev => ({ ...prev, altMobile: "" }));
                }
            }

            if (name === "pincode") {
                if (!/^\d*$/.test(value)) {
                    return; 
                }

                if (value.length > 6) {
                    return;
                }

                setFormData(prev => ({ ...prev, [name]: value }));

                if (value.length === 6) {
                    setErrors(prev => ({ ...prev, [name]: "" }));
                }
                return;
            }

            if (name === "gst") {
                if (value.length > 15) {
                    return; 
                }

                if (value.trim() === "") {
                    setErrors(prev => ({ ...prev, gst: "" }));
                } 

                else if (!/^[0-9A-Z]{15}$/.test(value)) {
                    setErrors(prev => ({ ...prev, gst: "GST No. must be 15 alphanumeric characters." }));
                } else {
                    setErrors(prev => ({ ...prev, gst: "" }));
                }
            }


        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (value && errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }

        if (name === "state") {
            setFormData(prev => ({ ...prev, district: "" }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;

        if (!value.trim()) {
            setErrors(prev => ({ ...prev, [name]: `${name.replace("_", " ")} is required.` }));
            return;
        }

       if (name === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.(com)$/i;
            if (!emailRegex.test(value)) {
                setErrors(prev => ({ ...prev, email: "Enter a valid email address." }));
            } else {
                setErrors(prev => ({ ...prev, email: "" }));
            }
        }

        if (name === "mobile") {
            if (!/^\d{10}$/.test(value)) {
                setErrors(prev => ({ ...prev, [name]: "Must be exactly 10 digits." }));
            } else {
                setErrors(prev => ({ ...prev, [name]: "" }));
            }
        }

        if (name === "altMobile") {
            if (value.trim() !== "" && !/^\d{10}$/.test(value)) {
                setErrors(prev => ({ ...prev, altMobile: "Alternative mobile number must be 10 digits." }));
            } else {
                setErrors(prev => ({ ...prev, altMobile: "" }));
            }
        }

        if (name === "pincode") {
            if (!/^\d{6}$/.test(value)) {
                setErrors(prev => ({ ...prev, [name]: "Pincode must be exactly 6 digits." }));
            } else {
                setErrors(prev => ({ ...prev, [name]: "" }));
            }
        }

        if (["gender", "state", "district"].includes(name)) {
            if (!value) {
                setErrors(prev => ({ ...prev, [name]: `${name.charAt(0).toUpperCase() + name.slice(1)} is required.` }));
            } else {
                setErrors(prev => ({ ...prev, [name]: "" }));
            }
        }

        if (name === "gst") {
            if (!value.trim()) {
                setErrors(prev => ({ ...prev, gst: "GST_NO is required." }));
            } 
            else if (!/^[0-9A-Z]{15}$/.test(value)) {
                setErrors(prev => ({ ...prev, gst: "GST No. must be 15 alphanumeric characters." }));
            } else {
                setErrors(prev => ({ ...prev, gst: "" })); // Clear error when correct
            }
        }
    };

    const handleSelectBlur = (fieldName) => {
        const value = formData[fieldName];
        if (!value) {
            setErrors(prev => ({ ...prev, [fieldName]: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required.` }));
        } else {
            setErrors(prev => ({ ...prev, [fieldName]: "" }));
        }
    };



const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.(com)$/i.test(formData.email)) newErrors.email = "Email is invalid";

    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required.";
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = "Mobile number must be 10 digits.";

    if (formData.altMobile.trim() && !/^\d{10}$/.test(formData.altMobile)) {
        newErrors.altMobile = "Alternative mobile number must be 10 digits.";
    }

    if (
        formData.mobile &&
        formData.altMobile &&
        formData.mobile === formData.altMobile
    ) {
        newErrors.altMobile = "Mobile and alternative mobile numbers should not be the same.";
    }

    if (!formData.gender) newErrors.gender = "Gender is required.";

    const today = new Date().toISOString().slice(0, 10);
    if (!formData.dob) newErrors.dob = "Date of Birth is required.";
    else if (formData.dob > today) newErrors.dob = "Date of Birth cannot be in the future.";

    if (!formData.company_name.trim()) newErrors.company_name = "Company name is required.";
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.city.trim()) newErrors.city = "City is required.";

    if (!formData.gst.trim()) {
        newErrors.gst = "GST_NO is required.";
    } else if (!/^[0-9A-Z]{15}$/.test(formData.gst)) {
        newErrors.gst = "GST No. must be 15 alphanumeric characters.";
    }
if (!formData.state) newErrors.state = "State is required.";
if (!formData.district) newErrors.district = "District is required.";

    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = "Pincode must be 6 digits.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        const payload = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            gender: formData.gender,
            mobile: formData.mobile,
            alter_mobile: formData.altMobile,
            email: formData.email,
            company_name: formData.company_name,
            address: formData.address,
            city: formData.city,
            state_id: formData.state ? parseInt(formData.state, 10) : null,
            district_id: formData.district ? parseInt(formData.district, 10) : null,
            pincode: formData.pincode,
            gst_no: formData.gst,
            date_of_birth: formData.dob,
        };

        const request = isEditing
            ? axios.put(`${API_BASE_URL}/vendors/${formData.id}`, payload)
            : axios.post(`${API_BASE_URL}/vendors`, payload);

        request
            .then(() => {
                if (isEditing) {
                    toast.success("Vendor updated successfully!", { autoClose: 1500 });
                } else {
                    toast.success("Vendor added successfully!", { autoClose: 1500 });
                }
                setTimeout(() => {
                    window.location.reload();
                }, 1500); 
            })
            .catch((err) => {
                if (err.response && err.response.data) {
                    const { message, errors: backendErrors } = err.response.data;
                    let newErrors = {};
                    if (backendErrors) {
                        Object.keys(backendErrors).forEach(field => {
                            const fieldErrors = backendErrors[field];
                            if (Array.isArray(fieldErrors)) {
                                newErrors[field] = fieldErrors[0];
                                toast.error(fieldErrors[0], { autoClose: 1000 });
                            } else {
                                newErrors[field] = fieldErrors;
                                toast.error(fieldErrors, { autoClose: 1000 });
                            }
                        });
                    } else if (message) {
                        toast.error(`Failed to save vendor: ${message}`, { autoClose: 1000 });
                    } else {
                        toast.error("Failed to save vendor. Please try again.", { autoClose: 1000 });
                    }
                    setErrors(newErrors);
                } else {
                    toast.error("Failed to save vendor.", { autoClose: 1000 });
                }
            });
    };

    const stateOptions = states.map(state => ({
        value: String(state.id),
        label: state.state,
    }));

    const districtOptions = districtsForForm.map(d => ({
        value: String(d.id),
        label: d.district,
    }));

    const genderOptions = [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
        { value: "Other", label: "Other" },
    ];

    const handleEdit = (vendor) => {
        setFormData({
            id: vendor.id,
            first_name: vendor.first_name || "",
            last_name: vendor.last_name || "",
            gender: vendor.gender || "",
            mobile: vendor.mobile || "",
        altMobile: vendor.alter_mobile || "", 
            email: vendor.email || "",
            company_name: vendor.company_name || "",
            address: vendor.address || "",
            city: vendor.city || "",
            state: vendor.state_id ? String(vendor.state_id) : "",
            district: vendor.district_id ? String(vendor.district_id) : "",
            pincode: vendor.pincode || "",
gst: vendor.gst_no || "",
            dob: vendor.date_of_birth || "",
        });

        setIsEditing(true);
        setShowForm(true);
        setErrors({});
    };

    const openForm = () => {
        setFormData(initialForm());
        setIsEditing(false);
        setShowForm(true);
        setErrors({});
    };

    const closeForm = () => {
        setFormData(initialForm());
        setIsEditing(false);
        setShowForm(false);
        setErrors({});
    };

    const errorStyle = {
        color: "#dc3545",
        fontSize: "13px",
        marginTop: "4px",
    };

    const getInputStyle = (fieldName) => ({
        width: "270px",
        height: "50px",
        fontFamily: "Product Sans, sans-serif",
        fontWeight: 400,
        fontSize: "16px",
        borderRadius: "4px",
        border: `1px solid ${errors[fieldName] ? "#dc3545" : "#D3DBD5"}`,
        backgroundColor: "#FFFFFF",
        color: "#212529",
    });

    const SimpleOption = ({ innerRef, innerProps, data }) => (
        <div ref={innerRef} {...innerProps} className="simple-option" style={{ padding: "10px 15px" }}>
            {data.label}
        </div>
    );

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            width: "270px",
            height: "50px",
            minHeight: "50px",
            fontFamily: "Product Sans, sans-serif",
            fontWeight: 400,
            fontSize: "16px",
            borderRadius: "4px",
            border: `1px solid ${state.selectProps.name && state.selectProps.errors?.[state.selectProps.name]
                ? "#dc3545"
                : "#D3DBD5"
                }`,
            boxShadow: "none",
            "&:hover": {
                borderColor: "#D3DBD5",
            },
            display: "flex",
            alignItems: "center",
            paddingLeft: "8px",
            paddingRight: "8px",
            cursor: "pointer",
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#212529",
        }),
        placeholder: (provided) => ({
            ...provided,
            fontFamily: "Product Sans, sans-serif",
            fontWeight: 400,
            color: "#828282",
        }),
        indicatorSeparator: () => ({
            display: "none",
        }),
        dropdownIndicator: (provided, state) => ({
            ...provided,
            color: "#000",
            transition: "transform 0.2s ease-in-out",
            transform: state.isFocused ? "rotate(180deg)" : null,
        }),
        menu: (provided) => ({
            ...provided,
            fontFamily: "Product Sans, sans-serif",
            fontWeight: 400,
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #D3DBD5",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            marginTop: "4px",
            zIndex: 1000,
            paddingTop: "4px",
            paddingBottom: "4px",
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? "#F0F0F0" : "white",
            color: "#212529",
            padding: "12px 18px",
            margin: "2px 8px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            "&:active": {
                backgroundColor: "#E0E0E0",
            },
        }),
    };
    const labelStyle = {
        color: "#393C3AE5",
        width: "325px",
        fontFamily: "Product Sans, sans-serif",
        fontWeight: 400,
    };

    const getStateNameById = (stateId) => {
        const state = states.find(s => String(s.id) === String(stateId));
        return state ? state.state : '';
    };

    const getDistrictNameById = (districtId) => {
        const district = districtsForTable.find(d => String(d.id) === String(districtId));
        return district ? district.district : '';
    };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

// Filter vendors based on search input
const filtered = vendors.filter((c) =>
  `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase().includes(search.toLowerCase()) ||
  (c.mobile || "").toLowerCase().includes(search.toLowerCase()) ||
  (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
  (c.gender || "").toLowerCase().includes(search.toLowerCase()) ||
  (c.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
  (c.address || "").toLowerCase().includes(search.toLowerCase()) ||
  (getStateNameById(c.state_id) || "").toLowerCase().includes(search.toLowerCase()) ||
  (getDistrictNameById(c.district_id) || "").toLowerCase().includes(search.toLowerCase())
);

// Sort customers by selected field
const sorted = [...filtered].sort((a, b) => {
  if (!sortField) return 0;

  let valA, valB;

  switch (sortField) {
    case "name":
      valA = `${a.first_name || ""} ${a.last_name || ""}`;
      valB = `${b.first_name || ""} ${b.last_name || ""}`;
      break;
    case "state":
      valA = getStateNameById(a.state_id);
      valB = getStateNameById(b.state_id);
      break;
    case "district":
      valA = getDistrictNameById(a.district_id);
      valB = getDistrictNameById(b.district_id);
      break;
    default:
      valA = a[sortField];
      valB = b[sortField];
  }

  valA = (valA || "").toString().toLowerCase();
  valB = (valB || "").toString().toLowerCase();

  if (valA < valB) return sortDirection === "asc" ? -1 : 1;
  if (valA > valB) return sortDirection === "asc" ? 1 : -1;
  return 0;
});

// Paginate results
const paginated = sorted.slice((page - 1) * perPage, page * perPage);

    return (
   <div className="px-4 py-2">
      <Breadcrumb title="Vendors" />

  <Card className="border-0 shadow-sm rounded-3 p-3 mt-3 bg-white">
    <div className="row mb-3">
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
        <div className="mt-2 d-inline-block mb-2">
<Button
    variant="outline-secondary"
    size="sm"
    className="me-2"
    onClick={loadInitialData}
>
    <i className="bi bi-arrow-clockwise"></i>
</Button>


          <Button
            size="sm"
            style={{
              backgroundColor: "#2FA64F",
              borderColor: "#2FA64F",
              color: "#fff",
            }}
            onClick={openForm}
          >
            + Add New
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
    <table className="table align-middle mb-0">
      <thead style={{ backgroundColor: "#2E3A59", color: "white" }}>
        <tr>
          <th
            style={{
              width: "70px",
              textAlign: "center",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
            S.No
          </th>
          <th
            onClick={() => handleSort("name")}
            style={{
              cursor: "pointer",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
            Name {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
          </th>
          <th
            onClick={() => handleSort("mobile")}
            style={{
              cursor: "pointer",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
            Mobile {sortField === "mobile" && (sortDirection === "asc" ? "▲" : "▼")}
          </th>
          <th
            onClick={() => handleSort("email")}
            style={{
              cursor: "pointer",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
            Email {sortField === "email" && (sortDirection === "asc" ? "▲" : "▼")}
          </th>
    <th
            onClick={() => handleSort("gender")}
            style={{
              cursor: "pointer",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
            gender {sortField === "gender" && (sortDirection === "asc" ? "▲" : "▼")}
          </th>
    <th
            onClick={() => handleSort("company")}
            style={{
              cursor: "pointer",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
            Company {sortField === "company" && (sortDirection === "asc" ? "▲" : "▼")}
          </th>
    <th
            onClick={() => handleSort("address")}
            style={{
              cursor: "pointer",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
            Address {sortField === "address" && (sortDirection === "asc" ? "▲" : "▼")}
          </th>
    <th
            onClick={() => handleSort("state")}
            style={{
              cursor: "pointer",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
           State {sortField === "state" && (sortDirection === "asc" ? "▲" : "▼")}
          </th>
    <th
            onClick={() => handleSort("district")}
            style={{
              cursor: "pointer",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
            District {sortField === "district" && (sortDirection === "asc" ? "▲" : "▼")}
          </th>
          <th
            style={{
              width: "130px",
              textAlign: "center",
              backgroundColor: "#2E3A59",
              color: "white",
            }}
          >
            Action
          </th>
        </tr>
      </thead>
<tbody>
  {loading ? (
    <tr>
      <td colSpan="10" className="text-center py-4">
        <Spinner animation="border" />
      </td>
    </tr>
  ) : paginated.length === 0 ? (
    <tr>
      <td colSpan="10" className="text-center py-4 text-muted">
        <img
          src="/empty-box.png"
          alt="No data"
          style={{ width: 80, height: 100, opacity: 0.6 }}
        />
      </td>
    </tr>
  ) : (
    paginated.map((vendor, i) => (
      <tr key={vendor.id}>
        <td className="text-center" style={{ width: "70px" }}>
          {(page - 1) * perPage + i + 1}
        </td>
        <td>{`${vendor.first_name || ""} ${vendor.last_name || ""}`}</td>
        <td>{vendor.mobile}</td>
        <td>{vendor.email}</td>
        <td>{vendor.gender}</td>
        <td>{vendor.company_name}</td>
        <td>{vendor.address}</td>
        <td>{getStateNameById(vendor.state_id)}</td>
        <td>{getDistrictNameById(vendor.district_id)}</td>
        <td style={{ textAlign: "center" }}>
          <Button
            variant=""
            size="sm"
            className="me-1"
            onClick={() => handleEdit(vendor)}
            style={{ borderColor: "#2E3A59", color: "#2E3A59" }}
          >
            <i className="bi bi-pencil-square"></i>
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
    totalEntries={filtered.length}
  />
</Card>

            <div
                className={`position-fixed bg-white shadow-lg px-3 pt-2 pb-2 vendor-form-slide`}
                style={{
                    width: "600px",
                    height: "calc(100vh - 58px)",
                    top: "61px",
                    right: showForm ? "0" : "-800px",
                    transition: "right 0.4s ease-in-out",
                    overflowY: "auto",
                    overflowX: "hidden",
                    opacity: 1,
                    fontFamily: "Product Sans, sans-serif",
                    fontWeight: 400,
                    zIndex: 1050,
                }}
            >
                <div
                    className="d-flex justify-content-between align-items-center"
                    style={{ marginBottom: "30px" }}
                >
                    <h5
                        className="mb-0 fw-bold"
                        style={{
                            fontFamily: "Product Sans, sans-serif",
                            fontWeight: 700,
                            fontSize: "25px",
                            color: "#212529",
                            lineHeight: "1",
                            letterSpacing: "0",
                        }}
                    >
                        {isEditing ? "Edit Vendor" : "Add New Vendor"}
                    </h5>
                    <button
                        onClick={closeForm}
                        style={{
                            width: "33px",
                            height: "33px",
                            backgroundColor: "#F0F0F0",
                            border: "none",
                            borderRadius: "50%",
                            fontSize: "20px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                        }}
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                <h6
                    className="mb-1"
                    style={{
                        fontFamily: "Product Sans, sans-serif",
                        fontWeight: 700,
                        fontSize: "20px",
                        color: "#141414",
                        lineHeight: "1",
                        letterSpacing: "0",
                    }}
                >
                    Personal Information
                </h6>
                <hr className="mt-1 mb-2" />
                <form onSubmit={handleSubmit}>
                    <div className="row gx-4 personal-form">
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>First Name</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Enter Vendor First Name"
                                size="sm"
                                isInvalid={!!errors.first_name}
                                style={getInputStyle("first_name")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.first_name}
                            </Form.Control.Feedback>
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>Last Name</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Enter Vendor Last Name"
                                size="sm"
                                isInvalid={!!errors.last_name}
                                style={getInputStyle("last_name")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.last_name}
                            </Form.Control.Feedback>
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>Gender</Form.Label>
                            <Select
                                name="gender"
                                value={genderOptions.find(option => option.value === formData.gender) || null}
                                onChange={(selectedOption) => handleChange(selectedOption, "gender")}
                                onBlur={() => handleSelectBlur("gender")}
                                options={genderOptions}
                                placeholder="Select Gender"
                                isClearable={true}
                                styles={customSelectStyles}
                                components={{ Option: SimpleOption }}
                                classNamePrefix="react-select"
                                errors={errors}
                            />
                            {errors.gender && <div style={errorStyle}>{errors.gender}</div>}
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label
                                className="mb-1"
                                style={labelStyle}
                            >
                                Date of Birth
                            </Form.Label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="text"
                                    readOnly
                                    className={`form-control custom-placeholder ${errors.dob ? "is-invalid" : ""
                                        }`}
                                    value={
                                        formData.dob
                                            ? new Date(formData.dob + "T00:00:00").toLocaleDateString("en-GB")
                                            : ""
                                    }
                                    placeholder="Select Date of Birth"
                                    onClick={() => setShowCalendar((prev) => !prev)}
                                    style={{ cursor: "pointer", ...getInputStyle("dob") }}
                                />

                                <img
                                    src="/Calendar.png"
                                    alt="calendar icon"
                                    style={{
                                        position: "absolute",
                                        right: "20px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "30px",
                                        height: "30px",
                                        pointerEvents: "none",
                                    }}
                                />

                                {errors.dob && (
                                    <div style={{ ...errorStyle, position: "absolute", top: "100%", left: 0 }}>
                                    {errors.dob}
                                    </div>
                                )}

                                {showCalendar && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            zIndex: 2000,
                                            top: "100%",
                                            left: 0,
                                            background: "white",
                                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                            marginTop: "4px",
                                            borderRadius: "6px",
                                        }}
                                    >
                                        <MiniCalendar
                                            selectedDate={formData.dob ? new Date(formData.dob) : null}
                                            onDateChange={(date) => {
                                                if (!date) return;
                                                const today = new Date();
                                                if (date > today) {
                                                    toast.error("Date of Birth cannot be in the future.", { autoClose: 1500 });
                                                    return;
                                                }

                                                // Fix timezone issue
                                                const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                                                const localDateStr = localDate.toISOString().split("T")[0];

                                                setFormData((prev) => ({
                                                    ...prev,
                                                    dob: localDateStr,
                                                }));
                                                setErrors((prev) => ({ ...prev, dob: "" }));
                                                setShowCalendar(false);
                                            }}
                                            onCancel={() => setShowCalendar(false)}
                                            allowFuture={false}
                                            maxDate={new Date()}
                                        />

                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>Mobile No.</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="Enter Mobile No."
                                size="sm"
                                isInvalid={!!errors.mobile}
                                style={getInputStyle("mobile")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.mobile}
                            </Form.Control.Feedback>
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>Alternative Mobile</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="altMobile"
                                value={formData.altMobile}
                                onChange={handleChange}
                                placeholder="Enter Alternative Mobile No."
                                size="sm"
                                isInvalid={!!errors.altMobile}
                                style={getInputStyle("altMobile")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.altMobile}
                            </Form.Control.Feedback>
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>Email</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Enter Email"
                                size="sm"
                                isInvalid={!!errors.email}
                                style={getInputStyle("email")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.email}
                            </Form.Control.Feedback>
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>GST No.</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="gst"
                                value={formData.gst}
                                onChange={handleChange}
                                placeholder="Enter GST No."
                                size="sm"
                                isInvalid={!!errors.gst}
                                style={getInputStyle("gst")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.gst}
                            </Form.Control.Feedback>
                        </div>
                    </div>

                    <h6
                        className="mb-1 mt-4"
                        style={{
                            fontFamily: "Product Sans, sans-serif",
                            fontWeight: 700,
                            fontSize: "20px",
                            color: "#141414",
                            lineHeight: "1",
                            letterSpacing: "0",
                        }}
                    >
                        Company Address
                    </h6>
                    <hr className="mt-1 mb-2" />
                    <div className="row gx-4 address-form">
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>Company Name</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Enter Company Name"
                                size="sm"
                                isInvalid={!!errors.company_name}
                                style={getInputStyle("company_name")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.company_name}
                            </Form.Control.Feedback>
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>Address</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Enter Address"
                                size="sm"
                                isInvalid={!!errors.address}
                                style={getInputStyle("address")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.address}
                            </Form.Control.Feedback>
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>City</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Enter City"
                                size="sm"
                                isInvalid={!!errors.city}
                                style={getInputStyle("city")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.city}
                            </Form.Control.Feedback>
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>State</Form.Label>
                            <Select
                                name="state"
                                value={stateOptions.find(option => option.value === formData.state) || null}
                                onChange={(selectedOption) => handleChange(selectedOption, "state")}
                                onBlur={() => handleSelectBlur("state")}
                                options={stateOptions}
                                placeholder="Select State"
                                isClearable={true}
                                styles={customSelectStyles}
                                components={{ Option: SimpleOption }}
                                classNamePrefix="react-select"
                                errors={errors}
                            />
                            {errors.state && <div style={errorStyle}>{errors.state}</div>}
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>District</Form.Label>
                            <Select
                                name="district"
                                value={districtOptions.find(option => option.value === formData.district) || null}
                                onChange={(selectedOption) => handleChange(selectedOption, "district")}
                                options={districtOptions}
                                placeholder="Select District"
                                isClearable={true}
                                styles={customSelectStyles}
                                components={{ Option: SimpleOption }}
                                classNamePrefix="react-select"
                                isDisabled={!formData.state}
                                errors={errors}
                            />
                            {errors.district && <div style={errorStyle}>{errors.district}</div>}
                        </div>
                        <div className="col-6 mb-2">
                            <Form.Label className="mb-1" style={labelStyle}>Pincode</Form.Label>
                            <Form.Control
                                className="custom-placeholder"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                placeholder="Enter Pincode"
                                size="sm"
                                isInvalid={!!errors.pincode}
                                style={getInputStyle("pincode")}
                            />
                            <Form.Control.Feedback type="invalid" style={errorStyle}>
                                {errors.pincode}
                            </Form.Control.Feedback>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end py-3 px-2">
                        <Button variant="secondary" className="me-2" onClick={closeForm}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="success" className="me-2">
                            {isEditing ? "Update Vendor" : "Add Vendor"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

