#!/usr/bin/env python3
"""
Social Station Agent - PraisonAI + Composio Integration
Handles all social media operations for the Social Station interface
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

try:
    from praisonai import PraisonAI
    from composio_praisonai import ComposioToolSet, Action
except ImportError:
    print("⚠️  PraisonAI or Composio not installed. Install with:")
    print("pip install praisonai composio-praisonai")
    exit(1)

@dataclass
class SocialPost:
    content: str
    platforms: List[str]
    scheduled_time: Optional[datetime] = None
    media_urls: List[str] = None
    hashtags: List[str] = None
    post_id: Optional[str] = None
    status: str = "draft"

class SocialStationAgent:
    """
    PraisonAI-powered Social Media Agent with Composio integrations
    """
    
    def __init__(self, composio_api_key: str = None):
        self.composio_api_key = composio_api_key or os.getenv('COMPOSIO_API_KEY')
        if not self.composio_api_key:
            raise ValueError("COMPOSIO_API_KEY is required")
        
        # Initialize Composio toolset
        self.toolset = ComposioToolSet(api_key=self.composio_api_key)
        
        # Define available social media actions
        self.social_actions = [
            Action.TWITTER_CREATION_OF_A_POST,
            Action.TWITTER_GET_USER_TWEETS,
            Action.LINKEDIN_POST_CREATION,
            Action.LINKEDIN_GET_PROFILE,
            Action.INSTAGRAM_POST_CREATION,
            Action.FACEBOOK_POST_CREATION,
            Action.TIKTOK_POST_CREATION,
        ]
        
        # Initialize PraisonAI agent
        self.agent = PraisonAI(
            agent_file="backend/social_agent_config.yaml",
            tools=self.toolset.get_tools(actions=self.social_actions)
        )
        
        # Memory for tracking posts and user preferences
        self.post_history = []
        self.user_preferences = {
            "preferred_platforms": ["twitter", "linkedin"],
            "optimal_posting_times": {},
            "successful_hashtags": [],
            "content_themes": []
        }
    
    async def handle_chat_message(self, message: str, user_context: Dict = None) -> Dict[str, Any]:
        """
        Handle natural language requests from the Social Station chat interface
        """
        try:
            # Add context about available platforms and user preferences
            enhanced_message = f"""
            User Request: {message}
            
            Available Platforms: Twitter, LinkedIn, Instagram, Facebook, TikTok
            User's Connected Platforms: {', '.join(self.user_preferences['preferred_platforms'])}
            
            Context: You are a social media manager assistant. Help the user with:
            - Creating and posting content
            - Scheduling posts
            - Analyzing performance
            - Managing multiple platforms
            - Connecting new accounts
            
            Respond with actionable steps and execute social media operations when requested.
            """
            
            # Process through PraisonAI
            result = await self.agent.arun(enhanced_message)
            
            return {
                "success": True,
                "response": result,
                "timestamp": datetime.now().isoformat(),
                "action_taken": self._extract_action_from_result(result)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": f"Sorry, I encountered an error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    async def publish_post(self, post: SocialPost) -> Dict[str, Any]:
        """
        Publish a post to specified platforms using Composio
        """
        results = {}
        
        for platform in post.platforms:
            try:
                if platform.lower() == "twitter":
                    result = await self._post_to_twitter(post)
                elif platform.lower() == "linkedin":
                    result = await self._post_to_linkedin(post)
                elif platform.lower() == "instagram":
                    result = await self._post_to_instagram(post)
                elif platform.lower() == "facebook":
                    result = await self._post_to_facebook(post)
                elif platform.lower() == "tiktok":
                    result = await self._post_to_tiktok(post)
                else:
                    result = {"success": False, "error": f"Platform {platform} not supported"}
                
                results[platform] = result
                
                # Track successful posts for learning
                if result.get("success"):
                    self._track_successful_post(post, platform, result)
                    
            except Exception as e:
                results[platform] = {"success": False, "error": str(e)}
        
        return {
            "post_id": post.post_id or f"post_{datetime.now().timestamp()}",
            "results": results,
            "timestamp": datetime.now().isoformat(),
            "content": post.content
        }
    
    async def schedule_post(self, post: SocialPost, schedule_time: datetime) -> Dict[str, Any]:
        """
        Schedule a post for future publishing
        """
        post.scheduled_time = schedule_time
        post.status = "scheduled"
        
        # Store in memory/database for later execution
        scheduled_post = {
            "id": f"scheduled_{datetime.now().timestamp()}",
            "post": post.__dict__,
            "schedule_time": schedule_time.isoformat(),
            "status": "scheduled"
        }
        
        # TODO: Implement actual scheduling mechanism (cron job, celery, etc.)
        
        return {
            "success": True,
            "scheduled_id": scheduled_post["id"],
            "schedule_time": schedule_time.isoformat(),
            "message": f"Post scheduled for {schedule_time.strftime('%B %d, %Y at %I:%M %p')}"
        }
    
    async def get_analytics(self, platform: str = None, days: int = 7) -> Dict[str, Any]:
        """
        Get analytics data for posts
        """
        try:
            # Use Composio to fetch real analytics
            analytics_prompt = f"""
            Get analytics data for the last {days} days.
            Platform: {platform or 'all platforms'}
            
            Include:
            - Post engagement (likes, shares, comments)
            - Reach and impressions
            - Best performing posts
            - Optimal posting times
            """
            
            result = await self.agent.arun(analytics_prompt)
            
            return {
                "success": True,
                "analytics": result,
                "period": f"Last {days} days",
                "platform": platform or "all"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def connect_platform(self, platform: str, auth_data: Dict = None) -> Dict[str, Any]:
        """
        Connect a new social media platform
        """
        try:
            # Use Composio OAuth flow
            connection_prompt = f"""
            Help the user connect their {platform} account.
            Guide them through the OAuth process and confirm the connection.
            """
            
            result = await self.agent.arun(connection_prompt)
            
            # Update user preferences
            if platform.lower() not in self.user_preferences["preferred_platforms"]:
                self.user_preferences["preferred_platforms"].append(platform.lower())
            
            return {
                "success": True,
                "platform": platform,
                "message": f"{platform} account connected successfully!",
                "connection_details": result
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to connect {platform}: {str(e)}"
            }
    
    # Platform-specific posting methods
    async def _post_to_twitter(self, post: SocialPost) -> Dict[str, Any]:
        """Post to Twitter using Composio"""
        try:
            # Use Composio Twitter action
            result = await self.toolset.execute_action(
                Action.TWITTER_CREATION_OF_A_POST,
                params={"text": post.content}
            )
            return {"success": True, "platform": "twitter", "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _post_to_linkedin(self, post: SocialPost) -> Dict[str, Any]:
        """Post to LinkedIn using Composio"""
        try:
            result = await self.toolset.execute_action(
                Action.LINKEDIN_POST_CREATION,
                params={"text": post.content}
            )
            return {"success": True, "platform": "linkedin", "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _post_to_instagram(self, post: SocialPost) -> Dict[str, Any]:
        """Post to Instagram using Composio"""
        try:
            result = await self.toolset.execute_action(
                Action.INSTAGRAM_POST_CREATION,
                params={"caption": post.content}
            )
            return {"success": True, "platform": "instagram", "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _post_to_facebook(self, post: SocialPost) -> Dict[str, Any]:
        """Post to Facebook using Composio"""
        try:
            result = await self.toolset.execute_action(
                Action.FACEBOOK_POST_CREATION,
                params={"message": post.content}
            )
            return {"success": True, "platform": "facebook", "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _post_to_tiktok(self, post: SocialPost) -> Dict[str, Any]:
        """Post to TikTok using Composio"""
        try:
            result = await self.toolset.execute_action(
                Action.TIKTOK_POST_CREATION,
                params={"caption": post.content}
            )
            return {"success": True, "platform": "tiktok", "result": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _extract_action_from_result(self, result: str) -> str:
        """Extract the action taken from PraisonAI result"""
        # Simple keyword detection - can be enhanced with NLP
        if "posted" in result.lower() or "published" in result.lower():
            return "post_published"
        elif "scheduled" in result.lower():
            return "post_scheduled"
        elif "connected" in result.lower():
            return "platform_connected"
        elif "analytics" in result.lower():
            return "analytics_retrieved"
        else:
            return "chat_response"
    
    def _track_successful_post(self, post: SocialPost, platform: str, result: Dict):
        """Track successful posts for learning user preferences"""
        self.post_history.append({
            "content": post.content,
            "platform": platform,
            "timestamp": datetime.now().isoformat(),
            "engagement": result.get("engagement", {}),
            "hashtags": post.hashtags or []
        })
        
        # Learn from successful hashtags
        if post.hashtags:
            self.user_preferences["successful_hashtags"].extend(post.hashtags)
        
        # Track optimal posting times
        hour = datetime.now().hour
        if platform not in self.user_preferences["optimal_posting_times"]:
            self.user_preferences["optimal_posting_times"][platform] = []
        self.user_preferences["optimal_posting_times"][platform].append(hour)

# Example usage and testing
if __name__ == "__main__":
    async def test_agent():
        agent = SocialStationAgent()
        
        # Test chat message
        result = await agent.handle_chat_message("Schedule a post about AI productivity for tomorrow at 2 PM")
        print("Chat Result:", result)
        
        # Test posting
        post = SocialPost(
            content="Testing the new Social Station Agent! 🚀 #AI #SocialMedia",
            platforms=["twitter", "linkedin"]
        )
        
        publish_result = await agent.publish_post(post)
        print("Publish Result:", publish_result)
    
    # Run test
    # asyncio.run(test_agent())
