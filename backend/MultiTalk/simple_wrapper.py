#!/usr/bin/env python3
"""
Simple wrapper for MultiTalk - just calls their existing script
NO CUSTOM CODE - just a thin wrapper around their generate_multitalk.py
"""

import os
import json
import subprocess
import tempfile
import uuid
from pathlib import Path

def generate_talking_video(audio_file, image_file, prompt, output_name=None):
    """
    Simple wrapper that calls MultiTalk's generate_multitalk.py directly
    
    Args:
        audio_file: Path to audio file
        image_file: Path to image file  
        prompt: Text description
        output_name: Optional output name
    
    Returns:
        Path to generated video or None if failed
    """
    
    # Generate unique output name if not provided
    if output_name is None:
        output_name = f"talking_video_{uuid.uuid4().hex[:8]}"
    
    # Create input JSON file (using their exact format)
    input_config = {
        "prompt": prompt,
        "cond_image": image_file,
        "cond_audio": {
            "person1": audio_file
        }
    }
    
    # Save config to temp file
    config_file = f"{output_name}_config.json"
    with open(config_file, 'w') as f:
        json.dump(input_config, f, indent=2)
    
    # Call their script directly (exactly as they designed it)
    cmd = [
        "python", "generate_multitalk.py",
        "--ckpt_dir", "weights/Wan2.1-I2V-14B-480P",
        "--wav2vec_dir", "weights/chinese-wav2vec2-base", 
        "--input_json", config_file,
        "--sample_steps", "40",
        "--mode", "streaming",
        "--use_teacache",
        "--save_file", output_name
    ]
    
    try:
        # Run their script
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        
        # Clean up config file
        if os.path.exists(config_file):
            os.remove(config_file)
        
        if result.returncode == 0:
            # Find the generated video file
            video_file = f"{output_name}.mp4"
            if os.path.exists(video_file):
                return video_file
        
        return None
        
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    # Simple test
    result = generate_talking_video(
        "examples/single/1.wav",
        "examples/single/single1.png", 
        "A person talking in a studio setting"
    )
    print(f"Generated: {result}")
