-- Clear existing data (in correct order to respect foreign key constraints)
TRUNCATE TABLE fundings, prototypes, duplicate_links, problems, teams, users RESTART IDENTITY CASCADE;

INSERT INTO users (name, email, password_hash, role, phone, organization, location, skill_tags, category_interests, capacity, banned, created_at) VALUES
('Alice Citizen', 'citizen@gmail.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'CITIZEN', '555-0101', NULL, 'New York', ARRAY['photography','writing'], ARRAY['Environment','Education'], 5, false, CURRENT_TIMESTAMP),
('Bob Reporter', 'bob@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'CITIZEN', '555-0102', NULL, 'Chicago', ARRAY['journalism','coding'], ARRAY['Safety','Health'], 5, false, CURRENT_TIMESTAMP),
('Carol Citizen', 'carol@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'CITIZEN', '555-0103', NULL, 'Houston', ARRAY['teaching','design'], ARRAY['Education','Public Transport'], 5, false, CURRENT_TIMESTAMP),
('David Citizen', 'david@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'CITIZEN', '555-0104', NULL, 'Phoenix', ARRAY['engineering','math'], ARRAY['Infrastructure'], 5, false, CURRENT_TIMESTAMP),
('Eve Citizen', 'eve@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'CITIZEN', '555-0105', NULL, 'Philadelphia', ARRAY['biology','chemistry'], ARRAY['Health','Environment'], 5, false, CURRENT_TIMESTAMP),
('Frank Team Lead', 'team@gmail.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'TEAM', '555-0106', 'GreenBuilders', 'San Francisco', ARRAY['construction','architecture'], ARRAY['Infrastructure','Environment'], 5, false, CURRENT_TIMESTAMP),
('Grace Team Lead', 'grace@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'TEAM', '555-0107', 'EduTech', 'Boston', ARRAY['software','education'], ARRAY['Education','Technology'], 5, false, CURRENT_TIMESTAMP),
('Henry Industry', 'org@gmail.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'INDUSTRY_NGO', '555-0108', 'GreenCorp', 'Seattle', ARRAY['manufacturing','logistics'], ARRAY['Infrastructure','Public Transport'], 5, false, CURRENT_TIMESTAMP),
('Iris NGO', 'iris@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'INDUSTRY_NGO', '555-0109', 'HealthFirst', 'Los Angeles', ARRAY['healthcare','policy'], ARRAY['Health','Safety'], 5, false, CURRENT_TIMESTAMP),
('Jack Government', 'gover@gmail.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'GOVERNMENT', '555-0110', 'City Council', 'Denver', ARRAY['administration','law'], ARRAY['Infrastructure','Safety'], 5, false, CURRENT_TIMESTAMP),
('Kate Citizen', 'kate@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'CITIZEN', '555-0111', NULL, 'Miami', ARRAY['photography','activism'], ARRAY['Environment','Safety'], 5, false, CURRENT_TIMESTAMP),
('Leo Citizen', 'leo@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'CITIZEN', '555-0112', NULL, 'Dallas', ARRAY['transport','planning'], ARRAY['Public Transport','Infrastructure'], 5, false, CURRENT_TIMESTAMP),
('Mia Team Lead', 'mia@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'TEAM', '555-0113', 'TransportFix', 'Portland', ARRAY['mechanical','electrical'], ARRAY['Public Transport','Safety'], 5, false, CURRENT_TIMESTAMP),
('Nina Government', 'nina@example.com', '$2b$10$gebUOEbHfMS9.oGsh4tU3..PZZF3hJ1NPWXSfExlkIBq2.mKiKeja', 'GOVERNMENT', '555-0114', 'State Agency', 'Austin', ARRAY['environment','planning'], ARRAY['Environment','Health'], 5, false, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO problems (reporter_id, title, description, category, severity, photo_url, video_url, latitude, longitude, address, status, is_funded, funded_by, created_at)
SELECT * FROM (VALUES
(1, 'Pothole on Main St', 'Large pothole causing traffic. Multiple vehicles damaged. Needs immediate repair before monsoon season starts.', 'Infrastructure', 'HIGH', 'http://img/1.jpg', NULL::TEXT, 19.0760, 72.8777, 'Mumbai, Maharashtra', 'SOLVED', true, 'INDUSTRY_NGO', CURRENT_TIMESTAMP),
(1, 'Illegal dumping near river', 'Waste dumped near the riverbank causing pollution. Harmful to local wildlife and water quality.', 'Environment', 'MEDIUM', 'http://img/2.jpg', NULL, 18.5204, 73.8567, 'Pune, Maharashtra', 'SUBMITTED', false, NULL, CURRENT_TIMESTAMP),
(3, 'Playground equipment broken', 'Swing set damaged and rusted. Children playing here are at risk of injury.', 'Infrastructure', 'LOW', 'http://img/6.jpg', NULL, 22.5726, 88.3639, 'Park Street, Kolkata, West Bengal', 'SUBMITTED', false, NULL, CURRENT_TIMESTAMP),
(4, 'Open manhole', 'Manhole cover missing on busy pedestrian road. Very dangerous especially at night.', 'Safety', 'CRITICAL', 'http://img/7.jpg', NULL, 28.6139, 77.2090, 'Connaught Place, New Delhi', 'SUBMITTED', false, NULL, CURRENT_TIMESTAMP),
(8, 'Factory emissions', 'Smoke from factory affecting area. Residents experiencing breathing problems.', 'Environment', 'HIGH', 'http://img/9.jpg', NULL, 21.1702, 72.8311, 'Surat, Gujarat', 'MATCHED', false, NULL, CURRENT_TIMESTAMP)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM problems);

INSERT INTO duplicate_links (problem_id, duplicate_of_problem_id, similarity_score, created_at)
SELECT * FROM (VALUES
(2, 1, 0.85, CURRENT_TIMESTAMP),
(1, 2, 0.85, CURRENT_TIMESTAMP)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM duplicate_links);

INSERT INTO teams (name, leader_id, member_ids, skill_tags, category_interests, capacity, current_problems, created_at)
SELECT * FROM (VALUES
('GreenBuilders', 6, ARRAY[6]::BIGINT[], ARRAY['construction','architecture'], ARRAY['Infrastructure','Environment'], 5, 1, CURRENT_TIMESTAMP),
('EduTech', 7, ARRAY[7]::BIGINT[], ARRAY['software','education'], ARRAY['Education','Technology'], 5, 1, CURRENT_TIMESTAMP),
('TransportFix', 13, ARRAY[13]::BIGINT[], ARRAY['mechanical','electrical'], ARRAY['Public Transport','Safety'], 5, 2, CURRENT_TIMESTAMP),
('HealthFirst', 9, ARRAY[9]::BIGINT[], ARRAY['healthcare','policy'], ARRAY['Health','Safety'], 5, 1, CURRENT_TIMESTAMP),
('CodeForGood', 7, ARRAY[7,1]::BIGINT[], ARRAY['software','design'], ARRAY['Education','Technology'], 8, 0, CURRENT_TIMESTAMP),
('BridgeMenders', 6, ARRAY[6,4]::BIGINT[], ARRAY['civil','mechanical'], ARRAY['Infrastructure'], 6, 1, CURRENT_TIMESTAMP),
('CleanWater', 5, ARRAY[5,3]::BIGINT[], ARRAY['biology','chemistry'], ARRAY['Environment','Health'], 5, 0, CURRENT_TIMESTAMP),
('SafeStreets', 10, ARRAY[10,3]::BIGINT[], ARRAY['planning','law'], ARRAY['Safety','Infrastructure'], 5, 1, CURRENT_TIMESTAMP)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM teams);

INSERT INTO fundings (problem_id, prototype_id, funder_id, funding_type, amount, status, created_at)
SELECT * FROM (VALUES
(1, NULL::BIGINT, 8, 'SPONSORSHIP', 5000.00, 'CONFIRMED', CURRENT_TIMESTAMP)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM fundings);