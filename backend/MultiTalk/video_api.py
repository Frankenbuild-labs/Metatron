#!/usr/bin/env python3
"""
Video Generation API using Wan2.1-I2V-14B-480P
Provides basic video generation capabilities for the Video Generator tab
"""

import os
import sys
import uuid
import json
import subprocess
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Allowed file types
ALLOWED_IMAGE = {'png', 'jpg', 'jpeg', 'bmp', 'gif'}
ALLOWED_VIDEO = {'mp4', 'avi', 'mov', 'webm'}

def allowed_file(filename, allowed_types):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_types

def generate_video_from_text(prompt, output_name=None, image_path=None):
    """
    Generate video using Wan2.1-I2V-14B-480P model
    
    Args:
        prompt: Text description for video generation
        output_name: Optional output name
        image_path: Optional reference image for I2V generation
    
    Returns:
        Path to generated video or None if failed
    """
    
    # Generate unique output name if not provided
    if output_name is None:
        output_name = f"video_{uuid.uuid4().hex[:8]}"
    
    # Create input JSON file for Wan2.1 model
    input_config = {
        "prompt": prompt
    }
    
    # Add image if provided (Image-to-Video mode)
    if image_path and os.path.exists(image_path):
        input_config["cond_image"] = image_path
    
    # Save config to temp file
    config_file = f"{output_name}_config.json"
    with open(config_file, 'w') as f:
        json.dump(input_config, f, indent=2)
    
    # Call Wan2.1 script for basic video generation (without MultiTalk features)
    cmd = [
        "python", "generate_multitalk.py",
        "--ckpt_dir", "weights/Wan2.1-I2V-14B-480P",
        "--input_json", config_file,
        "--sample_steps", "40",
        "--mode", "streaming",
        "--use_teacache",
        "--size", "multitalk-480",  # 480P video generation
        "--save_file", output_name
    ]
    
    try:
        # Run video generation
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        # Clean up config file
        if os.path.exists(config_file):
            os.remove(config_file)
        
        if result.returncode == 0:
            # Find the generated video file
            video_file = f"{output_name}.mp4"
            if os.path.exists(video_file):
                return video_file
        else:
            print(f"Video generation failed: {result.stderr}")
        
        return None
        
    except Exception as e:
        print(f"Error: {e}")
        return None

@app.route('/api/video/generate', methods=['POST'])
def generate_video():
    """Generate video using Wan2.1-I2V-14B-480P model"""
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    prompt = data.get('prompt', '')
    if not prompt.strip():
        return jsonify({'error': 'Prompt is required'}), 400
    
    # Optional parameters
    quality = data.get('quality', '480p')  # 480p or 720p
    style = data.get('style', 'realistic')  # realistic, cinematic, artistic
    duration = data.get('duration', 'short')  # short, medium, long
    
    # Enhance prompt based on style and quality preferences
    enhanced_prompt = enhance_video_prompt(prompt, style, quality, duration)
    
    try:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Call video generation
        result = generate_video_from_text(enhanced_prompt, f"video_{request_id}")
        
        if result:
            return jsonify({
                'success': True,
                'video_path': result,
                'download_url': f'/api/video/download/{result}',
                'enhanced_prompt': enhanced_prompt
            })
        else:
            return jsonify({'error': 'Video generation failed'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/video/generate-from-image', methods=['POST'])
def generate_video_from_image():
    """Generate video from image using Image-to-Video capabilities"""
    
    # Check if image file is provided
    if 'image' not in request.files:
        return jsonify({'error': 'Image file required'}), 400
    
    image_file = request.files['image']
    prompt = request.form.get('prompt', 'A dynamic video scene')
    
    # Validate image file
    if not allowed_file(image_file.filename, ALLOWED_IMAGE):
        return jsonify({'error': 'Invalid image file type'}), 400
    
    # Save uploaded image
    request_id = str(uuid.uuid4())
    image_path = f"temp_image_{request_id}.{image_file.filename.rsplit('.', 1)[1]}"
    image_file.save(image_path)
    
    try:
        # Generate video from image
        result = generate_video_from_text(prompt, f"i2v_{request_id}", image_path)
        
        # Clean up temp image
        if os.path.exists(image_path):
            os.remove(image_path)
        
        if result:
            return jsonify({
                'success': True,
                'video_path': result,
                'download_url': f'/api/video/download/{result}'
            })
        else:
            return jsonify({'error': 'Video generation failed'}), 500
            
    except Exception as e:
        # Clean up temp image on error
        if os.path.exists(image_path):
            os.remove(image_path)
        return jsonify({'error': str(e)}), 500

@app.route('/api/video/download/<filename>')
def download_video(filename):
    """Download generated video"""
    if os.path.exists(filename):
        return send_file(filename, as_attachment=True)
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/video/status')
def video_status():
    """Check if video generation is ready"""
    model_exists = os.path.exists('weights/Wan2.1-I2V-14B-480P')
    return jsonify({
        'status': 'ready' if model_exists else 'model_missing',
        'model_downloaded': model_exists,
        'capabilities': {
            'text_to_video': model_exists,
            'image_to_video': model_exists,
            'quality_options': ['480p', '720p'],
            'style_options': ['realistic', 'cinematic', 'artistic']
        }
    })

def enhance_video_prompt(prompt, style='realistic', quality='480p', duration='short'):
    """Enhance user prompt with style and quality modifiers"""
    
    # Style enhancements
    style_modifiers = {
        'realistic': 'photorealistic, natural lighting, high detail',
        'cinematic': 'cinematic lighting, dramatic composition, film quality',
        'artistic': 'artistic style, creative composition, stylized'
    }
    
    # Quality enhancements
    quality_modifiers = {
        '480p': 'good quality, clear details',
        '720p': 'high quality, sharp details, professional'
    }
    
    # Duration hints
    duration_modifiers = {
        'short': 'brief scene, focused action',
        'medium': 'extended sequence, smooth transitions',
        'long': 'detailed sequence, multiple actions'
    }
    
    # Combine enhancements
    enhanced = f"{prompt}"
    
    if style in style_modifiers:
        enhanced += f", {style_modifiers[style]}"
    
    if quality in quality_modifiers:
        enhanced += f", {quality_modifiers[quality]}"
    
    if duration in duration_modifiers:
        enhanced += f", {duration_modifiers[duration]}"
    
    return enhanced

if __name__ == '__main__':
    print("🎬 Starting Video Generation API...")
    print("📁 Model path: weights/Wan2.1-I2V-14B-480P")
    print("🌐 API will be available at: http://localhost:5005")
    print("📋 Endpoints:")
    print("   POST /api/video/generate - Text-to-Video")
    print("   POST /api/video/generate-from-image - Image-to-Video")
    print("   GET  /api/video/status - Check model status")
    print("   GET  /api/video/download/<filename> - Download video")
    
    app.run(host='0.0.0.0', port=5005, debug=True)
