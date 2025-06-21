// Simple 3D Brain Memory System
class CerebralBrain {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.brain = null;
        this.branches = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Memory types and their positions
        this.memoryTypes = [
            { name: 'Episodic', color: '#FF6B6B', position: [2, 1, 0], description: 'Personal experiences & events' },
            { name: 'Semantic', color: '#4ECDC4', position: [-2, 1, 0], description: 'Facts & knowledge' },
            { name: 'Working', color: '#45B7D1', position: [0, 2, 1], description: 'Current tasks & focus' },
            { name: 'Procedural', color: '#96CEB4', position: [0, -2, 1], description: 'Skills & habits' },
            { name: 'Visual', color: '#FFEAA7', position: [1.5, -1, -1.5], description: 'Images & videos' },
            { name: 'Contextual', color: '#DDA0DD', position: [-1.5, -1, -1.5], description: 'Conversations & documents' }
        ];
        
        this.init();
    }
    
    init() {
        // Create scene with platform-matching background
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a); // Match --bg-primary
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        
        // Create brain center
        this.createBrain();
        
        // Create memory branches
        this.createBranches();
        
        // Add lighting
        this.addLighting();
        
        // Add controls
        this.addControls();
        
        // Start animation
        this.animate();
        
        // Add event listeners
        this.addEventListeners();
    }
    
    createBrain() {
        // Create digital brain group
        this.brain = new THREE.Group();

        // Main brain core (slightly flattened sphere)
        const coreGeometry = new THREE.SphereGeometry(0.6, 32, 24);
        coreGeometry.scale(1, 0.8, 1.2); // Make it more brain-like

        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0x667eea,
            shininess: 100,
            transparent: true,
            opacity: 0.8,
            wireframe: false
        });

        const brainCore = new THREE.Mesh(coreGeometry, coreMaterial);
        this.brain.add(brainCore);

        // Add digital wireframe overlay
        const wireframeGeometry = new THREE.SphereGeometry(0.62, 16, 12);
        wireframeGeometry.scale(1, 0.8, 1.2);

        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x4ECDC4,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });

        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.brain.add(wireframe);

        // Add brain hemispheres detail
        this.createBrainHemispheres();

        // Add digital particles around brain
        this.createDigitalParticles();

        this.scene.add(this.brain);

        // Add brain pulsing animation
        this.brain.userData = { originalScale: 1, pulseSpeed: 0.02 };
    }

    createBrainHemispheres() {
        // Left hemisphere
        const leftHemisphere = new THREE.SphereGeometry(0.58, 16, 12, 0, Math.PI);
        leftHemisphere.scale(1, 0.8, 1.2);
        leftHemisphere.translate(-0.05, 0, 0);

        const leftMaterial = new THREE.MeshPhongMaterial({
            color: 0x5a67d8,
            transparent: true,
            opacity: 0.6
        });

        const leftMesh = new THREE.Mesh(leftHemisphere, leftMaterial);
        this.brain.add(leftMesh);

        // Right hemisphere
        const rightHemisphere = new THREE.SphereGeometry(0.58, 16, 12, Math.PI, Math.PI);
        rightHemisphere.scale(1, 0.8, 1.2);
        rightHemisphere.translate(0.05, 0, 0);

        const rightMaterial = new THREE.MeshPhongMaterial({
            color: 0x7c3aed,
            transparent: true,
            opacity: 0.6
        });

        const rightMesh = new THREE.Mesh(rightHemisphere, rightMaterial);
        this.brain.add(rightMesh);
    }

    createDigitalParticles() {
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            // Create particles in a sphere around the brain
            const radius = 1.2 + Math.random() * 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi) * 0.8; // Flatten slightly
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) * 1.2;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x4ECDC4,
            size: 0.02,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.brain.add(particleSystem);

        // Store for animation
        this.brainParticles = particleSystem;
    }
    
    createBranches() {
        this.memoryTypes.forEach((memType, index) => {
            // Create branch line
            const points = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(memType.position[0], memType.position[1], memType.position[2])
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: memType.color, linewidth: 3 });
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            
            // Create branch node
            const nodeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const nodeMaterial = new THREE.MeshPhongMaterial({ color: memType.color });
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            node.position.set(memType.position[0], memType.position[1], memType.position[2]);
            
            // Add hover and click data
            node.userData = {
                type: 'memoryNode',
                memoryType: memType.name,
                description: memType.description,
                color: memType.color,
                originalScale: 1,
                hovered: false
            };
            
            this.scene.add(node);
            this.branches.push(node);
        });
    }
    
    addLighting() {
        // Ambient light (darker for digital feel)
        const ambientLight = new THREE.AmbientLight(0x202040, 0.4);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0x4ECDC4, 0.6);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Brain core light (pulsing)
        const brainLight = new THREE.PointLight(0x667eea, 1.5, 8);
        brainLight.position.set(0, 0, 0);
        this.scene.add(brainLight);
        this.brainLight = brainLight; // Store for animation

        // Accent lights for digital effect
        const accentLight1 = new THREE.PointLight(0x4ECDC4, 0.8, 6);
        accentLight1.position.set(2, 1, 1);
        this.scene.add(accentLight1);

        const accentLight2 = new THREE.PointLight(0x7c3aed, 0.8, 6);
        accentLight2.position.set(-2, -1, 1);
        this.scene.add(accentLight2);

        // Store accent lights for animation
        this.accentLights = [accentLight1, accentLight2];
    }
    
    addControls() {
        // Simple mouse rotation
        let isMouseDown = false;
        let mouseX = 0, mouseY = 0;
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (isMouseDown) {
                const deltaX = e.clientX - mouseX;
                const deltaY = e.clientY - mouseY;
                
                this.scene.rotation.y += deltaX * 0.01;
                this.scene.rotation.x += deltaY * 0.01;
                
                mouseX = e.clientX;
                mouseY = e.clientY;
            }
        });
    }
    
    addEventListeners() {
        // Mouse move for hover effects
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.handleHover();
        });
        
        // Click events
        this.renderer.domElement.addEventListener('click', (event) => {
            this.handleClick();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }
    
    handleHover() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.branches);
        
        // Reset all branches
        this.branches.forEach(branch => {
            if (branch.userData.hovered) {
                branch.scale.setScalar(branch.userData.originalScale);
                branch.userData.hovered = false;
                this.container.style.cursor = 'default';
            }
        });
        
        // Highlight hovered branch
        if (intersects.length > 0) {
            const branch = intersects[0].object;
            branch.scale.setScalar(1.3);
            branch.userData.hovered = true;
            this.container.style.cursor = 'pointer';
        }
    }
    
    handleClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.branches);
        
        if (intersects.length > 0) {
            const branch = intersects[0].object;
            const memoryType = branch.userData.memoryType;
            
            // Open memory management popup
            this.openMemoryPopup(memoryType, branch.userData);
        }
    }
    
    openMemoryPopup(memoryType, branchData) {
        // Create and show memory management popup
        window.openMemoryManager(memoryType, branchData);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());

        // Brain pulsing and digital effects animation
        if (this.brain) {
            const time = Date.now() * this.brain.userData.pulseSpeed;
            const scale = 1 + Math.sin(time) * 0.03;
            this.brain.scale.setScalar(scale);
            this.brain.rotation.y += 0.003;

            // Animate wireframe opacity
            const wireframe = this.brain.children[1]; // Second child is wireframe
            if (wireframe) {
                wireframe.material.opacity = 0.2 + Math.sin(time * 2) * 0.1;
            }

            // Animate particles
            if (this.brainParticles) {
                this.brainParticles.rotation.y += 0.001;
                this.brainParticles.rotation.x += 0.0005;

                // Pulse particle opacity
                this.brainParticles.material.opacity = 0.6 + Math.sin(time * 3) * 0.2;
            }

            // Animate hemisphere colors
            const leftHemisphere = this.brain.children[2];
            const rightHemisphere = this.brain.children[3];
            if (leftHemisphere && rightHemisphere) {
                const colorShift = Math.sin(time * 1.5) * 0.1;
                leftHemisphere.material.opacity = 0.6 + colorShift;
                rightHemisphere.material.opacity = 0.6 - colorShift;
            }
        }

        // Animate lights
        if (this.brainLight) {
            const lightTime = Date.now() * 0.003;
            this.brainLight.intensity = 1.2 + Math.sin(lightTime) * 0.3;
        }

        if (this.accentLights) {
            const lightTime = Date.now() * 0.002;
            this.accentLights[0].intensity = 0.6 + Math.sin(lightTime) * 0.2;
            this.accentLights[1].intensity = 0.6 + Math.sin(lightTime + Math.PI) * 0.2;
        }

        // Auto-rotate scene slowly
        this.scene.rotation.y += 0.001;

        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
    }
}
