#!/usr/bin/env python3
"""
Simple Flask API for MultiTalk voice generation
Just calls their existing script - NO CUSTOM CODE
"""

from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import uuid
from simple_wrapper import generate_talking_video

app = Flask(__name__)

# Allowed file extensions
ALLOWED_AUDIO = {'wav', 'mp3', 'flac', 'm4a'}
ALLOWED_IMAGE = {'jpg', 'jpeg', 'png', 'bmp'}

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@app.route('/api/voice/generate', methods=['POST'])
def generate_voice_video():
    """Generate talking video using MultiTalk"""
    
    # Check files
    if 'audio' not in request.files or 'image' not in request.files:
        return jsonify({'error': 'Audio and image files required'}), 400
    
    audio_file = request.files['audio']
    image_file = request.files['image'] 
    prompt = request.form.get('prompt', 'A person talking')
    
    # Validate files
    if not allowed_file(audio_file.filename, ALLOWED_AUDIO):
        return jsonify({'error': 'Invalid audio file type'}), 400
    
    if not allowed_file(image_file.filename, ALLOWED_IMAGE):
        return jsonify({'error': 'Invalid image file type'}), 400
    
    # Save uploaded files
    request_id = str(uuid.uuid4())
    audio_path = f"temp_audio_{request_id}.{audio_file.filename.rsplit('.', 1)[1]}"
    image_path = f"temp_image_{request_id}.{image_file.filename.rsplit('.', 1)[1]}"
    
    audio_file.save(audio_path)
    image_file.save(image_path)
    
    try:
        # Call MultiTalk wrapper
        result = generate_talking_video(audio_path, image_path, prompt, f"output_{request_id}")
        
        # Clean up temp files
        os.remove(audio_path)
        os.remove(image_path)
        
        if result:
            return jsonify({
                'success': True,
                'video_path': result,
                'download_url': f'/api/voice/download/{result}'
            })
        else:
            return jsonify({'error': 'Video generation failed'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/voice/download/<filename>')
def download_video(filename):
    """Download generated video"""
    if os.path.exists(filename):
        return send_file(filename, as_attachment=True)
    return jsonify({'error': 'File not found'}), 404

@app.route('/api/voice/status')
def status():
    """Check if MultiTalk is ready"""
    models_exist = (
        os.path.exists('weights/Wan2.1-I2V-14B-480P') and 
        os.path.exists('weights/chinese-wav2vec2-base')
    )
    return jsonify({
        'status': 'ready' if models_exist else 'models_missing',
        'models_downloaded': models_exist
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)
