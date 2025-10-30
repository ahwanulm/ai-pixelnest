const { pool } = require('./database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating database tables...');

    // Create contacts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        features JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create testimonials table
    await client.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        company VARCHAR(255),
        testimonial TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        avatar_url VARCHAR(500),
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create blog_posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(500) UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        author VARCHAR(255),
        category VARCHAR(100),
        tags VARCHAR(500),
        image_url VARCHAR(500),
        is_published BOOLEAN DEFAULT false,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create pricing_plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        billing_period VARCHAR(50) DEFAULT 'monthly',
        features JSONB,
        is_popular BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create newsletter_subscribers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert sample data for services
    await client.query(`
      INSERT INTO services (title, slug, description, icon, features) VALUES
      ('Workflow Automation', 'workflow-automation', 'Automate complex business processes to boost speed, clarity, and efficiency.', '🔄', '["Multi-step automation", "Cross-platform integration", "Smart scheduling"]'),
      ('Custom AI Solutions', 'custom-ai-solutions', 'Build tailored AI systems that align with your business goals and challenges.', '🤖', '["Custom AI models", "Business-specific logic", "Scalable architecture"]'),
      ('AI Assistant', 'ai-assistant', 'Deploy intelligent virtual agents to streamline tasks.', '💬', '["24/7 availability", "Natural language processing", "Task automation"]'),
      ('Sales & Marketing', 'sales-marketing', 'Leverage AI to optimize campaigns, track leads, and personalize outreach.', '📊', '["Lead tracking", "Campaign optimization", "Personalization"]')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Insert sample pricing plans
    await client.query(`
      INSERT INTO pricing_plans (name, price, billing_period, features, is_popular, display_order) VALUES
      ('Starter', 50.00, 'monthly', '["3 Automated Workflows", "Basic AI Assistant Access", "Email + Slack Integration", "Monthly Performance Reports", "Email Support"]', false, 1),
      ('Pro', 90.00, 'monthly', '["10+ Automated Workflows", "Advanced AI Assistant Features", "Bi-Weekly Strategy Reviews", "CRM + Marketing Tool Integrations", "Priority Support"]', true, 2),
      ('Enterprise', 0.00, 'custom', '["Unlimited Custom Workflows", "Dedicated AI Strategist", "API & Private Integrations", "Real-Time Performance Dashboards", "24/7 Premium Support + SLA"]', false, 3)
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample testimonials
    await client.query(`
      INSERT INTO testimonials (name, position, company, testimonial, rating, is_featured) VALUES
      ('Daniel Kim', 'Operations Lead', 'Flowbyte', 'Truly impressive. The AI assistant is fast, accurate, and blends into our daily ops without friction.', 5, true),
      ('Priya Mehra', 'CTO', 'Brightstack Labs', 'Game-changer. Automation flows run flawlessly. Our team now focuses only on what really matters.', 5, true),
      ('Elena Rodriguez', 'Product Manager', 'Nexora', 'Smooth setup. Their system replaced three tools. We saw improvements in just the first week.', 5, true),
      ('Ravi Shah', 'COO', 'PixelNest Solutions', 'Very intuitive. No fluff, just performance. Our internal processes finally feel under control.', 5, true)
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Database tables created successfully!');
    console.log('✅ Sample data inserted!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run the database initialization
createTables()
  .then(() => {
    console.log('🎉 Database initialization completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database initialization failed:', error);
    process.exit(1);
  });

