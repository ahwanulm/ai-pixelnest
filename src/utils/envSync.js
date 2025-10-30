const fs = require('fs');
const path = require('path');

/**
 * Utility for syncing API configurations between database and .env file
 * This ensures no mismatch between stored configs and environment variables
 */

const envPath = path.join(__dirname, '../../.env');

/**
 * Read current .env file as key-value pairs
 */
function readEnvFile() {
  try {
    if (!fs.existsSync(envPath)) {
      console.log('⚠️  .env file not found, will create one');
      return {};
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      // Skip empty lines and comments
      if (!line || line.trim().startsWith('#')) {
        return;
      }
      
      const [key, ...valueParts] = line.split('=');
      if (key) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error reading .env file:', error);
    return {};
  }
}

/**
 * Write key-value pairs back to .env file
 * Preserves comments and formatting
 */
function writeEnvFile(updates) {
  try {
    let envContent = '';
    
    // Read existing content if file exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add each key
    Object.keys(updates).forEach(key => {
      const value = updates[key] || '';
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (regex.test(envContent)) {
        // Update existing key
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add new key at the end
        if (envContent && !envContent.endsWith('\n')) {
          envContent += '\n';
        }
        envContent += `${key}=${value}\n`;
      }
    });
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env file updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error writing .env file:', error);
    return false;
  }
}

/**
 * Sync Google OAuth config to .env
 */
function syncGoogleOAuthToEnv(config) {
  const updates = {};
  
  if (config.api_key) {
    updates.GOOGLE_CLIENT_ID = config.api_key;
  }
  
  if (config.api_secret) {
    updates.GOOGLE_CLIENT_SECRET = config.api_secret;
  }
  
  if (config.endpoint_url) {
    updates.GOOGLE_CALLBACK_URL = config.endpoint_url;
  }
  
  return writeEnvFile(updates);
}

/**
 * Sync FAL AI config to .env
 */
function syncFalAIToEnv(config) {
  const updates = {};
  
  if (config.api_key) {
    updates.FAL_KEY = config.api_key;
  }
  
  return writeEnvFile(updates);
}

/**
 * Sync OpenAI config to .env
 */
function syncOpenAIToEnv(config) {
  const updates = {};
  
  if (config.api_key) {
    updates.OPENAI_API_KEY = config.api_key;
  }
  
  return writeEnvFile(updates);
}

/**
 * Sync Replicate config to .env
 */
function syncReplicateToEnv(config) {
  const updates = {};
  
  if (config.api_key) {
    updates.REPLICATE_API_TOKEN = config.api_key;
  }
  
  return writeEnvFile(updates);
}

/**
 * Main sync function - routes to appropriate sync handler
 */
function syncApiConfigToEnv(serviceName, config) {
  console.log(`🔄 Syncing ${serviceName} to .env file...`);
  
  try {
    let success = false;
    
    switch (serviceName) {
      case 'GOOGLE_OAUTH':
        success = syncGoogleOAuthToEnv(config);
        break;
      case 'FAL_AI':
        success = syncFalAIToEnv(config);
        break;
      case 'OPENAI':
        success = syncOpenAIToEnv(config);
        break;
      case 'REPLICATE':
        success = syncReplicateToEnv(config);
        break;
      default:
        console.log(`ℹ️  No .env sync configured for ${serviceName}`);
        return true; // Not an error, just not configured
    }
    
    if (success) {
      console.log(`✅ ${serviceName} synced to .env successfully`);
    } else {
      console.warn(`⚠️  Failed to sync ${serviceName} to .env`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Error syncing ${serviceName} to .env:`, error);
    return false;
  }
}

/**
 * Read API config from .env file
 */
function readApiConfigFromEnv(serviceName) {
  const envVars = readEnvFile();
  
  switch (serviceName) {
    case 'GOOGLE_OAUTH':
      return {
        api_key: envVars.GOOGLE_CLIENT_ID || '',
        api_secret: envVars.GOOGLE_CLIENT_SECRET || '',
        endpoint_url: envVars.GOOGLE_CALLBACK_URL || ''
      };
    case 'FAL_AI':
      return {
        api_key: envVars.FAL_KEY || ''
      };
    case 'OPENAI':
      return {
        api_key: envVars.OPENAI_API_KEY || ''
      };
    case 'REPLICATE':
      return {
        api_key: envVars.REPLICATE_API_TOKEN || ''
      };
    default:
      return null;
  }
}

/**
 * Check if .env and database are in sync
 */
function checkSyncStatus(serviceName, dbConfig) {
  const envConfig = readApiConfigFromEnv(serviceName);
  
  if (!envConfig) {
    return { inSync: true, message: 'No env sync configured' };
  }
  
  const issues = [];
  
  if (envConfig.api_key && dbConfig.api_key && envConfig.api_key !== dbConfig.api_key) {
    issues.push('API Key mismatch');
  }
  
  if (envConfig.api_secret && dbConfig.api_secret && envConfig.api_secret !== dbConfig.api_secret) {
    issues.push('API Secret mismatch');
  }
  
  if (envConfig.endpoint_url && dbConfig.endpoint_url && envConfig.endpoint_url !== dbConfig.endpoint_url) {
    issues.push('Endpoint URL mismatch');
  }
  
  return {
    inSync: issues.length === 0,
    issues: issues,
    message: issues.length > 0 ? issues.join(', ') : 'In sync'
  };
}

/**
 * Reload environment variables (requires process restart for full effect)
 */
function reloadEnv() {
  try {
    require('dotenv').config({ override: true });
    console.log('✅ Environment variables reloaded');
    return true;
  } catch (error) {
    console.error('❌ Error reloading environment:', error);
    return false;
  }
}

module.exports = {
  readEnvFile,
  writeEnvFile,
  syncApiConfigToEnv,
  readApiConfigFromEnv,
  checkSyncStatus,
  reloadEnv,
  syncGoogleOAuthToEnv,
  syncFalAIToEnv,
  syncOpenAIToEnv,
  syncReplicateToEnv
};

