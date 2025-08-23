-- Seed data for SiteGuard Pro

-- Insert admin user
INSERT INTO users (name, email, phone, password_hash, role, plan, status, email_verified) VALUES
('Admin User', 'admin@siteguard.com', '+1234567890', '$2b$10$hash_here', 'admin', 'enterprise', 'active', TRUE);

-- Insert sample users
INSERT INTO users (name, email, phone, password_hash, role, plan, status, email_verified) VALUES
('John Doe', 'john@example.com', '+1234567891', '$2b$10$hash_here', 'user', 'pro', 'active', TRUE),
('Jane Smith', 'jane@example.com', '+1234567892', '$2b$10$hash_here', 'user', 'free', 'active', TRUE),
('Bob Johnson', 'bob@example.com', '+1234567893', '$2b$10$hash_here', 'user', 'enterprise', 'suspended', TRUE),
('Alice Brown', 'alice@example.com', '+1234567894', '$2b$10$hash_here', 'user', 'free', 'pending', FALSE);

-- Insert sample websites
INSERT INTO websites (user_id, name, url, check_interval, timeout, status) VALUES
(2, 'My Portfolio', 'https://johndoe.com', 5, 10, 'active'),
(2, 'E-commerce Store', 'https://mystore.com', 1, 10, 'active'),
(2, 'Blog Website', 'https://myblog.com', 2, 10, 'active'),
(3, 'Company Website', 'https://janecompany.com', 5, 10, 'active'),
(3, 'Landing Page', 'https://landing.com', 10, 10, 'active'),
(4, 'Business Site', 'https://bobsbusiness.com', 5, 10, 'active');

-- Insert notification preferences for users
INSERT INTO notification_preferences (user_id, email_alerts, sms_alerts, push_notifications, weekly_reports, maintenance_updates) VALUES
(2, TRUE, TRUE, FALSE, TRUE, TRUE),
(3, TRUE, FALSE, TRUE, TRUE, FALSE),
(4, FALSE, TRUE, FALSE, FALSE, TRUE);

-- Insert sample monitor checks (last 24 hours)
INSERT INTO monitor_checks (website_id, status, response_time, status_code, checked_at) VALUES
-- Website 1 (My Portfolio) - mostly up
(1, 'up', 245, 200, NOW() - INTERVAL '5 minutes'),
(1, 'up', 230, 200, NOW() - INTERVAL '10 minutes'),
(1, 'up', 267, 200, NOW() - INTERVAL '15 minutes'),
(1, 'down', 0, 0, NOW() - INTERVAL '2 hours'),
(1, 'up', 189, 200, NOW() - INTERVAL '3 hours'),

-- Website 2 (E-commerce Store) - currently down
(2, 'down', 0, 500, NOW() - INTERVAL '1 minute'),
(2, 'down', 0, 500, NOW() - INTERVAL '2 minutes'),
(2, 'up', 456, 200, NOW() - INTERVAL '1 hour'),
(2, 'up', 423, 200, NOW() - INTERVAL '2 hours'),

-- Website 3 (Blog Website) - stable
(3, 'up', 180, 200, NOW() - INTERVAL '2 minutes'),
(3, 'up', 195, 200, NOW() - INTERVAL '4 minutes'),
(3, 'up', 167, 200, NOW() - INTERVAL '6 minutes'),
(3, 'up', 201, 200, NOW() - INTERVAL '8 minutes');

-- Insert sample uptime statistics
INSERT INTO uptime_stats (website_id, date, total_checks, successful_checks, average_response_time, uptime_percentage) VALUES
(1, CURRENT_DATE, 288, 285, 245, 99.0),
(1, CURRENT_DATE - INTERVAL '1 day', 288, 288, 230, 100.0),
(2, CURRENT_DATE, 1440, 1200, 420, 83.3),
(2, CURRENT_DATE - INTERVAL '1 day', 1440, 1440, 445, 100.0),
(3, CURRENT_DATE, 720, 720, 180, 100.0),
(3, CURRENT_DATE - INTERVAL '1 day', 720, 718, 175, 99.7);
