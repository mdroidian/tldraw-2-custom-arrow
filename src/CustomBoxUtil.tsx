import {
  TLBaseShape,
  ShapeProps,
  T,
  HTMLContainer,
  BaseBoxShapeUtil,
  BaseBoxShapeTool,
} from "@tldraw/tldraw";

export class CustomBoxTool extends BaseBoxShapeTool {
  static override id = "claim";
  static override initial = "idle";
  override shapeType = "claim";
}
type ICustomBox = TLBaseShape<
  "claim",
  {
    w: number;
    h: number;
    text: string;
  }
>;

export class CustomBoxUtil extends BaseBoxShapeUtil<ICustomBox> {
  static override type = "claim" as const;
  static override props: ShapeProps<ICustomBox> = {
    w: T.number,
    h: T.number,
    text: T.string,
  };

  getDefaultProps(): ICustomBox["props"] {
    return {
      w: 200,
      h: 200,
      text: "I'm a claim!",
    };
  }

  override canBind = () => true;
  override canEdit = () => false;
  override canResize = () => true;
  override isAspectRatioLocked = () => false;

  indicator(shape: ICustomBox) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }

  component(shape: ICustomBox) {
    return (
      <HTMLContainer style={{ backgroundColor: "#efefef" }}>
        {shape.props.text}
      </HTMLContainer>
    );
  }
}
