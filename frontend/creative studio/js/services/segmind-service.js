/**
 * Segmind Service for Creative Studio
 * Handles all image generation API calls
 */

class SegmindService {
    constructor() {
        this.baseUrl = 'http://localhost:5002/api/segmind';
        this.isHealthy = false;
        this.models = [];
        this.styles = [];
        
        // Initialize service
        this.init();
    }

    async init() {
        try {
            await this.checkHealth();
            await this.loadModels();
            await this.loadStyles();
            console.log('✅ Segmind Service initialized successfully');
        } catch (error) {
            console.warn('⚠️ Segmind Service initialization failed:', error);
        }
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const result = await response.json();
            this.isHealthy = result.success;
            return this.isHealthy;
        } catch (error) {
            console.error('Health check failed:', error);
            this.isHealthy = false;
            return false;
        }
    }

    async loadModels() {
        try {
            const response = await fetch(`${this.baseUrl}/models`);
            const result = await response.json();
            if (result.success) {
                this.models = result.models;
            }
        } catch (error) {
            console.error('Failed to load models:', error);
        }
    }

    async loadStyles() {
        try {
            const response = await fetch(`${this.baseUrl}/styles`);
            const result = await response.json();
            if (result.success) {
                this.styles = result.styles;
            }
        } catch (error) {
            console.error('Failed to load styles:', error);
        }
    }

    async generateImage(params) {
        try {
            console.log('🎨 Generating image with params:', params);
            
            const response = await fetch(`${this.baseUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Image generated successfully:', result);
                return {
                    success: true,
                    imageUrl: result.imageUrl,
                    generationId: result.generation_id,
                    seed: result.seed,
                    parameters: result.parameters
                };
            } else {
                throw new Error(result.error || 'Generation failed');
            }
        } catch (error) {
            console.error('❌ Image generation failed:', error);
            throw error;
        }
    }

    async enhanceImage(image, enhancementType) {
        try {
            console.log('✨ Enhancing image:', enhancementType);
            
            const response = await fetch(`${this.baseUrl}/enhance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: image,
                    enhancement_type: enhancementType
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Image enhanced successfully:', result);
                return {
                    success: true,
                    imageUrl: result.imageUrl,
                    generationId: result.generation_id
                };
            } else {
                throw new Error(result.error || 'Enhancement failed');
            }
        } catch (error) {
            console.error('❌ Image enhancement failed:', error);
            throw error;
        }
    }

    async generateVariations(image, prompt, strength = 0.7) {
        try {
            console.log('🔄 Generating variations:', prompt);
            
            const response = await fetch(`${this.baseUrl}/variations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: image,
                    prompt: prompt,
                    strength: strength
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Variations generated successfully:', result);
                return {
                    success: true,
                    imageUrl: result.imageUrl,
                    generationId: result.generation_id
                };
            } else {
                throw new Error(result.error || 'Variations failed');
            }
        } catch (error) {
            console.error('❌ Variations generation failed:', error);
            throw error;
        }
    }

    getModels() {
        return this.models;
    }

    getStyles() {
        return this.styles;
    }

    getModelById(id) {
        return this.models.find(model => model.id === id);
    }

    getStyleById(id) {
        return this.styles.find(style => style.id === id);
    }

    isServiceHealthy() {
        return this.isHealthy;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SegmindService;
} else {
    window.SegmindService = SegmindService;
}
