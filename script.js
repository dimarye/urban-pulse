const chartSelector = document.getElementById("chartSelector");
let currentChart = "bar";  // сохраняем текущее значение

async function loadChart(chartType) {
    d3.select("#chart").selectAll("*").remove();
    currentChart = chartType;  // обновляем текущее значение

    if (chartType === "bar") {
        const module = await import("./charts/barChart.js");
        module.drawBarChart();
    } else if (chartType === "scatter") {
        const module = await import("./charts/scatterplot.js");
        module.drawScatterplot();
    } else if (chartType === "heatmap") {
        const module = await import("./charts/heatmap.js");
        module.drawHeatmap();
    } else if (chartType === "choropleth") {
        const module = await import("./charts/choropleth.js");
        module.drawChoropleth();
    } else if (chartType === "treemap") {
        const module = await import("./charts/treemap.js");
        module.drawTreemap();
    }
}

// Обработка изменения селектора
chartSelector.addEventListener("change", async (e) => {
    await loadChart(e.target.value);
});

// При ресайзе — перерисовываем текущий активный график, а не то, что в select
window.addEventListener("resize", () => {
    loadChart(currentChart);
});

// Инициализация
chartSelector.value = currentChart;
loadChart(currentChart);
