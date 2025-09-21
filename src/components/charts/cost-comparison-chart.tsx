"use client";

import { useEffect, useRef, useState } from "react";

interface CostComparisonChartProps {
  height?: number;
  id: string;
}

export function CostComparisonChart({
  height = 400,
  id,
}: CostComparisonChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      if (typeof document === "undefined") return;
      const dark =
        document.documentElement?.classList?.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(dark);
    };

    if (typeof document !== "undefined") {
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", checkDarkMode);

      return () => {
        observer.disconnect();
        mediaQuery.removeEventListener("change", checkDarkMode);
      };
    }
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const loadApexCharts = async () => {
      // Clean up existing chart instance before creating new one
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }

      const ApexCharts = (await import("apexcharts")).default;

      const textColor = isDark ? "#ffffff" : "#111827";
      const strokeColor = isDark ? "#374151" : "#e5e7eb";

      // Data based on the calculations provided
      const series = [
        {
          name: "Manual Process Cost (Lost Revenue)",
          data: [450, 450, 450], // Stays flat at $450k/year
          color: "var(--chart-danger)", // Red color for cost/loss
        },
        {
          name: "With Blawby AI (Remaining Cost)",
          data: [315, 225, 135], // Decreasing cost as AI efficiency improves
          color: "var(--chart-success)", // Green color for savings
        },
      ];

      const categories = ["Year 1", "Year 2", "Year 3"];

      const options = {
        series,
        chart: {
          type: "line" as const,
          width: "100%",
          height,
          background: "transparent",
          fontFamily: "Inter, sans-serif",
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 800,
          },
        },
        theme: { mode: isDark ? "dark" : "light" },
        stroke: {
          width: 4,
          curve: "smooth" as const,
          colors: series.map((s) => s.color),
        },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 0.3,
            opacityFrom: 0.2,
            opacityTo: 0,
            stops: [0, 100],
          },
        },
        markers: { 
          size: 6,
          strokeWidth: 2,
          strokeColors: series.map((s) => s.color),
          fillColors: series.map((s) => s.color),
        },
        legend: {
          show: true,
          position: "bottom" as const,
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          labels: { colors: textColor },
        },
        dataLabels: { 
          enabled: true,
          style: {
            fontFamily: "Inter, sans-serif",
            colors: ["#111827"],
            fontSize: "14px",
            fontWeight: "600",
          },
          formatter: function (val: number) {
            return "$" + val + "k";
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          theme: isDark ? "dark" : "light",
          style: { fontFamily: "Inter, sans-serif" },
          y: { 
            formatter: (val: number) => `$${val}k`,
          },
        },
        xaxis: {
          categories,
          labels: {
            show: true,
            style: {
              fontFamily: "Inter, sans-serif",
              colors: textColor,
              fontSize: "16px",
            },
          },
          axisTicks: { show: false },
          axisBorder: { show: false },
        },
        yaxis: {
          labels: {
            show: true,
            style: {
              fontFamily: "Inter, sans-serif",
              colors: textColor,
              fontSize: "16px",
            },
            formatter: (val: number) => `$${val}k`,
          },
          min: 0,
          max: 500,
        },
        grid: {
          show: true,
          strokeDashArray: 4,
          borderColor: strokeColor,
          padding: { left: 2, right: 2, top: -20 },
        },
        annotations: {
          points: [
            {
              x: "Year 3",
              y: 135,
              marker: {
                size: 8,
                fillColor: "var(--chart-success)",
                strokeColor: "#ffffff",
                strokeWidth: 2,
              },
              label: {
                text: "70% Cost Reduction",
                style: {
                  background: "var(--chart-success)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontFamily: "Inter, sans-serif",
                },
                offsetY: -20,
              },
            },
          ],
        },
        responsive: [
          {
            breakpoint: 1024,
            options: {
              chart: { height: 350 },
              legend: { position: "bottom" },
              xaxis: { labels: { style: { fontSize: "14px" } } },
              yaxis: { labels: { style: { fontSize: "14px" } } },
            },
          },
          {
            breakpoint: 768,
            options: {
              chart: { height: 300 },
              legend: { position: "bottom" },
              xaxis: { labels: { rotate: -30, style: { fontSize: "13px" } } },
              yaxis: { labels: { style: { fontSize: "13px" } } },
            },
          },
          {
            breakpoint: 480,
            options: {
              chart: { height: 250 },
              legend: { position: "bottom" },
              xaxis: { labels: { rotate: -45, style: { fontSize: "12px" } } },
              yaxis: { labels: { style: { fontSize: "12px" } } },
              stroke: { width: 2 },
            },
          },
        ],
      };

      chartInstanceRef.current = new ApexCharts(chartRef.current, options);
      chartInstanceRef.current.render();
    };

    loadApexCharts();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [height, isDark]);

  return <div ref={chartRef} id={id} className="w-full" />;
}
