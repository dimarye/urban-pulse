import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const svg = d3.select("#chart");

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export async function drawTreemap() {
    svg.selectAll("*").remove();
    d3.select(".tooltip").remove();

    const width = svg.node().clientWidth;
    const height = +svg.attr("height") || 500;

    try {
        const raw = await d3.json("assets/datasets/population_age_structure.json");

        // Группируем данные в иерархию
        const grouped = d3.group(raw, d => d.region, d => d.group);

        const root = d3.hierarchy({
            children: Array.from(grouped, ([region, groupMap]) => ({
                name: region,
                children: Array.from(groupMap, ([group, entries]) => ({
                    name: group,
                    value: entries[0].value
                }))
            }))
        })
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        const treemapLayout = d3.treemap()
            .size([width, height])
            .padding(1)
            .round(true);

        treemapLayout(root);

        const color = d3.scaleOrdinal()
            .domain(root.children.map(d => d.data.name))
            .range(d3.schemeCategory10);

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

        const nodes = svg.selectAll("g")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        nodes.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => color(d.parent.data.name))
            .on("mouseenter", function(event, d) {
                tooltip
                    .style("opacity", 1)
                    .html(`<strong>${d.parent.data.name}</strong><br/>${d.data.name}: ${d.data.value}%`);
                d3.select(this).attr("stroke", "#000").attr("stroke-width", 1.5);
            })
            .on("mousemove", function(event) {
                tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseleave", function() {
                tooltip.style("opacity", 0);
                d3.select(this).attr("stroke", "none");
            });

        nodes.append("text")
            .attr("x", 4)
            .attr("y", 14)
            .style("font-size", "11px")
            .style("fill", "#fff")
            .text(d => `${d.data.name} (${d.data.value}%)`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Population Age Structure by Region");

    } catch (error) {
        console.error("Ошибка при отрисовке treemap:", error);
        svg.selectAll("*").remove();
        svg.append("text")
            .attr("x", 20)
            .attr("y", 40)
            .attr("fill", "red")
            .text("Error loading treemap data.");
    }
}

// --- Управление ресайзом ---
window.removeEventListener("resize", window.resizeHandler);  // Снимаем старый (если был)
window.resizeHandler = debounce(drawTreemap, 150);          // Назначаем новый
window.addEventListener("resize", window.resizeHandler);    // Вешаем
