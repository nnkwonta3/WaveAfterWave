// Priority Queue Implementation from cs4590 lib, had problems with importing directly
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        // Create a wrapper object with element and priority
        const queueElement = { element, priority };
        let contains = false;

        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > queueElement.priority) {
                // Insert at the correct position
                this.items.splice(i, 0, queueElement);
                contains = true;
                break;
            }
        }

        // End of the queue if highest priority
        if (!contains) {
            this.items.push(queueElement);
        }
    }

    dequeue() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items.shift().element;
    }

    front() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items[0].element;
    }

    back() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items[this.items.length - 1].element;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    stringify() {
        let str = "";
        for (let i = 0; i < this.items.length; i++)
            str += JSON.stringify(this.items[i]) + " ";
        return str;
    }
}

// Simple JSON Notifier Implementation
function createJSONNotifier(callback) {
    const notifier = {
        events: [],
        timers: [],
        isRunning: false,

        async loadJSONData(filename) {
            try {
                const response = await fetch(filename);
                if (!response.ok) {
                    throw new Error(`Failed to load ${filename}: ${response.status}`);
                }
                this.events = await response.json();
                console.log(`Loaded ${this.events.length} events from ${filename}`);
            } catch (error) {
                console.error('Error loading JSON data:', error);
                throw error;
            }
        },

        start() {
            if (this.isRunning) return;

            this.isRunning = true;
            const startTime = Date.now();

            // Schedule each event based on timestamp
            this.events.forEach(event => {
                const delay = event.timestamp;

                if (delay >= 0) {
                    const timer = setTimeout(() => {
                        if (this.isRunning) {
                            callback(event);
                        }
                    }, delay);

                    this.timers.push(timer);
                }
            });

            console.log('JSON notifier started');
        },

        stop() {
            this.isRunning = false;

            // Clear all timers
            this.timers.forEach(timer => clearTimeout(timer));
            this.timers = [];

            console.log('JSON notifier stopped');
        }
    };

    return notifier;
}

// WaveafterWave Sonification System
class WaveafterWave {
    constructor() {
        this.audioContext = null;
        this.jsonNotifier = null;
        this.isPlaying = false;
        this.currentContext = 'office';
        this.currentDataset = 'json/ExampleData_1.json';
        this.activeFilters = {
            twitter: true,
            email: true,
            text: true,
            call: true,
            voicemail: true
        };

        this.songSource = null;
        this.songGain = null;
        this.isSongPlaying = false;
        this.songBuffer = null;

        console.log('WaveafterWave constructor called');

        // Audio components
        this.ambientSource = null;
        this.ambientGain = null;
        this.masterGain = null;
        this.convolver = null;
        this.filter = null;

        // Sound banks
        this.soundBuffers = {};
        this.ambientBuffers = {};

        // Event queue for handling simultaneous events
        this.eventQueue = [];
        this.currentlyPlaying = [];
        this.priorityQueue = new PriorityQueue();

        // Contextual audio properties
// Contextual audio properties - INCREASED VOLUME
        this.contextSettings = {
            office: {
                description: 'Quiet hum + typing',
                filterType: 'lowpass',
                filterFreq: 2000,
                reverbLevel: 0.3,
                stereoSpread: 1.0,
                delayLevel: 0,
                gain: 0.6  // Increased from 0.1 to 0.6 (6x louder)
            },
            street: {
                description: 'Traffic + wind',
                filterType: 'bandpass',
                filterFreq: 1000,
                filterQ: 1,
                reverbLevel: 0.1,
                stereoSpread: 0.8,
                delayLevel: 0,
                gain: 0.8  // Increased from 0.2 to 0.8 (4x louder)
            },
            cafe: {
                description: 'Crowd murmur + cups',
                filterType: 'bandpass',
                filterFreq: 800,
                filterQ: 0.5,
                reverbLevel: 0.4,
                stereoSpread: 1.2,
                delayLevel: 0.3,
                gain: 0.7  // Increased from 0.15 to 0.7 (4.6x louder)
            },
            home: {
                description: 'HVAC drone',
                filterType: 'lowpass',
                filterFreq: 3000,
                reverbLevel: 0.1,
                stereoSpread: 1.0,
                delayLevel: 0,
                gain: 0.5
            }
        };
        // Audio nodes for effects
        this.stereoSpreadNodes = [];
        this.delayNode = null;
        this.reverbNode = null;

        console.log('WaveafterWave constructor called');
    }
// Replace these specific methods in your app.js:

