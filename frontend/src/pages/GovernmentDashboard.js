import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, ProgressBar, Nav, Form, Collapse, Modal } from 'react-bootstrap';
import api from '../api/axios';
import { LOCATIONS, matchLocation } from '../data/indiaLocations';

const GovernmentDashboard = () => {
  const [problemsWithPrototypes, setProblemsWithPrototypes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('problems');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [prototypeFilter, setPrototypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [expandedProblem, setExpandedProblem] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/problems/with-prototypes'),
        api.get('/statistics'),
      ]);
      setProblemsWithPrototypes(pRes.data || []);
      setStatistics(sRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStateFilterChange = (e) => {
    setStateFilter(e.target.value);
    setDistrictFilter('');
  };

  const filteredProblems = (problemsWithPrototypes || []).filter(p => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (severityFilter && p.severity !== severityFilter) return false;
    if (prototypeFilter === 'with' && (!p.prototypes || p.prototypes.length === 0)) return false;
    if (prototypeFilter === 'without' && p.prototypes && p.prototypes.length > 0) return false;
    const loc = matchLocation(p.address);
    if (stateFilter && loc.state !== stateFilter) return false;
    if (districtFilter && loc.district !== districtFilter) return false;
    return true;
  });

  const categories = [...new Set((problemsWithPrototypes || []).map(p => p.category).filter(Boolean))].sort();
  const severities = [...new Set((problemsWithPrototypes || []).map(p => p.severity).filter(Boolean))].sort();

  const handleFund = async (prototypeId) => {
    try {
      await api.post(`/prototypes/${prototypeId}/fund`);
      fetchData();
    } catch (err) {
      setError('Failed to fund prototype');
    }
  };

  const handleApprove = async (prototypeId) => {
    try {
      await api.post(`/prototypes/${prototypeId}/approve`);
      fetchData();
    } catch (err) {
      setError('Failed to approve prototype');
    }
  };

  const handleMarkSolved = async (problemId) => {
    try {
      await api.post(`/problems/${problemId}/mark-solved`);
      fetchData();
    } catch (err) {
      setError('Failed to mark problem as solved');
    }
  };

  const handleDelete = async (problemId) => {
    if (!window.confirm('Delete this complaint permanently?')) return;
    try {
      await api.delete(`/problems/${problemId}`);
      fetchData();
    } catch (err) {
      setError('Failed to delete complaint');
    }
  };

  if (loading) return <Container><p>Loading...</p></Container>;

  return (
    <Container>
      <h2 className="mb-4">Government Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link active={activeTab === 'problems'} onClick={() => setActiveTab('problems')}>
            Problems & Prototypes ({filteredProblems.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === 'statistics'} onClick={() => setActiveTab('statistics')}>
            Statistics Dashboard
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'problems' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">All Complaints & Their Prototypes</Card.Title>
            <Card.Text className="text-muted">Review every uploaded complaint with its submitted prototypes</Card.Text>

            <Row className="mb-3 g-2">
              <Col md={2}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold">Category</Form.Label>
                  <Form.Select size="sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold">Severity</Form.Label>
                  <Form.Select size="sm" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                    <option value="">All Severities</option>
                    {severities.map(sev => (
                      <option key={sev} value={sev}>{sev}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold">Prototypes</Form.Label>
                  <Form.Select size="sm" value={prototypeFilter} onChange={(e) => setPrototypeFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="with">With Prototypes</option>
                    <option value="without">Without Prototypes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold">State</Form.Label>
                  <Form.Select size="sm" value={stateFilter} onChange={handleStateFilterChange}>
                    <option value="">All States</option>
                    {LOCATIONS.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-0">
                  <Form.Label className="small fw-bold">District</Form.Label>
                  <Form.Select size="sm" value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} disabled={!stateFilter}>
                    <option value="">All Districts</option>
                    {stateFilter && LOCATIONS.find(s => s.name === stateFilter)?.districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <p className="small text-muted mb-2">
              Showing {filteredProblems.length} of {problemsWithPrototypes.length} complaints
            </p>

            {problemsWithPrototypes.length === 0 ? (
              <p>No problems with prototypes found.</p>
            ) : filteredProblems.length === 0 ? (
              <p>No complaints match the selected filters.</p>
            ) : (
              <div>
                {filteredProblems.map(p => (
                  <Card key={p.id} className="mb-3 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
<div className="d-flex align-items-center gap-2 mb-1">
                             <Badge bg="secondary">#{p.id}</Badge>
                             <h5 className="mb-0">{p.title}</h5>
                             {p.reportCount > 1 && (
                               <Badge bg="primary">{p.reportCount} Reports</Badge>
                             )}
                           </div>
                          <p className="text-muted mb-2">{p.description}</p>
                          <div className="d-flex gap-2 flex-wrap">
                            <Badge bg={p.status === 'SOLVED' ? 'success' : p.status === 'FUNDING_COMMITTED' ? 'info' : 'warning'}>
                              {p.status}
                            </Badge>
                            {p.category && <Badge bg="info">{p.category}</Badge>}
                            {p.severity && <Badge bg="danger">{p.severity}</Badge>}
                            {(() => {
                              const loc = matchLocation(p.address);
                              return (
                                <>
                                  {loc.state && <Badge bg="primary">{loc.state}</Badge>}
                                  {loc.district && <Badge bg="secondary">{loc.district}</Badge>}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="mb-2">
                            <strong>{p.prototypes ? p.prototypes.length : 0}</strong>
                            <br />
                            <small className="text-muted">Prototypes</small>
                          </div>
                          <div className="d-flex gap-1 justify-content-end">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => setSelectedProblem(p)}
                            >
                              View Details
                            </Button>
                            <Button
                              variant={expandedProblem === p.id ? "primary" : "outline-primary"}
                              size="sm"
                              onClick={() => setExpandedProblem(expandedProblem === p.id ? null : p.id)}
                            >
                              {expandedProblem === p.id ? 'Hide' : 'View'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2 mb-2">
                        <Button variant="success" size="sm" onClick={() => handleMarkSolved(p.id)}>
                          Mark as Solved
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p.id)}>
                          Delete
                        </Button>
                      </div>

                      <Collapse in={expandedProblem === p.id}>
                        <div className="mt-3 pt-3 border-top">
                          <h6 className="mb-3">
                            <Badge bg="primary">{p.prototypes ? p.prototypes.length : 0}</Badge> Prototype(s) Submitted
                          </h6>
                          {p.prototypes && p.prototypes.length > 0 ? (
                            p.prototypes.map(proto => (
                              <Card key={proto.id} className="mb-3 border-start border-4 border-primary">
                                <Card.Body className="py-3 px-3">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center gap-2 mb-2">
                                        <strong>Prototype #{proto.id}</strong>
                                        <Badge bg={proto.status === 'GOVERNMENT_APPROVED' ? 'success' : proto.status === 'FUNDING_COMMITTED' ? 'info' : 'secondary'}>{proto.status || 'Pending'}</Badge>
                                        {proto.fundingStatus && (
                                          <Badge bg={proto.fundingStatus === 'CONFIRMED' ? 'success' : proto.fundingStatus === 'PLEDGED' ? 'warning' : 'secondary'}>
                                            Funding: {proto.fundingStatus}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="mb-2 small">{proto.description}</p>
                                      <div className="d-flex gap-2 flex-wrap">
                                        {proto.fileUrl && (
                                          <Button variant="outline-secondary" size="sm" href={proto.fileUrl} target="_blank" rel="noreferrer">
                                            View File
                                          </Button>
                                        )}
                                        {proto.repoLink && (
                                          <Button variant="outline-dark" size="sm" href={proto.repoLink} target="_blank" rel="noreferrer">
                                            Repository
                                          </Button>
                                        )}
                                        {proto.pptUrl && (
                                          <Button variant="outline-info" size="sm" href={proto.pptUrl} target="_blank" rel="noreferrer">
                                            PPT
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="d-flex flex-column gap-1 ms-2">
                                      {!p.isFunded && (
                                        <Button variant="success" size="sm" onClick={() => handleFund(proto.id)}>
                                          Fund
                                        </Button>
                                      )}
                                      <Button variant="primary" size="sm" onClick={() => handleApprove(proto.id)}>
                                        Approve
                                      </Button>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            ))
                          ) : (
                            <div className="text-center py-3">
                              <p className="text-muted mb-0">No prototypes submitted for this complaint yet.</p>
                            </div>
                          )}
                        </div>
                      </Collapse>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'statistics' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h3">Statistics Dashboard</Card.Title>
            <Card.Text className="text-muted">Overview of all problems, solutions, and platform activity</Card.Text>

            <Row className="mb-4">
              <Col md={3}>
                <Card bg="primary" text="white">
                  <Card.Body>
                    <Card.Title>Total Problems</Card.Title>
                    <h2>{statistics?.totalProblems || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card bg="success" text="white">
                  <Card.Body>
                    <Card.Title>Solved</Card.Title>
                    <h2>{statistics?.totalSolved || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card bg="info" text="white">
                  <Card.Body>
                    <Card.Title>In Progress</Card.Title>
                    <h2>{statistics?.totalInProgress || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card bg="warning" text="white">
                  <Card.Body>
                    <Card.Title>Prototypes</Card.Title>
                    <h2>{statistics?.totalPrototypes || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {statistics?.categoryBreakdown && statistics.categoryBreakdown.length > 0 && (
              <div className="mb-4">
                <h5>By Category</h5>
                {statistics.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="d-flex justify-content-between">
                      <span>{cat.category}</span>
                      <span>{cat.count}</span>
                    </div>
                    <ProgressBar now={(cat.count / statistics.totalProblems) * 100} label={`${((cat.count / statistics.totalProblems) * 100).toFixed(1)}%`} />
                  </div>
                ))}
              </div>
            )}

            {statistics?.locationBreakdown && statistics.locationBreakdown.length > 0 && (
              <div>
                <h5>By Location</h5>
                {statistics.locationBreakdown.map((loc, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="d-flex justify-content-between">
                      <span>{loc.location}</span>
                      <span>{loc.count}</span>
                    </div>
                    <ProgressBar now={(loc.count / statistics.totalProblems) * 100} label={`${((loc.count / statistics.totalProblems) * 100).toFixed(1)}%`} />
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Modal show={!!selectedProblem} onHide={() => setSelectedProblem(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Complaint Details - #{selectedProblem?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProblem && (
            <div>
              <h5>{selectedProblem.title}</h5>
              <div className="d-flex gap-2 flex-wrap mb-3">
                <Badge bg={selectedProblem.status === 'SOLVED' ? 'success' : selectedProblem.status === 'FUNDING_COMMITTED' ? 'info' : 'warning'}>
                  {selectedProblem.status}
                </Badge>
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
                      {loc.state && <Badge bg="primary">State: {loc.state}</Badge>}
                      {loc.district && <Badge bg="secondary">District: {loc.district}</Badge>}
                    </div>
                    {selectedProblem.address && (
                      <div className="p-2 rounded border">
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
                      <img src={selectedProblem.photoUrl} alt="Problem" className="img-fluid rounded" style={{ maxHeight: '300px' }} />
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
                <h6>Prototypes Submitted</h6>
                <Badge bg="primary">{selectedProblem.prototypes ? selectedProblem.prototypes.length : 0}</Badge>
              </div>

              <div className="mb-3">
                <h6>Submitted</h6>
                <small className="text-muted">{new Date(selectedProblem.createdAt).toLocaleString()}</small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedProblem(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GovernmentDashboard;
