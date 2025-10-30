const { pool } = require('./database');

/**
 * Migration for Public Gallery System
 * Creates table for shared generations that appear in public gallery
 */

async function migratePublicGallery() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating public_shared_generations table...');
    
    // Create public_shared_generations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public_shared_generations (
        id SERIAL PRIMARY KEY,
        generation_id INTEGER NOT NULL REFERENCES ai_generation_history(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        -- Display settings
        display_name VARCHAR(255), -- NULL for anonymous, or custom name
        is_anonymous BOOLEAN DEFAULT false,
        
        -- Generation data (denormalized for performance)
        type VARCHAR(50) NOT NULL, -- 'image' or 'video'
        sub_type VARCHAR(255), -- model type
        url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        cost DECIMAL(10, 2),
        
        -- Metadata
        width INTEGER,
        height INTEGER,
        duration DECIMAL(10, 2), -- for videos
        
        -- Engagement metrics
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        bookmarks INTEGER DEFAULT 0,
        
        -- Status
        status VARCHAR(50) DEFAULT 'active', -- active, hidden, reported, removed
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes
        UNIQUE(generation_id) -- One generation can only be shared once
      );
    `);
    
    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_public_shared_status 
      ON public_shared_generations(status);
      
      CREATE INDEX IF NOT EXISTS idx_public_shared_type 
      ON public_shared_generations(type);
      
      CREATE INDEX IF NOT EXISTS idx_public_shared_created 
      ON public_shared_generations(created_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_public_shared_views 
      ON public_shared_generations(views DESC);
      
      CREATE INDEX IF NOT EXISTS idx_public_shared_likes 
      ON public_shared_generations(likes DESC);
      
      CREATE INDEX IF NOT EXISTS idx_public_shared_user 
      ON public_shared_generations(user_id);
    `);
    
    // Create table for user interactions (likes, bookmarks)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public_gallery_interactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shared_generation_id INTEGER NOT NULL REFERENCES public_shared_generations(id) ON DELETE CASCADE,
        
        interaction_type VARCHAR(50) NOT NULL, -- 'like', 'bookmark', 'view'
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Unique constraint: one user can only like/bookmark once
        UNIQUE(user_id, shared_generation_id, interaction_type)
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gallery_interactions_user 
      ON public_gallery_interactions(user_id);
      
      CREATE INDEX IF NOT EXISTS idx_gallery_interactions_shared 
      ON public_gallery_interactions(shared_generation_id);
      
      CREATE INDEX IF NOT EXISTS idx_gallery_interactions_type 
      ON public_gallery_interactions(interaction_type);
    `);
    
    // Create table for reports/moderation
    await client.query(`
      CREATE TABLE IF NOT EXISTS public_gallery_reports (
        id SERIAL PRIMARY KEY,
        shared_generation_id INTEGER NOT NULL REFERENCES public_shared_generations(id) ON DELETE CASCADE,
        reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        
        reason VARCHAR(255) NOT NULL,
        description TEXT,
        
        status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
        
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMP,
        resolution_note TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gallery_reports_status 
      ON public_gallery_reports(status);
      
      CREATE INDEX IF NOT EXISTS idx_gallery_reports_shared 
      ON public_gallery_reports(shared_generation_id);
    `);
    
    await client.query('COMMIT');
    console.log('✅ Public gallery tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating public gallery tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if executed directly
if (require.main === module) {
  migratePublicGallery()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migratePublicGallery };

