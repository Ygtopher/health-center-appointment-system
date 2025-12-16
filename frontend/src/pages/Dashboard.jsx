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
      const response = await axios.get('/api/stats');
      setStats(response.data.data);
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

