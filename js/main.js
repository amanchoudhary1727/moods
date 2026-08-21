/**
 * main.js — Application controller for moods*
 *
 * Handles:
 *  - Application initialization
 *  - UI interactions and mood selection
 *  - Background transitions
 *  - Clock updates
 *  - Player UI synchronization
 *  - Keyboard navigation
 */

const App = (() => {
    'use strict';

    /* ─── State ─── */
    let currentMood = null;
    let isMenuOpen = false;
    let isMobile = window.innerWidth < 768;
    let bgToggle = false; // Flip-flop for background cross-fade layers

    /* ─── Atelier State ─── */
    let atelierBgIndex = parseInt(localStorage.getItem(ATELIER_STORAGE.bgIndex) || '0', 10);

    /* ─── DOM References ─── */
    const dom = {};

    /**
     * Initialize the application
     */
    function init() {
        cacheDom();
        setupEventListeners();
        startClock();
        detectMobile();

        // Set default mood
        setMood(DEFAULT_MOOD, true);

        // Initialize analytics
        Analytics.init();

        // Initialize YouTube player
        Player.init({
            onReady: handlePlayerReady,
            onStateChange: handlePlayerStateChange,
            onVideoChange: handleVideoChange,
            onProgress: handleProgress,
            onError: handlePlayerError
        });
    }

    /**
     * Cache DOM element references
     */
    function cacheDom() {
        dom.bgBack = document.getElementById('bg-back');
        dom.bgFront = document.getElementById('bg-front');
        dom.bgVideo = document.getElementById('bg-video');
        dom.moodsToggle = document.getElementById('moods-toggle');
        dom.moodsPanel = document.getElementById('moods-panel');
        dom.panelBackdrop = document.getElementById('panel-backdrop');
        dom.moodItems = document.querySelectorAll('.mood-item');
        dom.playerThumbImg = document.getElementById('player-thumb-img');
        dom.playerThumbPlaceholder = document.getElementById('player-thumb-placeholder');
        dom.playerTitle = document.getElementById('player-title');
        dom.playerArtist = document.getElementById('player-artist');
        dom.progressBarFill = document.getElementById('progress-bar-fill');
        dom.progressBarContainer = document.getElementById('progress-bar-container');
        dom.timeCurrent = document.getElementById('time-current');
        dom.timeDuration = document.getElementById('time-duration');
        dom.btnPrev = document.getElementById('btn-prev');
        dom.btnPlayPause = document.getElementById('btn-play-pause');
        dom.btnNext = document.getElementById('btn-next');
        dom.btnVolume = document.getElementById('btn-volume');
        dom.volumeSlider = document.getElementById('volume-slider-container');
        dom.volumeSliderFill = document.getElementById('volume-slider-fill');
        dom.clockDisplay = document.getElementById('clock-display');
        dom.playIcon = document.getElementById('play-icon');
        dom.pauseIcon = document.getElementById('pause-icon');
        
        dom.btnSocials = document.getElementById('btn-socials');
        dom.socialsDropdown = document.getElementById('socials-dropdown');

        // Atelier
        dom.atelierModalBackdrop = document.getElementById('atelier-modal-backdrop');
        dom.atelierModal = document.getElementById('atelier-modal');
        dom.atelierInput = document.getElementById('atelier-playlist-input');
        dom.atelierError = document.getElementById('atelier-error');
        dom.atelierSubmit = document.getElementById('atelier-submit');
        dom.atelierCancel = document.getElementById('atelier-cancel');
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Moods menu
        dom.moodsToggle.addEventListener('click', toggleMenu);
        dom.panelBackdrop.addEventListener('click', closeMenu);

        // Mood items
        dom.moodItems.forEach(item => {
            item.addEventListener('click', () => {
                const moodKey = item.dataset.mood;
                if (!moodKey) return;

                // Atelier opens a modal instead of switching directly
                if (moodKey === 'atelier') {
                    closeMenu();
                    openAtelierModal();
                    return;
                }

                if (moodKey !== currentMood) {
                    setMood(moodKey);
                } else {
                    // If clicking the currently active mood, advance to the next background
                    updateBackground(MOODS[moodKey], false, true);
                }
                closeMenu();
            });
        });

        // Change BG button
        const btnNextBg = document.getElementById('btn-next-bg');
        if (btnNextBg) {
            btnNextBg.addEventListener('click', () => {
                if (currentMood === 'atelier') {
                    // Cycle through ALL backgrounds
                    atelierBgIndex = (atelierBgIndex + 1) % ALL_BACKGROUNDS.length;
                    localStorage.setItem(ATELIER_STORAGE.bgIndex, atelierBgIndex);
                    applyAtelierBackground(false);
                } else if (currentMood) {
                    updateBackground(MOODS[currentMood], false, true);
                }
            });
        }

        // Atelier modal events
        if (dom.atelierSubmit) {
            dom.atelierSubmit.addEventListener('click', handleAtelierSubmit);
        }
        if (dom.atelierCancel) {
            dom.atelierCancel.addEventListener('click', closeAtelierModal);
        }
        if (dom.atelierModalBackdrop) {
            dom.atelierModalBackdrop.addEventListener('click', closeAtelierModal);
        }
        if (dom.atelierInput) {
            dom.atelierInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleAtelierSubmit();
                if (e.key === 'Escape') closeAtelierModal();
                dom.atelierError.textContent = '';
                dom.atelierInput.classList.remove('error');
            });
        }

        // Socials Dropdown
        if (dom.btnSocials && dom.socialsDropdown) {
            dom.btnSocials.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dom.socialsDropdown.classList.contains('open');
                dom.socialsDropdown.classList.toggle('open');
                dom.btnSocials.setAttribute('aria-expanded', !isOpen);
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.socials-dropdown-container') && dom.socialsDropdown.classList.contains('open')) {
                    dom.socialsDropdown.classList.remove('open');
                    dom.btnSocials.setAttribute('aria-expanded', 'false');
                }
            });
        }

        // Player controls
        dom.btnPlayPause.addEventListener('click', () => Player.togglePlayPause());
        dom.btnNext.addEventListener('click', () => Player.next());
        dom.btnPrev.addEventListener('click', () => Player.prev());
        dom.btnVolume.addEventListener('click', () => {
            Player.toggleMute();
            updateVolumeIcon();
        });

        // Progress bar seeking
        dom.progressBarContainer.addEventListener('click', handleProgressSeek);

        // Volume slider
        dom.volumeSlider.addEventListener('click', handleVolumeChange);

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeydown);

        // Close menu on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                closeMenu();
            }
        });

        // Responsive detection
        window.addEventListener('resize', debounce(() => {
            const wasMobile = isMobile;
            detectMobile();
            if (wasMobile !== isMobile && currentMood) {
                updateBackground(MOODS[currentMood], false);
            }
        }, 250));
    }

    /**
     * Set the active mood
     * @param {string} moodKey - Key from MOODS object
     * @param {boolean} isInitial - Whether this is the initial load
     */
    function setMood(moodKey, isInitial = false) {
        const mood = MOODS[moodKey];
        if (!mood) return;

        currentMood = moodKey;

        // Update theme CSS variables
        applyTheme(mood.theme);

        // Update background
        updateBackground(mood, isInitial);

        // Update menu highlight
        dom.moodItems.forEach(item => {
            item.classList.toggle('active', item.dataset.mood === moodKey);
        });

        // Load playlist
        if (!isInitial) {
            Player.loadPlaylist(mood.playlistId);
            Analytics.trackMoodChange(moodKey);
        }
    }

    /**
     * Apply mood theme colors to CSS custom properties
     * @param {Object} theme - Theme object from mood definition
     */
    function applyTheme(theme) {
        const root = document.documentElement;
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--accent-alt', theme.accentAlt);
        root.style.setProperty('--accent-rgb', theme.accentRgb);
        root.style.setProperty('--accent-text', theme.accentText || '#ffffff');
        root.style.setProperty('--glow', theme.glow);
        root.style.setProperty('--glow-soft', theme.glowSoft);
        root.style.setProperty('--surface', theme.surface);
        root.style.setProperty('--surface-border', theme.surfaceBorder);
    }

    /**
     * Update background with cinematic cross-fade (images) or video
     * @param {Object} mood - Mood object
     * @param {boolean} instant - Skip transition
     * @param {boolean} advance - Advance to next background sequentially
     */
    function updateBackground(mood, instant = false, advance = false) {
        const bgs = mood.backgrounds;
        
        if (mood.currentBgIndex === undefined) {
            mood.currentBgIndex = 0;
        } else if (advance) {
            mood.currentBgIndex = (mood.currentBgIndex + 1) % bgs.length;
        }
        
        const bg = bgs[mood.currentBgIndex];

        // Video background
        if (bg.type === 'video') {
            // Hide image layers
            dom.bgBack.style.backgroundImage = 'none';
            dom.bgFront.classList.remove('active');
            dom.bgFront.style.backgroundImage = 'none';

            // Show video
            if (dom.bgVideo.getAttribute('src') !== bg.src) {
                dom.bgVideo.src = bg.src;
                dom.bgVideo.load();
            }
            dom.bgVideo.play().catch(() => {});
            if (instant) {
                dom.bgVideo.classList.add('active');
            } else {
                // Small delay for cinematic feel
                requestAnimationFrame(() => dom.bgVideo.classList.add('active'));
            }
            return;
        }

        // Image background — hide video
        dom.bgVideo.classList.remove('active');
        dom.bgVideo.pause();

        const bgUrl = isMobile ? bg.mobile : bg.desktop;

        // Preload image before transitioning
        const img = new Image();
        img.onload = () => {
            if (instant) {
                dom.bgBack.style.backgroundImage = `url('${bgUrl}')`;
                dom.bgFront.style.backgroundImage = `url('${bgUrl}')`;
                dom.bgFront.classList.remove('active');
                return;
            }

            // Cross-fade between the two background layers
            if (bgToggle) {
                dom.bgBack.style.backgroundImage = `url('${bgUrl}')`;
                dom.bgFront.classList.remove('active');
            } else {
                dom.bgFront.style.backgroundImage = `url('${bgUrl}')`;
                dom.bgFront.classList.add('active');
            }
            bgToggle = !bgToggle;
        };
        img.src = bgUrl;
    }

    /**
     * Toggle the moods menu
     */
    function toggleMenu() {
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    /**
     * Open the moods menu
     */
    function openMenu() {
        isMenuOpen = true;
        dom.moodsPanel.classList.add('open');
        dom.panelBackdrop.classList.add('open');
        dom.moodsToggle.classList.add('open');
        dom.moodsToggle.setAttribute('aria-expanded', 'true');

        // Focus first mood item for keyboard nav
        const firstItem = dom.moodsPanel.querySelector('.mood-item');
        if (firstItem) firstItem.focus();
    }

    /**
     * Close the moods menu
     */
    function closeMenu() {
        isMenuOpen = false;
        dom.moodsPanel.classList.remove('open');
        dom.panelBackdrop.classList.remove('open');
        dom.moodsToggle.classList.remove('open');
        dom.moodsToggle.setAttribute('aria-expanded', 'false');
    }

    /* ─── Atelier Modal ─── */

    function openAtelierModal() {
        // Pre-fill saved playlist if exists
        const savedId = localStorage.getItem(ATELIER_STORAGE.playlistId);
        if (savedId && dom.atelierInput.value === '') {
            dom.atelierInput.value = `https://www.youtube.com/playlist?list=${savedId}`;
        }
        dom.atelierError.textContent = '';
        dom.atelierInput.classList.remove('error');
        dom.atelierModal.classList.add('open');
        dom.atelierModalBackdrop.classList.add('open');
        dom.atelierModal.setAttribute('aria-hidden', 'false');
        setTimeout(() => dom.atelierInput.focus(), 300);
    }

    function closeAtelierModal() {
        dom.atelierModal.classList.remove('open');
        dom.atelierModalBackdrop.classList.remove('open');
        dom.atelierModal.setAttribute('aria-hidden', 'true');
    }

    function handleAtelierSubmit() {
        const raw = dom.atelierInput.value.trim();

        // Validate: empty
        if (!raw) {
            showAtelierError('Paste a playlist link to continue.');
            return;
        }

        // Validate: YouTube Music
        if (raw.includes('music.youtube.com')) {
            showAtelierError('YouTube Music links won\'t work here. Open the playlist on youtube.com and paste that link instead.');
            return;
        }

        // Validate: not a YouTube URL at all
        if (!raw.includes('youtube.com') && !raw.includes('youtu.be')) {
            showAtelierError('That doesn\'t look like a YouTube link. Try copying the URL from youtube.com.');
            return;
        }

        // Extract playlist ID
        let playlistId = null;
        try {
            const url = new URL(raw);
            playlistId = url.searchParams.get('list');
        } catch (e) {
            showAtelierError('That doesn\'t look like a valid URL. Try copying it directly from your browser.');
            return;
        }

        if (!playlistId) {
            showAtelierError('Couldn\'t find a playlist in that link. Make sure it\'s a playlist URL, not a single video.');
            return;
        }

        // All good — save and activate
        localStorage.setItem(ATELIER_STORAGE.playlistId, playlistId);
        closeAtelierModal();
        setAtelierMood(playlistId);
    }

    function showAtelierError(msg) {
        dom.atelierError.textContent = msg;
        dom.atelierInput.classList.add('error');
        dom.atelierInput.focus();
    }

    function setAtelierMood(playlistId) {
        currentMood = 'atelier';

        // Apply Atelier theme
        applyTheme(ATELIER.theme);

        // Highlight Atelier card in panel
        dom.moodItems.forEach(item => {
            item.classList.toggle('active', item.dataset.mood === 'atelier');
        });

        // Load saved bg index, defaulting to Silver Surfer (index 0)
        atelierBgIndex = parseInt(localStorage.getItem(ATELIER_STORAGE.bgIndex) || '0', 10);
        if (isNaN(atelierBgIndex) || atelierBgIndex >= ALL_BACKGROUNDS.length) {
            atelierBgIndex = 0;
        }

        applyAtelierBackground(false);

        // Load the playlist
        Player.loadPlaylist(playlistId);
        Analytics.trackMoodChange('atelier');
    }

    function applyAtelierBackground(instant = false) {
        const bg = ALL_BACKGROUNDS[atelierBgIndex];
        if (!bg) return;

        if (bg.type === 'video') {
            dom.bgBack.style.backgroundImage = 'none';
            dom.bgFront.classList.remove('active');
            dom.bgFront.style.backgroundImage = 'none';

            if (dom.bgVideo.getAttribute('src') !== bg.src) {
                dom.bgVideo.src = bg.src;
                dom.bgVideo.load();
            }
            dom.bgVideo.play().catch(() => {});
            if (instant) {
                dom.bgVideo.classList.add('active');
            } else {
                requestAnimationFrame(() => dom.bgVideo.classList.add('active'));
            }
        } else if (bg.type === 'image') {
            const bgUrl = isMobile ? bg.mobile : bg.desktop;
            dom.bgVideo.classList.remove('active');
            dom.bgVideo.pause();
            const img = new Image();
            img.onload = () => {
                if (instant) {
                    dom.bgBack.style.backgroundImage = `url('${bgUrl}')`;
                    dom.bgFront.style.backgroundImage = `url('${bgUrl}')`;
                    dom.bgFront.classList.remove('active');
                } else {
                    if (bgToggle) {
                        dom.bgBack.style.backgroundImage = `url('${bgUrl}')`;
                        dom.bgFront.classList.remove('active');
                    } else {
                        dom.bgFront.style.backgroundImage = `url('${bgUrl}')`;
                        dom.bgFront.classList.add('active');
                    }
                    bgToggle = !bgToggle;
                }
            };
            img.src = bgUrl;
        }
    }

    /* ─── Player Callbacks ─── */

    function handlePlayerReady() {
        // Sync initial volume UI with YouTube player's actual volume
        const vol = Player.getVolume();
        if (dom.volumeSliderFill) {
            dom.volumeSliderFill.style.width = vol + '%';
        }
        updateVolumeIcon();

        // Load the default mood's playlist
        const mood = MOODS[currentMood];
        if (mood) {
            Player.loadPlaylist(mood.playlistId);
        }
    }

    function handlePlayerStateChange(state) {
        if (typeof YT === 'undefined') return;

        const playing = (state === YT.PlayerState.PLAYING);

        // Toggle play/pause icon
        if (dom.playIcon && dom.pauseIcon) {
            dom.playIcon.style.display = playing ? 'none' : 'block';
            dom.pauseIcon.style.display = playing ? 'block' : 'none';
        }
    }

    function handleVideoChange(data) {
        // Update title and artist
        dom.playerTitle.textContent = data.title || 'Untitled';
        dom.playerArtist.textContent = data.author || 'Unknown Artist';

        // Update thumbnail
        if (data.thumbnail) {
            dom.playerThumbImg.src = data.thumbnail;
            dom.playerThumbImg.style.display = 'block';
            dom.playerThumbPlaceholder.style.display = 'none';
        } else {
            dom.playerThumbImg.style.display = 'none';
            dom.playerThumbPlaceholder.style.display = 'flex';
        }
    }

    let lastTimeCurrentStr = '';
    let lastTimeDurationStr = '';

    function handleProgress(currentTime, duration) {
        // Update progress bar
        const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
        dom.progressBarFill.style.width = pct + '%';

        // Update time displays only if they changed
        const currentStr = formatTime(currentTime);
        const durationStr = formatTime(duration);

        if (currentStr !== lastTimeCurrentStr) {
            dom.timeCurrent.textContent = currentStr;
            lastTimeCurrentStr = currentStr;
        }
        if (durationStr !== lastTimeDurationStr) {
            dom.timeDuration.textContent = durationStr;
            lastTimeDurationStr = durationStr;
        }
    }

    function handlePlayerError(errorCode) {
        console.warn('[App] Player error:', errorCode);
        dom.playerTitle.textContent = 'Unable to play';
        dom.playerArtist.textContent = 'Try another mood';
    }

    /* ─── Progress Seeking ─── */

    function handleProgressSeek(e) {
        const rect = dom.progressBarContainer.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const duration = parseTimeDisplay(dom.timeDuration.textContent);
        if (duration > 0) {
            Player.seekTo(pct * duration);
        }
    }

    /* ─── Volume ─── */

    function handleVolumeChange(e) {
        const rect = dom.volumeSlider.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const vol = Math.round(pct * 100);
        Player.setVolume(vol);
        dom.volumeSliderFill.style.width = pct * 100 + '%';
        updateVolumeIcon();
    }

    function updateVolumeIcon() {
        const muted = Player.isMuted();
        const vol = Player.getVolume();
        const volumeSvg = dom.btnVolume.querySelector('svg');
        if (!volumeSvg) return;

        // Update the volume icon based on state
        if (muted || vol === 0) {
            volumeSvg.innerHTML = '<path d="M3.63 3.63a.75.75 0 0 0-1.06 1.06L7.29 9.4H4a1 1 0 0 0-1 1v3.2a1 1 0 0 0 1 1h3.29l4.18 4.18a.75.75 0 0 0 1.28-.53v-4.1l4.18 4.18a.75.75 0 1 0 1.06-1.06L3.63 3.63ZM12.75 4.15a.75.75 0 0 0-1.28-.53L8.1 7.01l4.65 4.65V4.15Z"/>';
        } else {
            volumeSvg.innerHTML = '<path d="M11.47 3.62a.75.75 0 0 1 1.28.53v15.7a.75.75 0 0 1-1.28.53L7.18 16.2H4a1 1 0 0 1-1-1v-6.4a1 1 0 0 1 1-1h3.18l4.29-4.18ZM16.23 8.13a.75.75 0 0 1 1.06 0 5.5 5.5 0 0 1 0 7.74.75.75 0 1 1-1.06-1.06 4 4 0 0 0 0-5.62.75.75 0 0 1 0-1.06Z"/>';
        }
    }

    /* ─── Clock ─── */

    function startClock() {
        updateClock();
        setInterval(updateClock, 1000);
    }

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const timeStr = hours.toString().padStart(2, '0') + ':' + minutes + ' ' + ampm;
        if (dom.clockDisplay && dom.clockDisplay.textContent !== timeStr) {
            dom.clockDisplay.textContent = timeStr;
        }
    }

    /* ─── Keyboard Navigation ─── */

    function handleKeydown(e) {
        // Don't intercept when focused on interactive elements
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                Player.togglePlayPause();
                break;
            case 'ArrowRight':
                if (e.shiftKey) {
                    Player.next();
                } else {
                    // Seek forward 5 seconds
                    const seekTime = Math.min(Player.getDuration(), Player.getCurrentTime() + 5);
                    Player.seekTo(seekTime);
                }
                break;
            case 'ArrowLeft':
                if (e.shiftKey) {
                    Player.prev();
                } else {
                    // Seek back 5 seconds
                    const seekTime = Math.max(0, Player.getCurrentTime() - 5);
                    Player.seekTo(seekTime);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                Player.setVolume(Math.min(100, Player.getVolume() + 5));
                dom.volumeSliderFill.style.width = Player.getVolume() + '%';
                break;
            case 'ArrowDown':
                e.preventDefault();
                Player.setVolume(Math.max(0, Player.getVolume() - 5));
                dom.volumeSliderFill.style.width = Player.getVolume() + '%';
                break;
            case 'm':
                Player.toggleMute();
                updateVolumeIcon();
                break;
        }
    }

    /* ─── Utilities ─── */

    /**
     * Format seconds as MM:SS
     * @param {number} seconds
     * @returns {string}
     */
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ':' + secs.toString().padStart(2, '0');
    }

    /**
     * Parse a MM:SS time string back to seconds
     * @param {string} str
     * @returns {number}
     */
    function parseTimeDisplay(str) {
        if (!str) return 0;
        const parts = str.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        return 0;
    }

    /**
     * Detect if the viewport is mobile-sized
     */
    function detectMobile() {
        isMobile = window.innerWidth < 768;
    }

    /**
     * Simple debounce utility
     */
    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    return { init };
})();

/* ─── Global YouTube API Callback ─── */
function onYouTubeIframeAPIReady() {
    Player.onAPIReady();
}

/* ─── Boot ─── */
document.addEventListener('DOMContentLoaded', App.init);