    async init() {
        // Initialize Web Audio API
        await this.initAudio();

        // Load sound assets
        await this.loadSounds();

        // Load inspiration song
        await this.loadSong();

        // Set up UI event listeners
        this.setupEventListeners();

        // Initialize status display
        this.updateStatusDisplay();

        // Pre-initialize ambient audio nodes (but don't start yet)
        this.initializeAmbientAudio();

        // Add volume control
        this.addVolumeControl();

        console.log('WaveafterWave initialized successfully');

        // Add debug and song buttons
        this.addDebugButton();
    }

    initializeAmbientAudio() {
        // Pre-create the ambient gain node so it's always available
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.gain.value = 0; // Start muted

        console.log('Ambient audio nodes pre-initialized');
    }

    async startSimulation() {
        if (this.isPlaying) return;

        // Stop song if playing
        if (this.isSongPlaying) {
            this.stopInspirationSong();
        }

        try {
            this.isPlaying = true;
            this.updateStatusDisplay();

            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                console.log('Audio context suspended, resuming...');
                await this.audioContext.resume();
            }

            // Start ambient sound
            this.changeAmbientSound();

            // Load and start JSON event stream
            await this.loadJSONData(this.currentDataset);

            this.addLogEntry(`Simulation started with ${this.currentDataset} in ${this.currentContext} context`);

        } catch (error) {
            console.error('Error starting simulation:', error);
            this.addLogEntry('Error starting simulation: ' + error.message, 'error');
            this.isPlaying = false;
            this.updateStatusDisplay();
        }
    }

    async loadSong() {
        try {
            console.log('Loading inspiration song: waves.mp3');
            this.songBuffer = await this.loadAudioBuffer('sounds/waves.mp3');
            console.log('Inspiration song loaded successfully');
        } catch (error) {
            console.error('Failed to load inspiration song:', error);
            this.addLogEntry('Could not load inspiration song', 'error');
        }
    }

    playInspirationSong() {
        if (this.isSongPlaying) {
            this.stopInspirationSong();
            return;
        }

        if (!this.songBuffer) {
            this.addLogEntry('Song not loaded yet', 'error');
            return;
        }

        try {
            // Stop any current simulation
            if (this.isPlaying) {
                this.stopSimulation();
            }

            // Create song source
            this.songSource = this.audioContext.createBufferSource();
            this.songSource.buffer = this.songBuffer;

            // Create song gain node
            this.songGain = this.audioContext.createGain();
            this.songGain.gain.value = 0.7; // Comfortable listening volume

            // Connect: song -> gain -> master
            this.songSource.connect(this.songGain);
            this.songGain.connect(this.masterGain);

            // Set up song end handler
            this.songSource.onended = () => {
                this.isSongPlaying = false;
                this.updateSongButton();
                this.addLogEntry('Inspiration song finished playing');
            };

            // Start playing
            this.songSource.start();
            this.isSongPlaying = true;
            this.updateSongButton();

            this.addLogEntry('🎵 Now playing: "Waves" by Mr. Probz - The inspiration for this application');

        } catch (error) {
            console.error('Error playing song:', error);
            this.addLogEntry('Error playing inspiration song', 'error');
        }
    }

    stopInspirationSong() {
        if (!this.isSongPlaying || !this.songSource) return;

        try {
            this.songSource.stop();
            this.songSource = null;
            this.songGain = null;
            this.isSongPlaying = false;
            this.updateSongButton();

            this.addLogEntry('Inspiration song stopped');
        } catch (error) {
            console.error('Error stopping song:', error);
        }
    }

    updateSongButton() {
        const songBtn = document.getElementById('songBtn');
        if (songBtn) {
            if (this.isSongPlaying) {
                songBtn.textContent = '⏹️ Stop Song';
                songBtn.style.background = '#dc3545';
            } else {
                songBtn.textContent = '🎵 Play Song';
                songBtn.style.background = '#6f42c1'; // Purple color for music
            }
        }
    }

// Update the addDebugButton method to include song button
    addDebugButton() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '10px';
        buttonContainer.style.right = '10px';
        buttonContainer.style.zIndex = '1000';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '5px';

        // Debug Audio Button
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '🔧 Debug Audio';
        debugBtn.style.background = '#ff6b6b';
        debugBtn.style.padding = '8px 12px';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '4px';
        debugBtn.style.color = 'white';
        debugBtn.style.cursor = 'pointer';
        debugBtn.style.fontSize = '12px';

        debugBtn.addEventListener('click', () => {
            this.checkAudioState();
            this.testAudioOutput();
        });

        // Song Button
        const songBtn = document.createElement('button');
        songBtn.id = 'songBtn';
        songBtn.textContent = '🎵 Play Song';
        songBtn.style.background = '#6f42c1';
        songBtn.style.padding = '8px 12px';
        songBtn.style.border = 'none';
        songBtn.style.borderRadius = '4px';
        songBtn.style.color = 'white';
        songBtn.style.cursor = 'pointer';
        songBtn.style.fontSize = '12px';

        songBtn.addEventListener('click', () => {
            this.playInspirationSong();
        });

        buttonContainer.appendChild(debugBtn);
        buttonContainer.appendChild(songBtn);
        document.body.appendChild(buttonContainer);
    }

