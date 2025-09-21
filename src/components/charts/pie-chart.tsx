"use client";

import { useEffect, useRef, useState } from "react";

interface PieChartProps {
  data: number[];
  labels: string[];
  colors?: string[];
  height?: number;
  id: string;
}

export function PieChart({
  data,
  labels,
  colors = ["#11FFBD", "#16BDCA", "#AAFFA9", "#11998e", "#38ef7d", "#1C64F2"],
  height = 420,
  id,
}: PieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);

  // Monitor dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      const dark = document.documentElement.classList.contains("dark") ||
                   window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(dark);
    };

    checkDarkMode();

    // Watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    let chart: any;

    const loadApexCharts = async () => {
      const ApexCharts = (await import("apexcharts")).default;

      const textColor = isDark ? "#ffffff" : "#111827";
      const strokeColor = isDark ? "#1f2937" : "#ffffff";

      const options = {
        series: data,
        colors,
        chart: {
          type: "pie" as const,
          height,
          width: "100%",
          background: "transparent",
          fontFamily: "Inter, sans-serif",
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
          },
        },
        theme: {
          mode: isDark ? "dark" : "light",
        },
        stroke: {
          colors: [strokeColor],
          lineCap: "round",
        },
        labels,
        plotOptions: {
          pie: {
            dataLabels: {
              offset: -20,
            },
          },
        },
        dataLabels: {
          enabled: true,
          style: {
            fontFamily: "Inter, sans-serif",
            colors: [textColor],
          },
          formatter: function (val: number) {
            return val.toFixed(1) + "%";
          },
        },
        legend: {
          position: "right" as const,
          fontFamily: "Inter, sans-serif",
          labels: {
            colors: textColor,
          },
          offsetY: 0,
          offsetX: 20,
        },
        tooltip: {
          enabled: true,
          theme: isDark ? "dark" : "light",
          style: {
            fontFamily: "Inter, sans-serif",
          },
        },
        responsive: [{
          breakpoint: 768,
          options: {
            chart: {
              height: 350,
            },
            legend: {
              position: "bottom",
            },
          },
        }],
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
  }, [data, labels, colors, height, isDark]);

  return <div ref={chartRef} id={id} className="w-full" />;
}
