// Production Memory System Integration
class MemorySystemIntegration {
    constructor() {
        this.baseUrl = 'http://localhost:5006/api';
        this.unifiedUrl = 'http://localhost:5006/api/unified';
        this.userId = 'default_user'; // TODO: Get from auth system
        
        // Brain region mapping to memory types
        this.branchMapping = {
            'Episodic': {
                memoryType: 'episodic',
                brainRegion: 'TEMPORAL_LOBE',
                apiEndpoint: '/memory',
                description: 'Personal experiences & events'
            },
            'Semantic': {
                memoryType: 'user',
                brainRegion: 'OCCIPITAL_LOBE', 
                apiEndpoint: '/memory',
                description: 'Facts & knowledge'
            },
            'Working': {
                memoryType: 'working',
                brainRegion: 'PARIETAL_LOBE',
                apiEndpoint: '/memory',
                description: 'Current tasks & focus'
            },
            'Procedural': {
                memoryType: 'agent',
                brainRegion: 'CEREBELLUM',
                apiEndpoint: '/memory',
                description: 'Skills & habits (system-learned)'
            },
            'Visual': {
                memoryType: 'session',
                brainRegion: 'FRONTAL_LOBE',
                apiEndpoint: '/memory',
                description: 'Images & videos'
            },
            'Contextual': {
                memoryType: 'episodic',
                brainRegion: 'TEMPORAL_LOBE',
                apiEndpoint: '/memory',
                description: 'Conversations & documents'
            }
        };
    }
    
    // Get comprehensive memory stats for all branches
    async getMemoryStats() {
        try {
            const response = await fetch(`${this.baseUrl}/memory/stats?user_id=${this.userId}`);
            const data = await response.json();

            if (data.success) {
                return this.processMemoryStats(data);
            }
            throw new Error(data.error || 'Failed to get memory stats');
        } catch (error) {
            console.warn('Backend memory service not available, using fallback:', error.message);
            return this.getFallbackStats();
        }
    }
    
    // Process raw memory stats into branch-specific data
    processMemoryStats(rawStats) {
        const branchStats = {};
        
        Object.keys(this.branchMapping).forEach(branchName => {
            const mapping = this.branchMapping[branchName];
            const regionData = rawStats.regions[mapping.brainRegion] || {};
            
            branchStats[branchName] = {
                totalMemories: regionData.count || 0,
                recentActivity: regionData.recent_activity || 0,
                avgImportance: regionData.avg_importance || 0,
                memoryTypes: regionData.memory_types || {},
                systemGenerated: this.countSystemGenerated(regionData.memory_types || {}),
                userGenerated: this.countUserGenerated(regionData.memory_types || {}),
                lastUpdated: rawStats.timestamp
            };
        });
        
        return {
            branches: branchStats,
            totalMemories: rawStats.total_memories,
            timestamp: rawStats.timestamp
        };
    }
    
    // Count system-generated memories
    countSystemGenerated(memoryTypes) {
        return (memoryTypes.agent || 0) + (memoryTypes.session || 0);
    }
    
    // Count user-generated memories  
    countUserGenerated(memoryTypes) {
        return (memoryTypes.user || 0) + (memoryTypes.episodic || 0);
    }
    
