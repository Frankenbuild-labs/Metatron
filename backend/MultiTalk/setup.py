#!/usr/bin/env python3
"""
Setup script for MultiTalk - downloads models and installs dependencies
Uses their exact setup process - NO CUSTOM CODE
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and print status"""
    print(f"\n🔄 {description}...")
    try:
        # Use list format to handle spaces in paths
        if isinstance(cmd, str):
            cmd = cmd.split()
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    print("🚀 Setting up MultiTalk Voice Generation")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('generate_multitalk.py'):
        print("❌ Error: Must run from MultiTalk directory")
        print("Run: cd backend/MultiTalk && python setup.py")
        return False
    
    # Install dependencies
    if not run_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], "Installing MultiTalk dependencies"):
        return False

    # Install PyTorch with CUDA support
    if not run_command([sys.executable, "-m", "pip", "install", "torch", "torchvision", "torchaudio", "--index-url", "https://download.pytorch.org/whl/cu121"], "Installing PyTorch with CUDA"):
        return False

    # Install additional dependencies
    if not run_command([sys.executable, "-m", "pip", "install", "xformers", "flash-attn"], "Installing xformers and flash-attn"):
        return False
    
    # Create weights directory
    os.makedirs('weights', exist_ok=True)
    
    # Download models using huggingface-cli
    models = [
        ("Wan-AI/Wan2.1-I2V-14B-480P", "weights/Wan2.1-I2V-14B-480P"),
        ("TencentGameMate/chinese-wav2vec2-base", "weights/chinese-wav2vec2-base"),
        ("MeiGen-AI/MeiGen-MultiTalk", "weights/MeiGen-MultiTalk")
    ]
    
    for repo, local_dir in models:
        if os.path.exists(local_dir):
            print(f"✅ Model {repo} already exists, skipping...")
            continue
            
        if not run_command(["huggingface-cli", "download", repo, "--local-dir", local_dir], f"Downloading {repo}"):
            print(f"⚠️ Failed to download {repo}. You may need to install huggingface_hub:")
            print(f"pip install huggingface_hub[cli]")
            return False
    
    # Setup model files (copy MultiTalk weights to Wan directory)
    multitalk_dir = "weights/MeiGen-MultiTalk"
    wan_dir = "weights/Wan2.1-I2V-14B-480P"
    
    if os.path.exists(multitalk_dir) and os.path.exists(wan_dir):
        import shutil
        
        # Copy MultiTalk files to Wan directory
        multitalk_index = os.path.join(multitalk_dir, "diffusion_pytorch_model.safetensors.index.json")
        multitalk_weights = os.path.join(multitalk_dir, "multitalk.safetensors")
        
        if os.path.exists(multitalk_index):
            shutil.copy2(multitalk_index, wan_dir)
            print("✅ Copied MultiTalk index file")
        
        if os.path.exists(multitalk_weights):
            shutil.copy2(multitalk_weights, wan_dir)
            print("✅ Copied MultiTalk weights file")
    
    print("\n🎉 MultiTalk setup completed successfully!")
    print("\nNext steps:")
    print("1. Test the setup: python voice_api.py")
    print("2. Open test interface: http://localhost:5004/test_interface.html")
    print("3. Or integrate with your Creative Studio")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
