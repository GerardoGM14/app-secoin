import { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// Helper para limpiar raíces duplicadas en StrictMode
const maybeDisposeRoot = (divElement) => {
  if (!divElement) return;
  if (am5 && am5.registry && am5.registry.rootElements) {
    am5.array.each(am5.registry.rootElements, (root) => {
      if (root && root.dom === divElement) {
        root.dispose();
      }
    });
  }
};

export function AmChartArea({ data }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    maybeDisposeRoot(chartRef.current);

    try {
      const core = am5.default || am5;
      const xy = am5xy.default || am5xy;
      const animated = am5themes_Animated.default || am5themes_Animated;

      const root = core.Root.new(chartRef.current);
      root.setThemes([animated.new(root)]);

      const chart = root.container.children.push(
        xy.XYChart.new(root, {
          panX: true,
          panY: true,
          wheelX: "panX", wheelY: "zoomX", pinchZoomX: true
        })
      );

      const cursor = chart.set("cursor", xy.XYCursor.new(root, { behavior: "none" }));
      cursor.lineY.set("visible", false);

      const xRenderer = xy.AxisRendererX.new(root, { minGridDistance: 30, minorGridEnabled: true });
      xRenderer.grid.template.set("visible", false);

      const xAxis = chart.xAxes.push(
        xy.CategoryAxis.new(root, {
          categoryField: "mes",
          renderer: xRenderer,
          tooltip: core.Tooltip.new(root, {})
        })
      );
      xAxis.data.setAll(data);

      const yAxis = chart.yAxes.push(xy.ValueAxis.new(root, { renderer: xy.AxisRendererY.new(root, {}) }));

      // En amCharts 5, los gráficos de área son LineSeries con el relleno activado
      const series = chart.series.push(
        xy.LineSeries.new(root, {
          name: "Inspecciones",
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: "inspecciones",
          categoryXField: "mes",
          fill: core.color("#ef4444"),
          stroke: core.color("#ef4444"),
          tooltip: core.Tooltip.new(root, { labelText: "{valueY}" })
        })
      );

      // Activar el relleno para que parezca un gráfico de área
      series.fills.template.setAll({ fillOpacity: 0.2, visible: true });
      
      series.bullets.push(() => core.Bullet.new(root, { sprite: core.Circle.new(root, { radius: 5, fill: series.get("fill") }) }));
      
      series.data.setAll(data);
      series.appear(1000);
      chart.appear(1000, 100);

      return () => {
        root.dispose();
      };
    } catch (e) {
      console.error("Error al inicializar AmChartArea:", e);
    }
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height: "100%", minHeight: "350px" }}></div>;
}

export function AmChartPie({ data }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    maybeDisposeRoot(chartRef.current);

    try {
      const core = am5.default || am5;
      const percent = am5percent.default || am5percent;
      const animated = am5themes_Animated.default || am5themes_Animated;

      const root = core.Root.new(chartRef.current);
      root.setThemes([animated.new(root)]);

      const chart = root.container.children.push(
        percent.PieChart.new(root, { layout: root.verticalLayout, innerRadius: core.percent(50) })
      );

      const series = chart.series.push(
        percent.PieSeries.new(root, { valueField: "cantidad", categoryField: "nombre", alignLabels: false })
      );

      series.get("colors").set("colors", [ core.color("#ef4444"), core.color("#10b981"), core.color("#8b5cf6") ]);
      series.slices.template.setAll({ strokeWidth: 2, stroke: core.color("#ffffff") });
      series.labels.template.set("visible", false);
      series.data.setAll(data);

      const legend = chart.children.push(core.Legend.new(root, { centerX: core.percent(50), x: core.percent(50), marginTop: 15, marginBottom: 15 }));
      legend.data.setAll(series.dataItems);

      series.appear(1000, 100);
      
      return () => {
        root.dispose();
      };
    } catch (e) {
      console.error("Error al inicializar AmChartPie:", e);
    }
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height: "100%", minHeight: "350px" }}></div>;
}

export function AmChartBar({ data }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    maybeDisposeRoot(chartRef.current);

    try {
      const core = am5.default || am5;
      const xy = am5xy.default || am5xy;
      const animated = am5themes_Animated.default || am5themes_Animated;

      const root = core.Root.new(chartRef.current);
      root.setThemes([animated.new(root)]);

      const chart = root.container.children.push( xy.XYChart.new(root, { layout: root.verticalLayout }) );

      const xRenderer = xy.AxisRendererX.new(root, { minGridDistance: 30 });
      xRenderer.grid.template.set("visible", false);

      const xAxis = chart.xAxes.push(xy.CategoryAxis.new(root, { categoryField: "nombre", renderer: xRenderer }));
      xAxis.data.setAll(data);

      const yAxis = chart.yAxes.push(xy.ValueAxis.new(root, { renderer: xy.AxisRendererY.new(root, {}) }));

      const series = chart.series.push(
        xy.ColumnSeries.new(root, { name: "Cantidad", xAxis: xAxis, yAxis: yAxis, valueYField: "cantidad", categoryXField: "nombre", tooltip: core.Tooltip.new(root, { labelText: "{valueY}" }) })
      );

      series.columns.template.setAll({ cornerRadiusTL: 10, cornerRadiusTR: 10, strokeOpacity: 0, width: core.percent(60) });
      series.columns.template.adapters.add("fill", (fill, target) => {
        const dataItem = target.dataItem;
        if (dataItem) {
          const entry = data.find(it => it.nombre === dataItem.get("categoryX"));
          if (entry && entry.color) return core.color(entry.color);
        }
        return fill;
      });

      series.data.setAll(data);
      series.appear(1000);
      chart.appear(1000, 100);

      return () => {
        root.dispose();
      };
    } catch (e) {
      console.error("Error al inicializar AmChartBar:", e);
    }
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height: "100%", minHeight: "350px" }}></div>;
}
