import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Nav, Modal } from 'react-bootstrap';
import api from '../api/axios';
import { LOCATIONS, matchLocation } from '../data/indiaLocations';

const IndustryDashboard = () => {
  const [problems, setProblems] = useState([]);
  const [solved, setSolved] = useState([]);
  const [fundingResponsibilities, setFundingResponsibilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [prototypeFilter, setPrototypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [activeTab, setActiveTab] = useState('problems');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problemPrototypes, setProblemPrototypes] = useState([]);
  const [showPrototypesModal, setShowPrototypesModal] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, sRes, fRes] = await Promise.all([
        api.get('/problems'),
        api.get('/problems/solved/me'),
        api.get('/fundings/me'),
      ]);
      setProblems(pRes.data);
      setSolved(sRes.data);
      setFundingResponsibilities(fRes.data);
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
    if (p.status === 'SOLVED') return false;
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

  const handleViewPrototypes = async (problem) => {
    setSelectedProblem(problem);
    try {
      const res = await api.get(`/prototypes/problem/${problem.id}`);
      setProblemPrototypes(res.data);
      setShowPrototypesModal(true);
    } catch (err) {
      setError('Failed to load prototypes');
    }
  };

  const handleSponsorPrototype = async (prototypeId) => {
    try {
      await api.post(`/prototypes/${prototypeId}/fund`);
      setShowPrototypesModal(false);
      fetchAll();
    } catch (err) {
      setError('Failed to sponsor prototype');
    }
  };

  if (loading) return <Container><p>Loading...</p></Container>;

  return (
    <Container>
      <h2 className="mb-4">Industry / NGO Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link active={activeTab === 'problems'} onClick={() => setActiveTab('problems')}>
            Browse Problems ({filteredProblems.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === 'funding'} onClick={() => setActiveTab('funding')}>
            Funding Responsibilities ({fundingResponsibilities.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === 'solved'} onClick={() => setActiveTab('solved')}>
            Solved Problems ({solved.length})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'problems' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">Browse Problems</Card.Title>
            <Card.Text className="text-muted">View and sponsor societal problems that need solutions</Card.Text>
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
            {filteredProblems.length === 0 && <p>No problems found.</p>}
            {filteredProblems.map(p => (
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
                    <Badge bg="info">{p.category}</Badge>
                    <Badge bg="warning">{p.severity}</Badge>
                    <Badge bg={p.status === 'SOLVED' ? 'success' : 'secondary'}>{p.status === 'STRUCTURED' ? 'SUBMITTED' : p.status}</Badge>
                    <Badge bg={p.hasPrototypes ? 'primary' : 'light'} text={p.hasPrototypes ? 'white' : 'dark'}>
                      {p.hasPrototypes ? 'Prototypes Submitted' : 'No Prototypes'}
                    </Badge>
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
                  <Button variant="outline-primary" size="sm" className="mt-3" onClick={() => handleViewPrototypes(p)}>
                    View Prototypes
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'funding' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">Funding Responsibility</Card.Title>
            <Card.Text className="text-muted">Problems and prototypes you are responsible for funding</Card.Text>
            {fundingResponsibilities.length === 0 && <p>No funding responsibilities yet.</p>}
            {fundingResponsibilities.map(funding => (
              <Card key={funding.id} className="mb-3">
                <Card.Body>
                  <Card.Title>{funding.problemTitle || 'Problem #' + funding.problemId}</Card.Title>
                  <Card.Text>
                    <strong>Funding Type:</strong> {funding.fundingType}
                  </Card.Text>
                  <Card.Text>
                    <strong>Amount:</strong> ${parseFloat(funding.amount).toLocaleString()}
                  </Card.Text>
                  <div className="d-flex gap-2 align-items-center">
                    <Badge bg={funding.status === 'CONFIRMED' ? 'success' : funding.status === 'PLEDGED' ? 'warning' : 'secondary'}>{funding.status}</Badge>
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
            <Card.Text className="text-muted">Problems that have been successfully resolved</Card.Text>
            {solved.length === 0 && <p>No solved problems yet.</p>}
            {solved.map(p => (
              <Card key={p.id} className="mb-3">
                <Card.Body>
                  <Card.Title>{p.title}</Card.Title>
                  <Card.Text>{p.description}</Card.Text>
                  <div className="d-flex gap-2 align-items-center">
                    <Badge bg="success">SOLVED</Badge>
                    <Badge bg="info">{p.category}</Badge>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
      )}

      <Modal show={showPrototypesModal} onHide={() => setShowPrototypesModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Prototypes for {selectedProblem?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {problemPrototypes.length === 0 && <p>No prototypes submitted yet.</p>}
          {problemPrototypes.map(proto => (
            <Card key={proto.id} className="mb-3 prototype-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <Card.Title className="mb-1">Prototype #{proto.id}</Card.Title>
                    <div className="d-flex gap-2 flex-wrap">
                      <Badge bg={proto.status === 'FUNDING_COMMITTED' ? 'success' : proto.status === 'GOVERNMENT_APPROVED' ? 'info' : 'secondary'}>{proto.status}</Badge>
                      {proto.fundingStatus && (
                        <Badge bg={proto.fundingStatus === 'CONFIRMED' ? 'success' : 'warning'}>Funding: {proto.fundingStatus}</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline-success" size="sm" onClick={() => handleSponsorPrototype(proto.id)}>
                    Sponsor
                  </Button>
                </div>

                {/* Team Information */}
                <div className="mb-2 p-2 team-info-box rounded border">
                  <small className="text-muted d-block mb-1">Submitted by Team:</small>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Badge bg="secondary">Team: {proto.teamName || 'Unknown'}</Badge>
                    {proto.teamEmail && (
                      <small className="text-primary">
                        <i className="bi bi-envelope"></i> {proto.teamEmail}
                      </small>
                    )}
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
        </Modal.Body>
      </Modal>

      {/* Problem Details Modal */}
      <Modal show={!!selectedProblem && !showPrototypesModal} onHide={() => setSelectedProblem(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Complaint Details - #{selectedProblem?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProblem && (
            <div>
              <h5>{selectedProblem.title}</h5>
              <div className="d-flex gap-2 flex-wrap mb-3">
                <Badge bg="secondary">{selectedProblem.status}</Badge>
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
          <Button variant="primary" onClick={() => handleViewPrototypes(selectedProblem)}>
            View Prototypes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default IndustryDashboard;
