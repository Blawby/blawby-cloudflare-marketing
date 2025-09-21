"use client";

import { useEffect, useRef } from "react";

interface BarChartProps {
  series: Array<{
    name: string;
    data: number[];
    color: string;
  }>;
  categories: string[];
  height?: number;
  id: string;
  horizontal?: boolean;
  stacked?: boolean;
}

export function BarChart({
  series,
  categories,
  height = 400,
  id,
  horizontal = false,
  stacked = false,
}: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    let chart: any;

    const loadApexCharts = async () => {
      const ApexCharts = (await import("apexcharts")).default;

      // Detect dark mode
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const textColor = isDark ? "#ffffff" : "#111827";
      const strokeColor = isDark ? "#374151" : "#e5e7eb";

      const options = {
        series,
        chart: {
          sparkline: {
            enabled: false,
          },
          type: "bar" as const,
          width: "100%",
          height,
          background: "transparent",
          fontFamily: "Inter, sans-serif",
          toolbar: {
            show: false,
          },
          animations: {
            enabled: true,
            easing: 'easeInOut',
            speed: 800,
          },
          ...(stacked && { stacked: true }),
        },
        theme: {
          mode: isDark ? "dark" : "light",
        },
        fill: {
          opacity: 1,
        },
        plotOptions: {
          bar: {
            horizontal,
            columnWidth: "60%",
            borderRadiusApplication: "end" as const,
            borderRadius: 6,
            dataLabels: {
              position: "top" as const,
            },
          },
        },
        legend: {
          show: true,
          position: "bottom" as const,
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          labels: {
            colors: textColor,
          },
        },
        dataLabels: {
          enabled: true,
          style: {
            fontFamily: "Inter, sans-serif",
            colors: ["#111827"], // Always use dark text for readability on gold backgrounds
            fontSize: "16px",
            fontWeight: "600",
          },
          formatter: function (val: number) {
            return "$" + val.toLocaleString();
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          theme: isDark ? "dark" : "light",
          style: {
            fontFamily: "Inter, sans-serif",
          },
          y: {
            formatter: function (value: number) {
              return "$" + value.toLocaleString();
            },
          },
        },
        xaxis: {
          labels: {
            show: true,
            style: {
              fontFamily: "Inter, sans-serif",
              colors: textColor,
              fontSize: "16px",
            },
            formatter: function (value: any) {
              return String(value);
            },
          },
          categories,
          axisTicks: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
        },
        yaxis: {
          labels: {
            show: true,
            style: {
              fontFamily: "Inter, sans-serif",
              colors: textColor,
              fontSize: "16px",
            },
          },
        },
        grid: {
          show: true,
          strokeDashArray: 4,
          borderColor: strokeColor,
          padding: {
            left: 2,
            right: 2,
            top: -20,
          },
        },
      };

      chart = new ApexCharts(chartRef.current, options);
      chart.render();
    };

    loadApexCharts();

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [series, categories, height, horizontal, stacked]);

  return <div ref={chartRef} id={id} />;
}
