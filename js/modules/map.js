export let mainMap = null;
export let miniMap = null;
export let activeMarker = null;

export function initMainMap() {
    mainMap = new maplibregl.Map({
        container: 'map',
        style: {
            'version': 8,
            'sources': {
                'satellite': {
                    'type': 'raster',
                    'tiles': [
                        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    ],
                    'tileSize': 256,
                    'attribution': '&copy; Esri'
                }
            },
            'layers': [
                {
                    'id': 'satellite-layer',
                    'type': 'raster',
                    'source': 'satellite',
                    'paint': {
                        'raster-saturation': -0.2,
                        'raster-contrast': 0.1,
                        'raster-opacity': 1.0
                    }
                }
            ]
        },
        center: [121.5, 25.0], // Taipei
        zoom: 8,
        pitch: 0,
        bearing: 0,
        interactive: false
    });
}

export function initMiniMap() {
    const globeContainer = document.getElementById('footprint-globe');
    if (!globeContainer) return;

    miniMap = new maplibregl.Map({
        container: 'footprint-globe',
        style: {
            'version': 8,
            'glyphs': 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
            'sources': {
                'world-land': {
                    'type': 'geojson',
                    'data': 'data/world.geojson'
                }
            },
            'layers': [
                {
                    'id': 'background',
                    'type': 'background',
                    'paint': {
                        'background-color': '#111'
                    }
                },
                {
                    'id': 'land-layer',
                    'type': 'fill',
                    'source': 'world-land',
                    'paint': {
                        'fill-color': '#2a2a2a',
                        'fill-outline-color': '#333'
                    }
                },
                {
                    'id': 'country-label',
                    'type': 'symbol',
                    'source': 'world-land',
                    'layout': {
                        'text-field': ['get', 'name'],
                        'text-font': ['Klokantech Noto Sans Regular'],
                        'text-size': 10,
                        'text-transform': 'uppercase',
                        'text-letter-spacing': 0.1,
                        'text-max-width': 8
                    },
                    'paint': {
                        'text-color': '#555',
                        'text-halo-color': '#000',
                        'text-halo-width': 1
                    }
                }
            ]
        },
        center: [121.5, 25.0],
        zoom: 4,
        interactive: false,
        attributionControl: false
    });

    // Active Marker Initialization
    const el = document.createElement('div');
    el.className = 'footprint-marker-pulse';

    const label = document.createElement('span');
    label.className = 'footprint-marker-label';
    el.appendChild(label);

    activeMarker = new maplibregl.Marker({ element: el })
        .setLngLat([0, 0])
        .addTo(miniMap);

    // Toggle Button Logic
    const toggle = document.createElement('div');
    toggle.className = 'footprint-toggle';
    toggle.innerHTML = '×';
    globeContainer.appendChild(toggle);

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        globeContainer.classList.add('minimized');
    });

    globeContainer.addEventListener('click', () => {
        if (globeContainer.classList.contains('minimized')) {
            globeContainer.classList.remove('minimized');
            setTimeout(() => miniMap.resize(), 300);
        }
    });

    // Load Event: Projections and Layers
    miniMap.on('load', () => {
        if (miniMap.setProjection) {
            miniMap.setProjection({ type: 'globe' });
        }

        // Add Empty Sources
        miniMap.addSource('footprint-path', {
            'type': 'geojson',
            'data': { 'type': 'Feature', 'geometry': { 'type': 'LineString', 'coordinates': [] } }
        });

        miniMap.addSource('footprint-dots', {
            'type': 'geojson',
            'data': { 'type': 'FeatureCollection', 'features': [] }
        });

        // Add Layers
        miniMap.addLayer({
            'id': 'footprint-path-layer',
            'type': 'line',
            'source': 'footprint-path',
            'paint': {
                'line-color': '#fbbf24',
                'line-width': 2,
                'line-opacity': 0.6,
                'line-dasharray': [2, 2]
            }
        });

        miniMap.addLayer({
            'id': 'footprint-dots-layer',
            'type': 'circle',
            'source': 'footprint-dots',
            'paint': {
                'circle-color': '#fff',
                'circle-radius': 3,
                'circle-opacity': 0.8
            }
        });
    });
}
