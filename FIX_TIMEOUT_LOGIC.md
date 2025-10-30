# Fix Timeout Logic - Smart Timeouts by Generation Type

## Problem
The system was using an aggressive 2-minute timeout for ALL generation types, causing issues with:
- 3D generation models that need 5-10+ minutes
- Video generation that needs 4-8+ minutes
- Audio generation with varying requirements
- Excessive retries on timeout errors

## Solution
Implemented smart timeout logic that differentiates by generation type and improves retry behavior.

## Changes Made

### 1. Smart Timeout in `falAiService.js`

```javascript
// ✨ Smart timeout based on generation type (not too aggressive)
let timeoutMs;
if (model.includes('3d') || model.includes('seed3d')) {
  timeoutMs = 600000; // 10 minutes for 3D generation
  console.log(`⏱️  3D Model timeout: ${timeoutMs/1000}s`);
} else if (model.includes('video') || model.includes('veo') || model.includes('kling')) {
  timeoutMs = 480000; // 8 minutes for video generation
  console.log(`⏱️  Video Model timeout: ${timeoutMs/1000}s`);
} else if (model.includes('sora')) {
  timeoutMs = 600000; // 10 minutes for Sora (very complex)
  console.log(`⏱️  Sora Model timeout: ${timeoutMs/1000}s`);
} else {
  timeoutMs = 180000; // 3 minutes for image generation
  console.log(`⏱️  Image Model timeout: ${timeoutMs/1000}s`);
}
```

### 2. Smart Retry Logic in `aiGenerationWorker.js`

Updated `isPermanentFailure()` function to not retry long timeouts:

```javascript
// 9. Timeout Errors - Don't retry aggressive timeouts
if (errorMessage.includes('timeout') ||
    errorMessage.includes('tidak merespons')) {
  // For 3D models with long timeouts (10+ minutes), timeout means permanent issue
  if (errorMessage.includes('600 detik') || errorMessage.includes('600s') ||
      errorMessage.includes('10 minutes')) {
    console.log('   🔴 Type: Long Timeout (permanent - 3D model issue)');
    return true; // Don't retry
  }
  // For video models with 8+ minute timeouts, also permanent
  if (errorMessage.includes('480 detik') || errorMessage.includes('480s') ||
      errorMessage.includes('8 minutes')) {
    console.log('   🔴 Type: Long Timeout (permanent - video model issue)');
    return true; // Don't retry
  }
  // Regular timeouts (3 minutes) can be retried
  console.log('   🟡 Type: Short Timeout (transient - may retry)');
  return false; // Allow retry
}
```

## Timeout Durations by Type

| Generation Type | Timeout | Retry on Timeout |
|-----------------|---------|------------------|
| Image Generation | 3 minutes | Yes (transient) |
| Video Generation | 8 minutes | No (permanent) |
| 3D Generation | 10 minutes | No (permanent) |
| Sora Models | 10 minutes | No (permanent) |
| Audio (Suno) | No timeout (callback-based) | N/A |

## Benefits

1. **3D Models**: Now have 10 minutes instead of 2 minutes, allowing complex 3D generation to complete
2. **Video Models**: 8 minutes for proper video generation workflows
3. **Reduced Retries**: Long timeouts are treated as permanent failures, preventing wasted retry attempts
4. **Better User Experience**: Jobs fail faster when there's a real issue, rather than timing out repeatedly
5. **Resource Efficiency**: Less server load from unnecessary retries on models that are genuinely slow/down

## Testing

To test the new timeout behavior:

1. Try generating a 3D model (should timeout after 10 minutes, not retry)
2. Try generating a video (should timeout after 8 minutes, not retry)
3. Try generating an image (should timeout after 3 minutes, can retry)
4. Check logs for appropriate timeout messages and retry behavior

## Monitoring

Monitor logs for:
- `⏱️  3D Model timeout: 600s` - 3D models using 10-minute timeout
- `⏱️  Video Model timeout: 480s` - Video models using 8-minute timeout
- `🔴 Type: Long Timeout (permanent - 3D model issue)` - 3D timeouts not retried
- `🟡 Type: Short Timeout (transient - may retry)` - Image timeouts can retry
