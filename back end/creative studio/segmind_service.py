"""
Segmind Image Generation Service
Using the official Segmind Python SDK for AI image generation
"""

import os
import json
import uuid
import base64
from datetime import datetime
from typing import Dict, List, Optional, Any
from io import BytesIO

# Import official Segmind SDK
from segmind import Segmind
from PIL import Image

# Available Segmind models
from segmind import (
    SDXL, Kadinsky, SD2_1, ControlNet, 
    BackgroundRemoval, Codeformer, ESRGAN,
    FaceSwap, QRGenerator, Word2Img, SDOutpainting,
    SAM, SD1_5, Img2Img, Inpainting,
    # Text to Image models
    TinySD, SmallSD, Paragon, RealisticVision,
    Reliberate, Revanimated, Colorful, Cartoon,
    EdgeOfRealism, EpicRealism, RPG, SciFi,
    CyberRealistic, Samaritan, RCNZ, Manmarumix,
    Majicmix, Juggernaut, Icbinp, FruitFusion,
    Flat2D, FantassifiedIcons, DvArch, Dreamshaper,
    DeepSpacedDiffusion, CuteRichStyle, AllInOnePixel,
    Mix526
)


class SegmindService:
    """Service for handling Segmind AI image generation"""
    
    def __init__(self, api_key: str = None):
        """Initialize Segmind service with API key"""
        self.api_key = api_key or os.getenv('SEGMIND_API_KEY', 'SG_a6306a43775d4264')
        self.models = self._initialize_models()
        self.generation_history = []
        
    def _initialize_models(self) -> Dict[str, Dict]:
        """Initialize available models with their configurations"""
        return {
            # Main models
            'sdxl': {
                'name': 'SDXL 1.0',
                'class': SDXL,
                'description': 'High-quality realistic and artistic images at 1024x1024',
                'category': 'general',
                'default_size': (1024, 1024)
            },
            'kadinsky': {
                'name': 'Kadinsky',
                'class': Kadinsky,
                'description': 'Artistic and creative image generation',
                'category': 'artistic',
                'default_size': (512, 512)
            },
            'sd2_1': {
                'name': 'Stable Diffusion 2.1',
                'class': SD2_1,
                'description': 'Balanced quality and speed',
                'category': 'general',
                'default_size': (512, 512)
            },
            
            # Specialized models
            'realistic_vision': {
                'name': 'Realistic Vision',
                'class': RealisticVision,
                'description': 'Photorealistic human portraits',
                'category': 'photorealistic',
                'default_size': (512, 512)
            },
            'dreamshaper': {
                'name': 'Dreamshaper',
                'class': Dreamshaper,
                'description': 'Fantasy and artistic creations',
                'category': 'artistic',
                'default_size': (512, 512)
            },
            'cartoon': {
                'name': 'Cartoon',
                'class': Cartoon,
                'description': 'Cartoon and animated style',
                'category': 'stylized',
                'default_size': (512, 512)
            },
            'anime': {
                'name': 'Anime/Colorful',
                'class': Colorful,
                'description': 'Anime and vibrant illustrations',
                'category': 'stylized',
                'default_size': (512, 512)
            },
            'cyber_realistic': {
                'name': 'Cyber Realistic',
                'class': CyberRealistic,
                'description': 'Cyberpunk and futuristic style',
                'category': 'stylized',
                'default_size': (512, 512)
            },
            'epic_realism': {
                'name': 'Epic Realism',
                'class': EpicRealism,
                'description': 'Epic photorealistic scenes',
                'category': 'photorealistic',
                'default_size': (512, 512)
            },
            
            # Utility models
            'bg_removal': {
                'name': 'Background Removal',
                'class': BackgroundRemoval,
                'description': 'Remove image backgrounds',
                'category': 'utility',
                'default_size': None
            },
            'upscale': {
                'name': 'ESRGAN Upscaler',
                'class': ESRGAN,
                'description': 'Upscale images to higher resolution',
                'category': 'utility',
                'default_size': None
            },
            'face_enhance': {
                'name': 'Codeformer',
                'class': Codeformer,
                'description': 'Enhance and restore faces',
                'category': 'utility',
                'default_size': None
            },
            'qr_generator': {
                'name': 'QR Code Generator',
                'class': QRGenerator,
                'description': 'Generate artistic QR codes',
                'category': 'utility',
                'default_size': (512, 512)
            }
        }
    
    def generate_image(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate image using specified model and parameters
        
        Args:
            params: Dictionary containing:
                - model: Model ID (default: 'sdxl')
                - prompt: Text prompt for generation
                - negative_prompt: What to avoid (optional)
                - width: Image width (optional)
                - height: Image height (optional)
                - samples: Number of images (default: 1)
                - steps: Inference steps (optional)
                - guidance_scale: Guidance scale (optional)
                - seed: Random seed (optional)
                - style: Style preset (optional)
                
        Returns:
            Dictionary with generation results
        """
        try:
            # Extract parameters
            model_id = params.get('model', 'sdxl')
            prompt = params.get('prompt', '')
            
            if not prompt:
                raise ValueError("Prompt is required for image generation")
            
            # Get model configuration
            model_config = self.models.get(model_id)
            if not model_config:
                raise ValueError(f"Model '{model_id}' not found")
            
            # Initialize model
            model_class = model_config['class']
            model = model_class(self.api_key)
            
            # Prepare generation parameters
            gen_params = {
                'prompt': self._enhance_prompt(prompt, params.get('style')),
            }
            
            # Add optional parameters based on model type
            if hasattr(model, 'generate'):
                # Text-to-image models
                if params.get('negative_prompt'):
                    gen_params['negative_prompt'] = params['negative_prompt']
                if params.get('seed'):
                    gen_params['seed'] = str(params['seed'])
                else:
                    gen_params['seed'] = str(uuid.uuid4().int % 1000000)
                
                # Size parameters
                if model_config['default_size']:
                    gen_params['img_width'] = params.get('width', model_config['default_size'][0])
                    gen_params['img_height'] = params.get('height', model_config['default_size'][1])
                
                # Quality parameters
                if params.get('steps'):
                    gen_params['num_inference_steps'] = params['steps']
                if params.get('guidance_scale'):
                    gen_params['guidance_scale'] = params['guidance_scale']
                if params.get('samples'):
                    gen_params['samples'] = params['samples']
                
                # Model-specific parameters
                if model_id == 'sdxl':
                    gen_params['refiner'] = params.get('refiner', True)
                    gen_params['scheduler'] = params.get('scheduler', 'UniPC')
            
            # Generate image
            print(f"🎨 Generating with {model_config['name']}: {gen_params['prompt']}")
            result = model.generate(**gen_params)
            
            # Process result
            if hasattr(result, 'image'):
                # Single image result
                image_data = result.image
            elif hasattr(result, 'images'):
                # Multiple images
                image_data = result.images[0] if result.images else None
            elif isinstance(result, Image.Image):
                # PIL Image
                buffered = BytesIO()
                result.save(buffered, format="PNG")
                image_data = base64.b64encode(buffered.getvalue()).decode()
            else:
                # Assume base64 or URL
                image_data = result
            
            # Create response
            generation_id = str(uuid.uuid4())
            response = {
                'success': True,
                'generation_id': generation_id,
                'model': model_id,
                'model_name': model_config['name'],
                'prompt': gen_params['prompt'],
                'image': image_data,
                'seed': gen_params.get('seed'),
                'parameters': gen_params,
                'timestamp': datetime.now().isoformat()
            }
            
            # Store in history
            self.generation_history.append(response)
            
            return response
            
        except Exception as e:
            print(f"❌ Segmind generation error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'model': params.get('model', 'unknown')
            }
    
    def _enhance_prompt(self, base_prompt: str, style: Optional[str]) -> str:
        """Enhance prompt based on style preset"""
        style_enhancements = {
            'photorealistic': 'photorealistic, high quality, detailed, 8k, professional photography',
            'artistic': 'artistic, creative, masterpiece, award winning',
            'anime': 'anime style, manga, detailed, vibrant colors',
            'cartoon': 'cartoon style, colorful, cel-shaded',
            'abstract': 'abstract art, modern, artistic composition',
            'cinematic': 'cinematic, dramatic lighting, film still, movie poster',
            'fantasy': 'fantasy art, magical, ethereal, detailed',
            'scifi': 'science fiction, futuristic, cyberpunk, high tech',
            'vintage': 'vintage style, retro, nostalgic, classic',
            'minimalist': 'minimalist, clean, simple, modern design'
        }
        
        enhancement = style_enhancements.get(style, '')
        return f"{base_prompt}, {enhancement}" if enhancement else base_prompt
    
    def get_models(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get available models, optionally filtered by category"""
        models = []
        for model_id, config in self.models.items():
            if category and config['category'] != category:
                continue
            models.append({
                'id': model_id,
                'name': config['name'],
                'description': config['description'],
                'category': config['category']
            })
        return models
    
    def get_generation_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent generation history"""
        return self.generation_history[-limit:]
    
    def enhance_image(self, image_data: str, enhancement_type: str) -> Dict[str, Any]:
        """
        Apply enhancement to existing image
        
        Args:
            image_data: Base64 encoded image or URL
            enhancement_type: Type of enhancement (upscale, face_enhance, bg_removal)
            
        Returns:
            Enhanced image result
        """
        try:
            if enhancement_type == 'upscale':
                model = ESRGAN(self.api_key)
                result = model.generate(imageUrl=image_data)
            elif enhancement_type == 'face_enhance':
                model = Codeformer(self.api_key)
                result = model.generate(imageUrl=image_data)
            elif enhancement_type == 'bg_removal':
                model = BackgroundRemoval(self.api_key)
                result = model.generate(imageUrl=image_data)
            else:
                raise ValueError(f"Unknown enhancement type: {enhancement_type}")
            
            return {
                'success': True,
                'image': result.image if hasattr(result, 'image') else result,
                'enhancement_type': enhancement_type
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'enhancement_type': enhancement_type
            }
    
    def generate_variations(self, image_data: str, prompt: str, strength: float = 0.7) -> Dict[str, Any]:
        """Generate variations of existing image"""
        try:
            model = SD1_5(self.api_key)
            result = model.generate(
                prompt=prompt,
                imageUrl=image_data,
                strength=strength
            )
            
            return {
                'success': True,
                'image': result.image if hasattr(result, 'image') else result,
                'prompt': prompt,
                'strength': strength
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


# Example usage
if __name__ == "__main__":
    # Initialize service
    service = SegmindService()
    
    # Test image generation
    result = service.generate_image({
        'model': 'sdxl',
        'prompt': 'a serene mountain landscape at sunset',
        'style': 'photorealistic',
        'width': 1024,
        'height': 1024
    })
    
    if result['success']:
        print(f"✅ Generated image with seed: {result['seed']}")
    else:
        print(f"❌ Generation failed: {result['error']}")
