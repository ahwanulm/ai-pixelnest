const path = require('path');
const fs = require('fs').promises;

/**
 * Middleware to protect user media files
 * Ensures users can only access their own videos/images
 */

/**
 * Check if user can access a media file
 * Only allows access to files in their own folder
 */
async function secureMediaAccess(req, res, next) {
  try {
    // Get requested path (e.g., /videos/123/video-123456.mp4)
    const requestedPath = req.path;
    
    // Check if it's a protected media path
    const isVideoPath = requestedPath.startsWith('/videos/');
    const isImagePath = requestedPath.startsWith('/images/');
    
    if (!isVideoPath && !isImagePath) {
      // Not a protected path, continue normally
      return next();
    }
    
    // Extract user ID from path (e.g., /videos/123/... -> 123)
    const pathParts = requestedPath.split('/').filter(p => p);
    if (pathParts.length < 2) {
      return res.status(404).send('Not found');
    }
    
    const mediaType = pathParts[0]; // 'videos' or 'images'
    const fileOwnerId = parseInt(pathParts[1]);
    
    if (isNaN(fileOwnerId)) {
      return res.status(404).send('Not found');
    }
    
    // Check authentication
    if (!req.user || !req.user.id) {
      return res.status(401).send('Unauthorized - Please login');
    }
    
    const requesterId = req.user.id;
    
    // Allow access if:
    // 1. User is requesting their own file
    // 2. User is admin (can view all)
    const isOwner = requesterId === fileOwnerId;
    const isAdmin = req.user.role === 'admin';
    
    if (isOwner || isAdmin) {
      // User authorized, continue to serve file
      return next();
    } else {
      // Unauthorized access attempt
      console.warn(`🚫 Unauthorized media access attempt:`, {
        requester: requesterId,
        fileOwner: fileOwnerId,
        path: requestedPath
      });
      
      return res.status(403).send('Forbidden - You do not have permission to access this file');
    }
    
  } catch (error) {
    console.error('Error in secureMediaAccess middleware:', error);
    return res.status(500).send('Internal server error');
  }
}

/**
 * Serve media file with proper headers
 * Handles video streaming with range requests
 */
async function serveMediaFile(req, res, next) {
  try {
    const requestedPath = req.path;
    
    // Only handle video files
    if (!requestedPath.endsWith('.mp4') && !requestedPath.endsWith('.webm')) {
      return next();
    }
    
    const filePath = path.join(__dirname, '../../public', requestedPath);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).send('File not found');
    }
    
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Handle range request (video streaming)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const fileStream = require('fs').createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      
      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      // Full file request
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      
      res.writeHead(200, head);
      require('fs').createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error serving media file:', error);
    return res.status(500).send('Error serving file');
  }
}

module.exports = {
  secureMediaAccess,
  serveMediaFile
};

