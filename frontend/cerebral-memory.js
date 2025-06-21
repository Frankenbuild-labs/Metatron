// Production Memory Management System
class MemoryManager {
    constructor() {
        this.memoryIntegration = window.memoryIntegration;
        this.currentBranch = null;
        this.currentMemories = [];
        this.memoryStats = {};
    }

    // Load memories from backend API
    async loadMemories(branchName) {
        try {
            this.currentBranch = branchName;
            this.currentMemories = await this.memoryIntegration.getBranchMemories(branchName);
            return this.currentMemories;
        } catch (error) {
            console.error(`Error loading ${branchName} memories:`, error);
            return [];
        }
    }

    // Get memory statistics
    async getMemoryStats() {
        try {
            this.memoryStats = await this.memoryIntegration.getMemoryStats();
            return this.memoryStats;
        } catch (error) {
            console.error('Error loading memory stats:', error);
            return this.memoryIntegration.getEmptyStats();
        }
    }

    // Add new user memory via API
    async addMemory(branchName, memoryData) {
        try {
            const result = await this.memoryIntegration.addUserMemory(branchName, memoryData);

            // Reload memories to get updated list
            await this.loadMemories(branchName);

            return result;
        } catch (error) {
            console.error(`Error adding memory to ${branchName}:`, error);
            throw error;
        }
    }

    // Remove memory via API (works for both user and system memories)
    async removeMemory(memoryId) {
        try {
            const result = await this.memoryIntegration.deleteMemory(memoryId);

            // Reload current branch memories
            if (this.currentBranch) {
                await this.loadMemories(this.currentBranch);
            }

            return result;
        } catch (error) {
            console.error('Error removing memory:', error);
            throw error;
        }
    }

    // Get memories for current branch
    getMemories(branchName) {
        if (branchName === this.currentBranch) {
            return this.currentMemories;
        }
        return [];
    }

    // Search memories via API
    async searchMemories(query, branchName = null) {
        try {
            return await this.memoryIntegration.searchMemories(query, branchName);
        } catch (error) {
            console.error('Error searching memories:', error);
            return [];
        }
    }

    // Get branch statistics
    getBranchStats(branchName) {
        if (this.memoryStats.branches && this.memoryStats.branches[branchName]) {
            return this.memoryStats.branches[branchName];
        }
        return {
            totalMemories: 0,
            systemGenerated: 0,
            userGenerated: 0,
            recentActivity: 0,
            avgImportance: 0
        };
    }

    // Filter memories by type
    filterMemoriesByType(memories, type) {
        if (type === 'all') return memories;
        if (type === 'system') return memories.filter(m => m.isSystemGenerated);
        if (type === 'user') return memories.filter(m => m.isUserGenerated);
        return memories;
    }
}

// Global memory manager instance (will be initialized later)
let memoryManager;

// Memory popup management
async function openMemoryManager(memoryType, branchData) {
    const modal = document.getElementById('memoryManagerModal');
    if (!modal) {
        createMemoryManagerModal();
    }

    const modalTitle = document.getElementById('memoryModalTitle');
    const modalContent = document.getElementById('memoryModalContent');

    // Get branch statistics
    const stats = memoryManager.getBranchStats(memoryType);

    modalTitle.innerHTML = `
        <i class="fas fa-brain" style="color: ${branchData.color}"></i>
        ${memoryType} Memory
        <span class="memory-description">${branchData.description}</span>
        <div class="memory-stats-header">
            <span class="stat-item">Total: ${stats.totalMemories}</span>
            <span class="stat-item">System: ${stats.systemGenerated}</span>
            <span class="stat-item">User: ${stats.userGenerated}</span>
        </div>
    `;

    modalContent.innerHTML = createMemoryInterface(memoryType, branchData.color);

    document.getElementById('memoryManagerModal').classList.add('active');

    // Load real memory data
    await loadMemoryList(memoryType);
}

