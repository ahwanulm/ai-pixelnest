/**
 * ======================================
 * Worker Process Entry Point
 * ======================================
 * 
 * Jalankan file ini untuk start background worker
 * 
 * Usage:
 *   node worker.js --queue=pgboss     (default, recommended)
 *   node worker.js --queue=custom     (roll-your-own)
 * 
 * Or via npm:
 *   npm run worker
 *   npm run worker:custom
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const queueType = args.find(arg => arg.startsWith('--queue='))?.split('=')[1] || 'pgboss';

console.log('═══════════════════════════════════════════════');
console.log('🚀 PixelNest Background Worker');
console.log('═══════════════════════════════════════════════');
console.log(`📦 Queue Type: ${queueType}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🗄️  Database: ${process.env.DB_NAME}`);
console.log('═══════════════════════════════════════════════\n');

async function startWorker() {
  try {
    if (queueType === 'custom') {
      // Option 2: Custom Queue (Roll-your-own)
      console.log('📌 Using Custom Queue (FOR UPDATE SKIP LOCKED + LISTEN/NOTIFY)\n');
      
      const worker = require('./src/workers/customAIGenerationWorker');
      await worker.startWorker();
      
    } else {
      // Option 1: pg-boss (Recommended)
      console.log('📌 Using pg-boss Queue\n');
      
      const worker = require('./src/workers/aiGenerationWorker');
      await worker.startWorker();
    }
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start worker
startWorker();

