
# **<u>WaveafterWave Simulator</u>** 

## **System Architecture Overview** 

### **Core Architecture** 

The WaveafterWave simulator is built as a single-page web application using JavaScript with the Web Audio API. The system follows a modular architecture with these key components: 

1. **Audio Engine** (WaveafterWave class) 

   - Manages Web Audio Context and master gain chain 

   - Handles ambient sound generation and contextual effects 

   - Processes notification sounds with priority-based scheduling 

2. **Event Processing System** 

   - PriorityQueue for handling simultaneous notifications 

   - JSONNotifier for loading and scheduling JSON event streams 

   - Real-time event filtering and spatial audio positioning 

3. **Context Management** 

   - Four environmental contexts with distinct audio profiles 

   - Dynamic audio processing chain per context 

   - Real-time context switching with smooth transitions 

### **Audio Processing Chain** 

Ambient Source → Ambient Gain → [Stereo Spread] → [Delay] → [Reverb] → Filter → Master Gain → Output 

**How to Experience Different Scenarios:** _Please note these might take some time before you hear the sounds._ 

**1. Context Exploration** 

   - **Office Environment:** 

      - Select "Office" context 

      - Listen for quiet office and system hum with occasional keyboard typing 

      - Notice the low-pass filtering creating a professional atmosphere 

**Street Environment:** 


- Select "Street" context 

- Experience traffic noise with wind effects 

- Observe band-pass filtering for safety awareness 

- Notifications are more centered for environmental awareness 

### **Café Environment:** 

- Select "Café" context 

- Hear crowd murmur with cup clinking sounds 

- Experience stereo spread and reverb for spaciousness 

- Notice how notifications blend with social atmosphere 

### **Home Environment:** 

- Select "Home" context 

- Listen to subtle fridge drone with minimal filtering 

- Experience the most natural, unobtrusive background 

### **2. Advanced Features Demonstration** 

### **Simultaneous Event Handling:** 

- The system processes up to 3 events simultaneously 

- High-priority events (≥3) trigger text-to-speech 

- Spatial positioning prevents auditory masking: 

   - Tweets: Left-panned (-0.7) 

   - Emails: Left-center (-0.3) 

   - Texts: Center (0) 

   - Calls: Right-center (0.3) 

   - Voicemails: Right-panned (0.7) 

### **Priority-Based Scheduling:** 

- Events are processed in priority order (1-4, with 4 being highest) 

- High-priority events receive volume boosts and distortion effects 

- Rapid low-priority bursts are summarized to prevent overload 


### **Sonification Scheme Recap** 

### **Notification Sounds** 

- **Tweets** : Bright FM-modulated chirps (800Hz sine, 0.1s) 

- **Emails** : Soft filtered chimes (600Hz sine, 0.3s) 

- **Texts** : Quick percussive pings (1000Hz square, 0.05s) 

- **Calls** : Urgent ringing tones (400Hz sawtooth, 0.5s) 

- **Voicemails** : Record-click followed by TTS (300Hz triangle, 0.4s) 

### **Contextual Adaptation** 

Each context modifies both ambient sounds and notification presentation: 

- **Volume Adjustment** : Context-appropriate loudness levels 

- **Filtering** : Frequency shaping for environmental suitability 

- **Spatial Processing** : Safety-aware panning in street contexts 

- **Effects** : Reverb and delay for environmental realism 

### **Parameter Mapping** 

- **Priority → Volume & Brightness** : Louder/brighter = more urgent 

- **Emotional Valence → Harmony** : Consonant = positive, dissonant = negative 

- **Information Density → Rhythm** : Frequent events summarized via tempo 

- **Sender Identity → TTS Voice** : Distinct timbres aid recall 

### **Changes from the Original Design** 

**1. Simplified Audio Effects Chain** 

   - **Original** : Complex multi-stage processing with convolution reverb 

   - **Implemented** : Streamlined effects with fallback mechanisms 

   - **Reason** : Substituting non playable sounds or audio load errors 

**2. Added Debug Features** 

   - **Original** : No debugging tools 

   - **Implemented** : Audio state monitoring and test tones 

   - **Reason** : Development and troubleshooting needs 



### **Not Implemented: Advanced Contextual Adaptation Features** 

The following contextual adaptations from the original design document were not implemented in the current version: 

- Working Out Context: High-frequency boost and TTS reduction 

- Walking Context: Dedicated high-pass filtering and spatial offset 

- Socializing Context: Volume automation and brief motifs 

- Presenting Context: Priority 4-only pulse notifications 

**Reason:** These features were too advanced to implement. 

### **Additional Features Beyond Requirements** 

### **1. Song Integration** 

- Dedicated "Waves" by Mr. Probz playback 

- Automatic simulation pausing during song playback 

- YouTube integration for original song access and credit 

### **2. Audio Controls** 

- Real-time master volume slider 

- Audio context state monitoring 

- One-click audio testing functionality 

- Visual feedback for all audio states 

