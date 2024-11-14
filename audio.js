// Audio controller for the turnero system
class AudioController {
    constructor() {
        this.bgMusic = new Audio('https://assets.codepen.io/2689599/death-note-theme.mp3');
        this.newTicketSound = new Audio('https://assets.codepen.io/2689599/write-sound.mp3');
        this.completeSound = new Audio('https://assets.codepen.io/2689599/page-flip.mp3');
        
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.3;
        
        // Initialize mute state
        this.isMuted = localStorage.getItem('audioMuted') === 'true';
        this.updateMuteState();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('audioMuted', this.isMuted);
        this.updateMuteState();
    }

    updateMuteState() {
        const elements = [this.bgMusic, this.newTicketSound, this.completeSound];
        elements.forEach(audio => {
            if (audio) audio.muted = this.isMuted;
        });
        
        // Update mute button icon if it exists
        const muteBtn = document.getElementById('muteButton');
        if (muteBtn) {
            muteBtn.innerHTML = this.isMuted ? '🔇' : '🔊';
        }
    }

    playBackgroundMusic() {
        this.bgMusic.play().catch(e => console.log('Audio playback prevented:', e));
    }

    playNewTicketSound() {
        this.newTicketSound.currentTime = 0;
        this.newTicketSound.play().catch(e => console.log('Audio playback prevented:', e));
    }

    playCompleteSound() {
        this.completeSound.currentTime = 0;
        this.completeSound.play().catch(e => console.log('Audio playback prevented:', e));
    }
}

export const audioController = new AudioController();