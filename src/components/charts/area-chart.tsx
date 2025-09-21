"use client";

import type ApexCharts from "apexcharts";
import { useEffect, useRef, useState } from "react";

interface AreaChartProps {
  data: number[];
  categories: string[];
  color?: string;
  height?: number;
  id: string;
  name?: string;
}

export function AreaChart({
  data,
  categories,
  color = "#11FFBD",
  height = 400,
  id,
  name = "Growth",
}: AreaChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);

  // Monitor dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      const dark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(dark);
    };

    checkDarkMode();

    // Watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Watch for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    let chart: ApexCharts | undefined;
    let mounted = true;

    const loadApexCharts = async () => {
      const apexChartsPromise = import("apexcharts");
      const ApexCharts = (await apexChartsPromise).default;

      // Check if component is still mounted after async import
      if (!mounted || !chartRef.current) {
        return;
      }

      const textColor = isDark ? "#ffffff" : "#111827";

      const options = {
        chart: {
          height: height,
          maxWidth: "100%",
          type: "area" as const,
          fontFamily: "Inter, sans-serif",
          background: "transparent",
          dropShadow: {
            enabled: false,
          },
          toolbar: {
            show: false,
          },
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 800,
          },
        },
        theme: {
          mode: isDark ? "dark" : "light",
        },
        tooltip: {
          enabled: true,
          theme: isDark ? "dark" : "light",
          style: {
            fontSize: "16px",
            fontFamily: "Inter, sans-serif",
          },
          x: {
            show: false,
          },
        },
        fill: {
          type: "gradient",
          gradient: {
            opacityFrom: 0.55,
            opacityTo: 0,
            shade: isDark ? "dark" : "light",
            gradientToColors: [color],
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: 6,
          colors: [color],
        },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: {
            left: 2,
            right: 2,
            top: 0,
          },
        },
        series: [
          {
            name: name,
            data: data,
            color: color,
          },
        ],
        xaxis: {
          categories: categories,
          labels: {
            show: true,
            style: {
              colors: textColor,
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
            },
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          show: true,
          labels: {
            style: {
              colors: textColor,
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
            },
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: {
                height: 300,
              },
              xaxis: {
                labels: {
                  show: true,
                },
              },
            },
          },
        ],
      };

      // Final check before rendering
      if (!mounted || !chartRef.current) {
        return;
      }

      chart = new ApexCharts(chartRef.current, options);
      chart.render();
    };

    loadApexCharts();

    return () => {
      mounted = false;
      if (chart) {
        chart.destroy();
      }
    };
  }, [data, categories, color, height, name, isDark]);

  return <div ref={chartRef} id={id} className="w-full" />;
}
