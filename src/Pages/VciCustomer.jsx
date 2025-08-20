import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Spinner, Card, Offcanvas } from "react-bootstrap";
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
        gst_no: "",
        dob: "",
    };
}

export default function VciCustomer() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        city: "",
        state: "",
        district: "",
        pincode: "",
    });
    const [cityMenuIsOpen, setCityMenuIsOpen] = useState(false);
    const [cityOptions, setCityOptions] = useState([]);

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

const authToken = localStorage.getItem('authToken');
if (authToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
} else {
    // Handle cases where the user is not authenticated (e.g., redirect to login)
    console.error("No authentication token found. User is not logged in.");
}

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const statesRes = await axios.get(`${API_BASE_URL}/states`);
            setStates(Array.isArray(statesRes.data) ? statesRes.data : []);

            const districtsRes = await axios.get(`${API_BASE_URL}/districts`);
            setDistrictsForTable(Array.isArray(districtsRes.data) ? districtsRes.data : []);

            const customersRes = await axios.get(`${API_BASE_URL}/customers`);
            setCustomers(Array.isArray(customersRes.data.data) ? customersRes.data.data : customersRes.data);
            toast.success("Customers loaded successfully!", { toastId: 'customers-loaded', autoClose: 1500 });
        } catch (err) {
            console.error("Failed to load initial data:", err);
            toast.error("Failed to load data.", { autoClose: 1500 });
        } finally {
            setLoading(false);
        }
    };
    
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
        loadInitialData();
    }, []);

    useEffect(() => {
        if (!loading && customers.length > 0) {
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
    }, [customers, loading]);

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
                if (!/^\d*$/.test(value)) return;
                if (value.length > 6) return;

                setFormData(prev => ({ ...prev, [name]: value }));

                if (value.length === 6) {
                    setErrors(prev => ({ ...prev, [name]: "" }));

                    fetch(`https://api.postalpincode.in/pincode/${value}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
                                const cities = data[0].PostOffice.map(po => ({
                                    label: po.Name,
                                    value: po.Name,
                                }));
                                setCityOptions(cities);
                                setCityMenuIsOpen(true);
                                setFormData(prev => ({
                                    ...prev,
                                    state: data[0].PostOffice[0]?.State || "",
                                    district: data[0].PostOffice[0]?.District || "",
                                }));
                                setErrors(prev => ({ ...prev, pincode: "", city: "" }));
                            } else {
                                setCityOptions([]);
                                setFormData(prev => ({ ...prev, city: "", state: "", district: "" }));
                                setCityMenuIsOpen(false);
                                setErrors(prev => ({ ...prev, pincode: "Invalid pincode" }));
                            }
                        })
                        .catch(() => {
                            setCityOptions([]);
                            setCityMenuIsOpen(false);
                            setErrors(prev => ({ ...prev, pincode: "Error fetching pincode data" }));
                        });
                }
                return;
            }

            if (name === "gst_no") {
                if (value.trim() === "") {
                    setErrors(prev => ({ ...prev, gst_no: "" }));
                } else if (!/^[0-9A-Z]{15}$/.test(value)) {
                    setErrors(prev => ({ ...prev, gst_no: "GST No. must be 15  characters." }));
                } else {
                    setErrors(prev => ({ ...prev, gst_no: "" }));
                }
                if (value.length > 15) {
                    return;
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
            if (name === "city") {
                setErrors(prev => ({ ...prev, city: "City or Town is required." }));
            } else {
                setErrors(prev => ({ ...prev, [name]: `${name.replace("_", " ")} is required.` }));
            }
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
    };

    const handlePincodeChange = async (e) => {
        const value = e.target.value;
        setPincode(value);

        // Require 6 digits before making API call
        if (value.length === 6) {
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
                const data = await res.json();

                if (data[0].Status === "Success") {
                    const cities = [
                        ...new Set(data[0].PostOffice.map((po) => po.Name)),
                    ].map((city) => ({ label: city, value: city }));

                    setCityOptions(cities);
                    toast.success("Pincode matched! Please select city.");
                } else {
                    toast.error("Invalid Pincode");
                    setCityOptions([]);
                }
            } catch (err) {
                toast.error("Error fetching pincode data");
            }
        } else {
            setCityOptions([]);
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
        if (!formData.city.trim()) newErrors.city = "City or Town is required.";

        if (!formData.gst_no.trim()) newErrors.gst_no = "GST No is required.";
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
            alt_mobile: formData.altMobile,
            email: formData.email,
            company_name: formData.company_name,
            address: formData.address,
            city: formData.city,
            state: formData.state || "",
            district: formData.district || "",
            pincode: formData.pincode,
            gst_no: formData.gst_no,
            date_of_birth: formData.dob,
        };

        const request = isEditing
            ? axios.put(`${API_BASE_URL}/customers/${formData.id}`, payload)
            : axios.post(`${API_BASE_URL}/customers`, payload);

        request
            .then(() => {
                window.location.reload();
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
                        toast.error(`Failed to save customer: ${message}`, { autoClose: 1000 });
                    } else {
                        toast.error("Failed to save customer. Please try again.", { autoClose: 1000 });
                    }
                    setErrors(newErrors);
                } else {
                    toast.error("Failed to save customer.", { autoClose: 1000 });
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

    const handleEdit = (customer) => {
        setFormData({
            id: customer.id,
            first_name: customer.first_name || "",
            last_name: customer.last_name || "",
            gender: customer.gender || "",
            mobile: customer.mobile || "",
            altMobile: customer.alt_mobile || "",
            email: customer.email || "",
            company_name: customer.company_name || "",
            address: customer.address || "",
            city: customer.city || "",
            state: customer.state || "",
            district: customer.district || "",
            pincode: customer.pincode || "",
            gst_no: customer.gst_no || "",
            dob: customer.date_of_birth || "",
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
    const handleDownloadPdf = async () => {
        try {
            toast.info("Generating PDF, please wait...", { autoClose: false, toastId: "pdf-download-progress" });

            const response = await axios.get(`${API_BASE_URL}/pdf`, {
                responseType: 'blob',
            });

            // Create a blob URL
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

            // Create a temporary anchor and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'customers.pdf'); // Set the desired filename
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.dismiss("pdf-download-progress");
            toast.success("PDF downloaded successfully!", { autoClose: 1500 });
        } catch (error) {
            toast.dismiss("pdf-download-progress");
            console.error("Error downloading PDF:", error);
            toast.error("Failed to download PDF. Please try again.", { autoClose: 3000 });
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

    const filtered = customers.filter((c) =>
        `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase().includes(search.toLowerCase()) ||
        (c.mobile || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.gender || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.address || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.state || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.district || "").toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
        if (!sortField) return 0;

        let valA, valB;

        switch (sortField) {
            case "name":
                valA = `${a.first_name || ""} ${a.last_name || ""}`;
                valB = `${b.first_name || ""} ${b.last_name || ""}`;
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
        <div className="px-4" style={{ fontSize: "0.75rem" }}>
            <Breadcrumb title="Customers" />

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

                                onClick={loadInitialData}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                            </Button>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                style={{

                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    minWidth: '90px',
                                    height: '28px',
                                }}
                                className="me-2"
                                onClick={handleDownloadPdf}
                            >
                                <i className="bi bi-download me-1"></i> Download PDF
                            </Button>


                            <Button
                                size="sm"
                                style={{
                                    backgroundColor: '#2FA64F',
                                    borderColor: '#2FA64F',
                                    color: '#fff',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    minWidth: '90px',
                                    height: '28px',
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
                    <table className="table custom-table align-middle table-sm  mb-0" style={{ fontSize: "0.8rem" }}>
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
                                <th onClick={() => handleSort("gender")} style={{ backgroundColor: "#2E3A59", color: "white" }}>Gender  {sortField === "gender" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                                <th onClick={() => handleSort("company_name")} style={{ backgroundColor: "#2E3A59", color: "white" }}>Company  {sortField === "company_name" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                                <th onClick={() => handleSort("address")} style={{ backgroundColor: "#2E3A59", color: "white" }}>Address  {sortField === "address" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                                <th onClick={() => handleSort("state")} style={{ backgroundColor: "#2E3A59", color: "white" }}>State  {sortField === "state" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                                <th onClick={() => handleSort("district")} style={{ backgroundColor: "#2E3A59", color: "white" }}>District  {sortField === "district" && (sortDirection === "asc" ? "▲" : "▼")}</th>
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
                                paginated.map((customer, i) => (
                                    <tr key={customer.id}>
                                        <td className="text-center" style={{ width: "70px" }}>
                                            {(page - 1) * perPage + i + 1}
                                        </td>
                                        <td>{`${customer.first_name || ""} ${customer.last_name || ""}`}</td>
                                        <td>{customer.mobile}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.gender}</td>
                                        <td>{customer.company_name}</td>
                                        <td>{customer.address}</td>
                                        <td>{customer.state}</td>
                                        <td>{customer.district}</td>
                                        <td style={{ textAlign: "center" }}>
                                            <Button
                                                variant=""
                                                size="sm"
                                                className="me-1"
                                                onClick={() => handleEdit(customer)}
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

            <Offcanvas
                show={showForm}
                onHide={closeForm}
                placement="end"
                backdrop="static"
                className="custom-offcanvas"
                style={{ fontSize: "0.85rem", width: "600px" }}
            >
                <Offcanvas.Header className="border-bottom">
                    <Offcanvas.Title className="fw-semibold">
                        {isEditing ? "Edit Customer" : "Add New Customer"}
                    </Offcanvas.Title>
                    <div className="ms-auto">
                        <Button
                            variant="outline-secondary"
                            onClick={closeForm}
                            className="rounded-circle border-0 d-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px" }}
                        >
                            <i className="bi bi-x-lg fs-6"></i>
                        </Button>
                    </div>
                </Offcanvas.Header>

                <Offcanvas.Body className="px-3 pt-2 pb-2">
                    <Form onSubmit={handleSubmit} className="row g-3">

                        {/* Personal Info */}
                        {/* Personal Information Section */}
                        <h6 className="fw-semibold mt-3">
                            Personal Information
                        </h6 >
                        <hr className="mt-0 mb-0" />

                        <Form.Group className="col-6 ">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Enter First Name"
                                size="sm"
                                isInvalid={!!errors.first_name}
                            />
                            <Form.Control.Feedback type="invalid">{errors.first_name}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="col-6">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Enter Last Name"
                                size="sm"
                                isInvalid={!!errors.last_name}
                            />
                            <Form.Control.Feedback type="invalid">{errors.last_name}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="col-6" style={{ fontSize: "13px" }}>
                            <Form.Label className="mb-1" style={{ fontSize: "12px", fontWeight: 500 }}>
                                Gender
                            </Form.Label>
                            <Select
                                name="gender"
                                value={genderOptions.find(option => option.value === formData.gender) || null}
                                onChange={(selectedOption) => handleChange(selectedOption, "gender")}
                                onBlur={() => handleSelectBlur("gender")}
                                options={genderOptions}
                                placeholder="Select Gender"
                                isClearable
                                styles={{
                                    ...customSelectStyles,
                                    control: (provided, state) => ({
                                        ...provided,
                                        minHeight: "32px",       // reduce height
                                        height: "32px",
                                        fontSize: "12px",        // smaller font
                                    }),
                                    valueContainer: (provided) => ({
                                        ...provided,
                                        padding: "0 6px",
                                    }),
                                    dropdownIndicator: (provided) => ({
                                        ...provided,
                                        padding: "0 4px",
                                    }),
                                    clearIndicator: (provided) => ({
                                        ...provided,
                                        padding: "0 4px",
                                    }),
                                }}
                                components={{ Option: SimpleOption }}
                            />
                            {errors.gender && (
                                <div className="text-danger small" style={{ fontSize: "11px" }}>
                                    {errors.gender}
                                </div>
                            )}
                        </Form.Group>

                        <Form.Group className="col-6">
                            <Form.Label>Date of Birth</Form.Label>
                            <div style={{ position: "relative" }}>
                                <Form.Control
                                    type="text"
                                    readOnly
                                    value={formData.dob ? new Date(formData.dob + "T00:00:00").toLocaleDateString("en-GB") : ""}
                                    placeholder="Select Date of Birth"
                                    onClick={() => setShowCalendar((prev) => !prev)}
                                    size="sm"
                                    isInvalid={!!errors.dob}
                                />
                                 <img
              src="/Calendar.png"
              alt="calendar icon"
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "24px",
                height: "24px",
                pointerEvents: "none",
              }}
            />
                                {errors.dob && <div className="text-danger small">{errors.dob}</div>}
                                {showCalendar && (
                                    <div style={{
                                        position: "absolute",
                                        zIndex: 2000,
                                        top: "100%",
                                        left: 0,
                                        background: "white",
                                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                        marginTop: "4px",
                                        borderRadius: "6px",
                                    }}>
                                        <MiniCalendar
                                            selectedDate={formData.dob ? new Date(formData.dob) : null}
                                            onDateChange={(date) => {
                                                if (!date) return;
                                                const today = new Date();
                                                if (date > today) {
                                                    toast.error("Date of Birth cannot be in the future.", { autoClose: 1500 });
                                                    return;
                                                }
                                                const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                                                setFormData(prev => ({ ...prev, dob: localDate.toISOString().split("T")[0] }));
                                                setErrors(prev => ({ ...prev, dob: "" }));
                                                setShowCalendar(false);
                                            }}
                                            onCancel={() => setShowCalendar(false)}
                                            allowFuture={false}
                                            maxDate={new Date()}
                                        />
                                    </div>
                                )}
                            </div>
                        </Form.Group>

                        {/* Contact */}
                        <Form.Group className="col-6">
                            <Form.Label>Mobile No.</Form.Label>
                            <Form.Control
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="Enter Mobile No."
                                size="sm"
                                isInvalid={!!errors.mobile}
                            />
                            <Form.Control.Feedback type="invalid">{errors.mobile}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="col-6">
                            <Form.Label>Alternative Mobile</Form.Label>
                            <Form.Control
                                name="altMobile"
                                value={formData.altMobile}
                                onChange={handleChange}
                                placeholder="Enter Alternative No."
                                size="sm"
                                isInvalid={!!errors.altMobile}
                            />
                            <Form.Control.Feedback type="invalid">{errors.altMobile}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Email & GST */}
                        <Form.Group className="col-6">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter Email"
                                size="sm"
                                isInvalid={!!errors.email}
                            />
                            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="col-6">
                            <Form.Label>GST No.</Form.Label>
                            <Form.Control
                                name="gst_no"
                                value={formData.gst_no}
                                onChange={handleChange}
                                placeholder="Enter GST No."
                                size="sm"
                                isInvalid={!!errors.gst_no}
                            />
                            <Form.Control.Feedback type="invalid">{errors.gst_no}</Form.Control.Feedback>
                        </Form.Group>

                        {/* Company Address */}
                        {/* Company Address Section */}
                        <h6 className=" fw-semibold" >
                            Company Address
                        </h6>
                        <hr className="mt-0 mb-0" />

                        <Form.Group className="col-6">
                            <Form.Label>Company Name</Form.Label>
                            <Form.Control
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                placeholder="Enter Company Name"
                                size="sm"
                                isInvalid={!!errors.company_name}
                            />
                            <Form.Control.Feedback type="invalid">{errors.company_name}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="col-6">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter Address"
                                size="sm"
                                isInvalid={!!errors.address}
                            />
                            <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="col-6">
                            <Form.Label>City / Town</Form.Label>
                            <Form.Control
                                name="city"
                                onChange={handleChange}
                                size="sm"
                                isInvalid={!!errors.city}
                                placeholder="Enter City or Town"
                            />
                            {errors.city && <div className="text-danger small">{errors.city}</div>}
                        </Form.Group>

                        <Form.Group className="col-6">
                            <Form.Label>Pincode</Form.Label>
                            <Form.Control
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                placeholder="Enter Pincode"
                                size="sm"
                                isInvalid={!!errors.pincode}
                            />
                            <Form.Control.Feedback type="invalid">{errors.pincode}</Form.Control.Feedback>
                        </Form.Group>

                        {formData.pincode && formData.pincode.length === 6 && !errors.pincode && (
                            <>
                                <Form.Group className="col-6">
                                    <Form.Label>State</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        readOnly
                                        size="sm"
                                    />
                                </Form.Group>

                                <Form.Group className="col-6">
                                    <Form.Label>District</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="district"
                                        value={formData.district}
                                        readOnly
                                        size="sm"
                                    />
                                </Form.Group>
                            </>
                        )}

                        <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                            <Button className="btn-common btn-cancel" variant="light" onClick={closeForm} size="sm">Cancel</Button>
                            <Button className="btn-common btn-save" type="submit" variant="success" size="sm">
                                {isEditing ? "Update" : "Save"}
                            </Button>
                        </div>

                    </Form>
                </Offcanvas.Body>
            </Offcanvas>

        </div>
    );
}
