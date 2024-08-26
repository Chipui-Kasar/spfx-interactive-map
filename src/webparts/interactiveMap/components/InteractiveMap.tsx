import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useBoolean } from "@fluentui/react-hooks";
import styles from "./InteractiveMap.module.scss";
import {
  emptyMarkerItem,
  type IInteractiveMapProps,
  type IMarker,
} from "./IInteractiveMapProps";
import World from "./World";
import AddorEditMarker from "./AddorEditMarker";
import { isFunction, cloneDeep } from "lodash";

const InteractiveMap: React.FC<IInteractiveMapProps> = (props) => {
  const initialViewBox = { x: 0, y: 0, width: 1353, height: 543 };
  const [viewBox, setViewBox] = useState(initialViewBox);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [markerItems] = useState<IMarker[]>(props.markerItems);

  const [currentMarker, setCurrentMarker] = useState({} as IMarker);
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] =
    useBoolean(false);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    if (!svgRef.current) return;

    const svgElement = svgRef.current;
    const svgRect = svgElement.getBoundingClientRect();
    const w = viewBox.width;
    const h = viewBox.height;
    const mx = e.clientX - svgRect.left; // Mouse x relative to SVG
    const my = e.clientY - svgRect.top; // Mouse y relative to SVG

    const zoomDirection = e.deltaY < 0 ? 1 : -1; // Zoom direction
    const zoomFactor = 0.05; // Zoom speed

    const dw = w * zoomDirection * zoomFactor;
    const dh = h * zoomDirection * zoomFactor;

    const newWidth = w - dw;
    const newHeight = h - dh;

    // Calculate the new viewBox position
    const dx = (dw * mx) / svgRect.width;
    const dy = (dh * my) / svgRect.height;

    setViewBox((prevViewBox) => ({
      x: prevViewBox.x + dx,
      y: prevViewBox.y + dy,
      width: newWidth > 0 ? newWidth : prevViewBox.width, // Prevent negative width/height
      height: newHeight > 0 ? newHeight : prevViewBox.height, // Prevent negative width/height
    }));
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setDragStartPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;

    // Calculate the difference in mouse position
    const dx = event.clientX - dragStartPosition.x;
    const dy = event.clientY - dragStartPosition.y;

    // Update the viewBox based on the drag movement
    setViewBox((prevViewBox) => ({
      x: prevViewBox.x - dx * (viewBox.width / svgRef.current!.clientWidth),
      y: prevViewBox.y - dy * (viewBox.height / svgRef.current!.clientHeight),
      width: prevViewBox.width,
      height: prevViewBox.height,
    }));

    // Update drag start position to the current mouse position
    setDragStartPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRightClick = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault(); // Prevent the context menu from appearing

    if (!svgRef.current || !props.isEditMode) return;

    const svgElement = svgRef.current;

    const point = svgElement.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const transformedPoint = point.matrixTransform(
      svgElement.getScreenCTM()?.inverse()
    );

    const x = transformedPoint.x;
    const y = transformedPoint.y;

    const newMarker = cloneDeep(emptyMarkerItem);

    // Update the marker's coordinates
    newMarker.latitude = y;
    newMarker.longitude = x;
    // Update the current marker and show the panel
    setCurrentMarker(newMarker);

    openPanel();
  };

  useEffect(() => {
    const mapContainer = mapContainerRef.current;

    if (mapContainer) {
      mapContainer.addEventListener("wheel", handleWheel);
      mapContainer.addEventListener("mousemove", handleMouseMove);
      mapContainer.addEventListener("mouseup", handleMouseUp);
      mapContainer.addEventListener("mouseleave", handleMouseUp); // Handle case when mouse leaves the container
    }

    // Cleanup event listeners
    return () => {
      if (mapContainer) {
        mapContainer.removeEventListener("wheel", handleWheel);
        mapContainer.removeEventListener("mousemove", handleMouseMove);
        mapContainer.removeEventListener("mouseup", handleMouseUp);
        mapContainer.removeEventListener("mouseleave", handleMouseUp);
      }
    };
  }, [isDragging, dragStartPosition, viewBox]);
  const checkOpenPanelFromMapMarker = (marker: IMarker) => {
    if (marker.id) {
      setCurrentMarker(marker);
      openPanel();
    }
  };
  const scaleFactor = (initialViewBox.width / viewBox.width) * 0.8;

  return (
    <section className={`${styles.interactiveMap}`}>
      <div className={styles.header}>
        <div className={styles.title}>{props.title}</div>
      </div>
      <div
        className={styles.mapContainer}
        style={{
          height: props.height ?? "450px",
          overflow: "hidden",
          position: "relative",
          cursor: isDragging ? "grabbing" : "auto",
        }}
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
      >
        <World
          ref={svgRef} // Attach the SVG ref here
          onClick={handleRightClick} // Attach the right-click handler
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          style={{
            // userSelect: "none",
            width: "100%", // Ensure the SVG scales with the container
            height: "100%", // Ensure the SVG scales with the container
          }}
          markerItems={markerItems}
          openPanel={checkOpenPanelFromMapMarker}
          scale={scaleFactor}
        />
      </div>
      {isOpen && (
        <AddorEditMarker
          markerItem={currentMarker}
          onMarkerChanged={(markerItem: IMarker, isNewMarker: boolean) => {
            if (isNewMarker) {
              markerItems.push(markerItem);
            } else {
              const markerIndex: number = markerItems.findIndex(
                (m) => m.id == markerItem.id
              );

              if (markerIndex >= 0) {
                markerItems[markerIndex] = markerItem;
              }
            }

            if (isFunction(props.onMarkerCollectionChanged)) {
              props.onMarkerCollectionChanged(markerItems);
            }

            dismissPanel();
          }}
          onDeleteMarker={(marker: IMarker) => {
            const markerIndex: number = markerItems.findIndex(
              (m) => m.id == marker.id
            );

            if (markerIndex >= 0) {
              markerItems.splice(markerIndex, 1);
            }

            if (isFunction(props.onMarkerCollectionChanged)) {
              props.onMarkerCollectionChanged(markerItems);
            }
          }}
          openPanel={isOpen}
          dismissPanel={dismissPanel}
          editMode={props.isEditMode}
        />
      )}
    </section>
  );
};

export default InteractiveMap;
