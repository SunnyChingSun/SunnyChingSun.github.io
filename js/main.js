import { initMainMap, initMiniMap, mainMap, miniMap, activeMarker } from './modules/map.js';
import { renderStory, renderTimelineAxis, renderThoughts } from './modules/timeline.js';
import { getDecimalYear } from './modules/utils.js';

const DATA_URL = 'data/data.json';
let fullTimeline = [];
let timelineBounds = { start: 2004, end: 2026 };
let scroller = null;
let currentIndex = -1;

async function init() {
    // 1. Fetch Data
    const response = await fetch(DATA_URL);
    const data = await response.json();

    // 2. Parse Logic
    let rawStories = Array.isArray(data) ? data : (data.stories || data.timeline || []);
    const thoughts = Array.isArray(data) ? [] : (data.thoughts || []);

    fullTimeline = rawStories.map(s => {
        if (s.location && typeof s.location.lat === 'number') {
            s.location.center = [s.location.lng, s.location.lat];
        }
        return s;
    });

    // 3. Render Initial Components
    renderThoughts(thoughts);
    initMainMap();
    initMiniMap();

    // 4. Initial Filter & Render
    setFilter('all');

    // 5. Setup UI Listeners
    setupFilters();
    setupTimelineScrubbing();
}

function setFilter(type) {
    let filtered = fullTimeline;
    if (type !== 'all') {
        const filterMap = {
            'project': ['project', 'competition', 'hackathon'],
            'experience': ['school', 'study', 'work', 'job', 'internship'],
            'life': ['life']
        };

        if (filterMap[type]) {
            filtered = fullTimeline.filter(d => filterMap[type].includes(d.type));
        } else {
            filtered = fullTimeline.filter(d => d.type === type);
        }
    }

    // Dynamic Bounds Calculation
    if (filtered.length > 0) {
        const years = filtered.map(d => getDecimalYear(d));
        let minYear = Math.floor(Math.min(...years));
        let maxYear = Math.ceil(Math.max(...years));
        if (maxYear <= minYear) maxYear = minYear + 1;

        const currentYear = new Date().getFullYear();
        if (maxYear >= currentYear) maxYear = currentYear + 1;

        timelineBounds = { start: minYear, end: maxYear };
    } else {
        timelineBounds = { start: 2004, end: 2026 };
    }

    // Render Pipeline
    renderStory(filtered);
    renderTimelineAxis(filtered, timelineBounds);

    // Re-init Scrollama
    if (scroller) scroller.destroy();
    setupScrollama(filtered);
}

function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            setFilter(e.target.dataset.filter);

            // Scroll to the first story card
            const firstStep = document.querySelector('.step');
            if (firstStep) {
                firstStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
}

