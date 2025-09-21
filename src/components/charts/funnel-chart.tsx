"use client";

interface FunnelChartProps {
  series: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  height?: number; // Max height allowed
  id: string;
}

export function FunnelChart({ series, height = 500, id }: FunnelChartProps) {
  const proportions = [100, 40, 15]; // TAM → SAM → SOM taper
  const segmentHeight = 100;
  const gap = 0; // No gap - segments should touch
  const totalHeight = series.length * segmentHeight;
  const containerWidth = 400; // Base width for proportions

  return (
    <div
      id={id}
      style={{
        width: "100%",
        maxWidth: "600px",
        height: "auto",
        maxHeight: height,
        margin: "0 auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox={`0 0 ${containerWidth} ${totalHeight}`}
        width="100%"
        height="auto"
        preserveAspectRatio="xMidYMid meet"
        style={{
          filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.25))",
          maxWidth: "100%",
          maxHeight: height,
        }}
      >
        {series.map((segment, index) => {
          const topWidth = (proportions[index] / 100) * containerWidth;
          const bottomWidth =
            index < series.length - 1
              ? (proportions[index + 1] / 100) * containerWidth
              : (proportions[index] / 100) * containerWidth;

          const y = index * (segmentHeight + gap);
          const centerX = containerWidth / 2;

          const topLeft = centerX - topWidth / 2;
          const topRight = centerX + topWidth / 2;
          const bottomLeft = centerX - bottomWidth / 2;
          const bottomRight = centerX + bottomWidth / 2;

          // Simple trapezoid path for proper funnel shape
          const path = `
            M ${topLeft} ${y}
            L ${topRight} ${y}
            L ${bottomRight} ${y + segmentHeight}
            L ${bottomLeft} ${y + segmentHeight}
            Z
          `;

          return (
            <g key={segment.name}>
              <path
                d={path}
                fill={segment.color}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
              <text
                x={centerX}
                y={y + segmentHeight / 2 - 5}
                textAnchor="middle"
                fill="white"
                fontSize="16"
                fontWeight="bold"
                style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.6)" }}
              >
                {segment.name}
              </text>
              <text
                x={centerX}
                y={y + segmentHeight / 2 + 15}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="600"
                style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.6)" }}
              >
                ${segment.value}B
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
