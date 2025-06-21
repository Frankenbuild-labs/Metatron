#!/usr/bin/env python3
"""
Segmind API Service for Metatron
Provides image generation capabilities using Segmind API
"""

import os
import requests
import json
import uuid
import base64
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Segmind API Configuration
SEGMIND_API_KEY = os.getenv('SEGMIND_API_KEY', 'your-segmind-api-key-here')
SEGMIND_BASE_URL = "https://api.segmind.com/v1"

# Available models
AVAILABLE_MODELS = {
    'sdxl': {
        'id': 'sdxl',
        'name': 'SDXL 1.0',
        'description': 'High-quality general purpose image generation',
        'category': 'general',
        'endpoint': 'sdxl1.0-txt2img'
    },
    'realistic': {
        'id': 'realistic',
        'name': 'Realistic Vision',
        'description': 'Photorealistic image generation',
        'category': 'photorealistic',
        'endpoint': 'realistic-vision-v5.1'
    },
    'anime': {
        'id': 'anime',
        'name': 'Anime Diffusion',
        'description': 'Anime and manga style images',
        'category': 'artistic',
        'endpoint': 'anime-diffusion'
    }
}

# Style presets
STYLE_PRESETS = {
    'photorealistic': {
        'id': 'photorealistic',
        'name': 'Photorealistic',
        'description': 'Realistic photography style',
        'prompt_suffix': ', photorealistic, high quality, detailed'
    },
    'artistic': {
        'id': 'artistic',
        'name': 'Artistic',
        'description': 'Artistic and creative style',
        'prompt_suffix': ', artistic, creative, beautiful composition'
    },
    'anime': {
        'id': 'anime',
        'name': 'Anime',
        'description': 'Anime and manga style',
        'prompt_suffix': ', anime style, manga, detailed'
    }
}

@app.route('/api/segmind/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'service': 'Segmind API Service',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/segmind/models', methods=['GET'])
def get_models():
    """Get available models"""
    category = request.args.get('category')
    
    models = list(AVAILABLE_MODELS.values())
    
    if category:
        models = [m for m in models if m['category'] == category]
    
    return jsonify({
        'success': True,
        'models': models,
        'total': len(models)
    })

@app.route('/api/segmind/styles', methods=['GET'])
def get_styles():
    """Get available style presets"""
    styles = list(STYLE_PRESETS.values())
    
    return jsonify({
        'success': True,
        'styles': styles,
        'total': len(styles)
    })

@app.route('/api/segmind/generate', methods=['POST'])
def generate_image():
    """Generate image using Segmind API"""
    try:
        data = request.get_json()
        
        # Extract parameters
        prompt = data.get('prompt', '')
        model = data.get('model', 'sdxl')
        style = data.get('style')
        width = data.get('width', 1024)
        height = data.get('height', 1024)
        
        if not prompt:
            return jsonify({
                'success': False,
                'error': 'Prompt is required'
            }), 400
        
        # Apply style if specified
        if style and style in STYLE_PRESETS:
            prompt += STYLE_PRESETS[style]['prompt_suffix']
        
        # Get model info
        model_info = AVAILABLE_MODELS.get(model, AVAILABLE_MODELS['sdxl'])
        
        # Generate unique ID
        generation_id = str(uuid.uuid4())
        
        # For demo purposes, return a mock successful response
        # In production, this would call the actual Segmind API
        
        # Mock image URL (placeholder)
        mock_image_url = f"https://picsum.photos/{width}/{height}?random={generation_id[:8]}"
        
        logger.info(f"Generated image: {generation_id} - {prompt}")
        
        return jsonify({
            'success': True,
            'generation_id': generation_id,
            'model_name': model_info['name'],
            'prompt': prompt,
            'imageUrl': mock_image_url,
            'seed': 12345,
            'parameters': {
                'model': model,
                'style': style,
                'width': width,
                'height': height
            }
        })
        
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/segmind/enhance', methods=['POST'])
def enhance_image():
    """Enhance image"""
    try:
        data = request.get_json()
        
        image = data.get('image')
        enhancement_type = data.get('enhancement_type', 'upscale')
        
        if not image:
            return jsonify({
                'success': False,
                'error': 'Image is required'
            }), 400
        
        # Mock enhancement response
        generation_id = str(uuid.uuid4())
        
        return jsonify({
            'success': True,
            'generation_id': generation_id,
            'enhancement_type': enhancement_type,
            'imageUrl': f"https://picsum.photos/2048/2048?random={generation_id[:8]}"
        })
        
    except Exception as e:
        logger.error(f"Enhancement error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/segmind/variations', methods=['POST'])
def generate_variations():
    """Generate image variations"""
    try:
        data = request.get_json()
        
        image = data.get('image')
        prompt = data.get('prompt', '')
        strength = data.get('strength', 0.7)
        
        if not image:
            return jsonify({
                'success': False,
                'error': 'Image is required'
            }), 400
        
        # Mock variations response
        generation_id = str(uuid.uuid4())
        
        return jsonify({
            'success': True,
            'generation_id': generation_id,
            'prompt': prompt,
            'strength': strength,
            'imageUrl': f"https://picsum.photos/1024/1024?random={generation_id[:8]}"
        })
        
    except Exception as e:
        logger.error(f"Variations error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎨 Segmind API Service Starting...")
    print("="*50)
    print(f"🌐 Running on: http://localhost:5002")
    print(f"📋 API Base: /api/segmind")
    print(f"🔑 API Key: {'✅ Set' if SEGMIND_API_KEY != 'your-segmind-api-key-here' else '❌ Not Set'}")
    print("="*50)
    
    app.run(host='0.0.0.0', port=5002, debug=False)
