const { pool } = require('../config/database');

/**
 * Public Gallery Controller
 * Handles public gallery display, sharing, and interactions
 */

// Show public gallery page
exports.showPublicGallery = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    
    // Get filter parameters
    const { 
      type, 
      sort = 'recent', 
      search = '', 
      page = 1, 
      limit = 24,
      model,
      aspectRatio,
      minViews = 0,
      creatorType
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = `
      SELECT 
        psg.*,
        u.name as creator_name,
        u.avatar_url as creator_avatar,
        COALESCE(
          (SELECT COUNT(*) FROM public_gallery_interactions 
           WHERE shared_generation_id = psg.id AND interaction_type = 'like'),
          0
        ) as like_count,
        COALESCE(
          (SELECT COUNT(*) FROM public_gallery_interactions 
           WHERE shared_generation_id = psg.id AND interaction_type = 'bookmark'),
          0
        ) as bookmark_count
    `;
    
    // Add user's interaction status if logged in
    if (userId) {
      query += `,
        EXISTS(
          SELECT 1 FROM public_gallery_interactions 
          WHERE user_id = $${userId ? '1' : 'NULL'} 
          AND shared_generation_id = psg.id 
          AND interaction_type = 'like'
        ) as user_liked,
        EXISTS(
          SELECT 1 FROM public_gallery_interactions 
          WHERE user_id = $${userId ? '1' : 'NULL'} 
          AND shared_generation_id = psg.id 
          AND interaction_type = 'bookmark'
        ) as user_bookmarked
      `;
    }
    
    query += `
      FROM public_shared_generations psg
      LEFT JOIN users u ON psg.user_id = u.id
      WHERE psg.status = 'active'
    `;
    
    const params = [];
    let paramIndex = userId ? 2 : 1;
    
    // Add type filter
    if (type && ['image', 'video'].includes(type)) {
      query += ` AND psg.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    // Add search filter
    if (search) {
      query += ` AND (psg.prompt ILIKE $${paramIndex} OR psg.sub_type ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add model filter
    if (model) {
      query += ` AND psg.sub_type ILIKE $${paramIndex}`;
      params.push(`%${model}%`);
      paramIndex++;
    }
    
    // Add aspect ratio filter
    if (aspectRatio) {
      const [width, height] = aspectRatio.split(':').map(Number);
      if (width && height) {
        // Check if dimensions match aspect ratio (with some tolerance)
        query += ` AND (
          (psg.width IS NOT NULL AND psg.height IS NOT NULL) AND
          (ABS((psg.width::float / psg.height) - (${width}::float / ${height})) < 0.1)
        )`;
      }
    }
    
    // Add minimum views filter
    if (minViews && parseInt(minViews) > 0) {
      query += ` AND psg.views >= $${paramIndex}`;
      params.push(parseInt(minViews));
      paramIndex++;
    }
    
    // Add creator type filter
    if (creatorType === 'anonymous') {
      query += ` AND psg.is_anonymous = true`;
    } else if (creatorType === 'named') {
      query += ` AND psg.is_anonymous = false`;
    }
    
    // Add sorting
    switch (sort) {
      case 'popular':
        query += ` ORDER BY psg.likes DESC, psg.views DESC, psg.created_at DESC`;
        break;
      case 'trending':
        // Trending: most likes in last 7 days
        query += ` ORDER BY 
          CASE 
            WHEN psg.created_at > NOW() - INTERVAL '7 days' 
            THEN psg.likes * 2 
            ELSE psg.likes 
          END DESC, 
          psg.views DESC`;
        break;
      case 'mostViewed':
        query += ` ORDER BY psg.views DESC, psg.created_at DESC`;
        break;
      case 'mostLiked':
        query += ` ORDER BY psg.likes DESC, psg.created_at DESC`;
        break;
      case 'recent':
      default:
        query += ` ORDER BY psg.created_at DESC`;
    }
    
    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    // Execute query
    const queryParams = userId ? [userId, ...params] : params;
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM public_shared_generations psg
      WHERE psg.status = 'active'
    `;
    
    const countParams = [];
    let countParamIndex = 1;
    
    if (type && ['image', 'video'].includes(type)) {
      countQuery += ` AND psg.type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (psg.prompt ILIKE $${countParamIndex} OR psg.sub_type ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalItems = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalItems / limit);
    
    // Get recommendations for logged-in users
    let recommendations = [];
    if (userId) {
      recommendations = await getRecommendations(userId, 6);
    } else {
      // For guests, show trending
      recommendations = await getTrending(6);
    }
    
    // Get stats
    let stats = await getGalleryStats();
    
    // Ensure stats has default values if null
    if (!stats) {
      stats = {
        total: 0,
        images: 0,
        videos: 0,
        total_views: 0,
        total_likes: 0,
        total_creators: 0
      };
    }
    
    res.render('auth/public-gallery', {
      title: 'Public Gallery - PixelNest',
      user: req.user || null,
      generations: result.rows,
      recommendations,
      stats,
      filters: {
        type: type || 'all',
        sort,
        search,
        model: model || '',
        aspectRatio: aspectRatio || '',
        minViews: minViews || 0,
        creatorType: creatorType || ''
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        limit: parseInt(limit)
      },
      appVersion: process.env.APP_VERSION || Date.now()
    });
    
  } catch (error) {
    console.error('Error showing public gallery:', error);
    res.status(500).render('error', {
      message: 'Failed to load public gallery',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Share generation to public gallery
exports.shareToPublic = async (req, res) => {
  try {
    const userId = req.user.id;
    const { generationId, displayName, isAnonymous } = req.body;
    
    if (!generationId) {
      return res.status(400).json({
        success: false,
        message: 'Generation ID is required'
      });
    }
    
    // Check if generation exists and belongs to user
    const generationResult = await pool.query(
      `SELECT * FROM ai_generation_history 
       WHERE id = $1 AND user_id = $2`,
      [generationId, userId]
    );
    
    if (generationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Generation not found or access denied'
      });
    }
    
    const generation = generationResult.rows[0];
    
    // Parse metadata
    let metadata = {};
    try {
      metadata = generation.metadata ? JSON.parse(generation.metadata) : {};
    } catch (e) {
      console.error('Error parsing metadata:', e);
    }
    
    // Use INSERT ON CONFLICT for proper UPSERT
    let sharedId;
    let message;
    
    const upsertResult = await pool.query(
      `INSERT INTO public_shared_generations 
        (generation_id, user_id, display_name, is_anonymous, type, sub_type, 
         url, prompt, cost, width, height, duration, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
       ON CONFLICT (generation_id) 
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         is_anonymous = EXCLUDED.is_anonymous,
         status = 'active',
         updated_at = CURRENT_TIMESTAMP,
         url = EXCLUDED.url,
         prompt = EXCLUDED.prompt,
         cost = EXCLUDED.cost,
         width = EXCLUDED.width,
         height = EXCLUDED.height,
         duration = EXCLUDED.duration,
         type = EXCLUDED.type,
         sub_type = EXCLUDED.sub_type
       RETURNING id, (xmax = 0) AS was_inserted`,
      [
        generationId,
        userId,
        isAnonymous ? null : (displayName || req.user.name),
        isAnonymous,
        generation.generation_type || 'image',
        generation.sub_type,
        generation.result_url,
        generation.prompt,
        generation.cost_credits || generation.cost,
        metadata.width || null,
        metadata.height || null,
        metadata.duration || null
      ]
    );
    
    sharedId = upsertResult.rows[0].id;
    const wasInserted = upsertResult.rows[0].was_inserted;
    
    if (wasInserted) {
      message = 'Successfully shared to public gallery';
    } else {
      message = 'Share settings updated successfully';
    }
    
    res.json({
      success: true,
      message: message,
      sharedId: sharedId
    });
    
  } catch (error) {
    console.error('Error sharing to public:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share generation'
    });
  }
};

// Unshare from public gallery
exports.unshareFromPublic = async (req, res) => {
  try {
    const userId = req.user.id;
    const { generationId } = req.body;
    
    if (!generationId) {
      return res.status(400).json({
        success: false,
        message: 'Generation ID is required'
      });
    }
    
    // Delete from public gallery (only if owned by user)
    const result = await pool.query(
      `DELETE FROM public_shared_generations 
       WHERE generation_id = $1 AND user_id = $2
       RETURNING id`,
      [generationId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shared generation not found or access denied'
      });
    }
    
    res.json({
      success: true,
      message: 'Successfully removed from public gallery'
    });
    
  } catch (error) {
    console.error('Error unsharing from public:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from public gallery'
    });
  }
};

