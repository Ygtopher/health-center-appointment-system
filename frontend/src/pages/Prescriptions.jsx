import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Spinner, Badge, ListGroup, Alert } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [healthCenters, setHealthCenters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Patient search states
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
    healthCenterId: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    notes: '',
    medications: [{ medicationName: '', dosage: '', frequency: '', quantity: '', durationDays: '', startDate: '', endDate: '', instructions: '' }],
  });

  // Filter prescriptions based on search term
  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${prescription.first_name} ${prescription.last_name}`.toLowerCase();
    const nationalId = (prescription.national_id || '').toLowerCase();
    return fullName.includes(search) || nationalId.includes(search);
  });

  useEffect(() => {
    fetchPrescriptions();
    fetchHealthCenters();
  }, []);

  // Debounced patient search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (patientSearch.length >= 2) {
        searchPatients();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [patientSearch]);

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

  const searchPatients = async () => {
    try {
      setSearching(true);
      const response = await axios.get('/api/patients', {
        params: { search: patientSearch, limit: 10 }
      });
      setSearchResults(response.data.data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
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
    setSelectedPatient(null);
    setPatientSearch('');
    setSearchResults([]);
    setShowResults(false);
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

  const handleEdit = (prescription) => {
    // Set selected patient for edit mode
    const patient = {
      id: prescription.patient_id,
      first_name: prescription.first_name,
      last_name: prescription.last_name,
      national_id: prescription.national_id || 'N/A'
    };
    setSelectedPatient(patient);
    setPatientSearch(`${patient.first_name} ${patient.last_name} (${patient.national_id})`);

    // Populate form with prescription data
    setFormData({
      id: prescription.id,
      patientId: prescription.patient_id,
      healthCenterId: prescription.health_center_id || prescription.healthCenterId || '',
      prescriptionDate: moment(prescription.prescription_date).format('YYYY-MM-DD'),
      diagnosis: prescription.diagnosis || '',
      notes: prescription.notes || '',
      medications: prescription.medications?.map(med => ({
        medicationName: med.medication_name,
        dosage: med.dosage,
        frequency: med.frequency,
        quantity: med.quantity,
        durationDays: med.duration_days,
        startDate: moment(med.start_date).format('YYYY-MM-DD'),
        endDate: moment(med.end_date).format('YYYY-MM-DD'),
        instructions: med.instructions || ''
      })) || [{ medicationName: '', dosage: '', frequency: '', quantity: '', durationDays: '', startDate: '', endDate: '', instructions: '' }]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/prescriptions/${id}`);
        fetchPrescriptions();
        alert('Prescription deleted successfully');
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting prescription');
      }
    }
  };

  const handleRestore = async (id) => {
    if (window.confirm('Are you sure you want to restore this prescription?')) {
      try {
        await axios.patch(`/api/prescriptions/${id}/restore`);
        fetchPrescriptions();
        alert('Prescription restored successfully');
      } catch (error) {
        alert(error.response?.data?.message || 'Error restoring prescription');
      }
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData({ ...formData, patientId: patient.id });
    setPatientSearch(`${patient.first_name} ${patient.last_name} (${patient.national_id})`);
    setShowResults(false);
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
    console.log('Adding medication, current medications:', formData.medications);
    const newMedications = [...formData.medications, { medicationName: '', dosage: '', frequency: '', quantity: '', durationDays: '', startDate: '', endDate: '', instructions: '' }];
    console.log('New medications array:', newMedications);
    setFormData({
      ...formData,
      medications: newMedications,
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
        patientId: formData.patientId,
        healthCenterId: formData.healthCenterId,
        prescriptionDate: formData.prescriptionDate,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
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

      if (formData.id) {
        // Update existing prescription
        await axios.put(`/api/prescriptions/${formData.id}`, payload);
        alert('Prescription updated successfully');
      } else {
        // Create new prescription
        await axios.post('/api/prescriptions', payload);
        alert('Prescription created successfully');
      }

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

      {/* Search Bar */}
      <div className="mb-3">
        <Form.Control
          type="text"
          placeholder="Search by patient name or National ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPrescriptions.map((prescription) => (
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
              <td>
                {prescription.is_active ? (
                  <>
                    <Button
                      size="sm"
                      variant="warning"
                      className="me-2"
                      onClick={() => handleEdit(prescription)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(prescription.id)}
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleRestore(prescription.id)}
                  >
                    Restore
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{formData.id ? 'Edit Prescription' : 'Create Prescription'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Patient Search */}
            <Form.Group className="mb-3">
              <Form.Label>Search Patient (by National ID or Name) *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter National ID or patient name..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
                }}
                required={!selectedPatient}
              />
              <Form.Text className="text-muted">
                Type at least 2 characters to search
              </Form.Text>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <ListGroup className="mt-2" style={{ maxHeight: '200px', overflowY: 'auto', position: 'absolute', zIndex: 1000, width: 'calc(100% - 30px)' }}>
                  {searchResults.map((patient) => (
                    <ListGroup.Item
                      key={patient.id}
                      action
                      onClick={() => handleSelectPatient(patient)}
                      style={{ cursor: 'pointer' }}
                    >
                      <strong>{patient.first_name} {patient.last_name}</strong>
                      <br />
                      <small className="text-muted">
                        National ID: {patient.national_id} | Phone: {patient.phone_number}
                      </small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              {searching && (
                <div className="mt-2">
                  <Spinner animation="border" size="sm" /> Searching...
                </div>
              )}

              {patientSearch.length >= 2 && !searching && searchResults.length === 0 && !selectedPatient && (
                <Alert variant="warning" className="mt-2">
                  No patients found. Please try a different search term.
                </Alert>
              )}

              {/* Selected Patient Display */}
              {selectedPatient && (
                <Alert variant="success" className="mt-2">
                  <strong>Selected Patient:</strong> {selectedPatient.first_name} {selectedPatient.last_name}
                  <br />
                  <small>National ID: {selectedPatient.national_id}</small>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 ms-2"
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientSearch('');
                      setFormData({ ...formData, patientId: '' });
                    }}
                  >
                    (Change)
                  </Button>
                </Alert>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Health Center *</Form.Label>
              <Form.Select
                value={formData.healthCenterId}
                onChange={(e) => setFormData({ ...formData, healthCenterId: e.target.value })}
                required
                disabled={!!formData.id}
              >
                <option value="">Select health center</option>
                {healthCenters.map((hc) => (
                  <option key={hc.id} value={hc.id}>
                    {hc.name}
                  </option>
                ))}
              </Form.Select>
              {formData.id && (
                <Form.Text className="text-muted">
                  Health center cannot be changed when editing
                </Form.Text>
              )}
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
                placeholder="Enter diagnosis..."
              />
            </Form.Group>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label>Medications *</Form.Label>
                <Button size="sm" variant="outline-primary" type="button" onClick={addMedication}>
                  Add Medication
                </Button>
              </div>
              {formData.medications.map((med, index) => (
                <div key={index} className="border p-3 mb-3 rounded">
                  <div className="d-flex justify-content-between mb-2">
                    <strong>Medication {index + 1}</strong>
                    {formData.medications.length > 1 && (
                      <Button size="sm" variant="danger" type="button" onClick={() => removeMedication(index)}>
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
                      <Form.Select
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        required
                      >
                        <option value="">Select Frequency *</option>
                        <option value="once daily">Once Daily</option>
                        <option value="twice daily">Twice Daily</option>
                        <option value="three times daily">Three Times Daily</option>
                        <option value="every 8 hours">Every 8 Hours</option>
                        <option value="every 12 hours">Every 12 Hours</option>
                      </Form.Select>
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
                placeholder="Additional notes..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!selectedPatient}>
              Save Prescription
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Prescriptions;
