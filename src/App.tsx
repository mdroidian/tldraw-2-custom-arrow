import {
  TLEditorComponents,
  TLUiOverrides,
  Tldraw,
  createShapeId,
  toolbarItem,
  useEditor,
} from "@tldraw/tldraw";
import { CustomArrowUtil, CustomArrowTool } from "./CustomArrowUtil";
import { CustomBoxTool, CustomBoxUtil } from "./CustomBoxUtil";
import "@tldraw/tldraw/tldraw.css";

const customShapeUtils = [CustomArrowUtil, CustomBoxUtil];
const customTools = [CustomArrowTool, CustomBoxTool];

const uiOverrides: TLUiOverrides = {
  tools(app, tools) {
    tools.supports = {
      id: "supports",
      icon: "tool-arrow",
      label: "supports",
      kbd: "",
      readonlyOk: true,
      onSelect: () => {
        app.setCurrentTool("supports");
        console.log(app.root.getPath()); // root.supports.idle
      },
    };
    tools.claim = {
      id: "claim",
      icon: "blob",
      label: "claim",
      kbd: "",
      readonlyOk: true,
      onSelect: () => {
        app.setCurrentTool("claim");
      },
    };

    return tools;
  },
  toolbar(_, toolbar, { tools }) {
    toolbar.splice(0, 0, toolbarItem(tools.supports));
    toolbar.splice(0, 0, toolbarItem(tools.claim));
    return toolbar;
  },
};

const Buttons = () => {
  const editor = useEditor();
  return (
    <div className="buttons">
      <button
        style={{ pointerEvents: "all" }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() =>
          editor.createShapes([
            {
              type: "claim",
              x: 500,
              y: 100,
            },
          ])
        }
      >
        Create CustomBox
      </button>
      <button
        style={{ pointerEvents: "all" }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          const id1 = createShapeId();
          const id2 = createShapeId();
          editor.createShapes([
            {
              id: id1,
              type: "claim",
              x: 100,
              y: 100,
            },
            {
              id: id2,
              type: "claim",
              x: 500,
              y: 500,
            },
            {
              type: "supports",
              props: {
                start: {
                  type: "binding",
                  boundShapeId: id1,
                  normalizedAnchor: { x: 0.5, y: 0.5 },
                  isExact: false,
                  isPrecise: false,
                },
                end: {
                  type: "binding",
                  boundShapeId: id2,
                  normalizedAnchor: { x: 0.5, y: 0.5 },
                  isExact: false,
                  isPrecise: false,
                },
              },
            },
          ]);
        }}
      >
        Create CustomArrow
      </button>
    </div>
  );
};

const components: TLEditorComponents = {
  InFrontOfTheCanvas: Buttons,
};
export default function CustomConfigExample() {
  return (
    <>
      <div className="tldraw__editor">
        <Tldraw
          shapeUtils={customShapeUtils}
          tools={customTools}
          overrides={uiOverrides}
          components={components}
        />
      </div>
    </>
  );
}
