/**
 * analytics.js — Firebase Analytics & Presence Integration
 */

const Analytics = (() => {
    'use strict';

    /** DOM references */
    let visitCountEl = null;
    let liveCountEl = null;

    const firebaseConfig = {
        apiKey: "AIzaSyCfZJ5EoC_cVo2XOUmn_pzAHmVGzMJ2BCg",
        authDomain: "moods-904b7.firebaseapp.com",
        projectId: "moods-904b7",
        storageBucket: "moods-904b7.firebasestorage.app",
        messagingSenderId: "61245369418",
        appId: "1:61245369418:web:cc638013d81efef05a4ab3",
        databaseURL: "https://moods-904b7-default-rtdb.asia-southeast1.firebasedatabase.app" // Singapore region
    };

    /**
     * Initialize analytics module
     */
    async function init() {
        visitCountEl = document.getElementById('visit-count');
        liveCountEl = document.getElementById('live-count');

        try {
            // Dynamically import Firebase SDKs (using version 10 for modern modular style)
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js");
            const { getDatabase, ref, onValue, onDisconnect, set, push, increment } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js");

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            const db = getDatabase(app);

            // 1. Total Visits Counter
            const visitsRef = ref(db, 'stats/total_visits');
            
            // Increment visits (this runs immediately when they connect)
            set(visitsRef, increment(1)).catch(err => {
                console.warn('[Analytics] Could not increment visits. Check database rules.', err);
            });

            // Listen to total visits to update the UI
            onValue(visitsRef, (snapshot) => {
                const count = snapshot.val() || 0;
                updateVisitCount(count);
            });

            // 2. Live Presence Tracking
            const connectedRef = ref(db, '.info/connected');
            const onlineUsersRef = ref(db, 'presence');
            
            // Generate a unique reference for this client's session
            const mySessionRef = push(onlineUsersRef);

            onValue(connectedRef, (snap) => {
                if (snap.val() === true) {
                    // We're connected! 
                    // Set up the disconnect hook first
                    onDisconnect(mySessionRef).remove().then(() => {
                        // Once the disconnect hook is registered on the server, mark as online
                        set(mySessionRef, true);
                    });
                }
            });

            // Listen to how many users are in the 'presence' node
            onValue(onlineUsersRef, (snapshot) => {
                const users = snapshot.val() || {};
                const count = Object.keys(users).length;
                updateLiveCount(count);
            });

        } catch (e) {
            console.error('[Analytics] Failed to initialize Firebase:', e);
            if (visitCountEl) visitCountEl.textContent = 'Err: ' + (e.code || e.message || 'unknown');
            if (liveCountEl) liveCountEl.textContent = 'Err: ' + (e.code || e.message || 'unknown');
        }
    }

    /**
     * Update the displayed visit count.
     * @param {number} count 
     */
    function updateVisitCount(count) {
        if (!visitCountEl) return;
        if (count >= 1000000) {
            visitCountEl.textContent = (count / 1000000).toFixed(1) + 'M visits';
        } else if (count >= 1000) {
            visitCountEl.textContent = (count / 1000).toFixed(1) + 'K visits';
        } else {
            visitCountEl.textContent = count + ' visits';
        }
    }

    /**
     * Update the displayed live count.
     * @param {number} count 
     */
    function updateLiveCount(count) {
        if (!liveCountEl) return;
        liveCountEl.textContent = count + ' online';
    }

    /**
     * Track a mood change event.
     * @param {string} moodKey 
     */
    function trackMoodChange(moodKey) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.log('[Analytics] Mood changed:', moodKey);
        }
    }

    return { init, updateVisitCount, trackMoodChange };
})();
