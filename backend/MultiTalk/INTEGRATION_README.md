# 🎤 MultiTalk Voice Generation Integration

This is a **direct integration** of the amazing MultiTalk model into Metatron. We use their existing code exactly as they built it - no custom modifications.

## 🚀 Quick Setup

### 1. Install Dependencies & Download Models
```bash
cd backend/MultiTalk
python setup.py
```

### 2. Test the Integration
```bash
python voice_api.py
```

### 3. Open Test Interface
Visit: http://localhost:5004/test_interface.html

## 📁 What We Added (Minimal Files)

- `simple_wrapper.py` - Thin wrapper that calls their `generate_multitalk.py`
- `voice_api.py` - Simple Flask API endpoint
- `test_interface.html` - Basic test interface
- `setup.py` - Downloads models using their process
- `INTEGRATION_README.md` - This file

## 🎯 How It Works

### Input Format (Exactly as MultiTalk Designed)
```json
{
    "prompt": "A person talking in a studio setting",
    "cond_image": "path/to/reference/image.jpg",
    "cond_audio": {
        "person1": "path/to/audio/file.wav"
    }
}
```

### API Usage
```bash
curl -X POST http://localhost:5004/api/voice/generate \
  -F "audio=@voice.wav" \
  -F "image=@person.jpg" \
  -F "prompt=A person talking in a professional studio"
```

### Response
```json
{
    "success": true,
    "video_path": "output_12345.mp4",
    "download_url": "/api/voice/download/output_12345.mp4"
}
```

## 🔧 Integration with Creative Studio

### Add Voice Tab to Creative Studio
1. Add new tab button: "Voice" 
2. Create upload form for audio + image
3. Add prompt text area
4. Call API endpoint: `POST /api/voice/generate`
5. Display generated video

### Example Frontend Integration
```javascript
// Add to Creative Studio
const generateVoiceVideo = async (audioFile, imageFile, prompt) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    
    const response = await fetch('/api/voice/generate', {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
};
```

## 📋 Requirements

### System Requirements
- Python 3.10+
- CUDA-capable GPU (recommended)
- ~20GB disk space for models
- 8GB+ VRAM for generation

### Models Downloaded
- `Wan2.1-I2V-14B-480P` - Main video generation model (14B parameters)
- `chinese-wav2vec2-base` - Audio feature extraction
- `MeiGen-MultiTalk` - MultiTalk-specific weights

## 🎯 Features Supported

### Single Person Talking Videos
- Upload audio file (wav, mp3, flac, m4a)
- Upload reference image (jpg, png, bmp)
- Generate lip-synced talking video

### Supported Formats
- **Audio Input**: WAV, MP3, FLAC, M4A
- **Image Input**: JPG, PNG, BMP
- **Video Output**: MP4 with audio

### Generation Options
- Resolution: 480p (default), 720p available
- Duration: Up to 15 seconds
- Frame rate: 25 FPS
- Audio-driven lip synchronization

## 🔍 Troubleshooting

### Models Not Found
```bash
cd backend/MultiTalk
python setup.py
```

### CUDA Out of Memory
- Use smaller resolution (480p instead of 720p)
- Close other GPU applications
- Reduce frame count

### Audio Issues
- Ensure audio is clear and not too quiet
- WAV format works best
- 16kHz sample rate recommended

## 🎉 Success!

Once setup is complete, you'll have:
- ✅ MultiTalk running exactly as designed
- ✅ Simple API wrapper (not custom code)
- ✅ Test interface for validation
- ✅ Ready for Creative Studio integration

**No custom MultiTalk code was written - we use their amazing model exactly as they built it!** 🚀
