# Metatron - AI-Powered Creative Platform

A comprehensive AI-powered platform featuring chat interface, creative studio, and video meeting capabilities.

## 🚀 Features

### 💬 AI Chat Interface
- Modern chat interface with AI assistant
- Support for multiple AI models (Gemini 2.0 Flash, etc.)
- Adjustable temperature settings
- Token counter and usage tracking
- Responsive design with teal accent colors

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
- Create and join meetings
- Audio/video controls
- Screen sharing
- In-meeting chat
- Recording capabilities
- Participant management
- Device selection (camera/microphone/speaker)
- Network quality indicators

### 🔧 Additional Tools
- Agent/Flow Builder (placeholder)
- Social Station (placeholder)
- App/Web Builder (placeholder)
- Model Training (placeholder)
- Connections/Integrations panel

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
│   ├── creative studio/      # Motionity video editor
│   └── videosdk/            # VideoSDK integration
│       ├── index.html       # VideoSDK interface
│       ├── index.js         # VideoSDK functionality
│       ├── index.css        # VideoSDK styles
│       └── config.js        # VideoSDK configuration
├── back end/                 # Backend services (future)
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
