const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:9001",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage for demo
const posts = [];
const scheduledPosts = [];
const drafts = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Platform status
app.get('/api/platforms', (req, res) => {
  res.json({
    platforms: {
      twitter: { connected: true, status: 'active' },
      linkedin: { connected: true, status: 'active' },
      instagram: { connected: false, status: 'not_configured' },
      facebook: { connected: false, status: 'not_configured' }
    }
  });
});

// Main API endpoint
app.post('/api/', async (req, res) => {
  const { message, platform, action } = req.body;
  
  console.log('Received request:', { message, platform, action });
  
  try {
    if (platform === 'scheduler') {
      const data = JSON.parse(message);
      
      if (data.action === 'schedule') {
        const scheduleId = `schedule_${Date.now()}`;
        const scheduledPost = {
          id: scheduleId,
          content: data.content,
          platforms: data.platforms,
          scheduledTime: new Date(data.scheduledTime),
          status: 'scheduled',
          createdAt: new Date()
        };
        
        scheduledPosts.push(scheduledPost);
        
        // Emit via WebSocket
        io.emit('scheduleResults', JSON.stringify({
          success: true,
          scheduleId: scheduleId,
          scheduledTime: data.scheduledTime,
          message: 'Post scheduled successfully'
        }));
        
        res.json({ status: 'ok', action: 'scheduled', scheduleId });
        return;
      }
      
      if (data.action === 'list') {
        io.emit('scheduleResults', JSON.stringify({
          success: true,
          action: 'list',
          posts: scheduledPosts.filter(p => p.status === 'scheduled')
        }));
        
        res.json({ status: 'ok', action: 'list' });
        return;
      }
    }
    
    if (platform && (platform === 'twitter' || platform === 'linkedin')) {
      // Direct platform posting
      const postId = `${platform}_${Date.now()}`;
      const post = {
        id: postId,
        platform: platform,
        content: message,
        timestamp: new Date().toISOString(),
        metrics: {
          likes: 0,
          shares: 0,
          comments: 0
        }
      };
      
      posts.push(post);
      
      // Simulate posting delay
      setTimeout(() => {
        io.emit('postResults', JSON.stringify({
          platform: platform,
          success: true,
          data: post,
          originalContent: message
        }));
      }, 1000);
      
      res.json({ status: 'ok', action: 'posted', platform: platform });
      return;
    }
    
    // Default: AI content formatting
    const formattedContent = {
      twitter: optimizeForTwitter(message),
      linkedin: optimizeForLinkedIn(message),
      original: message
    };
    
    // Send formatted content via WebSocket
    setTimeout(() => {
      io.emit('message', JSON.stringify(formattedContent));
    }, 500);
    
    res.json({ status: 'ok', action: 'formatting' });
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// AI content optimization functions
function optimizeForTwitter(content) {
  let optimized = content;
  
  // Add engagement elements
  if (!optimized.includes('🚀') && !optimized.includes('✨') && !optimized.includes('💡')) {
    optimized = '✨ ' + optimized;
  }
  
  // Ensure it fits Twitter's character limit
  if (optimized.length > 280) {
    optimized = optimized.substring(0, 270) + '... 🧵';
  }
  
  // Add call to action if missing
  if (!optimized.includes('?') && !optimized.includes('thoughts')) {
    optimized += '\n\nWhat do you think? 💭';
  }
  
  return optimized;
}

function optimizeForLinkedIn(content) {
  let optimized = content;
  
  // Make it more professional
  if (!optimized.includes('insights') && !optimized.includes('thoughts') && !optimized.includes('experience')) {
    optimized += '\n\nI\'d love to hear your insights on this topic.';
  }
  
  // Add professional hashtags
  if (!optimized.includes('#')) {
    optimized += '\n\n#Professional #Innovation #Growth';
  }
  
  return optimized;
}

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  socket.on('requestMetrics', (data) => {
    // Send sample metrics
    socket.emit('metricsResults', JSON.stringify({
      platform: data.platform,
      metrics: {
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 25)
      }
    }));
  });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`🚀 Simple Social Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 API available at http://localhost:${PORT}/api/`);
});