// Like a shared generation
exports.likeGeneration = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sharedId } = req.body;
    
    if (!sharedId) {
      return res.status(400).json({
        success: false,
        message: 'Shared ID is required'
      });
    }
    
    // Check if already liked
    const existing = await pool.query(
      `SELECT id FROM public_gallery_interactions 
       WHERE user_id = $1 AND shared_generation_id = $2 AND interaction_type = 'like'`,
      [userId, sharedId]
    );
    
    if (existing.rows.length > 0) {
      // Unlike
      await pool.query(
        `DELETE FROM public_gallery_interactions 
         WHERE user_id = $1 AND shared_generation_id = $2 AND interaction_type = 'like'`,
        [userId, sharedId]
      );
      
      // Decrement like count
      await pool.query(
        `UPDATE public_shared_generations 
         SET likes = GREATEST(0, likes - 1), updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [sharedId]
      );
      
      return res.json({
        success: true,
        action: 'unliked'
      });
    } else {
      // Like
      await pool.query(
        `INSERT INTO public_gallery_interactions (user_id, shared_generation_id, interaction_type)
         VALUES ($1, $2, 'like')
         ON CONFLICT DO NOTHING`,
        [userId, sharedId]
      );
      
      // Increment like count
      await pool.query(
        `UPDATE public_shared_generations 
         SET likes = likes + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [sharedId]
      );
      
      return res.json({
        success: true,
        action: 'liked'
      });
    }
    
  } catch (error) {
    console.error('Error liking generation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like generation'
    });
  }
};

