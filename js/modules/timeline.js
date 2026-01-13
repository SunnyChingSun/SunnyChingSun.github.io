import { getDecimalYear, parseDateStr } from './utils.js';
import { renderMicroChart } from './vis.js';

export function renderThoughts(thoughts) {
    const container = document.getElementById('thoughts-list');
    if (!container) return;
    container.innerHTML = '';

    // Empty state
    if (!thoughts || thoughts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Coming soon...</p>
            </div>
        `;
        return;
    }

    // Create carousel container
    const carousel = document.createElement('div');
    carousel.classList.add('thoughts-carousel');

    thoughts.forEach(t => {
        const card = document.createElement('a');
        card.href = `article.html?id=${t.id}`;
        card.classList.add('thought-card-vertical');
        card.style.textDecoration = 'none';

        card.innerHTML = `
            <div class="thought-card-cover" style="background-image: url('${t.coverImage}')"></div>
            <div class="thought-card-content">
                <div class="thought-date">${t.date}</div>
                <h4 class="thought-title">${t.title}</h4>
                <p class="thought-excerpt">${t.excerpt}</p>
            </div>
        `;
        carousel.appendChild(card);
    });

    container.appendChild(carousel);
}

export function renderTimelineAxis(displayData, timelineBounds) {
    const container = document.getElementById('timeline-axis');
    if (!container) return;

    container.innerHTML = '';

    const { start: startYear, end: endYear } = timelineBounds;
    const totalYears = endYear - startYear;

    // --- Ticks & Labels Generation ---
    // (Logic for ticks similar to original, simplified for readability)
    const isHighFidelity = totalYears <= 3;

    for (let y = startYear; y <= endYear; y++) {
        const createTick = (pct, isMajor, labelText = null) => {
            const tick = document.createElement('div');
            tick.classList.add(isMajor ? 'timeline-year-marker' : 'timeline-month-marker');
            tick.style.top = `${pct}%`;
            container.appendChild(tick);

            if (labelText) {
                const label = document.createElement('div');
                label.classList.add(isMajor ? 'timeline-year-label' : 'timeline-month-label');
                label.innerText = labelText;
                label.style.top = `${pct}%`;
                container.appendChild(label);
            }
        };

        if (isHighFidelity) {
            // Check months
            for (let m = 0; m < 12; m++) {
                const dec = y + (m / 12);
                if (dec > endYear) break;
                const pct = ((dec - startYear) / totalYears) * 100;

                if (m === 0) {
                    const txt = (y === endYear && endYear >= new Date().getFullYear()) ? 'Now' : y;
                    createTick(pct, true, txt);
                } else {
                    createTick(pct, false, m === 6 ? 'Jul' : null);
                }
            }
        } else {
            // Annual ticks
            const pct = ((y - startYear) / totalYears) * 100;
            const interval = totalYears <= 5 ? 1 : (totalYears <= 10 ? 2 : 4);
            const showLabel = (y - startYear) % interval === 0 || y === endYear || y === startYear;
            const txt = showLabel ? ((y === endYear && endYear >= new Date().getFullYear()) ? 'Now' : y) : null;
            createTick(pct, true, txt);
        }
    }

    // --- Activity Bars ---
    displayData.forEach((item, index) => {
        const startDec = parseDateStr(item.date) || parseFloat(item.year);
        const pct = ((startDec - startYear) / totalYears) * 100;

        if (isNaN(startDec) || pct < 0 || pct > 100) return;

        // Range Bars
        if (item.endDate) {
            let endDec = parseDateStr(item.endDate);
            if (item.endDate.toLowerCase().match(/(present|now)/)) {
                const now = new Date();
                endDec = now.getFullYear() + (now.getMonth() / 12);
            }

            if (!isNaN(endDec)) {
                const endPct = ((endDec - startYear) / totalYears) * 100;
                const height = Math.min(100, Math.max(0, endPct)) - pct;

                if (height > 0) {
                    const bar = document.createElement('div');
                    bar.className = `timeline-range-bar marker-type-${item.type.toLowerCase()}`;
                    bar.style.top = `${pct}%`;
                    bar.style.height = `${height}%`;
                    bar.dataset.index = index; // For click
                    container.appendChild(bar);
                }
            }
        }

        // Start Marker
        const marker = document.createElement('div');
        marker.className = `item-marker marker-type-${item.type.toLowerCase()}`;
        marker.style.top = `${pct}%`;
        marker.title = item.title;
        marker.dataset.index = index; // For click
        container.appendChild(marker);
    });
}

export function renderStory(timeline) {
    const container = document.getElementById('story');
    if (!container) return;
    container.innerHTML = '';

    timeline.forEach((item, index) => {
        const step = document.createElement('div');
        step.classList.add('step', `type-${item.type}`);
        step.dataset.step = index;
        step.id = `step-${index}`;

        // Sub-components rendering
        const mediaHtml = item.media ?
            `<div class="step-media"><img src="${item.media}" alt="${item.title}" loading="lazy"></div>` : '';

        const groupsHtml = renderGroups(item.groups);
        const statsHtml = (item.stats && item.stats.length > 0) ? `<div id="chart-${index}" class="chart-container"></div>` : '';
        const techHtml = (item.technologies && item.technologies.length > 0) ?
            `<div class="tech-stack">${item.technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}</div>` : '';

        const linksHtml = renderLinks(item.links);

        step.innerHTML = `
            <span class="type-label">${item.type}</span>
            <div class="step-meta">
                <span>${item.date || item.year}${item.endDate ? ' - ' + item.endDate : ''}</span>
                <span>${item.location ? item.location.placeName || '' : ''}</span>
            </div>
            <h3 class="step-title">${item.title}</h3>
            ${techHtml}
            <div class="step-content">${item.content}</div>
            ${groupsHtml}
            ${statsHtml}
            ${mediaHtml}
            ${linksHtml}
        `;

        container.appendChild(step);

        if (item.stats) {
            renderMicroChart(`#chart-${index}`, item.stats);
        }
    });
}

// Helpers for renderStory
function renderGroups(groups) {
    if (!groups || groups.length === 0) return '';
    return `<div class="group-container">
        ${groups.map(g => `
            <div>
                <div class="group-category">${g.category}</div>
                <div class="group-list">
                    ${g.items.map(i => {
        const label = typeof i === 'string' ? i : i.label;
        const details = (typeof i !== 'string' && i.details) ? `<div class="item-details">${i.details}</div>` : '';
        return `<div class="group-item"><div class="item-label">${label}</div>${details}</div>`;
    }).join('')}
                </div>
            </div>
        `).join('')}
    </div>`;
}

function renderLinks(links) {
    if (!links || links.length === 0) return '';
    return `<div class="card-links">
        ${links.map(l => `<a href="${l.url}" target="_blank" class="detail-link">${l.label} ↗</a>`).join('')}
    </div>`;
}
