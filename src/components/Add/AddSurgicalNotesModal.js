import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddSurgicalNotesModal = ({ show, handleClose, onNoteUpdated, existingNote }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
    });

    const brandNameRef = useRef(null);
    
    useEffect(() => {
        if (show && brandNameRef.current) {
            brandNameRef.current.focus(); // ✅ Auto-focus when modal opens
        }
    }, [show]);
        
    // Populate the form if editing an existing note
    useEffect(() => {
        if (existingNote) {
            setFormData({
                title: existingNote.title || '',
                content: existingNote.content || '',
            });
        } else {
            setFormData({
                title: '',
                content: '',
            });
        }
    }, [existingNote, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const payload = existingNote
                ? { id: existingNote.id, ...formData } // Include the ID for updating
                : { ...formData }; // For creating a new note
    
            console.log("Payload being sent to backend:", payload); // Debugging log for payload
    
            const endpoint = existingNote
                ? `http://localhost:80/api/surgical_notes.php`
                : `http://localhost:80/api/surgical_notes.php`;
    
            const method = existingNote ? 'PUT' : 'POST'; // Set the method based on whether it's add or edit
    
            const response = await axios({
                method,
                url: endpoint,
                data: payload,
            });
    
            console.log("Response from backend:", response.data); // Debugging log for response
    
            if (response.data.message === 'Note Updated' || response.data.message === 'Note Created') {
                toast.success(
                    existingNote
                        ? 'surgical Note Updated Successfully!'
                        : 'surgical Note Added Successfully!'
                );
                if (onNoteUpdated) onNoteUpdated(); // Refresh data in parent component
                handleClose(); // Close the modal
            } else {
                toast.error(response.data.message || 'Failed to save the note.');
            }
        } catch (error) {
            console.error('Error saving note:', error); // Debugging log for errors
            toast.error('Failed to save the note.');
        }
    };
    

    const handleDelete = async () => {
        if (!existingNote) return;
    
        try {
            const response = await axios.delete(`http://localhost:80/api/surgical_notes.php?id=${existingNote.id}`);
            if (response.data.message === 'Note Deleted') {
                toast.success('surgical Note Deleted Successfully!');
                if (onNoteUpdated) onNoteUpdated(); // Refresh data in parent component
                handleClose(); // Close the modal
            } else {
                toast.error(response.data.message || 'Failed to delete the note.');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('Failed to delete the note.');
        }
    };
    

    return (
<Modal show={show} onHide={handleClose} centered>
    <Modal.Header closeButton>
        <Modal.Title>{existingNote ? 'Edit Surgical Note' : 'Add Surgical Note'}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
        <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                    type="text"
                    name="title"
                    ref={brandNameRef} // ✅ Attach ref to input field
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter note title"
                    required
                />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={5}
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Enter note content"
                    required
                />
            </Form.Group>
            <div className="text-center">
                <Button type="submit" variant="primary" className="me-2">
                    {existingNote ? 'Update' : 'Add'}
                </Button>
                {existingNote && (
                    <Button variant="danger" onClick={handleDelete}>
                        Delete
                    </Button>
                )}
            </div>
        </Form>
    </Modal.Body>
</Modal>

    );
};

export default AddSurgicalNotesModal;
