import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Form, Spinner, Alert, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
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
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'general',
    reason: '',
  });

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${appointment.first_name} ${appointment.last_name}`.toLowerCase();
    const nationalId = (appointment.national_id || '').toLowerCase();
    return fullName.includes(search) || nationalId.includes(search);
  });

  useEffect(() => {
    fetchAppointments();
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

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments');
      setAppointments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
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
    setSelectedAppointment(null);
    setSelectedPatient(null);
    setPatientSearch('');
    setSearchResults([]);
    setShowResults(false);
    setFormData({
      patientId: '',
      healthCenterId: '',
      appointmentDate: '',
      appointmentTime: '',
      appointmentType: 'general',
      reason: '',
    });
    setShowModal(true);
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData({ ...formData, patientId: patient.id });
    setPatientSearch(`${patient.first_name} ${patient.last_name} (${patient.national_id})`);
    setShowResults(false);
  };

  const handleEdit = (appointment) => {
    // Set selected appointment for edit mode
    setSelectedAppointment(appointment);

    // Set selected patient
    const patient = {
      id: appointment.patient_id,
      first_name: appointment.first_name,
      last_name: appointment.last_name,
      national_id: appointment.national_id || 'N/A'
    };
    setSelectedPatient(patient);
    setPatientSearch(`${patient.first_name} ${patient.last_name} (${patient.national_id})`);

    // Populate form with appointment data
    setFormData({
      patientId: appointment.patient_id,
      healthCenterId: appointment.health_center_id,
      appointmentDate: moment(appointment.appointment_date).format('YYYY-MM-DD'),
      appointmentTime: appointment.appointment_time,
      appointmentType: appointment.appointment_type,
      reason: appointment.reason || '',
    });

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAppointment) {
        await axios.put(`/api/appointments/${selectedAppointment.id}`, formData);
      } else {
        await axios.post('/api/appointments', formData);
      }
      setShowModal(false);
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving appointment');
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await axios.delete(`/api/appointments/${id}`, {
          data: { cancellationReason: 'Cancelled by staff' }
        });
        fetchAppointments();
        alert('Appointment cancelled successfully');
      } catch (error) {
        alert(error.response?.data?.message || 'Error cancelling appointment');
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      scheduled: 'primary',
      confirmed: 'success',
      completed: 'info',
      cancelled: 'danger',
      no_show: 'warning',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return <Spinner animation="border" />;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Appointments</h2>
        <Button onClick={handleCreate}>Create Appointment</Button>
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
            <th>Time</th>
            <th>Patient</th>
            <th>Health Center</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAppointments.map((apt) => (
            <tr key={apt.id}>
              <td>{moment(apt.appointment_date).format('DD-MM-YYYY')}</td>
              <td>{apt.appointment_time}</td>
              <td>{apt.first_name} {apt.last_name}</td>
              <td>{apt.health_center_name}</td>
              <td>{apt.appointment_type}</td>
              <td>{getStatusBadge(apt.status)}</td>
              <td>
                <Button
                  size="sm"
                  variant="warning"
                  className="me-2"
                  onClick={() => handleEdit(apt)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleCancel(apt.id)}
                  disabled={apt.status === 'cancelled' || apt.status === 'completed'}
                >
                  Cancel
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedAppointment ? 'Edit Appointment' : 'Create Appointment'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* Patient Search */}
            <Form.Group className="mb-3">
              <Form.Label>Search Patient (by National ID or Name)</Form.Label>
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
              <Form.Label>Health Center</Form.Label>
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
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                min={moment().format('YYYY-MM-DD')}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
              >
                <option value="general">General</option>
                <option value="follow_up">Follow Up</option>
                <option value="emergency">Emergency</option>
                <option value="vaccination">Vaccination</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for appointment..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!selectedPatient}>
              Save Appointment
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Appointments;
