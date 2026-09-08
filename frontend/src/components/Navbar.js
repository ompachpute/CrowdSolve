import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const AppNavbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'CITIZEN':
        return '/citizen';
      case 'TEAM':
        return '/team';
      case 'INDUSTRY_NGO':
        return '/industry';
      case 'GOVERNMENT':
        return '/government';
      default:
        return '/login';
    }
  };

  const navbarVariant = theme === 'dark' ? 'dark' : 'light';
  const buttonVariant = theme === 'dark' ? 'outline-light' : 'outline-dark';

  return (
    <Navbar bg={navbarVariant} variant={navbarVariant} expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={NavLink} to="/">CrowdSolve</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <Nav.Link as={NavLink} to={getDashboardLink()}>
                Dashboard
              </Nav.Link>
            )}
          </Nav>
          <Nav>
            <Button
              variant={buttonVariant}
              size="sm"
              className="me-2 theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
            {isAuthenticated ? (
              <>
                <Navbar.Text className="me-3">
                  {user.name} ({user.role})
                </Navbar.Text>
                <Button variant={buttonVariant} size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
                <Nav.Link as={NavLink} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
