# Fix: Suno Callback Not Processing - Stuck at 50%

## Problem
Saat generate music dengan Suno:
- Web API Suno sudah selesai generate music
- Callback diterima di server
- Tapi di web progress stuck di 50% (status: processing)
- Music tidak muncul di hasil

## Root Cause
**Callback Type Mismatch**: Kode hanya memproses `callbackType === 'complete'` tapi Suno mengirim `callbackType === 'first'`

### Suno Callback Flow
```
1. User submit music generation
2. Suno mulai generate (2 tracks)
3. Suno sends callback 'first' → Track 1 ready ✅, Track 2 still processing
4. Server ignores 'first' callback ❌
5. Music stuck at "processing 50%"
```

### Log Evidence
```json
{
  "callbackType": "first",
  "data": [
    {
      "audio_url": "https://musicfile.api.box/...",  // Track 1 ready ✅
      "title": "Feel the Beat"
    },
    {
      "audio_url": "",  // Track 2 still processing ⏳
      "title": "Feel the Beat"
    }
  ]
}
```

## Solution
1. **Process both 'first' and 'complete' callbacks**
2. **Filter tracks that have audio_url** (skip tracks still processing)

### Changes Made

#### `/src/routes/music.js` ✅

**Before**:
```javascript
if (callbackType === 'complete' && Array.isArray(tracks)) {
  // Process tracks
}
```

**After**:
```javascript
// ✅ Process both 'first' and 'complete' callbacks
if ((callbackType === 'first' || callbackType === 'complete') && Array.isArray(tracks) && tracks.length > 0) {
  
  // ✅ Filter tracks that have audio_url (some may still be processing)
  const readyTracks = tracks.filter(t => t.audio_url && t.audio_url.trim());
  
  if (readyTracks.length === 0) {
    console.log('⏳ No tracks ready yet, waiting for next callback');
    return;
  }
  
  // Process ready tracks
  for (let i = 0; i < readyTracks.length; i++) {
    const track = readyTracks[i];
    // Update database with track...
  }
}
```

## Suno Callback Types

### 1. `first` Callback
- Sent when **first track** is ready
- May contain:
  - Track 1: `audio_url` ✅ (ready)
  - Track 2: `audio_url = ""` ⏳ (still processing)
- **Now handled**: Process track 1 immediately

### 2. `complete` Callback
- Sent when **all tracks** are ready
- Contains:
  - Track 1: `audio_url` ✅
  - Track 2: `audio_url` ✅
- **Now handled**: Process both tracks

## Result
- ✅ **First track** appears immediately when ready
- ✅ **Second track** appears when complete callback arrives
- ✅ **No more stuck at 50%**
- ✅ **Better user experience** - results appear faster

## Testing
1. Generate music with Suno
2. Watch for callback logs:
   ```
   📦 Processing callback:
      Type: first
      Task ID: xxx
      Tracks: 2
      ✅ 1 track(s) ready with audio_url
      ✅ Updated original generation
   ```
3. Track 1 should appear in UI immediately
4. Track 2 appears when fully processed

## Edge Cases Handled
- ✅ Empty `audio_url` → Skip track (wait for next callback)
- ✅ Multiple tracks → Process all ready tracks
- ✅ No ready tracks → Wait for next callback
- ✅ Database not found → Log error gracefully

## Database Column Fix

**Additional Error**: `column "model_id" does not exist`

The database uses `model_used` instead of `model_id` and `model_name`. Fixed all queries:

```javascript
// Before
SELECT id, user_id, prompt, model_id, model_name, ...
INSERT INTO ... (user_id, model_id, model_name, ...)

// After  
SELECT id, user_id, prompt, model_used, ...
INSERT INTO ... (user_id, model_used, ...)
```

## Files Modified
- `/src/routes/music.js` 
  - Process 'first' and 'complete' callbacks
  - Filter ready tracks (only process tracks with audio_url)
  - Fix database column names (model_id → model_used)