    // Get detailed memories for a specific branch
    async getBranchMemories(branchName, limit = 50) {
        try {
            const mapping = this.branchMapping[branchName];
            if (!mapping) {
                throw new Error(`Unknown branch: ${branchName}`);
            }

            const response = await fetch(`${this.baseUrl}/memory/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: '', // Empty query to get all memories
                    user_id: this.userId,
                    brain_region: mapping.brainRegion,
                    limit: limit
                })
            });

            const data = await response.json();

            if (data.success) {
                return this.processMemoryList(data.memories, branchName);
            }
            throw new Error(data.error || 'Failed to get memories');
        } catch (error) {
            console.warn(`Backend not available for ${branchName}, using fallback data:`, error.message);
            return this.getFallbackMemories(branchName, limit);
        }
    }

    // Generate fallback demo memories
    getFallbackMemories(branchName, limit = 50) {
        const demoMemories = {
            'Episodic': [
                { content: 'Meeting with team about project roadmap', type: 'user', importance: 0.8 },
                { content: 'Learned about new React patterns from documentation', type: 'system', importance: 0.6 },
                { content: 'Debugging session for memory integration', type: 'user', importance: 0.9 }
            ],
            'Semantic': [
                { content: 'JavaScript async/await patterns and best practices', type: 'system', importance: 0.7 },
                { content: 'Three.js 3D rendering concepts and implementation', type: 'system', importance: 0.8 },
                { content: 'Memory management in web applications', type: 'user', importance: 0.6 }
            ],
            'Working': [
                { content: 'Current task: Integrate memory system with 3D brain', type: 'system', importance: 0.9 },
                { content: 'TODO: Add error handling for API failures', type: 'user', importance: 0.7 },
                { content: 'Active debugging: Branch click handlers', type: 'system', importance: 0.8 }
            ],
            'Procedural': [
                { content: 'Learned pattern: Always check API availability before requests', type: 'system', importance: 0.8 },
                { content: 'Debugging workflow: Console -> Network -> Code', type: 'system', importance: 0.7 },
                { content: 'Code review process for production deployments', type: 'system', importance: 0.9 }
            ],
            'Visual': [
                { content: 'Brain model visualization with colored branches', type: 'user', importance: 0.8 },
                { content: 'UI mockups for memory management interface', type: 'user', importance: 0.6 },
                { content: 'Screenshot of working 3D brain interface', type: 'user', importance: 0.7 }
            ],
            'Contextual': [
                { content: 'Conversation about memory system architecture', type: 'system', importance: 0.8 },
                { content: 'Documentation on MEM0AI integration', type: 'user', importance: 0.7 },
                { content: 'Project requirements for production deployment', type: 'user', importance: 0.9 }
            ]
        };

        const memories = demoMemories[branchName] || [];
        return memories.map((memory, index) => ({
            id: `fallback_${branchName}_${index}`,
            content: memory.content,
            type: memory.type,
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            importance: memory.importance,
            metadata: { source: 'fallback_demo', branch: branchName },
            branchName: branchName,
            isSystemGenerated: memory.type === 'system',
            isUserGenerated: memory.type === 'user',
            accessCount: Math.floor(Math.random() * 10),
            tags: ['demo', branchName.toLowerCase(), memory.type]
        }));
    }
    
    // Process memory list with metadata
    processMemoryList(memories, branchName) {
        return memories.map(memory => ({
            id: memory.id,
            content: memory.memory || memory.content,
            type: this.determineMemorySource(memory),
            timestamp: memory.created_at || memory.timestamp,
            importance: memory.score || 0.5,
            metadata: memory.metadata || {},
            branchName: branchName,
            isSystemGenerated: this.isSystemGenerated(memory),
            isUserGenerated: !this.isSystemGenerated(memory),
            accessCount: memory.access_count || 0,
            tags: this.extractTags(memory)
        }));
    }
    
    // Determine if memory is system-generated
    isSystemGenerated(memory) {
        const memoryType = memory.metadata?.memory_type || memory.memory_type;
        return memoryType === 'agent' || memoryType === 'session';
    }
    
    // Determine memory source
    determineMemorySource(memory) {
        const memoryType = memory.metadata?.memory_type || memory.memory_type;
        return this.isSystemGenerated(memory) ? 'system' : 'user';
    }
    
    // Extract tags from memory
    extractTags(memory) {
        const tags = [];
        const metadata = memory.metadata || {};
        
        if (metadata.tags) tags.push(...metadata.tags);
        if (metadata.category) tags.push(metadata.category);
        if (memory.memory_type) tags.push(memory.memory_type);
        
        return [...new Set(tags)]; // Remove duplicates
    }
    
    // Add new user memory
    async addUserMemory(branchName, memoryData) {
        try {
            const mapping = this.branchMapping[branchName];
            if (!mapping) {
                throw new Error(`Unknown branch: ${branchName}`);
            }

            const response = await fetch(`${this.baseUrl}/memory/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: memoryData.content,
                    user_id: this.userId,
                    brain_region: mapping.brainRegion,
                    metadata: {
                        ...memoryData.metadata,
                        memory_type: mapping.memoryType,
                        source: 'user',
                        title: memoryData.title,
                        tags: memoryData.tags || [],
                        files: memoryData.files || [],
                        url: memoryData.url
                    }
                })
            });

            const data = await response.json();

            if (data.success) {
                return data;
            }
            throw new Error(data.error || 'Failed to add memory');
        } catch (error) {
            console.warn(`Backend not available for adding memory to ${branchName}, using fallback:`, error.message);
            // Fallback: save to localStorage
            const fallbackMemory = {
                id: `fallback_user_${Date.now()}`,
                content: memoryData.content,
                type: 'user',
                timestamp: new Date().toISOString(),
                importance: 0.5,
                metadata: memoryData.metadata || {},
                branchName: branchName,
                isSystemGenerated: false,
                isUserGenerated: true,
                accessCount: 0,
                tags: memoryData.tags || []
            };

            // Save to localStorage
            const stored = localStorage.getItem('fallbackMemories') || '{}';
            const memories = JSON.parse(stored);
            if (!memories[branchName]) memories[branchName] = [];
            memories[branchName].push(fallbackMemory);
            localStorage.setItem('fallbackMemories', JSON.stringify(memories));

            return { success: true, memory: fallbackMemory };
        }
    }
    
    // Delete memory (both user and system)
    async deleteMemory(memoryId) {
        try {
            const response = await fetch(`${this.baseUrl}/memory/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memory_id: memoryId,
                    user_id: this.userId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return data;
            }
            throw new Error(data.error || 'Failed to delete memory');
        } catch (error) {
            console.error('Error deleting memory:', error);
            throw error;
        }
    }
    
    // Search memories across branches
    async searchMemories(query, branchName = null) {
        try {
            const searchParams = {
                query: query,
                user_id: this.userId,
                limit: 20
            };

            if (branchName && this.branchMapping[branchName]) {
                searchParams.brain_region = this.branchMapping[branchName].brainRegion;
            }

            const response = await fetch(`${this.baseUrl}/memory/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchParams)
            });

            const data = await response.json();

            if (data.success) {
                return this.processMemoryList(data.memories, branchName || 'All');
            }
            throw new Error(data.error || 'Search failed');
        } catch (error) {
            console.warn('Backend search not available, using fallback:', error.message);
            // Fallback: search in demo memories
            if (branchName) {
                const memories = this.getFallbackMemories(branchName);
                return memories.filter(memory =>
                    memory.content.toLowerCase().includes(query.toLowerCase()) ||
                    memory.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
                );
            }
            return [];
        }
    }
    
    // Get learning analytics
    async getLearningAnalytics() {
        try {
            const response = await fetch(`${this.baseUrl}/learning/stats`);
            const data = await response.json();
            
            if (data.success) {
                return data.stats;
            }
            return null;
        } catch (error) {
            console.error('Error fetching learning analytics:', error);
            return null;
        }
    }
    
    // Get unified analysis
    async getUnifiedAnalysis() {
        try {
            const response = await fetch(`${this.unifiedUrl}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.userId,
                    content: 'comprehensive_analysis'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return data.results;
            }
            return null;
        } catch (error) {
            console.error('Error fetching unified analysis:', error);
            return null;
        }
    }
    
    // Get fallback stats with demo data
    getFallbackStats() {
        const fallbackBranchStats = {};
        Object.keys(this.branchMapping).forEach((branchName, index) => {
            fallbackBranchStats[branchName] = {
                totalMemories: Math.floor(Math.random() * 20) + 5,
                recentActivity: Math.floor(Math.random() * 10),
                avgImportance: Math.random() * 0.5 + 0.5,
                memoryTypes: {},
                systemGenerated: Math.floor(Math.random() * 10) + 2,
                userGenerated: Math.floor(Math.random() * 15) + 3,
                lastUpdated: new Date().toISOString()
            };
        });

        return {
            branches: fallbackBranchStats,
            totalMemories: Object.values(fallbackBranchStats).reduce((sum, branch) => sum + branch.totalMemories, 0),
            timestamp: new Date().toISOString(),
            fallbackMode: true
        };
    }

    // Get empty stats fallback
    getEmptyStats() {
        const emptyBranchStats = {};
        Object.keys(this.branchMapping).forEach(branchName => {
            emptyBranchStats[branchName] = {
                totalMemories: 0,
                recentActivity: 0,
                avgImportance: 0,
                memoryTypes: {},
                systemGenerated: 0,
                userGenerated: 0,
                lastUpdated: new Date().toISOString()
            };
        });

        return {
            branches: emptyBranchStats,
            totalMemories: 0,
            timestamp: new Date().toISOString()
        };
    }
}

// Global memory integration instance
const memoryIntegration = new MemorySystemIntegration();
