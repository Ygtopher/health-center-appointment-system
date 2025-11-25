import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg">
      <BootstrapNavbar.Brand href="/" className="ms-3">
        Health Center System
      </BootstrapNavbar.Brand>
      <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
      <BootstrapNavbar.Collapse id="basic-navbar-nav" className="justify-content-end">
        <Nav className="me-auto">
          <BootstrapNavbar.Text className="text-white ms-3">
            Welcome, {user?.first_name} {user?.last_name} ({user?.role})
          </BootstrapNavbar.Text>
        </Nav>
        <Nav>
          <Button variant="outline-light" onClick={logout} className="me-3">
            Logout
          </Button>
        </Nav>
      </BootstrapNavbar.Collapse>
    </BootstrapNavbar>
  );
}

export default Navbar;

