import * as React from "react";
import * as ReactDom from "react-dom";
import { DisplayMode, Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { IReadonlyTheme } from "@microsoft/sp-component-base";
import * as strings from "InteractiveMapWebPartStrings";
import InteractiveMap from "./components/InteractiveMap";
import {
  IInteractiveMapProps,
  IMarker,
} from "./components/IInteractiveMapProps";
import { IFilePickerResult } from "@pnp/spfx-property-controls/lib/PropertyFieldFilePicker";
import { sp } from "@pnp/sp/presets/all";

export interface IInteractiveMapWebPartProps {
  isEditMode: boolean;
  markerItems: IMarker[];
  title: string;
  height: number;
  filePickerResult: IFilePickerResult;
}

export default class InteractiveMapWebPart extends BaseClientSideWebPart<IInteractiveMapWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = "";

  public render(): void {
    const element: React.ReactElement<IInteractiveMapProps> =
      React.createElement(InteractiveMap, {
        markerItems: this.properties.markerItems || [],
        isEditMode: this.displayMode == DisplayMode.Edit,
        title: this.properties.title,
        height: this.properties.height || 578,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        filePickerResult: this.properties.filePickerResult,
        userDisplayName: this.context.pageContext.user.displayName,
        onMarkerCollectionChanged: (markerItems: IMarker[]) => {
          this.properties.markerItems = markerItems;
        },
      });

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    sp.setup({
      spfxContext: this.context as any,
    });
    return this._getEnvironmentMessage().then((message) => {
      this._environmentMessage = message;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app
        .getContext()
        .then((context) => {
          let environmentMessage: string = "";
          switch (context.app.host.name) {
            case "Office": // running in Office
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentOffice
                : strings.AppOfficeEnvironment;
              break;
            case "Outlook": // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentOutlook
                : strings.AppOutlookEnvironment;
              break;
            case "Teams": // running in Teams
            case "TeamsModern":
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentTeams
                : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(
      this.context.isServedFromLocalhost
        ? strings.AppLocalEnvironmentSharePoint
        : strings.AppSharePointEnvironment
    );
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty(
        "--bodyText",
        semanticColors.bodyText || null
      );
      this.domElement.style.setProperty("--link", semanticColors.link || null);
      this.domElement.style.setProperty(
        "--linkHovered",
        semanticColors.linkHovered || null
      );
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  //   private async handleFilePicker(e: IFilePickerResult) {
  //     if (e === null) {
  //       await this.deleteFileFromLibrary(
  //         this.properties.filePickerResult?.fileAbsoluteUrl
  //       );
  //       return;
  //     }
  //     // Update the file picker result in the properties.
  //     else if (e.fileAbsoluteUrl !== null) {
  //       this.properties.filePickerResult = e;
  //     } else {
  //       // If you want to perform additional operations, such as uploading new files, you can do so here.
  //       if (e && e.downloadFileContent) {
  //         e.downloadFileContent().then(async (fileContent) => {
  //           // Handle file content, e.g., upload to SharePoint library.
  //           await this.uploadFileToLibrary(e.fileName, fileContent);
  //         });
  //       }
  //     }
  //     // Optionally, you can perform additional actions based on file source (e.g., stock images, site images, or new upload images).
  //   }
  //   private async deleteFileFromLibrary(fileUrl: string): Promise<void> {
  //     try {
  //       // Ensure the file exists before attempting to delete it
  //       await sp.web.getFileByServerRelativePath(fileUrl).get();

  //       // Delete the file
  //       // await sp.web.getFileByServerRelativePath(fileUrl).delete();
  //       const result: any = {
  //         fileAbsoluteUrl: null,
  //         fileName: null,
  //         fileNameWithoutExtension: null,
  //       };
  //       this.properties.filePickerResult = result;

  //       console.log(`File deleted: ${fileUrl}`);
  //     } catch (error) {
  //       console.error("Error deleting file:", error);
  //     }
  //   }

  //   // Function to upload a file to a SharePoint library (if needed).
  //   private async uploadFileToLibrary(fileName: string, fileContent: Blob) {
  //     // Define the library URL where you want to upload the file.
  //     const libraryUrl = `${this.context.pageContext.web.serverRelativeUrl}/SiteAssets/Map`;
  //     const chunkSize = 10485760; // 10 MB chunk size
  //     this.renderProgressDialog();
  //     try {
  //       this.showProgressDialog();
  //       // Ensure the folder exists or create it if it doesn't.
  //       const folder = await sp.web
  //         .getFolderByServerRelativePath(libraryUrl)
  //         .select("Exists")();

  //       if (!folder.Exists) {
  //         await sp.web.folders.add(libraryUrl);
  //       }

  //       // Upload the file in chunks.
  //       const fileInfo: IFileAddResult = await sp.web
  //         .getFolderByServerRelativePath(libraryUrl)
  //         .files.addChunked(
  //           fileName,
  //           fileContent,
  //           (data) => {
  //             // Update the progress percentage
  //             const progress = data.blockNumber / data.totalBlocks;
  //             this.updateProgressDialog(progress ?? 0);
  //           },
  //           true, // Overwrite existing files
  //           chunkSize
  //         );
  //       // Hide the dialog box after the upload is complete
  //       this.hideProgressDialog();
  //       const result: any = {
  //         fileAbsoluteUrl: fileInfo.data.ServerRelativeUrl,
  //         fileName: fileName,
  //         fileNameWithoutExtension: fileName.split(".").slice(0, -1).join("."),
  //       };

  //       this.properties.filePickerResult = result;
  //       this.context.propertyPane.refresh();
  //       this.render();
  //       return this.properties.filePickerResult;
  //     } catch (error) {
  //       console.error("Error uploading file:", error);
  //       await sp.web.folders.add(libraryUrl);
  //       this.hideProgressDialog();
  //       this.uploadFileToLibrary(fileName, fileContent);
  //     }
  //   }
  //   //render upload file progress
  //   private renderProgressDialog() {
  //     const dialogHtml = `
  //     <div id="uploadProgressDialogCont" style="
  //     width: 100%;
  //     background: #0000009e;
  //     z-index: 9999;
  //     height: 100%;
  //     position: absolute;
  //     top: 50%;
  //     left: 50%;
  //     transform: translate(-50%, -50%);
  //     display:none;
  // ">
  //         <div id="uploadProgressDialog" style=" position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); padding:20px; background-color:white; border:1px solid #ccc;">
  //             <h3>Uploading File</h3>
  //             <p>Please wait while your file is being uploaded.</p>
  //             <div id="uploadProgressBar" style="width:100%; background-color:#f3f3f3;">
  //                 <div id="uploadProgress" style="width:0%; height:24px; background-color:#4caf50;"></div>
  //             </div>
  //             <p id="uploadProgressText">0%</p>
  //         </div>
  //         </div>
  //     `;

  //     document.body.insertAdjacentHTML("beforeend", dialogHtml);
  //   }

  //   private showProgressDialog() {
  //     const dialog = document.getElementById("uploadProgressDialogCont");
  //     if (dialog) dialog.style.display = "block";
  //   }

  //   private hideProgressDialog() {
  //     const dialog = document.getElementById("uploadProgressDialogCont");
  //     if (dialog) dialog.style.display = "none";
  //   }

  //   private updateProgressDialog(progress: number) {
  //     const progressBar = document.getElementById("uploadProgress");
  //     const progressText = document.getElementById("uploadProgressText");

  //     // Ensure the progress is a finite number and within the expected range
  //     let safeProgress =
  //       isFinite(progress) && !isNaN(progress) && progress >= 0 && progress <= 1
  //         ? progress
  //         : 1;

  //     if (progressBar) progressBar.style.width = `${safeProgress * 100}%`;
  //     if (progressText)
  //       progressText.textContent = `${Math.round(safeProgress * 100)}%`;
  //   }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: "Basic",
              groupFields: [
                PropertyPaneTextField("title", {
                  label: "Webpart title",
                }),
                PropertyPaneSlider("height", {
                  label: "webpart height",
                  min: 100,
                  max: 2000,
                  step: 1,
                  showValue: true,
                  value: this.properties.height,
                }),
                // PropertyFieldFilePicker("filePickerResult", {
                //   context: this.context,
                //   filePickerResult: this.properties.filePickerResult,
                //   onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                //   properties: this.properties,
                //   onSave: this.handleFilePicker.bind(this),
                //   onChanged: this.handleFilePicker.bind(this),
                //   key: "filePickerId",
                //   buttonLabel: "Select",
                //   label: "Map",
                // }),
              ],
            },
          ],
        },
      ],
    };
  }
}
