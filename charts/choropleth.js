import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const svg = d3.select("#chart");

// Debounce функция для ресайза
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export async function drawChoropleth() {
    svg.selectAll("*").remove();
    d3.select(".tooltip").remove();

    const width = svg.node()?.clientWidth || 800;
    const height = +svg.attr("height") || 500;

    svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    try {
        const [geoData, urbanData] = await Promise.all([
            d3.json("assets/datasets/world.geojson"),
            d3.json("assets/datasets/urbanization_by_country.json")
        ]);

        const dataMap = new Map(urbanData.map(d => [d.code, d.urban_percent]));

        const projection = d3.geoNaturalEarth1()
            .fitSize([width, height - 60], geoData);

        const path = d3.geoPath().projection(projection);

        const color = d3.scaleSequential()
            .domain([0, 100])
            .interpolator(d3.interpolateBlues);

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("opacity", 0)
            .style("background", "rgba(0, 0, 0, 0.75)")
            .style("color", "#fff")
            .style("padding", "8px 10px")
            .style("border-radius", "5px")
            .style("font-size", "13px")
            .style("pointer-events", "none");

        svg.append("g")
            .selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const value = dataMap.get(d.properties.iso_a3);
                return value != null ? color(value) : "#e0e0e0";
            })
            .attr("stroke", "#999")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0)
            .on("mouseenter", function (event, d) {
                const value = dataMap.get(d.properties.iso_a3);
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`<strong>${d.properties.name}</strong><br/>Urbanization: ${value != null ? value + "%" : "N/A"}`);
                d3.select(this).attr("stroke", "#222").attr("stroke-width", 1);
            })
            .on("mousemove", event => {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseleave", function () {
                tooltip.transition().duration(200).style("opacity", 0);
                d3.select(this).attr("stroke", "#999").attr("stroke-width", 0.5);
            })
            .transition()
            .duration(800)
            .attr("opacity", 1);

        // Заголовок
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Urbanization by Country (%)");

        // Легенда
        const legendWidth = 200;
        const legendHeight = 10;

        svg.select("defs").remove();
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient").attr("id", "choropleth-gradient");

        linearGradient.selectAll("stop")
            .data(d3.range(0, 1.01, 0.01))
            .enter().append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => color(d * 100));

        svg.append("rect")
            .attr("x", width - legendWidth - 40)
            .attr("y", height - 40)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#choropleth-gradient)");

        svg.append("text")
            .attr("x", width - legendWidth - 40)
            .attr("y", height - 45)
            .style("font-size", "11px")
            .text("Low");

        svg.append("text")
            .attr("x", width - 40)
            .attr("y", height - 45)
            .attr("text-anchor", "end")
            .style("font-size", "11px")
            .text("High");

    } catch (error) {
        console.error("Ошибка при загрузке карты:", error);
        svg.selectAll("*").remove();
        svg.append("text")
            .attr("x", 20)
            .attr("y", 40)
            .attr("fill", "red")
            .text("Error loading choropleth map.");
    }
}

// Debounced resize
window.removeEventListener("resize", window.resizeHandler);
window.resizeHandler = debounce(drawChoropleth, 150);
window.addEventListener("resize", window.resizeHandler);