// Update the init method to load the song

    changeAmbientSound() {
        console.log(`Changing ambient sound to: ${this.currentContext}`);

        // Stop current ambient sound if playing
        if (this.ambientSource) {
            console.log('Stopping previous ambient sound');
            this.ambientSource.stop();
            this.ambientSource = null;
        }

        // Clean up previous effects
        this.cleanupAudioEffects();

        // Check if we have a buffer for this context
        if (!this.ambientBuffers[this.currentContext]) {
            console.warn(`No ambient buffer found for ${this.currentContext}, generating synthetic`);
            this.ambientBuffers[this.currentContext] = this.generateAmbientBuffer(this.currentContext);
        }

        // Create new ambient source
        this.ambientSource = this.audioContext.createBufferSource();
        this.ambientSource.buffer = this.ambientBuffers[this.currentContext];
        this.ambientSource.loop = true;

        // Apply context-specific effects
        this.applyContextEffects();

        // Set up the complete audio chain
        this.setupEffectsChain();

        // Start playing
        this.ambientSource.start();

        console.log(`Ambient sound started for ${this.currentContext}`);
        console.log(`Audio context state: ${this.audioContext.state}`);
        console.log(`Ambient gain value: ${this.ambientGain.gain.value}`);

        this.addLogEntry(`Context changed to ${this.currentContext}: ${this.contextSettings[this.currentContext].description}`);
    }

    setupEffectsChain() {
        const settings = this.contextSettings[this.currentContext];
        console.log(`Setting up effects chain for ${this.currentContext}:`, settings);

        // Clear any existing connections
        this.ambientSource.disconnect();
        this.ambientGain.disconnect();

        // Start fresh: source -> gain
        this.ambientSource.connect(this.ambientGain);
        let lastNode = this.ambientGain;

        // 1. Stereo Spread (for Café context)
        if (settings.stereoSpread !== 1.0) {
            console.log('Applying stereo spread:', settings.stereoSpread);
            lastNode = this.setupStereoSpread(lastNode, settings.stereoSpread);
        }

        // 2. Delay (for Café context)
        if (settings.delayLevel > 0) {
            console.log('Applying delay:', settings.delayLevel);
            lastNode = this.setupDelay(lastNode, settings.delayLevel);
        }

        // 3. Reverb
        if (settings.reverbLevel > 0) {
            console.log('Applying reverb:', settings.reverbLevel);
            lastNode = this.setupReverb(lastNode, settings.reverbLevel);
        }

        // 4. Filter (always applied)
        console.log('Applying filter:', settings.filterType, settings.filterFreq);
        lastNode = this.setupFilter(lastNode, settings);

        // 5. Final connection to master output
        lastNode.connect(this.masterGain);

        console.log('Effects chain setup complete');
    }

    setupStereoSpread(inputNode, spread) {
        try {
            const panner = this.audioContext.createStereoPanner();
            panner.pan.value = (spread - 1.0) * 0.1;

            inputNode.connect(panner);
            this.stereoSpreadNodes = [panner];
            return panner;

        } catch (error) {
            console.warn('Stereo spread setup failed, connecting directly:', error);
            this.stereoSpreadNodes = [inputNode];
            return inputNode;
        }
    }

    setupDelay(inputNode, level) {
        try {
            const delay = this.audioContext.createDelay();
            delay.delayTime.value = 0.1;

            const feedback = this.audioContext.createGain();
            feedback.gain.value = level * 0.3;

            // Connect input to delay
            inputNode.connect(delay);

            // Connect delay to output and feedback
            delay.connect(feedback);
            feedback.connect(delay);

            this.delayNode = delay;
            return delay;

        } catch (error) {
            console.warn('Delay setup failed, connecting directly:', error);
            this.delayNode = inputNode;
            return inputNode;
        }
    }

    setupReverb(inputNode, level) {
        try {
            const reverb = this.audioContext.createConvolver();

            // Create impulse response
            const sampleRate = this.audioContext.sampleRate;
            const length = sampleRate * 2;
            const impulse = this.audioContext.createBuffer(2, length, sampleRate);

            for (let channel = 0; channel < 2; channel++) {
                const data = impulse.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2) * level;
                }
            }

            reverb.buffer = impulse;
            inputNode.connect(reverb);

            this.reverbNode = reverb;
            return reverb;

        } catch (error) {
            console.warn('Reverb setup failed, connecting directly:', error);
            this.reverbNode = inputNode;
            return inputNode;
        }
    }

    setupFilter(inputNode, settings) {
        // Create a new filter for this context
        const filter = this.audioContext.createBiquadFilter();
        filter.type = settings.filterType;
        filter.frequency.value = settings.filterFreq;

        if (settings.filterQ) {
            filter.Q.value = settings.filterQ;
        }

        inputNode.connect(filter);
        this.filter = filter;
        return filter;
    }

    applyContextEffects() {
        const settings = this.contextSettings[this.currentContext];

        // Set ambient volume - UNMUTE HERE
        this.ambientGain.gain.value = settings.gain;

        console.log(`Applied ${this.currentContext} context effects:`, settings);
    }

