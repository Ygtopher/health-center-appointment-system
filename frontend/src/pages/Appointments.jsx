import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patients, setPatients] = useState([]);
  const [healthCenters, setHealthCenters] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    healthCenterId: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'general',
    reason: '',
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchHealthCenters();
  }, []);

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
    setSelectedAppointment(null);
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
        await axios.delete(`/api/appointments/${id}`);
        fetchAppointments();
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
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Appointments</h2>
        <Button onClick={handleCreate}>Create Appointment</Button>
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
          {appointments.map((apt) => (
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

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedAppointment ? 'Edit Appointment' : 'Create Appointment'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Patient</Form.Label>
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
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Appointments;

