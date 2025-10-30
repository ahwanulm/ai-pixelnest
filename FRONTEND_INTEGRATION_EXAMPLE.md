# 🎨 Frontend Integration Examples

Panduan lengkap integrasi queue system di frontend.

---

## 📦 Setup

### 1. Include Queue Client

```html
<!-- In your layout/base template -->
<script src="/js/queueClient.js"></script>
```

### 2. Initialize Client

```javascript
// Initialize once on page load
const queueClient = new QueueClient({
  pollingInterval: 2000,  // Poll every 2 seconds (fallback)
  useSSE: true            // Use Server-Sent Events (recommended)
});
```

---

## 🚀 Example 1: Simple Generation

```html
<button id="generateBtn">Generate Image</button>
<div id="status"></div>
<div id="result"></div>

<script>
document.getElementById('generateBtn').addEventListener('click', async () => {
  const prompt = "A beautiful sunset over mountains";
  
  try {
    const jobId = await queueClient.generateWithQueue(
      prompt,
      'text-to-image',
      'image',
      { modelId: 1, width: 1024, height: 1024 },
      {
        onStart: (jobId) => {
          console.log('Job started:', jobId);
          document.getElementById('status').innerHTML = 
            `<p>⏳ Generating... (Job: ${jobId})</p>`;
        },
        
        onUpdate: (job) => {
          console.log('Progress:', job.progress);
          document.getElementById('status').innerHTML = 
            `<p>⏳ Generating... ${job.progress}%</p>`;
        },
        
        onComplete: (job) => {
          console.log('Completed!', job);
          document.getElementById('status').innerHTML = 
            `<p>✅ Complete!</p>`;
          document.getElementById('result').innerHTML = 
            `<img src="${job.resultUrl}" alt="Generated image">`;
        },
        
        onError: (data) => {
          console.error('Failed:', data.error);
          document.getElementById('status').innerHTML = 
            `<p>❌ Error: ${data.error}</p>`;
        }
      }
    );
    
  } catch (error) {
    alert('Failed to start generation: ' + error.message);
  }
});
</script>
```

---

## 🔄 Example 2: Resume Active Jobs on Page Load

```html
<div id="activeJobs"></div>

<script>
// On page load, check for active jobs
window.addEventListener('DOMContentLoaded', async () => {
  const activeJobs = await queueClient.resumeActiveJobs({
    onUpdate: (job) => {
      updateJobCard(job.jobId, job.progress);
    },
    
    onComplete: (job) => {
      showCompletedJob(job);
    },
    
    onError: (data) => {
      showErrorJob(data.jobId, data.error);
    }
  });
  
  // Display active jobs
  if (activeJobs.length > 0) {
    activeJobs.forEach(job => {
      showLoadingCard(job);
    });
  }
});

function showLoadingCard(job) {
  const html = `
    <div class="job-card" data-job-id="${job.jobId}">
      <p>⏳ ${job.prompt.substring(0, 50)}...</p>
      <div class="progress-bar">
        <div class="progress" style="width: ${job.progress}%"></div>
      </div>
      <p>Status: ${job.status}</p>
    </div>
  `;
  document.getElementById('activeJobs').insertAdjacentHTML('beforeend', html);
}

function updateJobCard(jobId, progress) {
  const card = document.querySelector(`[data-job-id="${jobId}"]`);
  if (card) {
    const progressBar = card.querySelector('.progress');
    progressBar.style.width = progress + '%';
  }
}

function showCompletedJob(job) {
  const card = document.querySelector(`[data-job-id="${job.jobId}"]`);
  if (card) {
    card.innerHTML = `
      <div class="completed">
        <p>✅ Generation complete!</p>
        <img src="${job.resultUrl}" alt="Result">
        <a href="${job.resultUrl}" download>Download</a>
      </div>
    `;
  }
}

function showErrorJob(jobId, error) {
  const card = document.querySelector(`[data-job-id="${jobId}"]`);
  if (card) {
    card.innerHTML = `
      <div class="error">
        <p>❌ Generation failed</p>
        <p>${error}</p>
      </div>
    `;
  }
}
</script>
```

---

## 🎭 Example 3: Multiple Concurrent Generations

