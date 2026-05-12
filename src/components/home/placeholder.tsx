export function Placeholder({
  caption,
  height = 280,
  ratio,
}: {
  caption: string;
  height?: number;
  ratio?: string;
}) {
  const style: React.CSSProperties = ratio
    ? { aspectRatio: ratio }
    : { height };
  return (
    <div className="ph" style={style}>
      <div className="ph-stripes" />
      <div className="ph-caption mono small-caps">{caption}</div>
    </div>
  );
}
