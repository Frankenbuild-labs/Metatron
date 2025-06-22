# Metatron Platform

Unified AI platform with integrated Social Station for social media management.

## Quick Start

### Option 1: Auto Start (Recommended)
```bash
# Start both frontend and backend automatically
start.bat
```

### Option 2: Manual Start
```bash
# Terminal 1: Start Main App Frontend (Port 9001)
cd frontend
python serve.py

# Terminal 2: Start Social Station Backend Service (Port 8081)
cd backend
npm start
```

## How to Use Social Station

1. **Start the platform** using `start.bat` or manual start
2. **Open your main app** at http://localhost:9001
3. **Click "Social Station"** button in the right navigation menu
4. **Use the Social Station features** - all buttons now work with real backend!

## Features

### 🚀 Main Platform
- AI Agent Flow Builder
- Creative Studio
- Memory Management
- Video Meeting Integration
- Model Training

### 📱 Social Station (NEW!) - PraisonAI + Composio Powered
- **🤖 AI Social Agent** - Chat interface for natural language commands
- **🔗 Real Platform Connections** - Twitter, LinkedIn, Instagram, Facebook, TikTok
- **📝 Intelligent Posting** - AI-optimized content creation and publishing
- **📅 Smart Scheduling** - Optimal timing recommendations
- **📊 Real Analytics** - Live engagement metrics and insights
- **💬 Natural Language Interface** - "Schedule 3 posts about AI for next week"
- **🔐 Secure OAuth** - Composio-powered platform authentication

## Architecture

```
Metatron/
├── frontend/           # Main UI (Port 9001)
├── backend/           # Integrated backend services
│   ├── social-station.js  # Social media backend (Port 8081)
│   └── [other services]   # AI, memory, etc.
├── start.bat          # Auto-startup script
└── package.json       # Main dependencies
```

## Social Station Agent Setup

