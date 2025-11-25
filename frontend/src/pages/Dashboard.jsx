import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({
    appointments: { today: 0, upcoming: 0, total: 0 },
    patients: 0,
    prescriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [appointmentsRes, patientsRes, prescriptionsRes] = await Promise.all([
        axios.get('/api/appointments', { params: { startDate: today } }),
        axios.get('/api/patients', { params: { limit: 1 } }),
        axios.get('/api/prescriptions', { params: { limit: 1 } }),
      ]);

      const appointments = appointmentsRes.data.data || [];
      const todayAppointments = appointments.filter(
        (apt) => apt.appointment_date === today
      );

      setStats({
        appointments: {
          today: todayAppointments.length,
          upcoming: appointments.length,
          total: appointmentsRes.data.pagination?.total || 0,
        },
        patients: patientsRes.data.pagination?.total || 0,
        prescriptions: prescriptionsRes.data.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      <Row>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Today's Appointments</Card.Title>
              <Card.Text className="display-4">{stats.appointments.today}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Upcoming Appointments</Card.Title>
              <Card.Text className="display-4">{stats.appointments.upcoming}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Total Patients</Card.Title>
              <Card.Text className="display-4">{stats.patients}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Prescriptions</Card.Title>
              <Card.Text className="display-4">{stats.prescriptions}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;