function setupScrollama(timeline) {
    if (!window.scrollama) return;
    scroller = scrollama();

    scroller
        .setup({
            step: '.step',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(response => {
            const index = response.index;
            const item = timeline[index];
            currentIndex = index;

            // Update UI State
            document.querySelectorAll('.step').forEach(s => s.classList.remove('is-active'));
            response.element.classList.add('is-active');

            updateTimelineIndicator(item, index);
            updateMaps(item, timeline, index);
        })
        .onStepExit(response => {
            // If we scroll UP from the first step, we are entering the Hero section.
            // Reset map to "Home" (Taipei)
            if (response.index === 0 && response.direction === 'up') {
                resetMapsToHome();
            }
        });
}

function resetMapsToHome() {
    // Default Home: Taipei
    const homeCenter = [121.5, 25.0];
    const offsetLeft = window.innerWidth > 900 ? window.innerWidth * 0.4 : 0;

    if (mainMap) {
        mainMap.flyTo({
            center: homeCenter,
            zoom: 8,
            pitch: 0,
            bearing: 0,
            speed: 1.2,
            curve: 1.2,
            padding: { left: offsetLeft, right: 0, top: 0, bottom: 0 }
        });
    }

    if (miniMap) {
        // Hide/Reset mini map if desired, or just center it
        const globeContainer = document.getElementById('footprint-globe');
        if (globeContainer) {
            // Optional: Hide mini-map on hero? 
            // globeContainer.classList.remove('active'); 
            // User just said "showing the same place", let's keep it visible but reset location.
            // Actually, usually the mini-map is for the journey. For hero, maybe it disappears?
            // Let's assume reset location for now.

            miniMap.flyTo({
                center: [170, 20], // Pacific View
                zoom: 4,
                speed: 1.5
            });
        }
    }
}

function updateTimelineIndicator(item, index) {
    // 1. Clear previous active classes
    document.querySelectorAll('.item-marker.active, .timeline-range-bar.active').forEach(el => {
        el.classList.remove('active');
    });

    // 2. Add active class to current index
    const markers = document.querySelectorAll(`.item-marker[data-index="${index}"], .timeline-range-bar[data-index="${index}"]`);
    markers.forEach(el => el.classList.add('active'));
}

function updateMaps(item, timeline, index) {
    if (!item.location || !item.location.center) return;
    const loc = item.location;

    // 1. Move Main Map
    if (mainMap) {
        const offsetLeft = window.innerWidth > 900 ? window.innerWidth * 0.4 : 0;
        mainMap.flyTo({
            center: loc.center,
            zoom: loc.zoom,
            pitch: loc.pitch || 0,
            bearing: loc.bearing || 0,
            speed: 0.9,
            curve: 1.2,
            padding: { left: offsetLeft, right: 0, top: 0, bottom: 0 }
        });
    }

    // 2. Move Mini Map (Globe)
    if (miniMap) {
        const globeContainer = document.getElementById('footprint-globe');
        if (globeContainer) {
            // Safari Fix Check
            const wasInactive = !globeContainer.classList.contains('active');
            globeContainer.classList.add('active');
            if (wasInactive) setTimeout(() => miniMap.resize(), 50);

            miniMap.flyTo({
                center: loc.center,
                zoom: 4,
                speed: 1.0,
                curve: 1.5,
                essential: true
            });

            // Update Marker
            if (activeMarker) {
                activeMarker.setLngLat(loc.center);
                const labelEl = activeMarker.getElement().querySelector('.footprint-marker-label');
                if (labelEl) {
                    // labelEl.textContent = loc.placeName || '';
                    // labelEl.style.opacity = '1';
                    labelEl.style.display = 'none'; // Ensure it's hidden
                }
            }

            // Update Dynamic Trail
            updateGlobeTrail(timeline, index);
        }
    }
}

function updateGlobeTrail(timeline, currentIndex) {
    const history = timeline.slice(0, currentIndex + 1);
    const visitedEvents = history.filter(s =>
        s.location && s.location.center
    );

    const trailCoords = visitedEvents.map(s => s.location.center);

    // Unique dots
    const uniqueCoords = [];
    const seen = new Set();
    visitedEvents.forEach(s => {
        const key = s.location.center.join(',');
        if (!seen.has(key)) {
            seen.add(key);
            uniqueCoords.push(s.location.center);
        }
    });

    const pathSource = miniMap.getSource('footprint-path');
    if (pathSource) {
        pathSource.setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: trailCoords }
        });
    }

    const dotsSource = miniMap.getSource('footprint-dots');
    if (dotsSource) {
        dotsSource.setData({
            type: 'FeatureCollection',
            features: uniqueCoords.map(c => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: c }
            }))
        });
    }
}

function setupTimelineScrubbing() {
    const container = document.getElementById('timeline-axis');
    if (!container) return;

    // Click Delegation for Markers
    container.addEventListener('click', (e) => {
        const target = e.target.closest('.item-marker, .timeline-range-bar');
        if (target && target.dataset.index) {
            const index = parseInt(target.dataset.index);
            const stepElement = document.getElementById(`step-${index}`);

            if (stepElement) {
                stepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
}

// Boot
window.addEventListener('load', init);
