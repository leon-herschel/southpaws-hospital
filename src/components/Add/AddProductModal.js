import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import '../../assets/add.css';
import AddCategoryModal from './AddCategoryModal'; // Import AddCategoryModal
import AddBrandModal from './AddBrandModal'; // Import AddBrandModal
import AddUnitModal from './AddUnitModal'; // Import AddBrandModal
import AddGenericModal from './AddGenericModal'; // Import AddBrandModal

import { toast } from 'react-toastify';


const CreateProductModal = ({ show, handleClose, onProductAdded }) => {
    const [inputs, setInputs] = useState({});
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false); // State to control AddCategoryModal visibility
    const [showAddBrandModal, setShowAddBrandModal] = useState(false); // State to control AddBrandModal visibility
    const [genericNames, setGenericNames] = useState([]); // ✅ State for Generic Names

    const barcodeRef = useRef(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [unitsOfMeasurement, setUnitsOfMeasurement] = useState([]); // List of units of measurement
    const [showAddUnitModal, setShowAddUnitModal] = useState(false); 
    const [showAddGenericModal, setShowAddGenericModal] = useState(false); // ✅ Added modal for Generic Name
    const brandNameRef = useRef(null);

    useEffect(() => {
        if (show && brandNameRef.current) {
            brandNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);

    useEffect(() => {
        fetchCategories();
        fetchBrands(); 
        fetchUnit();
        fetchGenerics();
    }, []);

        useEffect(() => {
            if (barcodeRef.current && inputs.sku) {
                JsBarcode(barcodeRef.current, inputs.sku, {
                    format: "CODE128",
                    displayValue: true,
                    lineColor: "#000",
                    width: 2,
                    height: 50,
                });
            }
        }, [inputs.sku]);

        const fetchCategories = () => {
            axios
                .get('http://localhost:80/api/category.php')
                .then((response) => {
                    // Check if response.data and response.data.categories exist and is an array
                    if (response.data && Array.isArray(response.data.categories)) {
                        setCategories(response.data.categories);
                    } else {
                        console.error('Invalid categories data structure:', response.data);
                        setCategories([]); // Reset categories in case of unexpected data structure
                    }
                })
                .catch((error) => {
                    console.error('Error fetching categories:', error);
                    setCategories([]); // Reset categories on error
                });
        };
        

        const fetchUnit = () => {
            // Ensure the 'archived' query parameter is passed as expected (e.g., 0 for active units)
            axios.get('http://localhost:80/api/units.php?archived=0') // Fetch only active units
                .then(response => {
                    // Check if response.data and response.data.units exist and are an array
                    if (response.data && Array.isArray(response.data.units)) {
                        setUnitsOfMeasurement(response.data.units); // Set the units correctly
                    } else {
                        // Log error and set empty array if no valid data
                        console.error('No valid unit data received:', response.data);
                        setUnitsOfMeasurement([]); // Reset units
                    }
                })
                .catch(error => {
                    // Handle error during fetch
                    console.error('Error fetching units:', error);
                    setUnitsOfMeasurement([]); // Reset units on error
                });
        };
        

    const fetchBrands = () => {
        axios
            .get('http://localhost:80/api/brands.php')
            .then((response) => {
                // Check if response.data and response.data.brands exist and is an array
                if (response.data && Array.isArray(response.data.brands)) {
                    setBrands(response.data.brands);
                } else {
                    console.error('Invalid brands data structure:', response.data);
                    setBrands([]); // Reset brands if the data structure is not as expected
                }
            })
            .catch((error) => {
                console.error('Error fetching brands:', error);
                setBrands([]); // Reset brands on error
            });
    };

    const fetchGenerics = () => {
        axios.get('http://localhost:80/api/generic.php')
            .then(response => setGenericNames(response.data.records || [])) // ✅ Fetch generic names
            .catch(() => setGenericNames([]));
    };
    

    const handleChange = (event) => {
        const { name, value } = event.target;
        setInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
    
        if (!inputs.product_name || !inputs.generic_id) {
            setError('Product Name and Generic Name are required.');
            return;
        }
    
        const userId = localStorage.getItem('userID');
        if (!userId) {
            setError('User not authenticated.');
            return;
        }
    
        const productData = {
            ...inputs,
            created_by: userId, 
        };
    
    
        axios
            .post('http://localhost:80/api/products.php/save', productData)
            .then((response) => {
    
                if (response.data.status === 0) {
                    setError(response.data.message);
                } else {
                    handleClose();
                    onProductAdded();
                    setInputs({ name: '', sku: '', price: '', category: '', brand: '', generic_id: '' }); // ✅ Reset generic_id
                    setError('');
                }
            })
            .catch((error) => {
                console.error("🔥 API Request Failed:", error);
                setError('Failed to save product. Please try again.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };
    
    
    
    // Reset the error state when closing the modal
    const handleCloseModal = () => {
        setError(''); // Clear the error message when closing the modal
        handleClose(); // Close the modal
    };


    const handleCreateUnit = () => {
        setShowAddUnitModal(true); // Open AddCategoryModal
    };

    
    const handleCreateCategory = () => {
        setShowAddCategoryModal(true); // Open AddCategoryModal
    };

    const handleCreateBrand = () => {
        setShowAddBrandModal(true); // Open AddBrandModal
    };

    const handleGenericAdded = (newGeneric) => {
        toast.success('Generic added successfully!');
        axios.get('http://localhost:80/api/generic.php')
            .then((response) => {
                const updatedGenerics = response.data.records || [];
    
                setGenericNames(updatedGenerics);
                const newlyAddedGeneric = updatedGenerics.find(generic => generic.generic_name === newGeneric.generic_name);
    
                if (newlyAddedGeneric) {
                    setInputs((prevInputs) => ({
                        ...prevInputs,
                        generic_id: newlyAddedGeneric.id, 
                    }));
                    setTimeout(() => {
                        document.querySelector("[name='generic_id']").value = newlyAddedGeneric.id;
                    }, 200);
                } else {
                    console.warn("❌ New Generic Not Found in Updated List!");
                }
            })
            .catch((error) => {
                console.error("🔥 Failed to fetch Generic Names:", error);
            });
    };
    
    const handleUnitAdded = (newUnit) => {
        toast.success('Unit of Measurement added successfully!');
    
        // Fetch updated list of units
        axios.get('http://localhost:80/api/units.php')
            .then((response) => {
                const updatedUnits = response.data.units || [];
                
                setUnitsOfMeasurement(updatedUnits);
                const newlyAddedUnit = updatedUnits.find(unit => unit.unit_name === newUnit.unit_name);

                if (newlyAddedUnit) {
                    setInputs((prevInputs) => ({
                        ...prevInputs,
                        unit_id: newlyAddedUnit.id, 
                    }));
                    setTimeout(() => {
                        document.querySelector("[name='unit_id']").value = newlyAddedUnit.id;
                    }, 200);
                } else {
                    console.warn("❌ New Unit Not Found in Updated List!");
                }
            })
            .catch((error) => {
                console.error("🔥 Failed to fetch Units:", error);
            });
    };
    
    const handleCategoryAdded = (newCategory) => {
        toast.success('Category added successfully!');
    
        // Fetch updated list of categories
        axios.get('http://localhost:80/api/category.php')
            .then((response) => {
                const updatedCategories = response.data.categories || [];

                setCategories(updatedCategories);
                const newlyAddedCategory = updatedCategories.find(category => category.name === newCategory.name);
    
                if (newlyAddedCategory) {
                    setInputs((prevInputs) => ({
                        ...prevInputs,
                        category_id: newlyAddedCategory.id,
                    }));
                    setTimeout(() => {
                        document.querySelector("[name='category_id']").value = newlyAddedCategory.id;
                    }, 200);
                } else {
                    console.warn("❌ New Category Not Found in Updated List!");
                }
            })
            .catch((error) => {
                console.error("🔥 Failed to fetch Categories:", error);
            });
    };
    
    const handleBrandAdded = (newBrand) => {
        toast.success('Brand added successfully!');
        axios.get('http://localhost:80/api/brands.php')
            .then((response) => {
                const updatedBrands = response.data.brands || [];

                setBrands(updatedBrands);
                const newlyAddedBrand = updatedBrands.find(brand => brand.name === newBrand.name);
    
                if (newlyAddedBrand) {
                    setInputs((prevInputs) => ({
                        ...prevInputs,
                        brand_id: newlyAddedBrand.id, 
                    }));
                    setTimeout(() => {
                        document.querySelector("[name='brand_id']").value = newlyAddedBrand.id;
                    }, 200);
                } else {
                    console.warn("❌ New Brand Not Found in Updated List!");
                }
            })
            .catch((error) => {
                console.error("🔥 Failed to fetch Brands:", error);
            });
    };
    
    return (
        <>
            <Modal show={show} onHide={handleClose} className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Add Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Form.Label>Product Name</Form.Label>
                                    </div>
                                    <Form.Control
                                        type="text"
                                        ref={brandNameRef} // ✅ Attach ref to input field
                                        name="product_name"
                                        onChange={handleChange}
                                        placeholder="Enter Product name"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Form.Label>Generic Name</Form.Label>
                                        <Button 
                                            variant="success" 
                                            onClick={() => setShowAddGenericModal(true)} 
                                            size="sm"
                                        >
                                            +
                                        </Button>
                                    </div>
                                    <Form.Control
                                        as="select"
                                        name="generic_id"
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Generic Name</option>
                                        {genericNames.length > 0 ? (
                                            genericNames.map(generic => (
                                                <option key={generic.id} value={generic.id}>
                                                    {generic.generic_name}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled>Loading generic names...</option>
                                        )}
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Form.Label style={{ margin: 0 }}>Brand</Form.Label>
                                        <Button 
                                            variant="success" 
                                            onClick={handleCreateBrand} 
                                            className="sticky-button" 
                                            size="sm"
                                        >
                                            +
                                        </Button>
                                    </div>
                                    <Form.Control
                                        as="select"
                                        name="brand_id"
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select brand</option>
                                        {brands.length > 0 ? (
                                            brands.map((brand) => (
                                                <option key={brand.id} value={brand.id}>
                                                    {brand.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Loading brands...</option>
                                        )}
                                    </Form.Control>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Form.Label style={{ margin: 0 }}>Unit of Measurement</Form.Label>
                                        <Button 
                                            variant="success" 
                                            onClick={handleCreateUnit} 
                                            className="sticky-button" 
                                            size="sm"
                                        >
                                            +
                                        </Button>
                                    </div>
                                    <Form.Control
                                        as="select"
                                        name="unit_id"
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Unit of Measurement</option>
                                        {unitsOfMeasurement.length > 0 ? (
                                            unitsOfMeasurement.map((unit) => (
                                                <option key={unit.id} value={unit.id}>
                                                    {unit.unit_name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Loading unit of measurement...</option>
                                        )}
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Form.Label style={{ margin: 0 }}>Category</Form.Label>
                                        <Button 
                                            variant="success" 
                                            onClick={handleCreateCategory} 
                                            className="sticky-button" 
                                            size="sm"
                                        >
                                            +
                                        </Button>
                                    </div>
                                    <Form.Control
                                        as="select"
                                        name="category_id"
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.length > 0 ? (
                                            categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Loading categories...</option>
                                        )}
                                    </Form.Control>
                                </Form.Group>

                              
                            </Col>
                        </Row>


                        <div className="text-center">
                            <Button variant="primary" type="submit" className="button">
                                Add
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* AddGenericModal to create a new generic */}
            <AddGenericModal
                show={showAddGenericModal}
                handleClose={() => setShowAddGenericModal(false)}
                onGenericAdded={(newGeneric) => handleGenericAdded(newGeneric)}
            />
            {/* AddCategoryModal to create a new category */}
            <AddCategoryModal
                show={showAddCategoryModal}
                handleClose={() => setShowAddCategoryModal(false)}
                onCategoryAdded={(newCategory) => handleCategoryAdded(newCategory)}
            />
            {/* AddBrandModal to create a new brand */}
            <AddBrandModal
                show={showAddBrandModal}
                handleClose={() => setShowAddBrandModal(false)}
                onBrandAdded={(newBrand) => handleBrandAdded(newBrand)}
            />
            {/* AddBrandModal to create a new brand */}
            <AddUnitModal
                show={showAddUnitModal}
                onClose={() => setShowAddUnitModal(false)}
                onUnitAdded={(newUnit) => handleUnitAdded(newUnit)}
            />

        </>
    );
};

export default CreateProductModal;