```html
<button id="generateMultiple">Generate 3 Images</button>
<div id="results"></div>

<script>
document.getElementById('generateMultiple').addEventListener('click', async () => {
  const prompts = [
    "A beautiful sunset",
    "A mountain landscape",
    "A city skyline"
  ];
  
  // Create all jobs
  const jobIds = await Promise.all(
    prompts.map(prompt => 
      queueClient.createJob(prompt, 'text-to-image', 'image', { modelId: 1 })
    )
  );
  
  console.log('Created jobs:', jobIds);
  
  // SSE will notify when each completes
  queueClient.connectSSE(
    null, // onUpdate
    (job) => {
      // onComplete
      document.getElementById('results').insertAdjacentHTML('beforeend', `
        <div>
          <h3>${job.prompt}</h3>
          <img src="${job.resultUrl}" alt="${job.prompt}">
        </div>
      `);
    },
    (data) => {
      // onError
      console.error('Job failed:', data);
    }
  );
});
</script>
```

---

## ❌ Example 4: Cancel Job

```html
<button id="generateBtn">Generate</button>
<button id="cancelBtn" style="display:none;">Cancel</button>
<div id="status"></div>

<script>
let currentJobId = null;

document.getElementById('generateBtn').addEventListener('click', async () => {
  const jobId = await queueClient.createJob(
    "A beautiful landscape",
    'text-to-image',
    'image',
    { modelId: 1 }
  );
  
  currentJobId = jobId;
  
  // Show cancel button
  document.getElementById('cancelBtn').style.display = 'block';
  
  // Track progress
  queueClient.pollJobStatus(
    jobId,
    (job) => {
      document.getElementById('status').textContent = 
        `Progress: ${job.progress}%`;
    },
    (job) => {
      document.getElementById('status').textContent = 'Complete!';
      document.getElementById('cancelBtn').style.display = 'none';
    },
    (data) => {
      document.getElementById('status').textContent = 
        `Error: ${data.error}`;
      document.getElementById('cancelBtn').style.display = 'none';
    }
  );
});

document.getElementById('cancelBtn').addEventListener('click', async () => {
  if (currentJobId) {
    await queueClient.cancelJob(currentJobId);
    document.getElementById('status').textContent = 'Cancelled';
    document.getElementById('cancelBtn').style.display = 'none';
  }
});
</script>
```

---

## 🔔 Example 5: Browser Notifications

```javascript
// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Generate with notifications
queueClient.generateWithQueue(
  prompt,
  type,
  mode,
  settings,
  {
    onComplete: (job) => {
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('Generation Complete!', {
          body: 'Your AI generation is ready',
          icon: job.resultUrl,
          tag: job.jobId
        });
      }
      
      // Play sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.play();
    }
  }
);
```

---

## 📱 Example 6: Mobile-Friendly with Service Worker

```javascript
// Register service worker for background notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// In sw.js (Service Worker)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  self.registration.showNotification('Generation Complete!', {
    body: data.message,
    icon: data.icon,
    badge: '/icon-badge.png',
    tag: data.jobId,
    data: {
      url: data.url
    }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

---

## 🎨 Example 7: Full Integration with UI Components

```html
<!-- In your dashboard -->
<div class="generation-container">
  <!-- Input Form -->
  <div class="input-section">
    <textarea id="promptInput" placeholder="Enter your prompt..."></textarea>
    <select id="modelSelect">
      <option value="1">FLUX.1 Pro</option>
      <option value="2">Stable Diffusion XL</option>
    </select>
    <button id="runBtn" class="btn-primary">Run Generation</button>
  </div>
  
  <!-- Active Jobs -->
  <div class="active-jobs" id="activeJobs"></div>
  
  <!-- Results -->
  <div class="results" id="results"></div>
</div>

<script>
// Initialize queue client
const queueClient = new QueueClient({ useSSE: true });

// Resume active jobs on page load
window.addEventListener('DOMContentLoaded', async () => {
  const activeJobs = await queueClient.resumeActiveJobs({
    onUpdate: updateJobProgress,
    onComplete: showResult,
    onError: showError
  });
  
  // Display active jobs
  activeJobs.forEach(job => {
    showLoadingCard(job);
  });
});

// Run generation
document.getElementById('runBtn').addEventListener('click', async () => {
  const prompt = document.getElementById('promptInput').value;
  const modelId = document.getElementById('modelSelect').value;
  
  if (!prompt.trim()) {
    alert('Please enter a prompt');
    return;
  }
  
  try {
    const jobId = await queueClient.generateWithQueue(
      prompt,
      'text-to-image',
      'image',
      { modelId, width: 1024, height: 1024 },
      {
        onStart: (jobId) => {
          showLoadingCard({
            jobId,
            prompt,
            status: 'pending',
            progress: 0
          });
        },
        onUpdate: updateJobProgress,
        onComplete: showResult,
        onError: showError
      }
    );
    
    // Clear input
    document.getElementById('promptInput').value = '';
    
  } catch (error) {
    alert('Failed to start generation: ' + error.message);
  }
});

