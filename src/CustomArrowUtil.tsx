import { ArrowShapeTool, ArrowShapeUtil, TLArrowShape } from "@tldraw/tldraw";

export class CustomArrowTool extends ArrowShapeTool {
  static override id = "supports";
  static override initial = "idle";
  override shapeType = "supports";
}

export class CustomArrowUtil extends ArrowShapeUtil {
  static override type = "supports" as const; // ArrowShapeUtil static type: string;
  override canBind = () => true;
  override canEdit = () => false;
  getDefaultProps() {
    console.log("getDefaultProps"); // does not fire using toolbar
    return {
      labelColor: "blue" as const,
      color: "green" as const,
      fill: "none" as const,
      dash: "draw" as const,
      size: "s" as const,
      arrowheadStart: "arrow" as const,
      arrowheadEnd: "arrow" as const,
      font: "draw" as const,
      start: { type: "point" as const, x: 0, y: 0 },
      end: { type: "point" as const, x: 0, y: 0 },
      bend: 0,
      text: "getDefaultProps",
      labelPosition: 0.5,
    };
  }
  override onBeforeCreate = (shape: TLArrowShape) => {
    console.log("onBeforeCreate"); // does not fire using toolbar
    return {
      ...shape,
      props: {
        ...shape.props,
        labelColor: "blue" as const,
        color: "green" as const,
        text: "onBeforeCreate",
      },
    };
  };
  component(shape: TLArrowShape) {
    return <>{super.component(shape)}</>;
  }
}