### Prerequisites
1. **Composio API Key** - Get from [Composio Dashboard](https://app.composio.dev)
2. **Python 3.8+** - For PraisonAI agent
3. **Node.js** - For frontend

### Installation
```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env and add your COMPOSIO_API_KEY

# Install frontend dependencies (if needed)
cd ../frontend
# No additional dependencies required
```

### Social Station Agent API

- **Chat Interface**: `POST /api/social-agent/chat`
- **Publish Posts**: `POST /api/social-agent/publish`
- **Schedule Posts**: `POST /api/social-agent/schedule`
- **Save Drafts**: `POST /api/social-agent/draft`
- **Analytics**: `GET /api/social-agent/analytics`
- **Platform Management**: `GET/POST /api/social-agent/platforms`

### Natural Language Commands
- *"Post this to Twitter and LinkedIn: [content]"*
- *"Schedule 3 posts about AI for next week"*
- *"Connect my TikTok account"*
- *"Show me my best performing posts"*
- *"Create a content calendar for July"*

## Development

```bash
# Install dependencies
npm install
cd backend && npm install

# Development mode with auto-restart
cd backend && npm run dev
``` - AI-Powered Creative Platform

A comprehensive AI-powered platform featuring chat interface, creative studio, video meeting capabilities, and advanced web application builder.

## 🚀 Features

### 💬 AI Chat Interface (Main App)
- Modern chat interface with AI assistant
- Support for multiple AI models (Gemini 2.0 Flash, DeepSeek, etc.)
- Adjustable temperature settings
- Token counter and usage tracking
- Responsive design with teal accent colors (#069494)

### 🎨 Creative Studio
- **Video Editor**: Custom Motionity video editor integration
- **Image Generator**: AI-powered image generation with multiple modes
  - Text to Image
  - Image to Image
  - ControlNet
  - Enhancement tools
  - Style presets
- **Video Generator**: AI video creation from text prompts
- **Advanced Settings**: Model selection, creativity controls, negative prompts

### 📹 Video Meeting
- Full-featured video conferencing powered by VideoSDK
- Create and join meetings with AI agents integration
- Audio/video controls
- Screen sharing
- In-meeting chat
- Recording capabilities
- Participant management
- Device selection (camera/microphone/speaker)
- Network quality indicators
- Google Gemini LiveAPI integration for AI agents

### �️ LocalSite-ai (Web Builder)
- **Enhanced Code Generation**: Support for multiple languages and frameworks
  - Frontend: React, Next.js, Vue, Svelte, TypeScript
  - Backend: Node.js/Express, Python/FastAPI, Java/Spring Boot
  - Full-Stack: Next.js, Nuxt, SvelteKit
- **Vercel Template Gallery**: 10+ professional templates including:
  - Next.js Boilerplate
  - AI Chatbot
  - E-commerce Store
  - Blog Starter
  - Portfolio Kit
  - Admin Dashboard
  - SaaS Starter
  - Documentation Site
  - Landing Page
  - Image Gallery
- **Template Features**:
  - Category filtering (AI, Starter, Ecommerce, SaaS, Blog, Portfolio, etc.)
  - One-click template selection
  - Detailed prompts for each template
  - Responsive grid layout matching Vercel's design
- **Project Builder**: Complete project scaffolding with dependencies
- **Deployment Ready**: Vercel, Netlify, Docker configurations

### 🔧 Additional Tools
- **Agent Flow Builder**: Composio Agent Flow integration for workflow automation
- **Witz Management Interface**: Frontend design and orchestrator management
- **Connections**: 300+ integrations via Composio white-labeled connections
- **Copy Coder**: Image-to-code conversion tool

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS variables for theming
- **Video SDK**: VideoSDK for video conferencing
- **AI Integration**: Ready for multiple AI service integrations
- **Server**: Python HTTP server for development

## 📁 Project Structure

```
Metatron/
├── frontend/
│   ├── newfrontend.html      # Main application interface
│   ├── styles.css            # Application styles
│   ├── script.js             # Main JavaScript functionality
│   ├── serve.py              # Development server
│   ├── agent-flow/          # Agent Flow Builder (Port 3000)
│   ├── creative studio/      # Motionity video editor
│   └── videosdk/            # VideoSDK integration
│       ├── index.html       # VideoSDK interface
│       ├── index.js         # VideoSDK functionality
│       ├── index.css        # VideoSDK styles
│       └── config.js        # VideoSDK configuration
├── backend/                  # Backend services
│   ├── ai-agent/            # VideoSDK AI agent service (Port 5003)
│   ├── creative-studio/     # Segmind API server (Port 5002)
│   ├── MultiTalk/           # Voice generation service (Port 5004)
│   ├── orchestrator/        # Main AI orchestrator (Port 5001)
│   ├── segmind_api.py       # Image generation API (Port 5002)
│   └── voice_generator/     # Voice generation utilities
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.7+ (for development server)
- Modern web browser with camera/microphone support
- VideoSDK account (for video meetings)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Frankenbuild-labs/Metatron.git
   cd Metatron
   ```

2. **Start the development server**
   ```bash
   cd frontend
   python serve.py
   ```

3. **Open in browser**
   Navigate to `http://localhost:9000`

### VideoSDK Setup

1. **Get VideoSDK credentials**
   - Sign up at [VideoSDK](https://app.videosdk.live/)
   - Get your API Key and Secret Key

2. **Generate JWT Token**
   ```bash
   cd frontend/videosdk
   node generate-token.cjs
   ```

3. **Update configuration**
   Copy the generated token to `frontend/videosdk/config.js`

## 🎯 Usage

### Chat Interface
1. Type messages in the input field
2. Adjust AI model and temperature in settings (gear icon)
3. Monitor token usage in the right panel

### Creative Studio
1. Click "Creative Studio" in the right navigation
2. Choose between Editor, Image Generator, or Video Generator
3. Use the tools and settings in the right panel

### Video Meeting
1. Click "Video Meeting" in the right navigation
2. Create a new meeting or join with a meeting code
3. Use controls for audio/video, screen sharing, and chat

## 🔧 Configuration

### AI Models
Configure AI models in the settings modal:
- Model selection
- Temperature adjustment
- Token limits

### VideoSDK
Update `frontend/videosdk/config.js` with your credentials:
```javascript
const API_KEY = "your-api-key";
const SECRET_KEY = "your-secret-key";
TOKEN = "your-generated-jwt-token";
```

## 🎨 Customization

### Theming
The application uses CSS variables for easy theming:
```css
:root {
  --accent-primary: #069494;  /* Teal accent color */
  --bg-primary: #1a1a1a;     /* Dark background */
  --text-primary: #ffffff;    /* Primary text */
  /* ... more variables */
}
```

### Adding Features
1. Add navigation button in `newfrontend.html`
2. Create corresponding modal/interface
3. Add JavaScript handlers in `script.js`
4. Style with CSS in `styles.css`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- VideoSDK for video conferencing capabilities
- Motionity for video editing functionality
- Font Awesome for icons
- All contributors and testers

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

---

**Built with ❤️ by Frankenbuild Labs**
