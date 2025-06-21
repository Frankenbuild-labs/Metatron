# Phase 1: MEM0AI Core Integration - Setup Guide

## 🎯 Overview

Phase 1 integrates the production-ready MEM0AI memory system with your existing Metatron architecture, replacing the current memory backend with a sophisticated, brain-region-mapped memory layer.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend/memory
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file in the project root:

```bash
# Required for MEM0AI
export GOOGLE_GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: Memory Service Configuration
export MEMORY_API_HOST="0.0.0.0"
export MEMORY_API_PORT="5006"
export MEMORY_DEBUG="True"
```

### 3. Start Memory Service

```bash
cd backend/memory
python start_memory_service.py
```

### 4. Test Integration

Open your browser to `http://localhost:9001` and click the brain button in the right panel.

## 📋 Detailed Setup Instructions

### Prerequisites

1. **Python 3.10+** with pip
2. **Google Gemini API Key** (get from Google AI Studio)
3. **Node.js** (for future Cerebral React app integration)
4. **8GB+ RAM** (for vector database operations)

### Step-by-Step Installation

#### 1. Install Core Dependencies

```bash
# Core memory system
pip install mem0ai>=0.1.110
pip install chromadb>=0.4.0
pip install google-generativeai>=0.8.0

# Web framework
pip install flask>=2.3.0
pip install flask-cors>=4.0.0

# Utilities
pip install python-dotenv>=1.0.0
pip install requests>=2.31.0
```

#### 2. Configure Environment

```bash
# Create environment file
echo "GOOGLE_GEMINI_API_KEY=your_api_key_here" > .env

# Set memory service configuration
echo "MEMORY_API_HOST=0.0.0.0" >> .env
echo "MEMORY_API_PORT=5006" >> .env
echo "MEMORY_DEBUG=True" >> .env
```

#### 3. Initialize Directory Structure

```bash
# Create necessary directories
mkdir -p backend/memory/data/chromadb
mkdir -p backend/memory/logs
mkdir -p backend/memory/integrations
```

#### 4. Start Services

```bash
# Terminal 1: Start Memory Service
cd backend/memory
python memory_api.py

# Terminal 2: Start Main Frontend (if not already running)
cd frontend
python serve.py

# Terminal 3: Start Main Orchestrator (if not already running)
cd backend/orchestrator
python metatron_orchestrator_api.py
```

## 🧠 Brain Region Mapping

The system maps MEM0AI memory types to brain regions for Cerebral UI:

| MEM0AI Type | Brain Region | Purpose | Color |
|-------------|--------------|---------|-------|
| `session` | Frontal Lobe | Short-term memory | Red |
| `episodic` | Temporal Lobe | Long-term memory | Teal |
| `working` | Parietal Lobe | Working memory | Blue |
| `user` | Occipital Lobe | Personal memory | Yellow |
| `agent` | Cerebellum | System memory | Purple |

## 🔧 API Endpoints

### Memory Service (Port 5006)

- **Health Check**: `GET /api/memory/health`
- **Add Memory**: `POST /api/memory/add`
- **Search Memories**: `POST /api/memory/search`
- **Memory Stats**: `GET /api/memory/stats`

### Example API Usage

```javascript
// Add a memory
fetch('http://localhost:5006/api/memory/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        content: "User prefers dark mode interface",
        user_id: "user123",
        brain_region: "OCCIPITAL_LOBE",
        metadata: { type: "preference" }
    })
});

// Search memories
fetch('http://localhost:5006/api/memory/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        query: "user interface preferences",
        user_id: "user123",
        limit: 5
    })
});
```

## 🎨 Frontend Integration

### Cerebral UI Features

1. **Brain Button Status**: Shows green when memory service is healthy
2. **3D Brain Visualization**: Interactive brain regions with memory counts
3. **Real-time Updates**: Memory statistics update every 30 seconds
4. **Search Interface**: Search memories across all brain regions
5. **Region Selection**: Click brain regions to view specific memories

### JavaScript Integration

The `cerebral-integration.js` script automatically:
- Checks memory service health on page load
- Updates brain button status indicator
- Handles modal opening/closing
- Provides search and visualization functionality

## 🔍 Testing & Validation

### 1. Health Check

```bash
curl http://localhost:5006/api/memory/health
```

Expected response:
```json
{
    "status": "healthy",
    "service": "metatron-memory",
    "memory_backend": "healthy",
    "mem0_available": true,
    "timestamp": "2025-01-21T..."
}
```

### 2. Add Test Memory

```bash
curl -X POST http://localhost:5006/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a test memory for the system",
    "user_id": "test_user",
    "brain_region": "FRONTAL_LOBE"
  }'
```

### 3. Search Test

```bash
curl -X POST http://localhost:5006/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test memory",
    "user_id": "test_user",
    "limit": 5
  }'
```

## 🐛 Troubleshooting

### Common Issues

1. **MEM0AI Import Error**
   ```bash
   pip install mem0ai --upgrade
   ```

2. **Gemini API Key Error**
   - Verify API key is set: `echo $GOOGLE_GEMINI_API_KEY`
   - Get key from: https://makersuite.google.com/app/apikey

3. **ChromaDB Permission Error**
   ```bash
   chmod -R 755 backend/memory/data/
   ```

4. **Port Already in Use**
   ```bash
   # Find process using port 5006
   lsof -i :5006
   # Kill process if needed
   kill -9 <PID>
   ```

### Debug Mode

Enable debug logging:
```bash
export MEMORY_DEBUG=True
python memory_api.py
```

## 📊 Performance Monitoring

### Memory Usage

- **ChromaDB**: ~100MB for 10K memories
- **MEM0AI**: ~50MB base memory
- **API Service**: ~30MB

### Response Times

- **Add Memory**: <100ms
- **Search (5 results)**: <200ms
- **Stats**: <50ms

## 🔄 Next Steps

After Phase 1 is working:

1. **Phase 2**: VANNA Learning Patterns Integration
2. **Phase 3**: RASA Conversation Management
3. **Phase 4**: Unified Memory API Service
4. **Phase 5**: Full Cerebral UI Integration

## 📞 Support

If you encounter issues:

1. Check the logs in `backend/memory/logs/`
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Test each component individually

The memory service should now be fully integrated with your Metatron system!
