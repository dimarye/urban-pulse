import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const svg = d3.select("#chart");

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export async function drawHeatmap() {
    svg.selectAll("*").remove();
    d3.select(".tooltip").remove();

    const margin = { top: 50, right: 20, bottom: 50, left: 60 };
    const width = svg.node().clientWidth;
    const height = +svg.attr("height");
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    try {
        const data = await d3.csv("assets/datasets/migration_months.csv", d3.autoType);

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const years = Array.from(new Set(data.map(d => d.year)));

        const x = d3.scaleBand().domain(years).range([0, innerWidth]).padding(0.05);
        const y = d3.scaleBand().domain(months).range([0, innerHeight]).padding(0.05);
        const maxFlow = d3.max(data, d => d.flows);
        const color = d3.scaleSequential()
            .interpolator(d3.interpolateYlOrRd)
            .domain([0, maxFlow]);

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // Оси
        g.append("g").call(d3.axisLeft(y)).selectAll("text").style("font-size", "12px");
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSize(0))
            .selectAll("text")
            .style("font-size", "12px");

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("opacity", 0)
            .style("pointer-events", "none")
            .style("background", "rgba(0,0,0,0.7)")
            .style("color", "#fff")
            .style("padding", "6px 10px")
            .style("border-radius", "4px")
            .style("font-size", "13px");

        // Ячейки с анимацией
        g.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.year))
            .attr("y", d => y(months[d.month - 1]))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("fill", d => color(d.flows))
            .attr("opacity", 0)
            .on("mouseenter", function(event, d) {
                tooltip
                    .style("opacity", 1)
                    .html(`<strong>${months[d.month - 1]} ${d.year}</strong><br/>Flows: ${d.flows}`);
                d3.select(this).attr("stroke", "#333").attr("stroke-width", 1.5);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseleave", function() {
                tooltip.style("opacity", 0);
                d3.select(this).attr("stroke", "none");
            })
            .transition()
            .duration(600)
            .delay((_, i) => i * 3)
            .attr("opacity", 1);

        // Заголовок
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("fill", "#333")
            .text("Monthly Migration Flows (2019–2023)");

        // Легенда
        const legendWidth = 200;
        const legendHeight = 10;

        svg.select("defs").remove();
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient").attr("id", "legend-gradient");

        linearGradient.selectAll("stop")
            .data(d3.range(0, 1.01, 0.01))
            .enter()
            .append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => color(d * maxFlow));

        svg.append("rect")
            .attr("x", width - legendWidth - 40)
            .attr("y", height - 30)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        svg.append("text")
            .attr("x", width - legendWidth - 40)
            .attr("y", height - 35)
            .attr("font-size", "11px")
            .attr("fill", "#333")
            .text("Low");

        svg.append("text")
            .attr("x", width - 40)
            .attr("y", height - 35)
            .attr("text-anchor", "end")
            .attr("font-size", "11px")
            .attr("fill", "#333")
            .text("High");

    } catch (error) {
        console.error("Ошибка при отрисовке heatmap:", error);
        svg.selectAll("*").remove();
        svg.append("text")
            .attr("x", 20)
            .attr("y", 40)
            .attr("fill", "red")
            .text("Ошибка загрузки данных.");
    }
}

// Подключаем debounced ресайз
window.removeEventListener("resize", window.resizeHandler);
window.resizeHandler = debounce(drawHeatmap, 150);
window.addEventListener("resize", window.resizeHandler);
