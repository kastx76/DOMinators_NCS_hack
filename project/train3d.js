import * as THREE from 'three';

class Train3DVisualization {
    constructor(line = 'agha-zeralda') {
        this.canvas = document.getElementById('train3d');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.movingPoint = null; // Renamed for clarity
        this.animationId = null;
        this.line = line;

        // Animation timing control
        this.currentStationIndex = 0;
        this.nextStationIndex = 1;
        this.isMoving = true;
        this.isWaiting = false;
        this.movementProgress = 0;
        this.waitStartTime = 0;
        this.moveStartTime = Date.now();

        // Timing constants
        this.TRAVEL_TIME = 20000; // 20 seconds
        this.WAIT_TIME = 5000;    // 5 seconds

        this.stationPositions = this.getStationPositions();
        this.stationTValues = [];

        this.init();
    }

    getStationPositions() {
        // This data defines the invisible path the point will follow
        const stations = {
            'agha': { lat: 36.768, lng: 3.057 }, 'ateliers': { lat: 36.756, lng: 3.065 },
            'h-dey': { lat: 36.745, lng: 3.094 }, 'caroubier': { lat: 36.735, lng: 3.119 },
            'el-harrach': { lat: 36.721, lng: 3.132 }, 'gue-constantine': { lat: 36.697, lng: 3.095 },
            'ain-naadja': { lat: 36.689, lng: 3.077 }, 'baba-ali': { lat: 36.667, lng: 3.052 },
            'birtouta': { lat: 36.630, lng: 3.009 }, 'tessala': { lat: 36.639, lng: 2.935 },
            'sidi-abdellah': { lat: 36.680, lng: 2.892 }, 'sidi-abdellah-university': { lat: 36.692, lng: 2.871 },
            'zeralda': { lat: 36.702, lng: 2.849 }, 'blida': { lat: 36.478, lng: 2.815 },
            'afroune': { lat: 36.473, lng: 2.624 }, 'ain-defla': { lat: 36.267, lng: 1.969 },
            'chlef': { lat: 36.166, lng: 1.342 }, 'relizane': { lat: 35.748, lng: 0.555 },
            'oran': { lat: 35.698, lng: -0.638 }
        };
        const lineStations = {
            'agha-zeralda': ['agha', 'ateliers', 'h-dey', 'caroubier', 'el-harrach', 'gue-constantine', 'ain-naadja', 'baba-ali', 'birtouta', 'tessala', 'sidi-abdellah', 'sidi-abdellah-university', 'zeralda'],
            'oran-agha': ['agha', 'el-harrach', 'blida', 'afroune', 'ain-defla', 'chlef', 'relizane', 'oran']
        };
        const centerLat = 36.768, centerLng = 3.057, latScale = 100, lngScale = 50;
        return lineStations[this.line].map(id => {
            const s = stations[id];
            return new THREE.Vector3((s.lng - centerLng) * lngScale, 0, (s.lat - centerLat) * latScale);
        });
    }

    init() {
        if (!this.canvas) return;
        try {
            this.setupScene();
            this.createMovementPath(); // Creates the invisible path logic
            this.createMovingPoint();  // Creates the visible point
            this.setupLighting();
            this.setupCamera();
            this.setupRenderer();
            this.setupEventListeners();
            this.animate();
        } catch (error) {
            console.error('Error initializing 3D visualization:', error);
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1d232a); // Darker background
        this.scene.fog = new THREE.Fog(0x1d232a, 15, 60);
    }

    // This function now only defines the path data, without creating a visible object
    createMovementPath() {
        const path = new THREE.CurvePath();
        for (let i = 0; i < this.stationPositions.length - 1; i++) {
            path.add(new THREE.LineCurve3(this.stationPositions[i], this.stationPositions[i + 1]));
        }
        this.trackCurve = path;
        this.computeStationTValues();
        
        // --- MODIFICATION: The visible railway line is no longer added to the scene ---
        // const trackGeometry = new THREE.TubeGeometry(...);
        // const trackMaterial = new THREE.MeshLambertMaterial(...);
        // this.railwayLine = new THREE.Mesh(trackGeometry, trackMaterial);
        // this.scene.add(this.railwayLine);
    }
    
    computeStationTValues() {
        const curveLengths = this.trackCurve.getCurveLengths();
        const totalLength = curveLengths[curveLengths.length - 1];
        this.stationTValues = [0];
        for (let i = 0; i < curveLengths.length - 1; i++) {
             this.stationTValues.push(curveLengths[i] / totalLength);
        }
        this.stationTValues.push(1);
    }

    // --- MODIFICATION: This function creates a small, bright point ---
    createMovingPoint() {
        const geometry = new THREE.SphereGeometry(0.15, 12, 12); // Smaller point
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Bright yellow color
        this.movingPoint = new THREE.Mesh(geometry, material);
        this.scene.add(this.movingPoint);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        // Camera follows the point, so mouse interaction can be simplified or removed
        window.updateTrainRotation = () => {}; // Disable mouse rotation
    }

    onWindowResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    updateAnimation() {
        const now = Date.now();
        const stationCount = this.stationPositions.length;

        if (!this.isMoving && !this.isWaiting) return;

        if (this.isWaiting) {
            if (now - this.waitStartTime > this.WAIT_TIME) {
                if (this.currentStationIndex >= stationCount - 1) {
                    this.isWaiting = false;
                    return;
                }
                this.isWaiting = false;
                this.isMoving = true;
                this.moveStartTime = now;
                this.movementProgress = 0;
                this.nextStationIndex = this.currentStationIndex + 1;
            }
        }

        if (this.isMoving) {
            const elapsed = now - this.moveStartTime;
            this.movementProgress = Math.min(elapsed / this.TRAVEL_TIME, 1.0);

            if (this.movementProgress >= 1.0) {
                this.isMoving = false;
                this.isWaiting = true;
                this.waitStartTime = now;
                this.currentStationIndex = this.nextStationIndex;
            }
        }
        
        if (this.nextStationIndex >= stationCount) {
             const finalPos = this.trackCurve.getPointAt(1);
             this.movingPoint.position.copy(finalPos);
             return;
        }

        const startT = this.stationTValues[this.currentStationIndex];
        const endT = this.stationTValues[this.nextStationIndex];
        const currentT = THREE.MathUtils.lerp(startT, endT, this.movementProgress);
        const position = this.trackCurve.getPointAt(currentT);
        
        this.movingPoint.position.copy(position);
        this.camera.lookAt(this.movingPoint.position); // Camera now follows the point
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        this.updateAnimation();
        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Train3DVisualization('agha-zeralda'); 
});