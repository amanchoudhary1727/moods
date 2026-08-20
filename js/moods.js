/**
 * moods.js — Mood definitions and data
 *
 * Each mood contains:
 *  - name:       Display name
 *  - icon:       Unicode icon for the menu
 *  - playlistId: YouTube playlist ID (replace with real IDs)
 *  - background: Desktop and mobile background paths
 *  - theme:      CSS custom-property overrides for this mood
 */

const MOODS = {
    aura: {
        name: 'AURA',
        icon: '👑',
        description: 'Powerful. Energetic. Untouchable.',
        playlistId: 'PLfblj2-n5H_4',
        backgrounds: [
            {
                type: 'video',
                src: 'assets/backgrounds/silver-surfer-space-stars-moewalls-com.mp4'
            },
            {
                type: 'video',
                src: 'assets/backgrounds/celestial-battle-gojo-vs-mahoraga.3840x2160.mp4'
            }
        ],
        theme: {
            accent: '#e63946',
            accentAlt: '#9b2226',
            accentRgb: '230, 57, 70',
            accentText: '#ffffff',
            glow: 'rgba(230, 57, 70, 0.35)',
            glowSoft: 'rgba(230, 57, 70, 0.15)',
            surface: 'rgba(15, 5, 8, 0.30)',
            surfaceBorder: 'rgba(230, 57, 70, 0.12)',
            textPrimary: '#ffffff',
            textSecondary: 'rgba(255, 255, 255, 0.6)'
        }
    },

    afterhours: {
        name: 'AFTERHOURS',
        icon: '◐',
        description: 'Late drives. Nowhere to rush.',
        playlistId: 'PLOXWoMH8V4yo',
        backgrounds: [
            {
                type: 'video',
                src: 'assets/backgrounds/cyberpunk-night-city.1920x1080.mp4'
            },
            {
                type: 'video',
                src: 'assets/backgrounds/dark-cyberpunk-2077-city-street-moewalls-com.mp4'
            }
        ],
        theme: {
            accent: '#7b68ee',
            accentAlt: '#483d8b',
            accentRgb: '123, 104, 238',
            accentText: '#ffffff',
            glow: 'rgba(123, 104, 238, 0.35)',
            glowSoft: 'rgba(123, 104, 238, 0.15)',
            surface: 'rgba(8, 5, 18, 0.30)',
            surfaceBorder: 'rgba(123, 104, 238, 0.12)',
            textPrimary: '#ffffff',
            textSecondary: 'rgba(255, 255, 255, 0.55)'
        }
    },

    affection: {
        name: 'AFFECTION',
        icon: '♡',
        description: 'Warm. Intimate. Dreamy.',
        playlistId: 'PLFsGJcgqYpX8',
        backgrounds: [
            {
                type: 'video',
                src: 'assets/backgrounds/silent-train-ride-just-listen-to-the-song-moewalls-com.mp4'
            },
            {
                type: 'video',
                src: 'assets/backgrounds/koi-no-yokan-live-wallpaper.mp4'
            }
        ],
        theme: {
            accent: '#e8a87c',
            accentAlt: '#c97b4b',
            accentRgb: '232, 168, 124',
            accentText: '#ffffff',
            glow: 'rgba(232, 168, 124, 0.35)',
            glowSoft: 'rgba(232, 168, 124, 0.15)',
            surface: 'rgba(18, 10, 6, 0.25)',
            surfaceBorder: 'rgba(232, 168, 124, 0.12)',
            textPrimary: '#ffffff',
            textSecondary: 'rgba(255, 255, 255, 0.6)'
        }
    },

    alive: {
        name: 'ALIVE',
        icon: '☼',
        description: 'Life feels good.',
        playlistId: 'PLWMx1uuTvnKU',
        backgrounds: [
            {
                type: 'video',
                src: 'assets/backgrounds/sakura-street.1920x1080.mp4'
            },
            {
                type: 'video',
                src: 'assets/backgrounds/anime-town-rainfall.1920x1080.mp4'
            }
        ],
        theme: {
            accent: '#ffffff',
            accentAlt: '#cccccc',
            accentRgb: '255, 255, 255',
            accentText: '#000000',
            glow: 'rgba(255, 255, 255, 0.35)',
            glowSoft: 'rgba(255, 255, 255, 0.15)',
            surface: 'rgba(0, 0, 0, 0.20)',
            surfaceBorder: 'rgba(255, 255, 255, 0.12)',
            textPrimary: '#ffffff',
            textSecondary: 'rgba(255, 255, 255, 0.6)'
        }
    }
};

/** Default mood on first load */
const DEFAULT_MOOD = 'aura';

/** Ordered list of mood keys for display */
const MOOD_ORDER = ['aura', 'afterhours', 'affection', 'alive'];
