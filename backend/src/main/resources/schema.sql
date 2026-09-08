-- CrowdSolve Portal Database Schema
-- Run this in PostgreSQL to set up the database

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CITIZEN', 'TEAM', 'INDUSTRY_NGO', 'GOVERNMENT')),
    phone VARCHAR(50),
    organization VARCHAR(255),
    location VARCHAR(255),
    skill_tags TEXT[],
    category_interests TEXT[],
    capacity INTEGER DEFAULT 5,
    banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problems (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    severity VARCHAR(50),
    photo_url TEXT,
    video_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN (
        'SUBMITTED', 'STRUCTURED', 'DUPLICATE_REJECTED', 'MATCHED',
        'IN_PROGRESS', 'PROTOTYPE_SUBMITTED', 'FUNDING_COMMITTED', 'SOLVED'
    )),
    is_funded BOOLEAN DEFAULT FALSE,
    funded_by VARCHAR(50) CHECK (funded_by IN ('INDUSTRY_NGO', 'GOVERNMENT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS duplicate_links (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT REFERENCES problems(id) ON DELETE CASCADE,
    duplicate_of_problem_id BIGINT REFERENCES problems(id) ON DELETE CASCADE,
    similarity_score DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    leader_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    member_ids BIGINT[] DEFAULT '{}',
    skill_tags TEXT[] DEFAULT '{}',
    category_interests TEXT[] DEFAULT '{}',
    capacity INTEGER DEFAULT 5,
    current_problems INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_requests (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT REFERENCES problems(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    industry_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    initiated_by VARCHAR(50) NOT NULL CHECK (initiated_by IN ('TEAM', 'INDUSTRY_NGO')),
    source VARCHAR(50) NOT NULL CHECK (source IN ('SYSTEM_MATCH', 'SELF_PICK', 'DIRECT_REQUEST')),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    notes TEXT,
    funding_amount NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prototypes (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT REFERENCES problems(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    industry_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    file_url TEXT,
    repo_link TEXT,
    ppt_url TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN (
        'SUBMITTED', 'FUNDING_COMMITTED', 'GOVERNMENT_APPROVED'
    )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fundings (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT REFERENCES problems(id) ON DELETE CASCADE,
    prototype_id BIGINT REFERENCES prototypes(id) ON DELETE CASCADE,
    funder_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    funding_type VARCHAR(50) NOT NULL CHECK (funding_type IN ('SPONSORSHIP', 'PROTOTYPE_FUNDING')),
    amount NUMERIC(12,2),
    status VARCHAR(50) DEFAULT 'PLEDGED' CHECK (status IN ('PLEDGED', 'CONFIRMED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS government_approvals (
    id BIGSERIAL PRIMARY KEY,
    prototype_id BIGINT REFERENCES prototypes(id) ON DELETE CASCADE,
    approved_by BIGINT REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
