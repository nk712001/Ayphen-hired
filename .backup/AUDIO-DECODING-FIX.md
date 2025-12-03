# Audio Decoding Fix - WebM/Opus Support

## Issue Identified

The transcription was completely wrong:
- **Reference**: "Believe you can and you are halfway to achieving your goals"
- **Transcribed**: "看到 See ya" (Chinese characters + English)
- **Accuracy**: 7%

This indicates the audio decoding is failing - the WebM/Opus audio from the browser is not being properly decoded by the backend.

## Root Cause

The old `_decode_audio` method tried:
1. WebM library (may not be installed or working)
2. Raw format decoding (doesn't work with WebM container)

WebM is a container format with Opus codec - it requires proper decoding libraries.

## Solution Implemented

Replaced `_decode_audio` with librosa-based decoding that properly handles WebM/Opus.

### Changes Made

**File**: `/ai_service/modules/speech_recognition.py`

**New Implementation** (lines 117-185):
```python
def _decode_audio(self, base64_string: str) -> np.ndarray:
    """Convert base64 audio data to numpy array using librosa for robust format handling"""
    try:
        # Decode base64
        audio_bytes = base64.b64decode(base64_string)
        
        # Use librosa to load audio from bytes
        # librosa can handle WebM/Opus, WAV, MP3, OGG, etc.
        try:
            audio_io = io.BytesIO(audio_bytes)
            audio_data, sr = librosa.load(audio_io, sr=self.sample_rate, mono=True)
            return audio_data.astype(np.float32)
            
        except Exception as e:
            # Fallback: save as temp file and load
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
            
            audio_data, sr = librosa.load(tmp_path, sr=self.sample_rate, mono=True)
            os.unlink(tmp_path)  # Clean up
            
            return audio_data.astype(np.float32)
```

## Dependencies Required

For librosa to decode WebM/Opus, you need **ffmpeg** installed on your system.

### Install ffmpeg

**macOS**:
```bash
brew install ffmpeg
```

**Ubuntu/Debian**:
```bash
sudo apt-get install ffmpeg
```

**Windows**:
Download from https://ffmpeg.org/download.html

### Verify Installation

```bash
ffmpeg -version
```

Should show ffmpeg version information.

## How It Works

1. **Browser** records audio in WebM/Opus format (best compression)
2. **Frontend** sends base64-encoded WebM to backend
3. **Backend** uses librosa to decode:
   - librosa uses ffmpeg under the hood
   - Automatically handles WebM container
   - Decodes Opus codec
   - Resamples to 16kHz
   - Converts to mono
4. **Transcription** works on properly decoded audio

## Expected Behavior After Fix

### Before Fix:
```
[AUDIO] WebM decode failed: ...
[AUDIO] Decoded as float32: shape=(64392,), range=[-0.001, 0.001]
[SPEECH] Transcription: "看到 See ya"  ← Garbage!
```

### After Fix (with ffmpeg):
```
[AUDIO] Librosa decoded: shape=(136000,), sr=16000, range=[-0.856, 0.912]
[SPEECH] Whisper transcription: "Believe you can and you are halfway to achieving your goals"
[SPEECH] Accuracy: 0.98
```

## Testing

1. **Install ffmpeg** (if not already installed)
2. **Restart AI service**:
   ```bash
   cd ai_service
   python main.py
   ```
3. **Test recording**:
   - Record for 3+ seconds
   - Check backend logs for "Librosa decoded"
   - Verify transcription is accurate

## Troubleshooting

### If you see "Librosa decode from BytesIO failed"

This means ffmpeg is not installed or not in PATH.

**Solution**:
1. Install ffmpeg (see above)
2. Restart terminal/IDE
3. Restart AI service
4. Try again

### If transcription is still poor

Check backend logs for:
```
[AUDIO] Librosa decoded: shape=(136000,), sr=16000
```

If shape is very small (< 48000), the audio might be too short or corrupted.

## Benefits

✅ **Robust format handling** - Works with WebM, WAV, MP3, OGG, etc.
✅ **Proper codec support** - Handles Opus codec correctly
✅ **Automatic resampling** - Converts to 16kHz automatically
✅ **Better transcription** - Real audio data = accurate transcription
✅ **Industry standard** - librosa + ffmpeg is the standard approach

## Alternative: Change Frontend Format

If you can't install ffmpeg, you could change the frontend to record in WAV format instead of WebM:

**File**: `/frontend/components/setup/MicrophoneTest.tsx` (line 174-180)

```typescript
const mimeTypes = [
  'audio/wav',           // ← Try WAV first
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4'
];
```

However, WAV files are much larger (10x size), so ffmpeg + WebM is the better solution.

## Status

✅ **Code Updated** - librosa-based decoding implemented
⚠️ **Requires ffmpeg** - Must be installed on system
🔄 **Ready for Testing** - Install ffmpeg and test

---

**Next Steps**: Install ffmpeg and restart AI service to test the fix.
