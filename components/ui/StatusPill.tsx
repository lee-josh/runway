import { STATUS_COLORS } from "@/lib/constants";
import type { Status } from "@/lib/types";

interface Props {
  status: Status;
  style?: React.CSSProperties;
}

export default function StatusPill({ status, style }: Props) {
  const sc = STATUS_COLORS[status];
  return (
    <span
      className="status-pill"
      style={{
        background: sc.bg,
        color: sc.dot,
        border: `1px solid ${sc.accent}44`,
        ...style,
      }}
    >
      {status}
    </span>
  );
}
