import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal, Alert, Nav } from 'react-bootstrap';
import api from '../api/axios';
import { LOCATIONS } from '../data/indiaLocations';

const STATUS_COLORS = {
  SUBMITTED: 'primary',
  DUPLICATE_REJECTED: 'danger',
  REJECTED: 'danger',
  MATCHED: 'warning',
  IN_PROGRESS: 'warning',
  PROTOTYPE_SUBMITTED: 'secondary',
  FUNDING_COMMITTED: 'primary',
  SOLVED: 'success',
};

// Internal AI structuring status is hidden from citizens — they only see SUBMITTED.
const STATUS_LABELS = {
  SUBMITTED: 'SUBMITTED',
  STRUCTURED: 'SUBMITTED',
  DUPLICATE_REJECTED: 'REJECTED',
  MATCHED: 'MATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  PROTOTYPE_SUBMITTED: 'PROTOTYPE_SUBMITTED',
  FUNDING_COMMITTED: 'FUNDING_COMMITTED',
  SOLVED: 'SOLVED',
};

const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z]/g, '');

const CitizenDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('uploaded');
  const [form, setForm] = useState({
    title: '',
    description: '',
    state: '',
    district: '',
    addressDetail: '',
  });
  const [mediaName, setMediaName] = useState('');
  // Real GPS coordinates — only set when "Use My Location" is used.
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(false);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
      const data = await res.json();
      const a = data.address || {};
      const districtRaw = a.state_district || a.county || a.city || a.town || a.village || a.municipality || '';
      const stateRaw = a.state || '';
      // Match against the dropdown dataset so auto-filled values are always valid options.
      const stateEntry = LOCATIONS.find(s => normalize(s.name) === normalize(stateRaw));
      const state = stateEntry ? stateEntry.name : '';
      let district = '';
      if (stateEntry) {
        const d = stateEntry.districts.find(d => normalize(d) === normalize(districtRaw));
        district = d || '';
      }
      return { state, district, matched: Boolean(state) };
    } catch (err) {
      return { state: '', district: '', matched: false };
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/problems/mine');
      setComplaints(res.data);
    } catch (err) {
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (e) => {
    if (e.target.files[0]) setMediaName(e.target.files[0].name);
  };

  const handleStateChange = (e) => {
    const value = e.target.value;
    // Reset district when the state changes so it always belongs to the selected state.
    setForm(prev => ({ ...prev, state: value, district: '' }));
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      if (!navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== 'function') {
        setError('Geolocation is not supported by your browser.');
        setLocating(false);
        return;
      }
      // Modern W3C Geolocation API returns a Promise resolving to { coords: { latitude, longitude } }.
      const pos = await navigator.geolocation.getCurrentPosition();
      const { latitude, longitude } = pos.coords;
      setPosition({ lat: latitude, lng: longitude });
      setLocating(false);
      reverseGeocode(latitude, longitude).then(({ state, district, matched }) => {
        if (matched) {
          setForm(prev => ({ ...prev, state, district }));
          setError('');
        } else {
          setError('Could not auto-detect your state. Please select your state and district manually.');
        }
      });
    } catch (err) {
      setError('Unable to retrieve your location. Please enable location services.');
      setLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        severity: 'MEDIUM',
        latitude: position ? position.lat : null,
        longitude: position ? position.lng : null,
        address: [form.addressDetail, form.district, form.state]
          .map(s => (s || '').trim())
          .filter(Boolean)
          .join(', ') || null,
        photoUrl: mediaName || null,
        videoUrl: null,
      };
      await api.post('/problems', payload);
      setShowModal(false);
      setForm({ title: '', description: '', state: '', district: '', addressDetail: '' });
      setMediaName('');
      setPosition(null);
      fetchComplaints();
      setActiveTab('uploaded');
    } catch (err) {
      setError('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSolved = async (id) => {
    setError('');
    try {
      await api.post(`/problems/${id}/mark-solved`);
      fetchComplaints();
    } catch (err) {
      setError('Failed to mark complaint as solved. You can only mark your own complaints.');
    }
  };

  const uploadedComplaints = complaints.filter(c => ['SUBMITTED', 'STRUCTURED', 'MATCHED', 'IN_PROGRESS', 'PROTOTYPE_SUBMITTED', 'FUNDING_COMMITTED'].includes(c.status));
  const solvedComplaints = complaints.filter(c => c.status === 'SOLVED');

  return (
    <Container>
      <h2 className="mb-4">Citizen Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link active={activeTab === 'uploaded'} onClick={() => setActiveTab('uploaded')}>
            Uploaded Complaints ({uploadedComplaints.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === 'solved'} onClick={() => setActiveTab('solved')}>
            Solved Complaints ({solvedComplaints.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === 'submit'} onClick={() => setActiveTab('submit')}>
            Submit New Complaint
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'uploaded' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">My Uploaded Complaints</Card.Title>
            <Card.Text className="text-muted">Track the status of your submitted problems</Card.Text>
            {loading ? (
              <p>Loading...</p>
            ) : uploadedComplaints.length === 0 ? (
              <Card><Card.Body>No uploaded complaints yet. Click "Submit New Complaint" to get started.</Card.Body></Card>
            ) : (
              uploadedComplaints.map(c => (
                <Card key={c.id} className="mb-3">
                  <Card.Body>
                    <Card.Title>{c.title}</Card.Title>
                    <Card.Text>{c.description}</Card.Text>
                    <div className="mb-2">
                      <Badge bg={STATUS_COLORS[STATUS_LABELS[c.status] || c.status] || 'secondary'} className="me-2">
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                      {c.category && <Badge bg="light" text="dark">{c.category}</Badge>}
                      {c.severity && <Badge bg="light" text="dark" className="ms-2">{c.severity}</Badge>}
                    </div>
                    {c.address && (
                      <small className="text-muted">
                        Address: {c.address}
                      </small>
                    )}
                    <div className="mt-3">
                      <Button variant="outline-success" size="sm" onClick={() => handleMarkSolved(c.id)}>
                        Mark Solved
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'solved' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">Solved Complaints</Card.Title>
            <Card.Text className="text-muted">Problems that have been successfully resolved</Card.Text>
            {loading ? (
              <p>Loading...</p>
            ) : solvedComplaints.length === 0 ? (
              <Card><Card.Body>No solved complaints yet.</Card.Body></Card>
            ) : (
              solvedComplaints.map(c => (
                <Card key={c.id} className="mb-3">
                  <Card.Body>
                    <Card.Title>{c.title}</Card.Title>
                    <Card.Text>{c.description}</Card.Text>
                    <div className="mb-2">
                      <Badge bg="success" className="me-2">SOLVED</Badge>
                      {c.category && <Badge bg="light" text="dark">{c.category}</Badge>}
                      {c.severity && <Badge bg="light" text="dark" className="ms-2">{c.severity}</Badge>}
                    </div>
                    {c.address && (
                      <small className="text-muted">
                        Address: {c.address}
                      </small>
                    )}
                  </Card.Body>
                </Card>
              ))
            )}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'submit' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">Submit a New Complaint</Card.Title>
            <Card.Text className="text-muted">Report a societal problem that needs attention</Card.Text>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control name="title" value={form.title} onChange={handleChange} required placeholder="Brief summary of the problem" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={handleChange} required placeholder="Describe the problem in detail" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <div className="d-flex gap-2 mb-2">
                  <Button variant="outline-primary" size="sm" onClick={handleUseMyLocation} disabled={locating}>
                    {locating ? 'Locating...' : 'Use My Location'}
                  </Button>
                  <small className="text-muted align-self-center">
                    Auto-fills your state and district from GPS, or select manually below
                  </small>
                </div>
                <Row>
                  <Col md={6}>
                    <Form.Select name="state" value={form.state} onChange={handleStateChange} required aria-label="State">
                      <option value="">Select State</option>
                      {LOCATIONS.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Select
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                      required
                      disabled={!form.state}
                      aria-label="District"
                    >
                      <option value="">{form.state ? 'Select District' : 'Select State first'}</option>
                      {(LOCATIONS.find(s => s.name === form.state)?.districts || []).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>
                {position && (
                  <Form.Text className="text-muted">
                    GPS location captured (lat {position.lat.toFixed(4)}, lng {position.lng.toFixed(4)})
                  </Form.Text>
                )}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Specific Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="addressDetail"
                  value={form.addressDetail}
                  onChange={handleChange}
                  required
                  placeholder="Street, Area, Landmark near you"
                />
                <Form.Text className="text-muted">
                  This is combined with the selected district and state to pinpoint the problem location.
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Upload Photo / Video</Form.Label>
                <Form.Control type="file" accept="image/*,video/*" onChange={handleMediaChange} />
                {mediaName && <Form.Text className="text-muted">{mediaName}</Form.Text>}
              </Form.Group>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default CitizenDashboard;