// Update the checkAudioState method to be more informative
    checkAudioState() {
        console.log('Audio Context State:', this.audioContext ? this.audioContext.state : 'No context');
        console.log('Master Gain:', this.masterGain ? this.masterGain.gain.value : 'No master gain');
        console.log('Ambient Source:', this.ambientSource ? 'PLAYING' : 'NULL (start simulation to create)');
        console.log('Ambient Gain:', this.ambientGain ? `Exists (gain: ${this.ambientGain.gain.value})` : 'Null');
        console.log('Current Context:', this.currentContext);
        console.log('Available Buffers:', Object.keys(this.ambientBuffers));
        console.log('Is Playing:', this.isPlaying);

        // If ambient source is null but we should be playing, start it
        if (this.isPlaying && !this.ambientSource) {
            console.log('Audio state inconsistent - restarting ambient sound');
            this.changeAmbientSound();
        }
    }


    async initAudio() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 1.0; // Increased from 0.8 to 1.0 (maximum)
            this.masterGain.connect(this.audioContext.destination);

            // Create effect nodes
            this.convolver = this.audioContext.createConvolver();
            this.filter = this.audioContext.createBiquadFilter();

            // Set up audio graph - simplified direct connection
            this.filter.connect(this.masterGain);

            console.log('Audio context initialized, state:', this.audioContext.state);

            // Add click event to resume audio context on user interaction
            this.setupAudioContextResume();

        } catch (error) {
            console.error('Error initializing audio:', error);
            this.addLogEntry('Error initializing audio system', 'error');
        }
    }

    setupAudioContextResume() {
        // Resume audio context on any user interaction
        const resumeAudio = async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('Audio context resumed after user interaction');
                this.addLogEntry('Audio context resumed - sounds should work now');
            }
        };

        // Add event listeners for user interaction
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
    }

    async loadSounds() {
        try {
            console.log('Starting to load sounds...');

            // Load ambient sound files for each context
            await this.loadAmbientSounds();

            // Create synthetic notification sounds
            await this.createSyntheticNotificationSounds();

            console.log('All sounds loaded successfully');
            console.log('Available ambient buffers:', Object.keys(this.ambientBuffers));

        } catch (error) {
            console.error('Error loading sounds:', error);
            this.addLogEntry('Error loading sound assets, using synthetic sounds', 'error');
            // Fall back to synthetic ambient sounds
            await this.createSyntheticAmbientSounds();
        }
    }

    async loadAmbientSounds() {
        console.log('Loading ambient sounds...');

        // Define the ambient sound files for each context
        const ambientFiles = {
            office: 'sounds/office-ambient.wav',
            street: 'sounds/street-ambient.wav',
            cafe: 'sounds/cafe-ambient.wav',
            home: 'sounds/home-ambient.wav'
        };

        // Try to load each sound file
        for (const [context, filePath] of Object.entries(ambientFiles)) {
            try {
                const buffer = await this.loadAudioBuffer(filePath);
                this.ambientBuffers[context] = buffer;
                console.log(`✅ Loaded ambient sound for ${context}`);
            } catch (error) {
                console.warn(`Failed to load ${filePath}:`, error);
                // Don't throw here - we'll use synthetic sounds as fallback
            }
        }

        // Check which contexts need synthetic sounds
        const missingContexts = Object.keys(ambientFiles).filter(context => !this.ambientBuffers[context]);
        if (missingContexts.length > 0) {
            console.log(`Creating synthetic sounds for: ${missingContexts.join(', ')}`);
            await this.createSyntheticAmbientSoundsForContexts(missingContexts);
        }
    }

    async loadAudioBuffer(url) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';

            request.onload = () => {
                this.audioContext.decodeAudioData(
                    request.response,
                    buffer => resolve(buffer),
                    error => reject(error)
                );
            };

            request.onerror = () => {
                reject(new Error(`Failed to load audio: ${url}`));
            };

            request.send();
        });
    }

    async createSyntheticAmbientSoundsForContexts(contexts) {
        for (const context of contexts) {
            console.log(`Creating synthetic ambient sound for ${context}...`);
            this.ambientBuffers[context] = this.generateAmbientBuffer(context);
            console.log(`Created synthetic ambient sound for ${context}`);
        }
    }

    async createSyntheticAmbientSounds() {
        console.log('Creating synthetic ambient sounds for all contexts...');
        const contexts = ['office', 'street', 'cafe', 'home'];
        for (const context of contexts) {
            this.ambientBuffers[context] = this.generateAmbientBuffer(context);
        }
        console.log('All synthetic ambient sounds created');
    }

    generateAmbientBuffer(context) {
        const duration = 8; // Longer duration for more variety
        const sampleRate = this.audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, bufferSize, sampleRate);

        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / sampleRate;

            // Generate context-specific ambient noise
            let leftSample = 0;
            let rightSample = 0;

            switch(context) {
                case 'office':
                    // Quiet hum with occasional typing sounds
                    leftSample = this.generateOfficeSound(t, i, sampleRate);
                    rightSample = this.generateOfficeSound(t, i, sampleRate);
                    break;
                case 'street':
                    // Traffic + wind sounds
                    leftSample = this.generateStreetSound(t, i, sampleRate);
                    rightSample = this.generateStreetSound(t, i, sampleRate);
                    break;
                case 'cafe':
                    // Crowd murmur + cup sounds
                    leftSample = this.generateCafeSound(t, i, sampleRate, true);
                    rightSample = this.generateCafeSound(t, i, sampleRate, false);
                    break;
                case 'home':
                    // HVAC drone
                    leftSample = this.generateHomeSound(t, i, sampleRate);
                    rightSample = this.generateHomeSound(t, i, sampleRate);
                    break;
            }

            leftChannel[i] = leftSample;
            rightChannel[i] = rightSample;
        }

        return buffer;
    }

    generateOfficeSound(t, i, sampleRate) {
        // Base hum - INCREASED VOLUME
        let sample = Math.sin(2 * Math.PI * 60 * t) * 0.03; // Increased from 0.005

        // White noise for air conditioning - INCREASED VOLUME
        sample += (Math.random() * 2 - 1) * 0.05; // Increased from 0.008

        // Occasional typing sounds (more frequent) - INCREASED VOLUME
        if (i % (sampleRate * 0.5) < sampleRate * 0.05) {
            sample += Math.random() * 0.3 * Math.sin(2 * Math.PI * 2000 * t); // Increased from 0.1
        }

        // Occasional keyboard clicks - INCREASED VOLUME
        if (i % (sampleRate * 2) < sampleRate * 0.02) {
            sample += Math.random() * 0.4; // Increased from 0.15
        }

        return sample;
    }

    generateStreetSound(t, i, sampleRate) {
        // Traffic rumble - INCREASED VOLUME
        let sample = Math.sin(2 * Math.PI * 80 * t) * 0.1; // Increased from 0.02

        // Wind noise - INCREASED VOLUME
        sample += (Math.random() * 2 - 1) * 0.15; // Increased from 0.03

        // Occasional car pass-by - INCREASED VOLUME
        const carInterval = sampleRate * 3;
        const carPosition = (i % carInterval) / carInterval;
        const carVolume = Math.sin(carPosition * Math.PI) * 0.3; // Increased from 0.1
        sample += Math.sin(2 * Math.PI * 200 * t) * carVolume;

        // High-frequency traffic noise - INCREASED VOLUME
        sample += Math.sin(2 * Math.PI * 800 * t) * 0.05; // Increased from 0.01

        return sample;
    }

    generateCafeSound(t, i, sampleRate, isLeftChannel) {
        // Base crowd murmur - INCREASED VOLUME
        let sample = (Math.random() * 2 - 1) * 0.2; // Increased from 0.04

        // Stereo spread: slight variation between channels
        const channelOffset = isLeftChannel ? 0 : 0.1;

        // Occasional cup clinks (stereo positioned) - INCREASED VOLUME
        if (i % (sampleRate * 1.5) < sampleRate * 0.03) {
            const pan = isLeftChannel ? -0.3 : 0.3;
            sample += Math.random() * 0.5 * (0.7 + pan); // Increased from 0.2
        }

        // Conversational snippets (random bursts) - INCREASED VOLUME
        if (i % (sampleRate * 4) < sampleRate * 0.5) {
            sample += (Math.random() * 2 - 1) * 0.2; // Increased from 0.06
        }

        return sample;
    }

    generateHomeSound(t, i, sampleRate) {
        // HVAC drone - smooth low frequency - INCREASED VOLUME
        let sample = Math.sin(2 * Math.PI * 50 * t) * 0.02; // Increased from 0.003

        // Gentle background noise - INCREASED VOLUME
        sample += (Math.random() * 2 - 1) * 0.03; // Increased from 0.005

        // Occasional house sounds (less frequent) - INCREASED VOLUME
        if (i % (sampleRate * 8) < sampleRate * 0.1) {
            sample += Math.random() * 0.2; // Increased from 0.08
        }

        // Very subtle high frequency for air movement - INCREASED VOLUME
        sample += Math.sin(2 * Math.PI * 400 * t) * 0.005; // Increased from 0.001

        return sample;
    }

    async createSyntheticNotificationSounds() {
        const notificationTypes = [
            { type: 'Tweet', freq: 800, duration: 0.1, wave: 'sine' },
            { type: 'Email', freq: 600, duration: 0.3, wave: 'sine' },
            { type: 'TextMessage', freq: 1000, duration: 0.05, wave: 'square' },
            { type: 'PhoneCall', freq: 400, duration: 0.5, wave: 'sawtooth' },
            { type: 'VoiceMail', freq: 300, duration: 0.4, wave: 'triangle' }
        ];

        for (const notif of notificationTypes) {
            this.soundBuffers[notif.type] = this.generateNotificationBuffer(notif);
        }
    }

    generateNotificationBuffer({ type, freq, duration, wave }) {
        const sampleRate = this.audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / sampleRate;
            const envelope = 1 - (t / duration); // Simple decay envelope

            switch(wave) {
                case 'sine':
                    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
                    break;
                case 'square':
                    data[i] = (Math.sin(2 * Math.PI * freq * t) > 0 ? 0.15 : -0.15) * envelope;
                    break;
                case 'sawtooth':
                    data[i] = (2 * (t * freq - Math.floor(0.5 + t * freq))) * envelope * 0.2;
                    break;
                case 'triangle':
                    data[i] = Math.asin(Math.sin(2 * Math.PI * freq * t)) * (2 / Math.PI) * envelope * 0.25;
                    break;
            }

            // Add type-specific characteristics
            switch(type) {
                case 'Tweet':
                    // Add FM modulation for chirp effect
                    data[i] *= Math.sin(2 * Math.PI * 20 * t) * 0.5 + 0.5;
                    break;
                case 'Email':
                    // Soft filter effect
                    data[i] *= Math.exp(-t * 2);
                    break;
                case 'PhoneCall':
                    // Ring modulation
                    data[i] *= Math.sin(2 * Math.PI * 2 * t) * 0.3 + 0.7;
                    break;
                case 'VoiceMail':
                    // Record click effect at start
                    if (t < 0.05) {
                        data[i] += Math.random() * 0.1;
                    }
                    break;
            }
        }

        return buffer;
    }

    setupEventListeners() {
        // Context selection
        document.querySelectorAll('input[name="context"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentContext = e.target.value;
                this.updateStatusDisplay();
                this.changeAmbientSound();
            });
        });

        // Dataset selection - updated paths to include json/ folder
        document.querySelectorAll('input[name="dataset"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentDataset = e.target.value;
                this.updateStatusDisplay();
                this.stopSimulation();
            });
        });

        // Event filters - map JSON types to filter names
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.activeFilters[e.target.name] = e.target.checked;
                this.updateStatusDisplay();
            });
        });

        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startSimulation());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopSimulation());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSimulation());

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.masterGain) {
                    this.masterGain.gain.value = 0.1; // Reduce volume when tab is hidden
                }
            } else {
                if (this.masterGain) {
                    this.masterGain.gain.value = 0.8; // Restore volume when tab is visible
                }
            }
        });
    }

    addVolumeControl() {
        const volumeControl = document.createElement('div');
        volumeControl.style.position = 'fixed';
        volumeControl.style.bottom = '10px';
        volumeControl.style.right = '10px';
        volumeControl.style.zIndex = '1000';
        volumeControl.style.background = 'white';
        volumeControl.style.padding = '10px';
        volumeControl.style.borderRadius = '8px';
        volumeControl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

        volumeControl.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">Master Volume</div>
        <input type="range" id="masterVolume" min="0" max="100" value="80" style="width: 150px;">
        <span id="volumeValue" style="margin-left: 10px;">80%</span>
    `;

        document.body.appendChild(volumeControl);

        const volumeSlider = document.getElementById('masterVolume');
        const volumeValue = document.getElementById('volumeValue');

        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            if (this.masterGain) {
                this.masterGain.gain.value = volume;
            }
            volumeValue.textContent = e.target.value + '%';
        });
    }

    updateStatusDisplay() {
        document.getElementById('currentContext').textContent =
            this.currentContext.charAt(0).toUpperCase() + this.currentContext.slice(1);

        document.getElementById('currentDataset').textContent =
            this.currentDataset.replace('json/ExampleData_', 'Dataset ').replace('.json', '');

        const activeEvents = Object.keys(this.activeFilters)
            .filter(key => this.activeFilters[key])
            .map(key => {
                // Map filter names to display names
                const nameMap = {
                    'twitter': 'Tweet',
                    'email': 'Email',
                    'text': 'TextMessage',
                    'call': 'PhoneCall',
                    'voicemail': 'VoiceMail'
                };
                return nameMap[key] || key;
            });

        document.getElementById('activeEvents').textContent =
            activeEvents.length === 5 ? 'All' : activeEvents.join(', ');

        document.getElementById('simulationStatus').textContent =
            this.isPlaying ? 'Running' : 'Stopped';

        // Update button states
        document.getElementById('startBtn').disabled = this.isPlaying;
        document.getElementById('stopBtn').disabled = !this.isPlaying;
    }


    async loadJSONData(filename) {
        try {
            // Create JSON notifier
            this.jsonNotifier = createJSONNotifier(this.handleNotification.bind(this));
            await this.jsonNotifier.loadJSONData(filename);
            this.jsonNotifier.start();

        } catch (error) {
            console.error('Error loading JSON data:', error);
            throw error;
        }
    }

    stopSimulation() {
        if (!this.isPlaying) return;

        this.isPlaying = false;

        // Stop ambient sound
        if (this.ambientSource) {
            this.ambientSource.stop();
            this.ambientSource = null;
        }

        // Stop JSON notifier
        if (this.jsonNotifier) {
            this.jsonNotifier.stop();
        }

        // Clear queues
        this.eventQueue = [];
        this.priorityQueue = new PriorityQueue();

        // Stop all currently playing sounds
        this.currentlyPlaying.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Source might have already ended
            }
        });
        this.currentlyPlaying = [];

        this.addLogEntry('Simulation stopped');
        this.updateStatusDisplay();
    }

    resetSimulation() {
        this.stopSimulation();

        // Clear event log
        const logContainer = document.getElementById('logContainer');
        logContainer.innerHTML = '<p class="log-entry">No events yet. Start the simulation to see events.</p>';

        this.addLogEntry('Simulation reset');
    }


    cleanupAudioEffects() {
        // Disconnect and clean up previous effects nodes
        if (this.stereoSpreadNodes.length > 0) {
            this.stereoSpreadNodes.forEach(node => {
                try {
                    node.disconnect();
                } catch (e) {
                    // Node might already be disconnected
                }
            });
            this.stereoSpreadNodes = [];
        }

        if (this.delayNode) {
            try {
                this.delayNode.disconnect();
            } catch (e) {
                // Node might already be disconnected
            }
            this.delayNode = null;
        }

        if (this.reverbNode) {
            try {
                this.reverbNode.disconnect();
            } catch (e) {
                // Node might already be disconnected
            }
            this.reverbNode = null;
        }
    }

    // Simple audio test
    testAudioOutput() {
        console.log('Testing audio output...');

        if (!this.audioContext) {
            console.log('No audio context available');
            return;
        }

        if (this.audioContext.state === 'suspended') {
            console.log('Audio context is suspended - click anywhere to resume');
            this.addLogEntry('Audio context suspended - click anywhere to enable sound');
            return;
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.1;

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            console.log('Audio test complete - you should have heard a tone');
            this.addLogEntry('Audio test: you should have heard a test tone');
        }, 500);
    }

    handleNotification(event) {
        // Map JSON event types to filter names
        const typeMap = {
            'Tweet': 'twitter',
            'Email': 'email',
            'TextMessage': 'text',
            'PhoneCall': 'call',
            'VoiceMail': 'voicemail'
        };

        const filterType = typeMap[event.type];

        // Check if this event type is active
        if (!filterType || !this.activeFilters[filterType]) {
            return;
        }

        // Add to priority queue
        this.priorityQueue.enqueue(event, event.priority || 1);

        // Process queue
        this.processEventQueue();

        // Log the event
        this.addLogEntry(
            `${event.type} from ${event.sender}: ${event.message || 'Notification'}`,
            filterType
        );
    }

    processEventQueue() {
        // Process up to 3 events simultaneously
        if (!this.priorityQueue.isEmpty() && this.currentlyPlaying.length < 3) {
            const event = this.priorityQueue.dequeue();
            this.playNotificationSound(event);
        }
    }

    playNotificationSound(event) {
        try {
            // Create audio source for notification
            const source = this.audioContext.createBufferSource();
            source.buffer = this.soundBuffers[event.type];

            // Create gain node for volume control based on priority
            const gainNode = this.audioContext.createGain();
            const baseVolume = 0.3;
            const priorityVolume = (event.priority || 1) * 0.1;
            gainNode.gain.value = baseVolume + priorityVolume;

            // Create panner for spatialization
            const panner = this.audioContext.createStereoPanner();

            // Set spatial position based on event type
            let panValue = 0;
            switch(event.type) {
                case 'Tweet': panValue = -0.7; break;
                case 'Email': panValue = -0.3; break;
                case 'TextMessage': panValue = 0; break;
                case 'PhoneCall': panValue = 0.3; break;
                case 'VoiceMail': panValue = 0.7; break;
            }

            // Apply context-specific adjustments to spatialization
            if (this.currentContext === 'street') {
                panValue *= 0.5; // More centered for safety
            }

            panner.pan.value = panValue;

            // Connect nodes: source -> gain -> panner -> master
            source.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(this.masterGain);

            // Apply additional effects based on event properties
            this.applyNotificationEffects(event, gainNode);

            // Start playing
            source.start();

            // Add to currently playing list
            this.currentlyPlaying.push(source);

            // Remove from list when done
            source.onended = () => {
                const index = this.currentlyPlaying.indexOf(source);
                if (index > -1) {
                    this.currentlyPlaying.splice(index, 1);
                }
                // Process next events in queue
                setTimeout(() => this.processEventQueue(), 100);
            };

            // Use TTS for high priority events or specific types
            if ((event.priority >= 3) || event.type === 'VoiceMail') {
                this.speakNotification(event);
            }

        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }

    applyNotificationEffects(event, gainNode) {
        // Create and apply context-specific filters
        if (this.currentContext === 'street') {
            const highPassFilter = this.audioContext.createBiquadFilter();
            highPassFilter.type = 'highpass';
            highPassFilter.frequency.value = 500;
            gainNode.disconnect();
            gainNode.connect(highPassFilter);
            highPassFilter.connect(this.masterGain);
        }

        // Add slight distortion for high-priority events
        if (event.priority >= 3) {
            const waveShaper = this.audioContext.createWaveShaper();
            waveShaper.curve = this.makeDistortionCurve(20);
            gainNode.disconnect();
            gainNode.connect(waveShaper);
            waveShaper.connect(this.masterGain);
        }
    }

    makeDistortionCurve(amount) {
        const samples = 256;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }

        return curve;
    }

    speakNotification(event) {
        // Use Web Speech API for text-to-speech
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance();

            // Create appropriate message based on event type
            let message = '';
            switch(event.type) {
                case 'Tweet':
                    message = `Tweet from ${event.sender}`;
                    if (event.message) {
                        message += `. ${event.message.substring(0, 30)}`;
                    }
                    break;
                case 'Email':
                    message = `Email from ${event.sender}`;
                    if (event.message) {
                        message += `. ${event.message.substring(0, 30)}`;
                    }
                    break;
                case 'TextMessage':
                    message = `Text from ${event.sender}`;
                    if (event.message) {
                        message += `. ${event.message.substring(0, 30)}`;
                    }
                    break;
                case 'PhoneCall':
                    message = `Call from ${event.sender}`;
                    break;
                case 'VoiceMail':
                    message = `Voicemail from ${event.sender}`;
                    if (event.message) {
                        message += `. ${event.message.substring(0, 30)}`;
                    }
                    break;
            }

            utterance.text = message;

            // Adjust speech parameters based on context
            utterance.rate = this.currentContext === 'street' ? 1.2 : 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            // Cancel any ongoing speech
            speechSynthesis.cancel();

            // Speak the message
            speechSynthesis.speak(utterance);
        }
    }

    addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        const logEntry = document.createElement('p');
        logEntry.className = `log-entry ${type}`;

        const timestamp = new Date().toLocaleTimeString();
        logEntry.textContent = `[${timestamp}] ${message}`;

        // Remove initial placeholder if it exists
        const firstChild = logContainer.firstChild;
        if (firstChild && firstChild.textContent.includes('No events yet')) {
            logContainer.removeChild(firstChild);
        }

        logContainer.appendChild(logEntry);

        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;

        // Limit log entries to prevent memory issues
        const entries = logContainer.getElementsByClassName('log-entry');
        if (entries.length > 50) {
            logContainer.removeChild(entries[0]);
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.wawApp = new WaveafterWave();
    window.wawApp.init().catch(error => {
        console.error('Failed to initialize WaveafterWave:', error);
    });
});