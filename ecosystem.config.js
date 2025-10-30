/**
 * ======================================
 * PM2 Configuration for Production
 * ======================================
 * 
 * Deploy dengan PM2:
 *   pm2 start ecosystem.config.js
 * 
 * Monitor:
 *   pm2 status
 *   pm2 logs
 *   pm2 monit
 */

module.exports = {
  apps: [
    // ==========================================
    // API Server (Web)
    // ==========================================
    {
      name: 'pixelnest-api',
      script: 'server.js',
      
      // Cluster mode untuk load balancing
      instances: 2,
      exec_mode: 'cluster',
      
      // Auto-restart settings
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 5005
      },
      
      // Logs
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Restart delay
      restart_delay: 4000,
    },
    
    // ==========================================
    // Worker (Background Jobs) - pg-boss
    // ==========================================
    {
      name: 'pixelnest-worker',
      script: 'worker.js',
      args: '--queue=pgboss',
      
      // Fork mode (tidak perlu cluster untuk worker)
      instances: 'max', // ✨ 1 instance with teamSize=3 in worker config
      exec_mode: 'cluster',
      
      // Auto-restart settings
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      
      // Environment
      env: {
        NODE_ENV: 'production'
      },
      
      // Logs
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Graceful shutdown
      kill_timeout: 30000, // 30s untuk finish current jobs
      
      // Restart delay
      restart_delay: 5000,
      
      // Cron restart (optional: restart setiap hari jam 3 pagi)
      cron_restart: '0 3 * * *',
    },
    
    // ==========================================
    // Worker (Custom Queue) - Optional
    // ==========================================
    // Uncomment jika pakai custom queue
    // {
    //   name: 'pixelnest-worker-custom',
    //   script: 'worker.js',
    //   args: '--queue=custom',
    //   instances: 2,
    //   exec_mode: 'fork',
    //   autorestart: true,
    //   max_memory_restart: '2G',
    //   env: {
    //     NODE_ENV: 'production'
    //   },
    //   error_file: './logs/worker-custom-error.log',
    //   out_file: './logs/worker-custom-out.log',
    //   kill_timeout: 30000,
    // },
  ],
  
  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/pixelnest.git',
      path: '/var/www/pixelnest',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};

