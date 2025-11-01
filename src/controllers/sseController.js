/**
 * ======================================
 * Server-Sent Events (SSE) Controller
 * ======================================
 * 
 * Real-time updates untuk job progress tanpa polling
 * 
 * Usage (Frontend):
 * ```javascript
 * const eventSource = new EventSource('/api/sse/generation-updates');
 * 
 * eventSource.addEventListener('job-update', (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Job update:', data);
 * });
 * 
 * eventSource.addEventListener('job-completed', (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Job completed:', data);
 * });
 * ```
 */

const { pool } = require('../config/database');
const queueManager = require('../queue/pgBossQueue');

// Store active SSE connections
const connections = new Map();

const sseController = {
  /**
   * SSE endpoint for generation updates
   */
  async generationUpdates(req, res) {
    const userId = req.user.id;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

    console.log(`📡 SSE connected: User ${userId}`);

    // Store connection
    if (!connections.has(userId)) {
      connections.set(userId, []);
    }
    connections.get(userId).push(res);

    // Keep-alive ping every 30 seconds
    const keepAliveInterval = setInterval(() => {
      res.write(`: keep-alive\n\n`);
    }, 30000);

    // Subscribe to job completion events
    const completionHandler = async (job) => {
      const { userId: jobUserId, jobId, generationId, resultUrl, type } = job.data;

      // Only send to the user who owns the job
      if (jobUserId === userId) {
        sendSSE(res, 'job-completed', {
          jobId,
          generationId, // ✅ Include database ID for frontend matching
          resultUrl,
          type,
          timestamp: new Date().toISOString()
        });
      }
    };

    const failureHandler = async (job) => {
      const { userId: jobUserId, jobId, generationId, error } = job.data;

      if (jobUserId === userId) {
        sendSSE(res, 'job-failed', {
          jobId,
          generationId, // ✅ Include database ID for frontend matching
          error,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Subscribe to events (pg-boss pub/sub)
    queueManager.subscribe('generation.completed', completionHandler);
    queueManager.subscribe('generation.failed', failureHandler);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      
      // Remove connection
      const userConnections = connections.get(userId);
      if (userConnections) {
        const index = userConnections.indexOf(res);
        if (index > -1) {
          userConnections.splice(index, 1);
        }
        if (userConnections.length === 0) {
          connections.delete(userId);
        }
      }

      console.log(`📡 SSE disconnected: User ${userId}`);
    });
  },

  /**
   * Alternative: Postgres LISTEN/NOTIFY for real-time updates
   * (More efficient for large scale)
   */
  async generationUpdatesWithNotify(req, res) {
    const userId = req.user.id;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

    console.log(`📡 SSE connected (NOTIFY): User ${userId}`);

    // Create separate connection for LISTEN
    const client = await pool.connect();

    try {
      // Listen to user-specific channel
      await client.query(`LISTEN generation_updates_${userId}`);

      // Handle notifications
      client.on('notification', (msg) => {
        if (msg.channel === `generation_updates_${userId}`) {
          const payload = JSON.parse(msg.payload);
          
          sendSSE(res, payload.event, payload.data);
        }
      });

      // Keep-alive ping
      const keepAliveInterval = setInterval(() => {
        res.write(`: keep-alive\n\n`);
      }, 30000);

      // Cleanup on disconnect
      req.on('close', () => {
        clearInterval(keepAliveInterval);
        client.query(`UNLISTEN generation_updates_${userId}`);
        client.release();
        console.log(`📡 SSE disconnected (NOTIFY): User ${userId}`);
      });

    } catch (error) {
      console.error('SSE error:', error);
      client.release();
      res.end();
    }
  }
};

/**
 * Helper: Send SSE message
 */
function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Helper: Broadcast to specific user
 */
function broadcastToUser(userId, event, data) {
  const userConnections = connections.get(userId);
  
  if (userConnections && userConnections.length > 0) {
    userConnections.forEach(res => {
      sendSSE(res, event, data);
    });
  }
}

/**
 * Trigger notification via Postgres NOTIFY
 * (Call this from worker after job completion)
 */
async function notifyUser(userId, event, data) {
  try {
    const payload = JSON.stringify({ event, data });
    await pool.query(
      `NOTIFY generation_updates_${userId}, $1`,
      [payload]
    );
  } catch (error) {
    console.error('Failed to send NOTIFY:', error);
  }
}

module.exports = sseController;
module.exports.broadcastToUser = broadcastToUser;
module.exports.notifyUser = notifyUser;

