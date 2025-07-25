import React from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";

const ViewPatientMedicalRecordModal = ({ show, handleClose, history }) => {
    if (!history) return null; // If no history is passed, return null (or you can display a loading message)

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Patient Medical Record</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Physical Exam Findings */}
                <h5 className="mt-4">Physical Exam Findings</h5>
                <Table bordered>
                    <thead>
                        <tr>
                            <th>Rectal Temperature</th>
                            <th>Oral Cavity</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <Form.Label>Heart Rate</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.heart_rate}
                                    readOnly
                                />
                            </td>
                            <td>
                                <Form.Label>Lymph Nodes</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.lymph_nodes}
                                    readOnly
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Form.Label>Respiratory Rate</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.respiratory_rate}
                                    readOnly
                                />
                            </td>
                            <td>
                                <Form.Label>Abdomen</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.abdomen}
                                    readOnly
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Form.Label>BCS</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.bcs}
                                    readOnly
                                />
                            </td>
                            <td>
                                <Form.Label>Cardiovascular</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.cardiovascular}
                                    readOnly
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Form.Label>General Appearance</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.general_appearance}
                                    readOnly
                                />
                            </td>
                            <td>
                                <Form.Label>Respiratory</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.respiratory}
                                    readOnly
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Form.Label>MM</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.mm}
                                    readOnly
                                />
                            </td>
                            <td>
                                <Form.Label>Genitourinary</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.genitourinary}
                                    readOnly
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Form.Label>Ears</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.ears}
                                    readOnly
                                />
                            </td>
                            <td>
                                <Form.Label>Integument</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.integument}
                                    readOnly
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Form.Label>Eyes</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.eyes}
                                    readOnly
                                />
                            </td>
                            <td>
                                <Form.Label>Musculoskeletal</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.musculoskeletal}
                                    readOnly
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Form.Label>Nose</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.nose}
                                    readOnly
                                />
                            </td>
                            <td>
                                <Form.Label>Neuro</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={history.neuro}
                                    readOnly
                                />
                            </td>
                        </tr>
                    </tbody>
                </Table>

                {/* Other Fields */}
                {["chief_complaint", "history", "diagnostic_plan", "differentials", "treatment_plan"].map((field, idx) => (
                    <Form.Group className="mb-3" key={idx}>
                        <Form.Label>{field.replace(/_/g, ' ').toUpperCase()}</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={history[field]}
                            readOnly
                        />
                    </Form.Group>
                ))}

                <Form.Group className="mb-3">
                    <Form.Label>NAME OF VETERINARIAN</Form.Label>
                    <Form.Control
                        type="text"
                        value={history.veterinarian}
                        readOnly
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ViewPatientMedicalRecordModal;
