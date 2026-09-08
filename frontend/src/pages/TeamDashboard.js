import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal, Alert, Nav } from 'react-bootstrap';
import api from '../api/axios';
import { LOCATIONS, matchLocation } from '../data/indiaLocations';

const STATUS_COLORS = {
  SUBMITTED: 'primary',
  DUPLICATE_REJECTED: 'danger',
  MATCHED: 'warning',
  IN_PROGRESS: 'warning',
  PROTOTYPE_SUBMITTED: 'secondary',
  FUNDING_COMMITTED: 'primary',
  SOLVED: 'success',
};

const TeamDashboard = () => {
  const [problems, setProblems] = useState([]);
  const [solved, setSolved] = useState([]);
  const [submittedPrototypes, setSubmittedPrototypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [prototypeFilter, setPrototypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showPrototypeModal, setShowPrototypeModal] = useState(false);
  const [prototypeDescription, setPrototypeDescription] = useState('');
  const [prototypeFileUrl, setPrototypeFileUrl] = useState('');
  const [prototypeRepoLink, setPrototypeRepoLink] = useState('');
  const [prototypePpt, setPrototypePpt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, sRes, protoRes] = await Promise.all([
        api.get('/problems'),
        api.get('/problems/solved/team'),
        api.get('/prototypes/team'),
      ]);
      setProblems(pRes.data);
      setSolved(sRes.data);
      setSubmittedPrototypes(protoRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleStateFilterChange = (e) => {
    setStateFilter(e.target.value);
    setDistrictFilter('');
  };

  const filteredProblems = problems.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (severityFilter && p.severity !== severityFilter) return false;
    if (prototypeFilter === 'with' && !p.hasPrototypes) return false;
    if (prototypeFilter === 'without' && p.hasPrototypes) return false;
    const loc = matchLocation(p.address);
    if (stateFilter && loc.state !== stateFilter) return false;
    if (districtFilter && loc.district !== districtFilter) return false;
    return true;
  });

  const categories = [...new Set(problems.map(p => p.category).filter(Boolean))].sort();
  const severities = [...new Set(problems.map(p => p.severity).filter(Boolean))].sort();

  const visibleProblems = filteredProblems.filter(p => ['SUBMITTED', 'MATCHED', 'IN_PROGRESS', 'FUNDING_COMMITTED'].includes(p.status));

  const handleSubmitPrototype = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('problemId', selectedProblem.id);
      formData.append('description', prototypeDescription);
      formData.append('fileUrl', prototypeFileUrl);
      formData.append('repoLink', prototypeRepoLink);
      formData.append('pptUrl', prototypePpt);
      await api.post('/prototypes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowPrototypeModal(false);
      setPrototypeDescription('');
      setPrototypeFileUrl('');
      setPrototypeRepoLink('');
      setPrototypePpt('');
      setSelectedProblem(null);
      fetchAll();
    } catch (err) {
      setError('Failed to submit prototype');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Container><p>Loading...</p></Container>;

  return (
    <Container>
      <h2 className="mb-4">Team Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link active={activeTab === 'browse'} onClick={() => setActiveTab('browse')}>
            Browse Complaints ({visibleProblems.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === 'submitted'} onClick={() => setActiveTab('submitted')}>
            Submitted Prototypes ({submittedPrototypes.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === 'solved'} onClick={() => setActiveTab('solved')}>
            Solved ({solved.length})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'browse' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">Browse Complaints</Card.Title>
            <Card.Text className="text-muted">Explore citizen complaints that need solutions</Card.Text>
            <Row className="g-2 mb-3 justify-content-end">
              <Col xs="auto">
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  {[...new Set(problems.map(p => p.status).filter(Boolean))].sort().map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs="auto">
                <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs="auto">
                <Form.Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                  <option value="">All Severities</option>
                  {severities.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs="auto">
                <Form.Select value={prototypeFilter} onChange={(e) => setPrototypeFilter(e.target.value)}>
                  <option value="">All Prototypes</option>
                  <option value="with">With Prototypes</option>
                  <option value="without">Without Prototypes</option>
                </Form.Select>
              </Col>
              <Col xs="auto">
                <Form.Select value={stateFilter} onChange={handleStateFilterChange}>
                  <option value="">All States</option>
                  {LOCATIONS.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs="auto">
                <Form.Select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} disabled={!stateFilter}>
                  <option value="">{stateFilter ? 'All Districts' : 'Select State first'}</option>
                  {(LOCATIONS.find(s => s.name === stateFilter)?.districts || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            {visibleProblems.length === 0 && <p>No complaints found.</p>}
            {visibleProblems.map(p => (
              <Card key={p.id} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <Card.Title>{p.title}</Card.Title>
                      <Card.Text className="text-muted small">{p.description.substring(0, 100)}{p.description.length > 100 ? '...' : ''}</Card.Text>
                    </div>
                    <Button variant="outline-info" size="sm" onClick={() => setSelectedProblem(p)}>
                      View Details
                    </Button>
                  </div>
                  <div className="d-flex gap-2 align-items-center flex-wrap mt-2">
                    <Badge bg={STATUS_COLORS[p.status] || 'secondary'}>{p.status}</Badge>
                    {p.category && <Badge bg="light" text="dark">{p.category}</Badge>}
                    {p.severity && <Badge bg="light" text="dark">{p.severity}</Badge>}
                    {(() => {
                      const loc = matchLocation(p.address);
                      return (
                        <>
                          {loc.state && <Badge bg="primary"><i className="bi bi-geo-alt"></i> {loc.state}</Badge>}
                          {loc.district && <Badge bg="secondary">{loc.district}</Badge>}
                          {!loc.state && !loc.district && p.address && <Badge bg="light" text="dark">{p.address}</Badge>}
                        </>
                      );
                    })()}
                  </div>
                  <Button variant="outline-primary" size="sm" className="mt-3" onClick={() => { setSelectedProblem(p); setShowPrototypeModal(true); }}>
                    Submit Prototype
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'submitted' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">Submitted Prototypes</Card.Title>
            <Card.Text className="text-muted">Prototype solutions your team has submitted for complaints</Card.Text>
            {submittedPrototypes.length === 0 && <p>No prototypes submitted yet.</p>}
            {submittedPrototypes.map(proto => (
              <Card key={proto.id} className="mb-3 prototype-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Card.Title className="mb-1">{proto.problemTitle || 'Problem #' + proto.problemId}</Card.Title>
                      <div className="d-flex gap-2 flex-wrap">
                        <Badge bg={STATUS_COLORS[proto.status] || 'secondary'}>{proto.status}</Badge>
                        {proto.fundingStatus && (
                          <Badge bg={proto.fundingStatus === 'CONFIRMED' ? 'success' : 'warning'}>Funding: {proto.fundingStatus}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Organization Information (if funded) */}
                  {proto.industryName && (
                    <div className="mb-2 p-2 org-info-box rounded border border-success">
                      <small className="text-muted d-block mb-1">Funded by Organization:</small>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <Badge bg="success">Org: {proto.industryName}</Badge>
                        {proto.industryEmail && (
                          <small className="text-primary">
                            <i className="bi bi-envelope"></i> {proto.industryEmail}
                          </small>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="mb-2 small text-muted">{proto.description}</p>
                  <div className="d-flex gap-2 flex-wrap">
                    {proto.fileUrl && (<Button variant="outline-secondary" size="sm" href={proto.fileUrl} target="_blank" rel="noreferrer">View File</Button>)}
                    {proto.repoLink && (<Button variant="outline-dark" size="sm" href={proto.repoLink} target="_blank" rel="noreferrer">Repository</Button>)}
                    {proto.pptUrl && (<Button variant="outline-info" size="sm" href={proto.pptUrl} target="_blank" rel="noreferrer">PPT</Button>)}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'solved' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">Solved Problems</Card.Title>
            <Card.Text className="text-muted">Problems your team has successfully resolved</Card.Text>
            {solved.length === 0 && <p>No solved problems yet.</p>}
            {solved.map(p => (
              <Card key={p.id} className="mb-3">
                <Card.Body>
                  <Card.Title>{p.title}</Card.Title>
                  <Card.Text>{p.description}</Card.Text>
                  <div className="d-flex gap-2 align-items-center">
                    <Badge bg="success">SOLVED</Badge>
                    {p.category && <Badge bg="light" text="dark">{p.category}</Badge>}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
      )}

      <Modal show={showPrototypeModal} onHide={() => setShowPrototypeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Submit Prototype</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitPrototype}>
            <Form.Group className="mb-3">
              <Form.Label>Problem</Form.Label>
              <Form.Control value={selectedProblem?.title || 'Select a problem first'} disabled />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={prototypeDescription} onChange={(e) => setPrototypeDescription(e.target.value)} required placeholder="Describe your prototype solution..." />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>File URL</Form.Label>
              <Form.Control type="url" value={prototypeFileUrl} onChange={(e) => setPrototypeFileUrl(e.target.value)} required placeholder="https://example.com/your-prototype.pdf" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Repository Link (optional)</Form.Label>
              <Form.Control type="url" value={prototypeRepoLink} onChange={(e) => setPrototypeRepoLink(e.target.value)} placeholder="https://github.com/..." />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>PPT Presentation (optional)</Form.Label>
              <Form.Control type="url" value={prototypePpt} onChange={(e) => setPrototypePpt(e.target.value)} placeholder="https://example.com/presentation.pptx" />
              <Form.Text className="text-muted">Paste a link to your PowerPoint presentation</Form.Text>
            </Form.Group>
            <Button variant="primary" type="submit" disabled={submitting || !selectedProblem}>
              {submitting ? 'Submitting...' : 'Submit Prototype'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Problem Details Modal */}
      <Modal show={!!selectedProblem && !showPrototypeModal} onHide={() => setSelectedProblem(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Complaint Details - #{selectedProblem?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProblem && (
            <div>
              <h5>{selectedProblem.title}</h5>
              <div className="d-flex gap-2 flex-wrap mb-3">
                <Badge bg={STATUS_COLORS[selectedProblem.status] || 'secondary'}>{selectedProblem.status}</Badge>
                {selectedProblem.category && <Badge bg="info">{selectedProblem.category}</Badge>}
                {selectedProblem.severity && <Badge bg="danger">{selectedProblem.severity}</Badge>}
              </div>
              
              <div className="mb-3">
                <h6>Description</h6>
                <p className="text-muted">{selectedProblem.description}</p>
              </div>

              {(() => {
                const loc = matchLocation(selectedProblem.address);
                return (
                  <div className="mb-3">
                    <h6>Location</h6>
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {loc.state && <Badge bg="primary"><i className="bi bi-geo-alt"></i> State: {loc.state}</Badge>}
                      {loc.district && <Badge bg="secondary">District: {loc.district}</Badge>}
                    </div>
                    {selectedProblem.address && (
                      <div className="p-2 address-box rounded border">
                        <small className="text-muted d-block mb-1">Full Address:</small>
                        <span className="fw-medium">{selectedProblem.address}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {(selectedProblem.photoUrl || selectedProblem.videoUrl) && (
                <div className="mb-3">
                  <h6>Media Attachments</h6>
                  {selectedProblem.photoUrl && (
                    <div className="mb-2">
                      <small className="text-muted d-block mb-1">Photo:</small>
                      <img src={selectedProblem.photoUrl} alt="Problem" className="img-fluid rounded" style={{ maxHeight: '200px' }} />
                    </div>
                  )}
                  {selectedProblem.videoUrl && (
                    <div className="mb-2">
                      <small className="text-muted d-block mb-1">Video:</small>
                      <a href={selectedProblem.videoUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm">View Video</a>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-3">
                <h6>Submitted</h6>
                <small className="text-muted">{new Date(selectedProblem.createdAt).toLocaleString()}</small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedProblem(null)}>Close</Button>
          <Button variant="primary" onClick={() => { setShowPrototypeModal(true); }}>
            Submit Prototype
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TeamDashboard;
