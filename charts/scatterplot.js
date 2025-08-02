import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const svg = d3.select("#chart");

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export async function drawScatterplot() {
    try {
        const data = await d3.json("assets/datasets/density_vs_urbanization.json");
        if (!data || !Array.isArray(data) || !data.every(d => 'urban_percent' in d && 'density' in d && 'country' in d)) {
            throw new Error("Invalid data format");
        }

        function getDensityGroup(density) {
            if (density <= 50) return "A";
            if (density <= 150) return "B";
            if (density <= 500) return "C";
            if (density <= 2000) return "D";
            return "E";
        }

        const groupColors = {
            A: "#007bff", B: "#28a745", C: "#ffc107", D: "#fd7e14", E: "#dc3545"
        };

        svg.selectAll("*").remove();

        const width = svg.node()?.clientWidth || 600;
        const height = +svg.attr("height") || 400;
        const margin = { top: 60, right: 40, bottom: 80, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        svg.attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#f8f9fa")
            .attr("stroke", "#dee2e6");

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.urban_percent)]).nice()
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.density)]).nice()
            .range([innerHeight, 0]);

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).ticks(10).tickFormat(d => d + "%"))
            .selectAll("text")
            .style("font-size", "12px");

        g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", "12px");

        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 45)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Urban Population (%)");

        g.append("text")
            .attr("x", -innerHeight / 2)
            .attr("y", -45)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Population Density (people/km²)");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Urbanization vs Population Density");

        let tooltip = d3.select("body").select(".tooltip#tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .attr("id", "tooltip")
                .style("position", "absolute")
                .style("opacity", 0)
                .style("pointer-events", "none")
                .style("background", "rgba(0, 0, 0, 0.8)")
                .style("color", "white")
                .style("padding", "10px")
                .style("border-radius", "6px")
                .style("border", "1px solid #ffffff")
                .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
                .style("font-size", "12px")
                .style("line-height", "1.5");
        }

        // Анимация точек
        const dots = g.selectAll(".dot")
            .data(data)
            .join("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.urban_percent))
            .attr("cy", d => y(d.density))
            .attr("r", 0)
            .attr("opacity", 0)
            .attr("fill", d => groupColors[getDensityGroup(d.density)])
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 7).attr("opacity", 1);
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.country}</strong><br/>
                          Urban: ${d.urban_percent}%<br/>
                          Density: ${d.density}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", event => {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("r", 5).attr("opacity", 0.8);
                tooltip.style("opacity", 0);
            });

        dots.transition()
            .duration(700)
            .delay((_, i) => i * 5)
            .attr("r", 5)
            .attr("opacity", 0.8);

        const groupLegend = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${height - 25})`);

        const groupLabels = [
            { group: "A", label: "0–50: Very Low", color: groupColors.A },
            { group: "B", label: "51–150: Low", color: groupColors.B },
            { group: "C", label: "151–500: Medium", color: groupColors.C },
            { group: "D", label: "501–2000: High", color: groupColors.D },
            { group: "E", label: ">2000: Very High", color: groupColors.E },
        ];

        groupLegend.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .style("font-size", "13px")
            .style("font-weight", "bold")
            .text("Density Groups (people/km²):");

        groupLegend.selectAll("g.label")
            .data(groupLabels)
            .join("g")
            .attr("class", "label")
            .attr("transform", (d, i) => `translate(${i * 150}, 0)`)
            .each(function(d) {
                d3.select(this).append("rect")
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("fill", d.color);
                d3.select(this).append("text")
                    .attr("x", 18)
                    .attr("y", 10)
                    .style("font-size", "12px")
                    .text(d.label);
            });

    } catch (err) {
        console.error("Error loading scatterplot data:", err);
        svg.selectAll("*").remove();
        svg.append("text")
            .attr("x", 20)
            .attr("y", 40)
            .text(`Error loading data: ${err.message}`)
            .attr("fill", "red")
            .style("font-size", "14px")
            .style("font-weight", "bold");
    }
}

// Debounced resize
window.removeEventListener("resize", window.resizeHandler);
window.resizeHandler = debounce(drawScatterplot, 100);
window.addEventListener("resize", window.resizeHandler);
