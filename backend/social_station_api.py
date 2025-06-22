#!/usr/bin/env python3
"""
Social Station API - Flask endpoints for Social Station UI integration
Connects the Social Station frontend to the PraisonAI Social Agent
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from typing import Dict, Any, List

# Import our Social Station Agent
from social_station_agent import SocialStationAgent, SocialPost

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize the Social Station Agent
try:
    social_agent = SocialStationAgent()
    print("✅ Social Station Agent initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize Social Station Agent: {e}")
    social_agent = None

# Memory storage for demo (replace with proper database)
scheduled_posts = []
published_posts = []
drafts = []
connected_platforms = {
    "twitter": False,
    "linkedin": False, 
    "instagram": False,
    "facebook": False,
    "tiktok": False
}

@app.route('/api/social-agent/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "agent_available": social_agent is not None,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/social-agent/chat', methods=['POST'])
def chat_with_agent():
    """
    Chat interface endpoint - handles natural language requests
    """
    try:
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        if not social_agent:
            return jsonify({"error": "Social agent not available"}), 503
        
        # Process message through PraisonAI agent
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            social_agent.handle_chat_message(message)
        )
        loop.close()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "response": f"Sorry, I encountered an error: {str(e)}"
        }), 500

@app.route('/api/social-agent/publish', methods=['POST'])
def publish_post():
    """
    Publish a post immediately to selected platforms
    """
    try:
        data = request.get_json()
        
        # Create SocialPost object
        post = SocialPost(
            content=data.get('content', ''),
            platforms=data.get('platforms', []),
            hashtags=data.get('hashtags', []),
            media_urls=data.get('media_urls', [])
        )
        
        if not post.content:
            return jsonify({"error": "Content is required"}), 400
        
        if not post.platforms:
            return jsonify({"error": "At least one platform is required"}), 400
        
        if not social_agent:
            # Fallback to mock response if agent not available
            return jsonify({
                "success": True,
                "post_id": f"mock_{datetime.now().timestamp()}",
                "results": {platform: {"success": True, "mock": True} for platform in post.platforms},
                "timestamp": datetime.now().isoformat(),
                "content": post.content
            })
        
        # Publish through PraisonAI agent
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            social_agent.publish_post(post)
        )
        loop.close()
        
        # Store in published posts
        published_posts.append({
            "id": result.get("post_id"),
            "content": post.content,
            "platforms": post.platforms,
            "timestamp": result.get("timestamp"),
            "results": result.get("results")
        })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/social-agent/schedule', methods=['POST'])
def schedule_post():
    """
    Schedule a post for future publication
    """
    try:
        data = request.get_json()
        
        # Parse schedule time
        schedule_time_str = data.get('schedule_time')
        if not schedule_time_str:
            return jsonify({"error": "Schedule time is required"}), 400
        
        schedule_time = datetime.fromisoformat(schedule_time_str.replace('Z', '+00:00'))
        
        # Create SocialPost object
        post = SocialPost(
            content=data.get('content', ''),
            platforms=data.get('platforms', []),
            hashtags=data.get('hashtags', []),
            media_urls=data.get('media_urls', []),
            scheduled_time=schedule_time
        )
        
        if not post.content:
            return jsonify({"error": "Content is required"}), 400
        
        if not social_agent:
            # Fallback to mock scheduling
            scheduled_id = f"scheduled_{datetime.now().timestamp()}"
            scheduled_posts.append({
                "id": scheduled_id,
                "content": post.content,
                "platforms": post.platforms,
                "schedule_time": schedule_time.isoformat(),
                "status": "scheduled"
            })
            
            return jsonify({
                "success": True,
                "scheduled_id": scheduled_id,
                "schedule_time": schedule_time.isoformat(),
                "message": f"Post scheduled for {schedule_time.strftime('%B %d, %Y at %I:%M %p')}"
            })
        
        # Schedule through PraisonAI agent
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            social_agent.schedule_post(post, schedule_time)
        )
        loop.close()
        
        # Store in scheduled posts
        if result.get("success"):
            scheduled_posts.append({
                "id": result.get("scheduled_id"),
                "content": post.content,
                "platforms": post.platforms,
                "schedule_time": schedule_time.isoformat(),
                "status": "scheduled"
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/social-agent/draft', methods=['POST'])
def save_draft():
    """
    Save a post as draft
    """
    try:
        data = request.get_json()
        
        draft = {
            "id": f"draft_{datetime.now().timestamp()}",
            "content": data.get('content', ''),
            "platforms": data.get('platforms', []),
            "hashtags": data.get('hashtags', []),
            "created_at": datetime.now().isoformat(),
            "status": "draft"
        }
        
        drafts.append(draft)
        
        return jsonify({
            "success": True,
            "draft_id": draft["id"],
            "message": "Draft saved successfully"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/social-agent/analytics', methods=['GET'])
def get_analytics():
    """
    Get analytics data
    """
    try:
        platform = request.args.get('platform')
        days = int(request.args.get('days', 7))
        
        if not social_agent:
            # Return mock analytics
            return jsonify({
                "success": True,
                "analytics": {
                    "total_posts": len(published_posts),
                    "total_engagement": 1247,
                    "reach": 15234,
                    "best_performing_platform": "linkedin",
                    "optimal_posting_time": "2:00 PM"
                },
                "period": f"Last {days} days",
                "platform": platform or "all"
            })
        
        # Get real analytics through PraisonAI agent
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            social_agent.get_analytics(platform, days)
        )
        loop.close()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/social-agent/platforms', methods=['GET'])
def get_platform_status():
    """
    Get connected platform status
    """
    return jsonify({
        "platforms": connected_platforms,
        "total_connected": sum(connected_platforms.values()),
        "available_platforms": list(connected_platforms.keys())
    })

@app.route('/api/social-agent/platforms/connect', methods=['POST'])
def connect_platform():
    """
    Connect a new platform
    """
    try:
        data = request.get_json()
        platform = data.get('platform', '').lower()
        
        if platform not in connected_platforms:
            return jsonify({"error": f"Platform {platform} not supported"}), 400
        
        if not social_agent:
            # Mock connection
            connected_platforms[platform] = True
            return jsonify({
                "success": True,
                "platform": platform,
                "message": f"{platform.title()} connected successfully (mock)"
            })
        
        # Real connection through PraisonAI agent
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            social_agent.connect_platform(platform, data.get('auth_data'))
        )
        loop.close()
        
        if result.get("success"):
            connected_platforms[platform] = True
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/social-agent/posts/scheduled', methods=['GET'])
def get_scheduled_posts():
    """
    Get all scheduled posts
    """
    return jsonify({
        "scheduled_posts": scheduled_posts,
        "total": len(scheduled_posts)
    })

@app.route('/api/social-agent/posts/published', methods=['GET'])
def get_published_posts():
    """
    Get published posts history
    """
    return jsonify({
        "published_posts": published_posts[-10:],  # Last 10 posts
        "total": len(published_posts)
    })

@app.route('/api/social-agent/drafts', methods=['GET'])
def get_drafts():
    """
    Get all saved drafts
    """
    return jsonify({
        "drafts": drafts,
        "total": len(drafts)
    })

# WebSocket support for real-time updates (optional)
@app.route('/api/social-agent/stream')
def stream_updates():
    """
    Server-sent events for real-time updates
    """
    def generate():
        while True:
            # Send periodic updates
            data = {
                "timestamp": datetime.now().isoformat(),
                "connected_platforms": sum(connected_platforms.values()),
                "scheduled_posts": len(scheduled_posts),
                "published_posts": len(published_posts)
            }
            yield f"data: {json.dumps(data)}\n\n"
            
            # Wait 30 seconds before next update
            import time
            time.sleep(30)
    
    return Response(generate(), mimetype='text/plain')

if __name__ == '__main__':
    print("🚀 Starting Social Station API Server...")
    print("📱 Social Station Agent:", "✅ Available" if social_agent else "❌ Not Available")
    print("🔗 API Endpoints:")
    print("   - POST /api/social-agent/chat")
    print("   - POST /api/social-agent/publish") 
    print("   - POST /api/social-agent/schedule")
    print("   - POST /api/social-agent/draft")
    print("   - GET  /api/social-agent/analytics")
    print("   - GET  /api/social-agent/platforms")
    print("   - POST /api/social-agent/platforms/connect")
    
    app.run(host='0.0.0.0', port=8082, debug=True)