// Bookmark a shared generation
exports.bookmarkGeneration = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sharedId } = req.body;
    
    if (!sharedId) {
      return res.status(400).json({
        success: false,
        message: 'Shared ID is required'
      });
    }
    
    // Check if already bookmarked
    const existing = await pool.query(
      `SELECT id FROM public_gallery_interactions 
       WHERE user_id = $1 AND shared_generation_id = $2 AND interaction_type = 'bookmark'`,
      [userId, sharedId]
    );
    
    if (existing.rows.length > 0) {
      // Remove bookmark
      await pool.query(
        `DELETE FROM public_gallery_interactions 
         WHERE user_id = $1 AND shared_generation_id = $2 AND interaction_type = 'bookmark'`,
        [userId, sharedId]
      );
      
      // Decrement bookmark count
      await pool.query(
        `UPDATE public_shared_generations 
         SET bookmarks = GREATEST(0, bookmarks - 1), updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [sharedId]
      );
      
      return res.json({
        success: true,
        action: 'unbookmarked'
      });
    } else {
      // Bookmark
      await pool.query(
        `INSERT INTO public_gallery_interactions (user_id, shared_generation_id, interaction_type)
         VALUES ($1, $2, 'bookmark')
         ON CONFLICT DO NOTHING`,
        [userId, sharedId]
      );
      
      // Increment bookmark count
      await pool.query(
        `UPDATE public_shared_generations 
         SET bookmarks = bookmarks + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [sharedId]
      );
      
      return res.json({
        success: true,
        action: 'bookmarked'
      });
    }
    
  } catch (error) {
    console.error('Error bookmarking generation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bookmark generation'
    });
  }
};

