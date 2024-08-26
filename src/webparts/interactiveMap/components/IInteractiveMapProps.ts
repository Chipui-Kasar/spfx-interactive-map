import { Guid } from "@microsoft/sp-core-library";
import { IFilePickerResult } from "@pnp/spfx-property-controls";

export type MarkerType = "Panel" | "Dialog" | "Url" | "None";

export interface IMarkerContentProperties {
  headerText: string;
  html: string;
}
export interface IMarkerClickProps {
  content: IMarkerContentProperties;
}
export interface IMarker {
  id: string;
  latitude: number;
  longitude: number;
  type?: MarkerType;
  popuptext?: string;
  markerClickProps?: IMarkerClickProps;
}

export interface IInteractiveMapProps {
  isEditMode: boolean;
  markerItems: IMarker[];
  title: string;
  height: number;
  filePickerResult: IFilePickerResult;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  onMarkerCollectionChanged(markerItems: IMarker[]): void;
}
export const emptyMarkerItem: IMarker = {
  id: Guid.empty.toString(),
  latitude: 0,
  longitude: 0,
  type: "Panel",
  popuptext: "",
  markerClickProps: {
    content: { html: "", headerText: "" },
  },
};
