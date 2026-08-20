/**
 * player.js — YouTube IFrame Player API integration
 *
 * Controls the embedded YouTube player and exposes a clean API
 * for the main application to use. The custom UI controls the
 * legitimate YouTube player via the official IFrame API.
 */

const Player = (() => {
    'use strict';

    /** @type {YT.Player|null} */
    let ytPlayer = null;

    /** Whether the YT API is ready */
    let apiReady = false;

    /** The current playlist ID being played */
    let currentPlaylistId = null;

    /** Animation frame ID for progress updates */
    let progressRAF = null;

    /** Callbacks registered by main.js */
    const callbacks = {
        onReady: null,
        onStateChange: null,
        onVideoChange: null,
        onProgress: null,
        onError: null
    };

    /** Track the last known video index and ID to detect song changes */
    let lastVideoIndex = -1;
    let lastVideoId = null;
    
    /** Local mute state to ensure immediate UI updates */
    let _isMuted = false;

    /**
     * Initialize the YouTube IFrame API
     * @param {Object} cbs - Callback functions
     */
    function init(cbs) {
        Object.assign(callbacks, cbs);

        // Load the IFrame API script
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(tag, firstScript);
    }

    /**
     * Called by the global onYouTubeIframeAPIReady callback
     */
    function onAPIReady() {
        apiReady = true;

        ytPlayer = new YT.Player('yt-player', {
            height: '200',
            width: '200',
            playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                fs: 0,
                playsinline: 1
            },
            events: {
                onReady: handlePlayerReady,
                onStateChange: handleStateChange,
                onError: handleError
            }
        });
    }

    /**
     * Handle player ready event
     */
    function handlePlayerReady() {
        if (callbacks.onReady) callbacks.onReady();
    }

    /**
     * Handle player state change
     * @param {Object} event - YT state change event
     */
    function handleStateChange(event) {
        const state = event.data;

        if (state === YT.PlayerState.PLAYING) {
            startProgressLoop();
            checkForVideoChange();
        } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED) {
            stopProgressLoop();
        }

        // When a new video starts via playlist auto-advance
        if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.CUED) {
            checkForVideoChange();
        }

        if (callbacks.onStateChange) {
            callbacks.onStateChange(state);
        }
    }

    /**
     * Handle player errors
     * @param {Object} event - YT error event
     */
    function handleError(event) {
        console.warn('[Player] YouTube error:', event.data);
        if (callbacks.onError) callbacks.onError(event.data);

        // Auto-skip unplayable videos (100: Not found, 101/150: Embed restricted)
        const unplayableErrors = [100, 101, 150];
        if (unplayableErrors.includes(event.data)) {
            console.log('[Player] Skipping unplayable video...');
            next();
        }
    }

    /**
     * Check if the video ID has changed (i.e. song changed)
     */
    function checkForVideoChange() {
        if (!ytPlayer) return;

        try {
            const data = ytPlayer.getVideoData();
            if (!data || !data.video_id) return;

            if (data.video_id !== lastVideoId) {
                lastVideoId = data.video_id;
                lastVideoIndex = ytPlayer.getPlaylistIndex();
                if (callbacks.onVideoChange) {
                    callbacks.onVideoChange(getVideoData());
                }
            }
        } catch (e) {
            // Player might not be ready yet
        }
    }

    /**
     * Get current video data from the player
     * @returns {Object} Video data
     */
    function getVideoData() {
        if (!ytPlayer) return {};

        try {
            const data = ytPlayer.getVideoData();
            const duration = ytPlayer.getDuration() || 0;
            const videoId = data.video_id || '';

            return {
                title: data.title || 'Untitled',
                author: data.author || 'Unknown Artist',
                videoId: videoId,
                thumbnail: videoId
                    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                    : '',
                duration: duration,
                index: ytPlayer.getPlaylistIndex()
            };
        } catch (e) {
            return {
                title: 'Loading...',
                author: '',
                videoId: '',
                thumbnail: '',
                duration: 0,
                index: 0
            };
        }
    }

    /**
     * Start the progress update loop using requestAnimationFrame
     */
    function startProgressLoop() {
        stopProgressLoop();

        function loop() {
            if (!ytPlayer) return;

            try {
                const currentTime = ytPlayer.getCurrentTime() || 0;
                const duration = ytPlayer.getDuration() || 0;

                if (callbacks.onProgress) {
                    callbacks.onProgress(currentTime, duration);
                }

                // Check for video change periodically
                checkForVideoChange();
            } catch (e) {
                // Ignore errors during progress updates
            }

            progressRAF = requestAnimationFrame(loop);
        }

        progressRAF = requestAnimationFrame(loop);
    }

    /**
     * Stop the progress update loop
     */
    function stopProgressLoop() {
        if (progressRAF) {
            cancelAnimationFrame(progressRAF);
            progressRAF = null;
        }
    }

    let playlistDebounceTimer = null;

    /**
     * Load a playlist by ID (with debounce to handle rapid mood switching)
     * @param {string} playlistId - YouTube playlist ID
     */
    function loadPlaylist(playlistId) {
        if (!ytPlayer || !apiReady) return;

        currentPlaylistId = playlistId;
        lastVideoIndex = -1;

        if (playlistDebounceTimer) {
            clearTimeout(playlistDebounceTimer);
        }

        playlistDebounceTimer = setTimeout(() => {
            try {
                if (currentPlaylistId !== playlistId) return;
                ytPlayer.stopVideo(); // Force stop any ongoing load/buffer
                ytPlayer.loadPlaylist({
                    list: playlistId,
                    listType: 'playlist',
                    index: 0,
                    startSeconds: 0
                });
            } catch (e) {
                console.warn('[Player] Could not load playlist:', e);
            }
        }, 500); // 500ms debounce
    }

    /**
     * Play
     */
    function play() {
        if (ytPlayer) {
            try { ytPlayer.playVideo(); } catch (e) { /* ignore */ }
        }
    }

    /**
     * Pause
     */
    function pause() {
        if (ytPlayer) {
            try { ytPlayer.pauseVideo(); } catch (e) { /* ignore */ }
        }
    }

    /**
     * Toggle play/pause
     */
    function togglePlayPause() {
        if (!ytPlayer) return;

        try {
            const state = ytPlayer.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                pause();
            } else {
                play();
            }
        } catch (e) {
            play();
        }
    }

    /**
     * Next track
     */
    function next() {
        if (ytPlayer) {
            try { ytPlayer.nextVideo(); } catch (e) { /* ignore */ }
        }
    }

    /**
     * Previous track
     */
    function prev() {
        if (ytPlayer) {
            try { ytPlayer.previousVideo(); } catch (e) { /* ignore */ }
        }
    }

    /**
     * Seek to a specific time
     * @param {number} seconds - Time in seconds
     */
    function seekTo(seconds) {
        if (ytPlayer) {
            try { ytPlayer.seekTo(seconds, true); } catch (e) { /* ignore */ }
        }
    }

    /**
     * Set volume
     * @param {number} vol - Volume 0-100
     */
    function setVolume(vol) {
        if (ytPlayer) {
            try { ytPlayer.setVolume(Math.max(0, Math.min(100, vol))); } catch (e) { /* ignore */ }
        }
    }

    /**
     * Get current volume
     * @returns {number} Volume 0-100
     */
    function getVolume() {
        if (!ytPlayer) return 50;
        try { return ytPlayer.getVolume(); } catch (e) { return 50; }
    }

    /**
     * Check if currently playing
     * @returns {boolean}
     */
    function isPlaying() {
        if (!ytPlayer) return false;
        try { return ytPlayer.getPlayerState() === YT.PlayerState.PLAYING; } catch (e) { return false; }
    }

    /**
     * Get current video time
     * @returns {number} Time in seconds
     */
    function getCurrentTime() {
        if (!ytPlayer) return 0;
        try { return ytPlayer.getCurrentTime() || 0; } catch (e) { return 0; }
    }

    /**
     * Get video duration
     * @returns {number} Duration in seconds
     */
    function getDuration() {
        if (!ytPlayer) return 0;
        try { return ytPlayer.getDuration() || 0; } catch (e) { return 0; }
    }

    /**
     * Mute / unmute
     */
    function toggleMute() {
        if (!ytPlayer) return;
        try {
            _isMuted = !_isMuted;
            if (_isMuted) {
                ytPlayer.mute();
            } else {
                ytPlayer.unMute();
            }
        } catch (e) { /* ignore */ }
    }

    /**
     * Check if muted
     * @returns {boolean}
     */
    function isMuted() {
        return _isMuted;
    }

    return {
        init,
        onAPIReady,
        loadPlaylist,
        play,
        pause,
        togglePlayPause,
        next,
        prev,
        seekTo,
        setVolume,
        getVolume,
        isPlaying,
        getCurrentTime,
        getDuration,
        toggleMute,
        isMuted,
        getVideoData
    };
})();
