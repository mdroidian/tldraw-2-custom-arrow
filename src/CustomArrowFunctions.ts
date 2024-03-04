import {
  DefaultFontStyle,
  PI,
  TLArrowInfo,
  TLDefaultColorStyle,
  TLDefaultColorTheme,
  TLDefaultDashStyle,
  TLDefaultFillStyle,
  TLShapeUtilCanvasSvgDef,
  Vec,
  VecLike,
} from "@tldraw/tldraw";

export function objectMapEntries<Key extends string, Value>(object: {
  [K in Key]: Value;
}): Array<[Key, Value]> {
  return Object.entries(object) as [Key, Value][];
}

export function mapObjectMapValues<Key extends string, ValueBefore, ValueAfter>(
  object: { readonly [K in Key]: ValueBefore },
  mapper: (key: Key, value: ValueBefore) => ValueAfter
): { [K in Key]: ValueAfter } {
  const result = {} as { [K in Key]: ValueAfter };
  for (const [key, value] of objectMapEntries(object)) {
    const newValue = mapper(key, value);
    result[key] = newValue;
  }
  return result;
}

type TLArrowPointsInfo = {
  point: VecLike;
  int: VecLike;
};

function getArrowhead({ point, int }: TLArrowPointsInfo) {
  const PL = Vec.RotWith(int, point, PI / 6);
  const PR = Vec.RotWith(int, point, -PI / 6);

  return `M ${PL.x} ${PL.y} L ${point.x} ${point.y} L ${PR.x} ${PR.y}`;
}

function intersectCircleCircle(
  c1: VecLike,
  r1: number,
  c2: VecLike,
  r2: number
) {
  let dx = c2.x - c1.x;
  let dy = c2.y - c1.y;
  const d = Math.sqrt(dx * dx + dy * dy),
    x = (d * d - r2 * r2 + r1 * r1) / (2 * d),
    y = Math.sqrt(r1 * r1 - x * x);
  dx /= d;
  dy /= d;
  return [
    new Vec(c1.x + dx * x - dy * y, c1.y + dy * x + dx * y),
    new Vec(c1.x + dx * x + dy * y, c1.y + dy * x - dx * y),
  ];
}

function getArrowPoints(
  info: TLArrowInfo,
  side: "start" | "end",
  strokeWidth: number
): TLArrowPointsInfo {
  const PT = side === "end" ? info.end.point : info.start.point;
  const PB = side === "end" ? info.start.point : info.end.point;

  const compareLength = info.isStraight
    ? Vec.Dist(PB, PT)
    : Math.abs(info.bodyArc.length); // todo: arc length for curved arrows

  const length = Math.max(
    Math.min(compareLength / 5, strokeWidth * 3),
    strokeWidth
  );

  let P0: VecLike;

  if (info.isStraight) {
    P0 = Vec.Nudge(PT, PB, length);
  } else {
    const ints = intersectCircleCircle(
      PT,
      length,
      info.handleArc.center,
      info.handleArc.radius
    );
    P0 =
      side === "end"
        ? info.handleArc.sweepFlag
          ? ints[0]
          : ints[1]
        : info.handleArc.sweepFlag
        ? ints[1]
        : ints[0];
  }

  if (Vec.IsNaN(P0)) {
    P0 = info.start.point;
  }

  return {
    point: PT,
    int: P0,
  };
}
export function getArrowheadPathForType(
  info: TLArrowInfo,
  side: "start" | "end",
  strokeWidth: number
): string | undefined {
  const type = side === "end" ? info.end.arrowhead : info.start.arrowhead;
  if (type === "none") return;

  const points = getArrowPoints(info, side, strokeWidth);
  if (!points) return;
  return getArrowhead(points);
}

function getArrowPath(start: VecLike, end: VecLike) {
  return `M${start.x},${start.y}L${end.x},${end.y}`;
}

/** @public */
export function getStraightArrowHandlePath(
  info: TLArrowInfo & { isStraight: true }
) {
  return getArrowPath(info.start.handle, info.end.handle);
}

/** @public */
export function getSolidStraightArrowPath(
  info: TLArrowInfo & { isStraight: true }
) {
  return getArrowPath(info.start.point, info.end.point);
}

export function getSolidCurvedArrowPath(
  info: TLArrowInfo & { isStraight: false }
) {
  const {
    start,
    end,
    bodyArc: { radius, largeArcFlag, sweepFlag },
  } = info;
  return `M${start.point.x},${start.point.y} A${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.point.x},${end.point.y}`;
}

