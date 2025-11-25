import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [healthCenters, setHealthCenters] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    healthCenterId: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    notes: '',
    medications: [{ medicationName: '', dosage: '', frequency: '', quantity: '', durationDays: '', startDate: '', endDate: '', instructions: '' }],
  });

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
    fetchHealthCenters();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('/api/prescriptions');
      setPrescriptions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients', { params: { limit: 100 } });
      setPatients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchHealthCenters = async () => {
    try {
      const response = await axios.get('/api/health-centers');
      setHealthCenters(response.data.data || []);
    } catch (error) {
      console.error('Error fetching health centers:', error);
    }
  };

  const handleCreate = () => {
    setFormData({
      patientId: '',
      healthCenterId: '',
      prescriptionDate: new Date().toISOString().split('T')[0],
      diagnosis: '',
      notes: '',
      medications: [{ medicationName: '', dosage: '', frequency: '', quantity: '', durationDays: '', startDate: '', endDate: '', instructions: '' }],
    });
    setShowModal(true);
  };

  const handleMedicationChange = (index, field, value) => {
    const medications = [...formData.medications];
    medications[index][field] = value;
    
    // Auto-calculate end date if start date and duration are provided
    if (field === 'startDate' || field === 'durationDays') {
      const startDate = medications[index].startDate;
      const duration = parseInt(medications[index].durationDays);
      if (startDate && duration) {
        const endDate = moment(startDate).add(duration, 'days').format('YYYY-MM-DD');
        medications[index].endDate = endDate;
      }
    }
    
    setFormData({ ...formData, medications });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { medicationName: '', dosage: '', frequency: '', quantity: '', durationDays: '', startDate: '', endDate: '', instructions: '' }],
    });
  };

  const removeMedication = (index) => {
    const medications = formData.medications.filter((_, i) => i !== index);
    setFormData({ ...formData, medications });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        medications: formData.medications.map(med => ({
          medicationName: med.medicationName,
          dosage: med.dosage,
          frequency: med.frequency,
          quantity: parseInt(med.quantity),
          durationDays: parseInt(med.durationDays),
          startDate: med.startDate,
          endDate: med.endDate,
          instructions: med.instructions,
        })),
      };
      await axios.post('/api/prescriptions', payload);
      setShowModal(false);
      fetchPrescriptions();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving prescription');
    }
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Prescriptions</h2>
        <Button onClick={handleCreate}>Create Prescription</Button>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Date</th>
            <th>Patient</th>
            <th>Health Center</th>
            <th>Diagnosis</th>
            <th>Medications</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map((prescription) => (
            <tr key={prescription.id}>
              <td>{moment(prescription.prescription_date).format('DD-MM-YYYY')}</td>
              <td>{prescription.first_name} {prescription.last_name}</td>
              <td>{prescription.health_center_name}</td>
              <td>{prescription.diagnosis || 'N/A'}</td>
              <td>
                {prescription.medications?.map((med, idx) => (
                  <Badge key={idx} bg="info" className="me-1">
                    {med.medication_name}
                  </Badge>
                ))}
              </td>
              <td>
                <Badge bg={prescription.is_active ? 'success' : 'secondary'}>
                  {prescription.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Prescription</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Patient *</Form.Label>
              <Form.Select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.national_id})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Health Center *</Form.Label>
              <Form.Select
                value={formData.healthCenterId}
                onChange={(e) => setFormData({ ...formData, healthCenterId: e.target.value })}
                required
              >
                <option value="">Select health center</option>
                {healthCenters.map((hc) => (
                  <option key={hc.id} value={hc.id}>
                    {hc.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Prescription Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.prescriptionDate}
                onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Diagnosis</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />
            </Form.Group>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label>Medications *</Form.Label>
                <Button size="sm" variant="outline-primary" onClick={addMedication}>
                  Add Medication
                </Button>
              </div>
              {formData.medications.map((med, index) => (
                <div key={index} className="border p-3 mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Medication {index + 1}</strong>
                    {formData.medications.length > 1 && (
                      <Button size="sm" variant="danger" onClick={() => removeMedication(index)}>
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <Form.Control
                        placeholder="Medication Name *"
                        value={med.medicationName}
                        onChange={(e) => handleMedicationChange(index, 'medicationName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-2">
                      <Form.Control
                        placeholder="Dosage * (e.g., 500mg)"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-2">
                      <Form.Control
                        placeholder="Frequency * (e.g., twice daily)"
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-2">
                      <Form.Control
                        type="number"
                        placeholder="Quantity *"
                        value={med.quantity}
                        onChange={(e) => handleMedicationChange(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <Form.Control
                        type="date"
                        placeholder="Start Date *"
                        value={med.startDate}
                        onChange={(e) => handleMedicationChange(index, 'startDate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <Form.Control
                        type="number"
                        placeholder="Duration (days) *"
                        value={med.durationDays}
                        onChange={(e) => handleMedicationChange(index, 'durationDays', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <Form.Control
                        type="date"
                        placeholder="End Date"
                        value={med.endDate}
                        onChange={(e) => handleMedicationChange(index, 'endDate', e.target.value)}
                        readOnly
                      />
                    </div>
                    <div className="col-12 mb-2">
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Instructions"
                        value={med.instructions}
                        onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Prescription
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Prescriptions;

