import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const svg = d3.select("#chart");

let tooltip;

export async function drawBarChart() {
    svg.selectAll("*").remove();
    d3.select(".tooltip").remove();

    try {
        const rawData = await d3.csv("assets/datasets/megacities_population.csv", d3.autoType);
        const data = rawData
            .filter(d => d.city && !isNaN(d.population))
            .sort((a, b) => b.population - a.population);

        renderChart(data);
    } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
        svg.append("text")
            .attr("x", 20)
            .attr("y", 40)
            .attr("fill", "red")
            .text("Ошибка при загрузке данных.");
    }
}

function renderChart(data) {
    const width = svg.node().clientWidth;
    const height = +svg.attr("height");
    const margin = { top: 50, right: 30, bottom: 160, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleBand()
        .domain(data.map(d => d.city))
        .range([0, innerWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.population)]).nice()
        .range([innerHeight, 0]);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "#333")
        .text("Population of Megacities in 2023");

    g.append("g")
        .call(d3.axisLeft(y))
        .call(g => g.selectAll("line").clone().attr("x2", innerWidth).attr("stroke", "#ddd"));

    g.append("text")
        .attr("x", -innerHeight / 2)
        .attr("y", -71)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Population");

    g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d => d.length > 10 ? d.slice(0, 10) + "…" : d))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("dx", "-2.2em")
        .attr("dy", "1.5em")
        .style("text-anchor", "middle");

    g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 130)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("City");

    const bars = g.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", d => x(d.city))
        .attr("y", innerHeight)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", "var(--bar-color)")
        .on("mouseover focus", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.city}</strong><br/>Population: ${d.population.toLocaleString()}`);
            d3.select(event.currentTarget).attr("fill", "var(--bar-hover)");
        })
        .on("mousemove", event => {
            tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px");
        })
        .on("mouseout blur", (event) => {
            d3.select(event.currentTarget).attr("fill", "var(--bar-color)");
            tooltip.style("opacity", 0);
        });

    bars.transition()
        .duration(800)
        .delay((d, i) => i * 50)
        .attr("y", d => y(d.population))
        .attr("height", d => innerHeight - y(d.population));

    tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("pointer-events", "none")
        .style("background", "rgba(0,0,0,0.75)")
        .style("color", "#fff")
        .style("padding", "5px 8px")
        .style("border-radius", "4px")
        .style("font-size", "13px");
}

// Debounced resize
window.removeEventListener("resize", window.resizeHandler);
window.resizeHandler = debounce(drawBarChart, 150);
window.addEventListener("resize", window.resizeHandler);

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