export function getPerfectDashProps(
  totalLength: number,
  strokeWidth: number,
  opts = {} as Partial<{
    style: TLDefaultDashStyle;
    snap: number;
    end: "skip" | "outset" | "none";
    start: "skip" | "outset" | "none";
    lengthRatio: number;
    closed: boolean;
  }>
): {
  strokeDasharray: string;
  strokeDashoffset: string;
} {
  const {
    closed = false,
    snap = 1,
    start = "outset",
    end = "outset",
    lengthRatio = 2,
    style = "dashed",
  } = opts;

  let dashLength = 0;
  let dashCount = 0;
  let ratio = 1;
  let gapLength = 0;
  let strokeDashoffset = 0;

  switch (style) {
    case "dashed": {
      ratio = 1;
      dashLength = Math.min(strokeWidth * lengthRatio, totalLength / 4);
      break;
    }
    case "dotted": {
      ratio = 100;
      dashLength = strokeWidth / ratio;
      break;
    }
    default: {
      return {
        strokeDasharray: "none",
        strokeDashoffset: "none",
      };
    }
  }

  if (!closed) {
    if (start === "outset") {
      totalLength += dashLength / 2;
      strokeDashoffset += dashLength / 2;
    } else if (start === "skip") {
      totalLength -= dashLength;
      strokeDashoffset -= dashLength;
    }

    if (end === "outset") {
      totalLength += dashLength / 2;
    } else if (end === "skip") {
      totalLength -= dashLength;
    }
  }

  dashCount = Math.floor(totalLength / dashLength / (2 * ratio));
  dashCount -= dashCount % snap;

  if (dashCount < 3 && style === "dashed") {
    if (totalLength / strokeWidth < 5) {
      dashLength = totalLength;
      dashCount = 1;
      gapLength = 0;
    } else {
      dashLength = totalLength * 0.333;
      gapLength = totalLength * 0.333;
    }
  } else {
    dashCount = Math.max(dashCount, 3);
    dashLength = totalLength / dashCount / (2 * ratio);

    if (closed) {
      strokeDashoffset = dashLength / 2;
      gapLength = (totalLength - dashCount * dashLength) / dashCount;
    } else {
      gapLength =
        (totalLength - dashCount * dashLength) / Math.max(1, dashCount - 1);
    }
  }

  return {
    strokeDasharray: [dashLength, gapLength].join(" "),
    strokeDashoffset: strokeDashoffset.toString(),
  };
}

export function getCurvedArrowHandlePath(
  info: TLArrowInfo & { isStraight: false }
) {
  const {
    start,
    end,
    handleArc: { radius, largeArcFlag, sweepFlag },
  } = info;
  return `M${start.handle.x},${start.handle.y} A${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.handle.x},${end.handle.y}`;
}

export const theme: TLDefaultColorTheme = {
  id: "light",
  text: "#000000",
  background: "rgb(249, 250, 251)",
  solid: "#fcfffe",
  black: {
    solid: "#1d1d1d",
    semi: "#e8e8e8",
    pattern: "#494949",
    highlight: {
      srgb: "#fddd00",
      p3: "color(display-p3 0.972 0.8705 0.05)",
    },
  },
  blue: {
    solid: "#4263eb",
    semi: "#dce1f8",
    pattern: "#6681ee",
    highlight: {
      srgb: "#10acff",
      p3: "color(display-p3 0.308 0.6632 0.9996)",
    },
  },
  green: {
    solid: "#099268",
    semi: "#d3e9e3",
    pattern: "#39a785",
    highlight: {
      srgb: "#00ffc8",
      p3: "color(display-p3 0.2536 0.984 0.7981)",
    },
  },
  grey: {
    solid: "#adb5bd",
    semi: "#eceef0",
    pattern: "#bcc3c9",
    highlight: {
      srgb: "#cbe7f1",
      p3: "color(display-p3 0.8163 0.9023 0.9416)",
    },
  },
  "light-blue": {
    solid: "#4dabf7",
    semi: "#ddedfa",
    pattern: "#6fbbf8",
    highlight: {
      srgb: "#00f4ff",
      p3: "color(display-p3 0.1512 0.9414 0.9996)",
    },
  },
  "light-green": {
    solid: "#40c057",
    semi: "#dbf0e0",
    pattern: "#65cb78",
    highlight: {
      srgb: "#65f641",
      p3: "color(display-p3 0.563 0.9495 0.3857)",
    },
  },
  "light-red": {
    solid: "#ff8787",
    semi: "#f4dadb",
    pattern: "#fe9e9e",
    highlight: {
      srgb: "#ff7fa3",
      p3: "color(display-p3 0.9988 0.5301 0.6397)",
    },
  },
  "light-violet": {
    solid: "#e599f7",
    semi: "#f5eafa",
    pattern: "#e9acf8",
    highlight: {
      srgb: "#ff88ff",
      p3: "color(display-p3 0.9676 0.5652 0.9999)",
    },
  },
  orange: {
    solid: "#f76707",
    semi: "#f8e2d4",
    pattern: "#f78438",
    highlight: {
      srgb: "#ffa500",
      p3: "color(display-p3 0.9988 0.6905 0.266)",
    },
  },
  red: {
    solid: "#e03131",
    semi: "#f4dadb",
    pattern: "#e55959",
    highlight: {
      srgb: "#ff636e",
      p3: "color(display-p3 0.9992 0.4376 0.45)",
    },
  },
  violet: {
    solid: "#ae3ec9",
    semi: "#ecdcf2",
    pattern: "#bd63d3",
    highlight: {
      srgb: "#c77cff",
      p3: "color(display-p3 0.7469 0.5089 0.9995)",
    },
  },
  yellow: {
    solid: "#ffc078",
    semi: "#f9f0e6",
    pattern: "#fecb92",
    highlight: {
      srgb: "#fddd00",
      p3: "color(display-p3 0.972 0.8705 0.05)",
    },
  },
};

interface ShapeFillProps {
  d: string;
  fill: TLDefaultFillStyle;
  color: TLDefaultColorStyle;
  theme: TLDefaultColorTheme;
}

export function getShapeFillSvg({ d, color, fill, theme }: ShapeFillProps) {
  if (fill === "none") {
    return;
  }

  if (fill === "pattern") {
    const gEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const path1El = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path1El.setAttribute("d", d);
    path1El.setAttribute("fill", theme[color].pattern);

    const path2El = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path2El.setAttribute("d", d);
    path2El.setAttribute("fill", `url(#hash_pattern)`);

    gEl.appendChild(path1El);
    gEl.appendChild(path2El);
    return gEl;
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);

  switch (fill) {
    case "semi": {
      path.setAttribute("fill", theme.solid);
      break;
    }
    case "solid": {
      {
        path.setAttribute("fill", theme[color].semi);
      }
      break;
    }
  }

  return path;
}
