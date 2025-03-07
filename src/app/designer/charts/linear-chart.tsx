export function LinearChart() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <line
        x1="10"
        y1="90"
        x2="90"
        y2="10"
        stroke="#13f598"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
