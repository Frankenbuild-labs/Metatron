"""
Segmind API Server
Flask-based REST API for Segmind image generation service
"""

import os
import sys
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import Segmind service
from segmind_service import SegmindService

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:*', 'http://127.0.0.1:*', 'file://*'])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Segmind service
segmind_service = SegmindService()


@app.route('/api/segmind/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'segmind-api',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/segmind/models', methods=['GET'])
def get_models():
    """Get available Segmind models"""
    try:
        category = request.args.get('category')
        models = segmind_service.get_models(category)
        
        return jsonify({
            'success': True,
            'models': models,
            'count': len(models)
        })
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/segmind/generate', methods=['POST'])
def generate_image():
    """Generate image using Segmind"""
    try:
        data = request.json
        
        # Validate required parameters
        if not data or 'prompt' not in data:
            return jsonify({
                'success': False,
                'error': 'Prompt is required'
            }), 400
        
        # Generate image
        result = segmind_service.generate_image(data)
        
        if result['success']:
            logger.info(f"✅ Generated image: {result['generation_id']}")
            return jsonify(result)
        else:
            logger.error(f"❌ Generation failed: {result['error']}")
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/segmind/enhance', methods=['POST'])
def enhance_image():
    """Enhance existing image"""
    try:
        data = request.json
        
        # Validate parameters
        if not data or 'image' not in data or 'enhancement_type' not in data:
            return jsonify({
                'success': False,
                'error': 'Image and enhancement_type are required'
            }), 400
        
        # Enhance image
        result = segmind_service.enhance_image(
            data['image'],
            data['enhancement_type']
        )
        
        if result['success']:
            logger.info(f"✅ Enhanced image with {data['enhancement_type']}")
            return jsonify(result)
        else:
            logger.error(f"❌ Enhancement failed: {result['error']}")
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error enhancing image: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/segmind/variations', methods=['POST'])
def generate_variations():
    """Generate variations of existing image"""
    try:
        data = request.json
        
        # Validate parameters
        if not data or 'image' not in data or 'prompt' not in data:
            return jsonify({
                'success': False,
                'error': 'Image and prompt are required'
            }), 400
        
        # Generate variations
        result = segmind_service.generate_variations(
            data['image'],
            data['prompt'],
            data.get('strength', 0.7)
        )
        
        if result['success']:
            logger.info(f"✅ Generated variations")
            return jsonify(result)
        else:
            logger.error(f"❌ Variations failed: {result['error']}")
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error generating variations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/segmind/history', methods=['GET'])
def get_history():
    """Get generation history"""
    try:
        limit = int(request.args.get('limit', 10))
        history = segmind_service.get_generation_history(limit)
        
        return jsonify({
            'success': True,
            'history': history,
            'count': len(history)
        })
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/segmind/styles', methods=['GET'])
def get_styles():
    """Get available style presets"""
    styles = [
        {'id': 'photorealistic', 'name': 'Photorealistic', 'description': 'Ultra-realistic photography'},
        {'id': 'artistic', 'name': 'Artistic', 'description': 'Creative and expressive art'},
        {'id': 'anime', 'name': 'Anime', 'description': 'Japanese animation style'},
        {'id': 'cartoon', 'name': 'Cartoon', 'description': 'Western cartoon style'},
        {'id': 'abstract', 'name': 'Abstract', 'description': 'Modern abstract art'},
        {'id': 'cinematic', 'name': 'Cinematic', 'description': 'Movie-like dramatic scenes'},
        {'id': 'fantasy', 'name': 'Fantasy', 'description': 'Magical and ethereal'},
        {'id': 'scifi', 'name': 'Sci-Fi', 'description': 'Futuristic and cyberpunk'},
        {'id': 'vintage', 'name': 'Vintage', 'description': 'Retro and nostalgic'},
        {'id': 'minimalist', 'name': 'Minimalist', 'description': 'Clean and simple'}
    ]
    
    return jsonify({
        'success': True,
        'styles': styles
    })


@app.route('/api/segmind/validate-api-key', methods=['POST'])
def validate_api_key():
    """Validate Segmind API key"""
    try:
        data = request.json
        api_key = data.get('api_key')
        
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API key is required'
            }), 400
        
        # Test with provided API key
        test_service = SegmindService(api_key)
        
        # Try a small test generation
        result = test_service.generate_image({
            'model': 'sdxl',
            'prompt': 'test validation',
            'width': 512,
            'height': 512,
            'steps': 1  # Minimal steps for speed
        })
        
        return jsonify({
            'success': result['success'],
            'valid': result['success']
        })
        
    except Exception as e:
        logger.error(f"Error validating API key: {str(e)}")
        return jsonify({
            'success': False,
            'valid': False,
            'error': str(e)
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.getenv('SEGMIND_API_PORT', 5002))
    
    print(f"""
╔══════════════════════════════════════╗
║      Segmind API Server Started      ║
╠══════════════════════════════════════╣
║  Running on: http://localhost:{port}  ║
║  API Base: /api/segmind              ║
╚══════════════════════════════════════╝
    """)
    
    # Run server
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.getenv('DEBUG', 'False').lower() == 'true'
    )
