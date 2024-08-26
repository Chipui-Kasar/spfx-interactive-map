import {
  DefaultButton,
  Panel,
  PanelType,
  PrimaryButton,
  TextField,
} from "@fluentui/react";
import * as React from "react";
import { IMarker } from "./IInteractiveMapProps";
import { Guid } from "@microsoft/sp-core-library";
import { RichText } from "@pnp/spfx-controls-react/lib/RichText";

export interface IAddorEditMarkerProps {
  markerItem: IMarker;
  onMarkerChanged: (markerItems: IMarker, isNew: boolean) => void;
  onDeleteMarker: (marker: IMarker) => void;
  openPanel: boolean;
  dismissPanel: () => void;
  editMode: boolean;
}
const buttonStyles = {
  root: {
    marginLeft: "5px",
  },
};
const AddorEditMarker = (props: IAddorEditMarkerProps) => {
  const [markerTitle, setMarkerTitle] = React.useState(
    props.markerItem?.popuptext || ""
  );
  const [markerDescription, setMarkerDescription] = React.useState("");
  const isNewMarker = props.markerItem.id === Guid.empty.toString();

  const headerText =
    props.editMode && isNewMarker
      ? "New Marker"
      : props.editMode && !isNewMarker
      ? "Edit Marker"
      : props.markerItem.popuptext;

  const dismissPanel = () => {
    props.dismissPanel();
  };

  const saveMarker = () => {
    const marker: IMarker = {
      id:
        props.markerItem?.id === Guid.empty.toString()
          ? Math.random().toString()
          : props.markerItem?.id,
      popuptext: markerTitle,
      longitude: props.markerItem.longitude,
      latitude: props.markerItem.latitude,
      type: props.markerItem.type,
      markerClickProps: {
        content: {
          headerText: markerTitle,
          html: markerDescription,
        },
      },
    };
    props.onMarkerChanged(marker, isNewMarker);
  };
  const deleteMarker = () => {
    props.onDeleteMarker(props.markerItem);
    dismissPanel();
  };
  const onRenderFooterContent = React.useCallback(
    () => (
      <div>
        {props.editMode && (
          <PrimaryButton onClick={saveMarker}>Save</PrimaryButton>
        )}
        {props.editMode && !isNewMarker && (
          <DefaultButton onClick={deleteMarker} styles={buttonStyles}>
            Delete
          </DefaultButton>
        )}
        <DefaultButton onClick={dismissPanel} styles={buttonStyles}>
          Close
        </DefaultButton>
      </div>
    ),
    [dismissPanel]
  );

  return (
    <div>
      <Panel
        headerText={headerText}
        isOpen={props.openPanel}
        onDismiss={dismissPanel}
        // You MUST provide this prop! Otherwise screen readers will just say "button" with no label.
        closeButtonAriaLabel="Close"
        type={PanelType.medium}
        isFooterAtBottom={true}
        onRenderFooterContent={onRenderFooterContent}
      >
        <label
          dangerouslySetInnerHTML={{
            __html: props.markerItem?.markerClickProps?.content?.html || "",
          }}
          hidden={props.editMode}
        ></label>
        {props.editMode && (
          <>
            <TextField
              label="Title"
              value={markerTitle}
              onChange={(e, v: string) => setMarkerTitle(v)}
              readOnly={!props.editMode}
            />

            <RichText
              label="Description"
              value={
                props.markerItem.markerClickProps?.content?.html ||
                markerDescription
              }
              isEditMode={props.editMode}
              onChange={(text: string) => {
                setMarkerDescription(text);
                return text; // Return the text as expected by the onChange prop type
              }}
            />
          </>
        )}
      </Panel>
    </div>
  );
};

export default React.memo(AddorEditMarker);
