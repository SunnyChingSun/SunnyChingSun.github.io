export function renderMicroChart(selector, data) {
    if (!data || !window.d3) return;

    // Normalizing data logic from original
    const parsedData = data.map(d => {
        let val = 0;
        let text = d.value;
        if (typeof d.value === 'string') {
            if (d.value.includes('%')) val = parseFloat(d.value);
            else if (d.value.includes('/')) {
                const parts = d.value.split('/');
                val = (parseFloat(parts[0]) / parseFloat(parts[1])) * 100;
            } else if (!isNaN(parseFloat(d.value))) {
                val = parseFloat(d.value);
                // Scaling for GPA/small numbers
                if (val <= 5) val = (val / 5) * 100;
                else if (val <= 10) val = (val / 10) * 100;
                else val = 100;
            }
        }
        return { label: d.label, val: val, text: text };
    });

    const width = 300;
    const rowHeight = 25;
    const height = parsedData.length * rowHeight;

    d3.select(selector).html('');
    const svg = d3.select(selector).append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .style("overflow", "visible");

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const rows = svg.selectAll(".row").data(parsedData).enter().append("g")
        .attr("transform", (d, i) => `translate(0, ${i * rowHeight})`);

    // Background Bar
    rows.append("rect")
        .attr("x", 0).attr("y", 8)
        .attr("width", width).attr("height", 6)
        .attr("rx", 3)
        .attr("fill", "rgba(0,0,0,0.05)");

    // Value Bar
    rows.append("rect")
        .attr("x", 0).attr("y", 8)
        .attr("width", 0).attr("height", 6)
        .attr("rx", 3)
        .attr("fill", "var(--text-light)")
        .transition().duration(1000).delay((d, i) => i * 100)
        .attr("width", d => xScale(d.val || 0));

    // Labels
    rows.append("text")
        .attr("x", 0).attr("y", 4)
        .text(d => d.label)
        .attr("font-size", "10px")
        .attr("fill", "var(--text-light)")
        .attr("font-weight", "600")
        .style("text-transform", "uppercase");

    rows.append("text")
        .attr("x", width).attr("y", 4)
        .text(d => d.text)
        .attr("font-size", "10px")
        .attr("fill", "var(--text-main)")
        .attr("text-anchor", "end")
        .attr("font-weight", "500");
}