// UI helper functions
function showLoadingCard(job) {
  const html = `
    <div class="loading-card" data-job-id="${job.jobId}">
      <div class="card-header">
        <h4>⏳ Generating...</h4>
        <button class="cancel-btn" onclick="cancelJob('${job.jobId}')">×</button>
      </div>
      <p class="prompt">${job.prompt}</p>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${job.progress}%"></div>
        </div>
        <span class="progress-text">${job.progress}%</span>
      </div>
      <p class="status">${job.status}</p>
      <div class="loading-animation">
        <div class="spinner"></div>
      </div>
    </div>
  `;
  
  document.getElementById('activeJobs').insertAdjacentHTML('beforeend', html);
}

function updateJobProgress(job) {
  const card = document.querySelector(`[data-job-id="${job.jobId}"]`);
  if (card) {
    const progressFill = card.querySelector('.progress-fill');
    const progressText = card.querySelector('.progress-text');
    const statusText = card.querySelector('.status');
    
    progressFill.style.width = job.progress + '%';
    progressText.textContent = job.progress + '%';
    statusText.textContent = job.status;
  }
}

function showResult(job) {
  const card = document.querySelector(`[data-job-id="${job.jobId}"]`);
  
  if (card) {
    // Remove from active jobs
    card.remove();
  }
  
  // Add to results
  const html = `
    <div class="result-card" data-job-id="${job.jobId}">
      <div class="card-header">
        <h4>✅ Complete</h4>
        <div class="actions">
          <button onclick="downloadResult('${job.resultUrl}')">⬇️</button>
          <button onclick="deleteResult('${job.jobId}')">🗑️</button>
        </div>
      </div>
      <img src="${job.resultUrl}" alt="${job.prompt}">
      <p class="prompt">${job.prompt}</p>
      <p class="meta">Credits: ${job.creditsCost}</p>
    </div>
  `;
  
  document.getElementById('results').insertAdjacentHTML('afterbegin', html);
  
  // Show notification
  if (Notification.permission === 'granted') {
    new Notification('Generation Complete!', {
      body: job.prompt.substring(0, 50) + '...',
      icon: job.resultUrl
    });
  }
}

function showError(data) {
  const card = document.querySelector(`[data-job-id="${data.jobId}"]`);
  
  if (card) {
    card.innerHTML = `
      <div class="error-card">
        <h4>❌ Generation Failed</h4>
        <p class="error-message">${data.error}</p>
        <button onclick="retryJob('${data.jobId}')">Retry</button>
      </div>
    `;
  }
}

async function cancelJob(jobId) {
  if (confirm('Cancel this generation?')) {
    await queueClient.cancelJob(jobId);
    const card = document.querySelector(`[data-job-id="${jobId}"]`);
    if (card) {
      card.remove();
    }
  }
}

function downloadResult(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = url.split('/').pop();
  a.click();
}

async function deleteResult(jobId) {
  if (confirm('Delete this result?')) {
    // Call delete API
    await fetch(`/api/generation/${jobId}`, { method: 'DELETE' });
    
    const card = document.querySelector(`[data-job-id="${jobId}"]`);
    if (card) {
      card.remove();
    }
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  queueClient.cleanup();
});
</script>

<style>
.loading-card, .result-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

---

## 🧹 Cleanup & Best Practices

### Always cleanup on page unload

```javascript
window.addEventListener('beforeunload', () => {
  queueClient.cleanup();
});
```

### Handle network errors

```javascript
queueClient.connectSSE(
  null,
  onComplete,
  (data) => {
    // Fallback to polling on SSE error
    if (!data.jobId) {
      console.warn('SSE failed, using polling');
      queueClient.disconnectSSE();
      queueClient.useSSE = false;
      queueClient.resumeActiveJobs(callbacks);
    }
  }
);
```

### Limit concurrent generations

```javascript
const MAX_CONCURRENT = 3;
let activeCount = 0;

async function generate() {
  if (activeCount >= MAX_CONCURRENT) {
    alert(`Maximum ${MAX_CONCURRENT} concurrent generations`);
    return;
  }
  
  activeCount++;
  
  await queueClient.generateWithQueue(/*...*/, {
    onComplete: () => {
      activeCount--;
    },
    onError: () => {
      activeCount--;
    }
  });
}
```

---

## 📚 More Examples

Check out:
- `QUEUE_WORKER_GUIDE.md` - Complete backend guide
- `QUEUE_QUICKSTART.md` - Quick setup
- `QUEUE_COMPARISON.md` - Choose the right option

Happy coding! 🚀