function createMemoryManagerModal() {
    const modalHTML = `
        <div class="memory-manager-modal" id="memoryManagerModal">
            <div class="memory-manager-container">
                <div class="memory-manager-header">
                    <div class="memory-title" id="memoryModalTitle">
                        Memory Manager
                    </div>
                    <button class="close-memory-btn" onclick="closeMemoryManager()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="memory-manager-body" id="memoryModalContent">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function createMemoryInterface(memoryType, color) {
    return `
        <div class="memory-interface">
            <!-- Add Memory Section -->
            <div class="add-memory-section">
                <h3>Add New ${memoryType} Memory</h3>
                <div class="memory-form">
                    <input type="text" id="memoryTitle" placeholder="Memory title..." class="memory-input">
                    <textarea id="memoryContent" placeholder="Describe this memory..." rows="3" class="memory-textarea"></textarea>

                    <div class="memory-attachments">
                        <div class="attachment-row">
                            <input type="url" id="memoryUrl" placeholder="Add URL..." class="memory-input">
                            <button onclick="addUrl('${memoryType}')" class="attachment-btn">
                                <i class="fas fa-link"></i> Add URL
                            </button>
                        </div>

                        <div class="attachment-row">
                            <input type="file" id="memoryFile" multiple accept="image/*,video/*,.pdf,.doc,.docx,.txt" class="file-input">
                            <button onclick="document.getElementById('memoryFile').click()" class="attachment-btn">
                                <i class="fas fa-paperclip"></i> Add Files
                            </button>
                        </div>
                    </div>

                    <div class="memory-tags">
                        <input type="text" id="memoryTags" placeholder="Tags (comma separated)..." class="memory-input">
                    </div>

                    <button onclick="saveMemory('${memoryType}', '${color}')" class="save-memory-btn" style="background: ${color}">
                        <i class="fas fa-save"></i> Save Memory
                    </button>
                </div>
            </div>

            <!-- Memory List Section -->
            <div class="memory-list-section">
                <div class="memory-list-header">
                    <h3>All ${memoryType} Memories</h3>
                    <div class="memory-controls">
                        <select id="memoryFilter" onchange="filterMemories('${memoryType}')" class="filter-select">
                            <option value="all">All Memories</option>
                            <option value="user">User Added</option>
                            <option value="system">System Generated</option>
                        </select>
                        <input type="text" id="memorySearch" placeholder="Search memories..." class="search-input"
                               onkeyup="searchMemories('${memoryType}')">
                    </div>
                </div>
                <div class="memory-list" id="memoryList">
                    <div class="loading-memories">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading memories...
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function saveMemory(memoryType, color) {
    const title = document.getElementById('memoryTitle').value;
    const content = document.getElementById('memoryContent').value;
    const url = document.getElementById('memoryUrl').value;
    const tags = document.getElementById('memoryTags').value.split(',').map(t => t.trim()).filter(t => t);
    const fileInput = document.getElementById('memoryFile');

    if (!title && !content && !url && fileInput.files.length === 0) {
        showNotification('Please add some content to save', '#ff6b6b');
        return;
    }

    const memoryData = {
        title: title || 'Untitled Memory',
        content: content || title || 'Memory content',
        url: url,
        tags: tags,
        files: [],
        metadata: {
            source: 'user',
            created_via: 'cerebral_interface'
        }
    };

    // Handle file uploads (simplified - in real app you'd upload to server)
    if (fileInput.files.length > 0) {
        Array.from(fileInput.files).forEach(file => {
            memoryData.files.push({
                name: file.name,
                type: file.type,
                size: file.size
            });
        });
    }

    try {
        // Show saving state
        const saveBtn = document.querySelector('.save-memory-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        await memoryManager.addMemory(memoryType, memoryData);

        // Clear form
        document.getElementById('memoryTitle').value = '';
        document.getElementById('memoryContent').value = '';
        document.getElementById('memoryUrl').value = '';
        document.getElementById('memoryTags').value = '';
        document.getElementById('memoryFile').value = '';

        // Reload memory list
        await loadMemoryList(memoryType);

        // Show success message
        showNotification('Memory saved successfully!', color);

        // Reset button
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;

    } catch (error) {
        console.error('Error saving memory:', error);
        showNotification('Failed to save memory: ' + error.message, '#ff6b6b');

        // Reset button
        const saveBtn = document.querySelector('.save-memory-btn');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Memory';
        saveBtn.disabled = false;
    }
}

async function loadMemoryList(memoryType) {
    const listContainer = document.getElementById('memoryList');

    try {
        // Show loading state
        listContainer.innerHTML = `
            <div class="loading-memories">
                <i class="fas fa-spinner fa-spin"></i>
                Loading ${memoryType} memories...
            </div>
        `;

        // Load memories from API
        const memories = await memoryManager.loadMemories(memoryType);

        if (memories.length === 0) {
            listContainer.innerHTML = '<div class="no-memories">No memories found for this branch</div>';
            return;
        }

        // Apply current filter
        const filter = document.getElementById('memoryFilter')?.value || 'all';
        const filteredMemories = memoryManager.filterMemoriesByType(memories, filter);

        if (filteredMemories.length === 0) {
            listContainer.innerHTML = '<div class="no-memories">No memories match the current filter</div>';
            return;
        }

        listContainer.innerHTML = filteredMemories.map(memory => `
            <div class="memory-item ${memory.isSystemGenerated ? 'system-memory' : 'user-memory'}" data-id="${memory.id}">
                <div class="memory-item-header">
                    <div class="memory-title-section">
                        <h4>${memory.content.substring(0, 50)}${memory.content.length > 50 ? '...' : ''}</h4>
                        <div class="memory-badges">
                            <span class="memory-type-badge ${memory.type}">${memory.type}</span>
                            ${memory.importance > 0.7 ? '<span class="importance-badge high">High</span>' : ''}
                            ${memory.accessCount > 5 ? '<span class="access-badge">Frequently Used</span>' : ''}
                        </div>
                    </div>
                    <div class="memory-actions">
                        <button onclick="viewMemoryDetails('${memory.id}', '${memoryType}')" class="view-btn" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteMemory('${memoryType}', '${memory.id}')" class="delete-btn" title="Delete Memory">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="memory-content">${memory.content}</div>
                ${memory.metadata?.url ? `<div class="memory-url"><a href="${memory.metadata.url}" target="_blank"><i class="fas fa-external-link-alt"></i> ${memory.metadata.url}</a></div>` : ''}
                ${memory.tags.length > 0 ? `<div class="memory-tags-display">${memory.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
                <div class="memory-metadata">
                    <span class="memory-timestamp">${new Date(memory.timestamp).toLocaleString()}</span>
                    <span class="memory-importance">Importance: ${(memory.importance * 100).toFixed(0)}%</span>
                    ${memory.accessCount > 0 ? `<span class="memory-access">Accessed: ${memory.accessCount} times</span>` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading memory list:', error);
        listContainer.innerHTML = `
            <div class="memory-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error Loading Memories</h4>
                <p>${error.message}</p>
                <button onclick="loadMemoryList('${memoryType}')" class="retry-btn">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }
}

async function deleteMemory(memoryType, memoryId) {
    if (confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
        try {
            await memoryManager.removeMemory(memoryId);
            await loadMemoryList(memoryType);
            showNotification('Memory deleted successfully', '#ff6b6b');
        } catch (error) {
            console.error('Error deleting memory:', error);
            showNotification('Failed to delete memory: ' + error.message, '#ff6b6b');
        }
    }
}

// Filter memories by type
async function filterMemories(memoryType) {
    await loadMemoryList(memoryType);
}

// View detailed memory information
function viewMemoryDetails(memoryId, memoryType) {
    const memory = memoryManager.currentMemories.find(m => m.id === memoryId);
    if (!memory) {
        showNotification('Memory not found', '#ff6b6b');
        return;
    }

    const detailModal = createMemoryDetailModal(memory, memoryType);
    document.body.appendChild(detailModal);
    detailModal.classList.add('active');
}

// Create memory detail modal
function createMemoryDetailModal(memory, memoryType) {
    const modal = document.createElement('div');
    modal.className = 'memory-detail-modal';
    modal.innerHTML = `
        <div class="memory-detail-container">
            <div class="memory-detail-header">
                <h3>Memory Details</h3>
                <button onclick="this.closest('.memory-detail-modal').remove()" class="close-detail-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="memory-detail-body">
                <div class="detail-section">
                    <h4>Content</h4>
                    <div class="detail-content">${memory.content}</div>
                </div>

                <div class="detail-section">
                    <h4>Metadata</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Type:</span>
                            <span class="detail-value ${memory.type}">${memory.type}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Branch:</span>
                            <span class="detail-value">${memory.branchName}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Created:</span>
                            <span class="detail-value">${new Date(memory.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Importance:</span>
                            <span class="detail-value">${(memory.importance * 100).toFixed(0)}%</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Access Count:</span>
                            <span class="detail-value">${memory.accessCount}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Memory ID:</span>
                            <span class="detail-value memory-id">${memory.id}</span>
                        </div>
                    </div>
                </div>

                ${memory.tags.length > 0 ? `
                    <div class="detail-section">
                        <h4>Tags</h4>
                        <div class="detail-tags">
                            ${memory.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                ${Object.keys(memory.metadata).length > 0 ? `
                    <div class="detail-section">
                        <h4>Additional Metadata</h4>
                        <div class="detail-metadata">
                            ${Object.entries(memory.metadata).map(([key, value]) => `
                                <div class="metadata-item">
                                    <span class="metadata-key">${key}:</span>
                                    <span class="metadata-value">${JSON.stringify(value)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="detail-actions">
                    <button onclick="deleteMemory('${memoryType}', '${memory.id}'); this.closest('.memory-detail-modal').remove();" class="delete-detail-btn">
                        <i class="fas fa-trash"></i> Delete Memory
                    </button>
                </div>
            </div>
        </div>
    `;

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    return modal;
}

async function searchMemories(memoryType) {
    const query = document.getElementById('memorySearch').value;
    const listContainer = document.getElementById('memoryList');

    if (!query.trim()) {
        await loadMemoryList(memoryType);
        return;
    }

    try {
        // Show searching state
        listContainer.innerHTML = `
            <div class="loading-memories">
                <i class="fas fa-search fa-spin"></i>
                Searching memories...
            </div>
        `;

        const results = await memoryManager.searchMemories(query, memoryType);

        if (results.length === 0) {
            listContainer.innerHTML = '<div class="no-memories">No memories found matching your search</div>';
            return;
        }

        // Apply current filter to search results
        const filter = document.getElementById('memoryFilter')?.value || 'all';
        const filteredResults = memoryManager.filterMemoriesByType(results, filter);

        if (filteredResults.length === 0) {
            listContainer.innerHTML = '<div class="no-memories">No search results match the current filter</div>';
            return;
        }

        listContainer.innerHTML = filteredResults.map(memory => `
            <div class="memory-item search-result ${memory.isSystemGenerated ? 'system-memory' : 'user-memory'}" data-id="${memory.id}">
                <div class="memory-item-header">
                    <div class="memory-title-section">
                        <h4>${memory.content.substring(0, 50)}${memory.content.length > 50 ? '...' : ''}</h4>
                        <div class="memory-badges">
                            <span class="memory-type-badge ${memory.type}">${memory.type}</span>
                            <span class="search-badge">Search Result</span>
                        </div>
                    </div>
                    <div class="memory-actions">
                        <button onclick="viewMemoryDetails('${memory.id}', '${memoryType}')" class="view-btn" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteMemory('${memoryType}', '${memory.id}')" class="delete-btn" title="Delete Memory">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="memory-content">${memory.content}</div>
                <div class="memory-metadata">
                    <span class="memory-timestamp">${new Date(memory.timestamp).toLocaleString()}</span>
                    <span class="memory-branch">Branch: ${memory.branchName}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error searching memories:', error);
        listContainer.innerHTML = `
            <div class="memory-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Search Error</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function closeMemoryManager() {
    document.getElementById('memoryManagerModal').classList.remove('active');
}

function showNotification(message, color) {
    const notification = document.createElement('div');
    notification.className = 'memory-notification';
    notification.style.background = color;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize memory system
async function initializeMemorySystem() {
    try {
        // Wait for memory integration to be available
        if (typeof memoryIntegration === 'undefined') {
            console.warn('Memory integration not available, retrying...');
            setTimeout(initializeMemorySystem, 1000);
            return;
        }

        memoryManager = new MemoryManager();

        // Load initial memory stats
        await memoryManager.getMemoryStats();

        console.log('✅ Memory system initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize memory system:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMemorySystem);
} else {
    initializeMemorySystem();
}

// Make functions globally available
window.openMemoryManager = openMemoryManager;
window.closeMemoryManager = closeMemoryManager;
window.saveMemory = saveMemory;
window.deleteMemory = deleteMemory;
window.searchMemories = searchMemories;
window.filterMemories = filterMemories;
window.viewMemoryDetails = viewMemoryDetails;
