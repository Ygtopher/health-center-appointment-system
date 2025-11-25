import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/appointments', label: 'Appointments', icon: '📅' },
    { path: '/patients', label: 'Patients', icon: '👥' },
    { path: '/prescriptions', label: 'Prescriptions', icon: '💊' },
  ];

  return (
    <Nav className="flex-column">
      {menuItems.map((item) => (
        <Nav.Link
          key={item.path}
          as={Link}
          to={item.path}
          className={location.pathname === item.path ? 'active' : ''}
        >
          {item.icon} {item.label}
        </Nav.Link>
      ))}
    </Nav>
  );
}

export default Sidebar;