// Increment view count
exports.incrementView = async (req, res) => {
  try {
    const { sharedId } = req.body;
    
    if (!sharedId) {
      return res.status(400).json({
        success: false,
        message: 'Shared ID is required'
      });
    }
    
    await pool.query(
      `UPDATE public_shared_generations 
       SET views = views + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [sharedId]
    );
    
    res.json({
      success: true
    });
    
  } catch (error) {
    console.error('Error incrementing view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment view'
    });
  }
};

// Report inappropriate content
exports.reportGeneration = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { sharedId, reason, description } = req.body;
    
    if (!sharedId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Shared ID and reason are required'
      });
    }
    
    await pool.query(
      `INSERT INTO public_gallery_reports 
        (shared_generation_id, reporter_user_id, reason, description)
       VALUES ($1, $2, $3, $4)`,
      [sharedId, userId, reason, description || null]
    );
    
    res.json({
      success: true,
      message: 'Report submitted successfully'
    });
    
  } catch (error) {
    console.error('Error reporting generation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report'
    });
  }
};

// Helper: Get recommendations based on user's history
async function getRecommendations(userId, limit = 6) {
  try {
    // Get user's generation types and models
    const userHistory = await pool.query(
      `SELECT type, sub_type, COUNT(*) as count
       FROM ai_generation_history
       WHERE user_id = $1
       GROUP BY type, sub_type
       ORDER BY count DESC
       LIMIT 3`,
      [userId]
    );
    
    if (userHistory.rows.length === 0) {
      return getTrending(limit);
    }
    
    // Get similar generations
    const types = userHistory.rows.map(r => r.type);
    const subTypes = userHistory.rows.map(r => r.sub_type);
    
    const result = await pool.query(
      `SELECT psg.*, u.name as creator_name, u.avatar_url as creator_avatar
       FROM public_shared_generations psg
       LEFT JOIN users u ON psg.user_id = u.id
       WHERE psg.status = 'active'
       AND psg.user_id != $1
       AND (psg.type = ANY($2) OR psg.sub_type = ANY($3))
       ORDER BY psg.likes DESC, psg.views DESC, psg.created_at DESC
       LIMIT $4`,
      [userId, types, subTypes, limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

// Helper: Get trending generations
async function getTrending(limit = 6) {
  try {
    const result = await pool.query(
      `SELECT psg.*, u.name as creator_name, u.avatar_url as creator_avatar
       FROM public_shared_generations psg
       LEFT JOIN users u ON psg.user_id = u.id
       WHERE psg.status = 'active'
       AND psg.created_at > NOW() - INTERVAL '7 days'
       ORDER BY 
         (psg.likes * 2 + psg.views + psg.bookmarks * 3) DESC,
         psg.created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting trending:', error);
    return [];
  }
}

// Helper: Get gallery statistics
async function getGalleryStats() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type = 'image') as images,
        COUNT(*) FILTER (WHERE type = 'video') as videos,
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(likes), 0) as total_likes,
        COUNT(DISTINCT user_id) as total_creators
      FROM public_shared_generations
      WHERE status = 'active'
    `);
    
    const stats = result.rows[0];
    
    // Ensure all values are numbers, not null
    return {
      total: parseInt(stats.total) || 0,
      images: parseInt(stats.images) || 0,
      videos: parseInt(stats.videos) || 0,
      total_views: parseInt(stats.total_views) || 0,
      total_likes: parseInt(stats.total_likes) || 0,
      total_creators: parseInt(stats.total_creators) || 0
    };
  } catch (error) {
    console.error('Error getting gallery stats:', error);
    return {
      total: 0,
      images: 0,
      videos: 0,
      total_views: 0,
      total_likes: 0,
      total_creators: 0
    };
  }
}

// Check if generation is shared
exports.checkSharedStatus = async (req, res) => {
  try {
    const { generationId } = req.query;
    
    if (!generationId) {
      return res.status(400).json({
        success: false,
        message: 'Generation ID is required'
      });
    }
    
    const result = await pool.query(
      `SELECT id, is_anonymous, display_name 
       FROM public_shared_generations 
       WHERE generation_id = $1 AND status = 'active'`,
      [generationId]
    );
    
    res.json({
      success: true,
      isShared: result.rows.length > 0,
      sharedData: result.rows[0] || null
    });
    
  } catch (error) {
    console.error('Error checking shared status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check shared status'
    });
  }
};

