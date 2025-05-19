"use client";

import type React from "react";
import { DEFAULT_PIXEL_SIZE, MIN_ZOOM, MAX_ZOOM } from "@/constants/canvas";

import { useRef, useEffect, useCallback } from "react";
import { useCanvas } from "@/contexts/CanvasContext";

// Constants for momentum
const DAMPING_FACTOR = 0.92; // How quickly the momentum slows down (0 to 1)
const MIN_VELOCITY_THRESHOLD = 0.1; // Below this speed, momentum stops
// NEW: Constants for keyboard movement with momentum
const KEY_ACCELERATION = 1; // How much velocity increases per frame when a key is held
const MAX_KEY_VELOCITY = 15; // Maximum velocity achievable with keys

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null); // New ref for overlay canvas
  const pendingDragStartInfoRef = useRef<{
    clientX: number;
    clientY: number;
  } | null>(null);

  // Refs for momentum
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  // NEW: Ref for tracking pressed keys
  const keysPressedRef = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });
  const hoveredPixelRef = useRef<{ x: number; y: number } | null>(null); // To store hovered pixel coords

  // Use context values
  const {
    pixels,
    selectedPixel, // Get selectedPixel from context
    setSelectedPixel, // Get setSelectedPixel from context
    zoom,
    setZoom,
    position,
    setPosition,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
  } = useCanvas();

  // Draw the canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || pixels.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate effective pixel size based on zoom (can be a float)
    const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;

    // Determine the size to draw each pixel (rounded up to prevent gaps)
    const drawSize = Math.ceil(effectivePixelSize);

    // Draw pixels
    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        // Calculate the precise, potentially fractional, top-left corner of the pixel
        const currentPixelX = x * effectivePixelSize + position.x;
        const currentPixelY = y * effectivePixelSize + position.y;

        // Only draw pixels that are visible in the viewport
        // This check uses the precise coordinates and effective size
        if (
          currentPixelX + effectivePixelSize >= 0 &&
          currentPixelX <= canvas.width &&
          currentPixelY + effectivePixelSize >= 0 &&
          currentPixelY <= canvas.height
        ) {
          // For actual drawing, round the coordinates to snap to the browser's pixel grid
          const drawX = Math.round(currentPixelX);
          const drawY = Math.round(currentPixelY);

          ctx.fillStyle = pixels[y][x];
          ctx.fillRect(drawX, drawY, drawSize, drawSize);
        }
      }
    }
  }, [pixels, zoom, position]);

  // NEW: Draw the hover outline on the overlay canvas
  const drawOverlayCanvas = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    const ctx = overlay?.getContext("2d");
    if (!overlay || !ctx) return;

    // Clear overlay canvas
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (
      hoveredPixelRef.current &&
      pixels.length > 0 &&
      pixels[0] &&
      pixels[0].length > 0
    ) {
      const { x: gridX, y: gridY } = hoveredPixelRef.current;

      // Check if the hovered pixel is within bounds
      if (
        gridY >= 0 &&
        gridY < pixels.length &&
        gridX >= 0 &&
        gridX < pixels[gridY].length
      ) {
        const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
        const drawSize = Math.ceil(effectivePixelSize); // Use the same drawSize as main canvas for consistency

        // Calculate the precise, potentially fractional, top-left corner of the pixel for outline
        const outlineX = Math.round(gridX * effectivePixelSize + position.x);
        const outlineY = Math.round(gridY * effectivePixelSize + position.y);

        // Draw a wider white outline first for contrast
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2; // Adjust as needed
        ctx.strokeRect(outlineX, outlineY, drawSize, drawSize);

        // Draw a thinner black outline on top
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1; // Adjust as needed
        ctx.strokeRect(outlineX, outlineY, drawSize, drawSize);
      }
    }

    if (
      selectedPixel &&
      pixels.length > 0 &&
      pixels[0] &&
      pixels[0].length > 0
    ) {
      const { x: gridX, y: gridY } = selectedPixel;

      // Check if the selected pixel is within bounds (it should be, if set correctly)
      if (
        gridY >= 0 &&
        gridY < pixels.length &&
        gridX >= 0 &&
        gridX < pixels[gridY].length
      ) {
        const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
        const drawSize = Math.ceil(effectivePixelSize);

        const outlineX = Math.round(gridX * effectivePixelSize + position.x);
        const outlineY = Math.round(gridY * effectivePixelSize + position.y);

        ctx.strokeStyle = "#00FFFF"; // Bright cyan for selected, adjust as needed
        ctx.lineWidth = 2.5; // Make it slightly thicker than hover
        // To make it more distinct, consider a dashed line or double outline later if needed
        ctx.strokeRect(outlineX, outlineY, drawSize, drawSize);
      }
    }
  }, [pixels, zoom, position, selectedPixel]);

  // Update canvas when pixels, zoom, or position changes
  useEffect(() => {
    drawCanvas();
  }, [pixels, zoom, position, drawCanvas]);

  useEffect(() => {
    drawOverlayCanvas(); // Draw selected outline after hover (or manage clearing better)
  }, [zoom, position, pixels, selectedPixel, drawOverlayCanvas]); // Added selectedPixel and pixels

  // Effect for cleaning up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Ensure event listeners for keys are also cleaned up if added elsewhere directly
    };
  }, []);

  // Resize canvas when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
      if (overlayCanvasRef.current) {
        // Resize overlay canvas
        overlayCanvasRef.current.width = window.innerWidth;
        overlayCanvasRef.current.height = window.innerHeight;
      }
      // Explicitly call draw functions after resize
      drawCanvas();
      drawOverlayCanvas();
    };

    handleResize(); // Initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCanvas, drawOverlayCanvas]); // Add drawSelectedOutline dependency

  // MODIFIED: Function to start and manage momentum scrolling animation (now handles keys too)
  const startMomentumScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const animate = () => {
      let { x: velX, y: velY } = velocityRef.current;
      let isActivelyKeyScrolling = false;

      // Apply acceleration from keys if any are pressed
      if (keysPressedRef.current.ArrowUp) {
        velY = Math.max(velY + KEY_ACCELERATION, MAX_KEY_VELOCITY);
        isActivelyKeyScrolling = true;
      }
      if (keysPressedRef.current.ArrowDown) {
        velY = Math.min(velY - KEY_ACCELERATION, -MAX_KEY_VELOCITY);
        isActivelyKeyScrolling = true;
      }
      if (keysPressedRef.current.ArrowLeft) {
        velX = Math.max(velX + KEY_ACCELERATION, MAX_KEY_VELOCITY);
        isActivelyKeyScrolling = true;
      }
      if (keysPressedRef.current.ArrowRight) {
        velX = Math.min(velX - KEY_ACCELERATION, -MAX_KEY_VELOCITY);
        isActivelyKeyScrolling = true;
      }

      // If not actively moving with keys, apply damping for momentum
      if (!isActivelyKeyScrolling) {
        velX *= DAMPING_FACTOR;
        velY *= DAMPING_FACTOR;
      }

      // Stop animation if velocity is below threshold AND no keys are pressed
      if (
        !isActivelyKeyScrolling &&
        Math.abs(velX) < MIN_VELOCITY_THRESHOLD &&
        Math.abs(velY) < MIN_VELOCITY_THRESHOLD
      ) {
        velocityRef.current = { x: 0, y: 0 };
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      setPosition((prevPos) => ({
        x: prevPos.x + velX,
        y: prevPos.y + velY,
      }));

      velocityRef.current = { x: velX, y: velY };
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [setPosition]);

  // NEW: useEffect for keyboard controls (keydown and keyup)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        Object.prototype.hasOwnProperty.call(keysPressedRef.current, event.key)
      ) {
        keysPressedRef.current[
          event.key as keyof typeof keysPressedRef.current
        ] = true;

        // If mouse momentum was active, stop it and let keys take over
        if (animationFrameRef.current && !isAnyKeyPressed()) {
          // This check ensures we don't needlessly stop/start if already key scrolling
        }
        // Ensure the animation loop is running if it's not already
        if (!animationFrameRef.current) {
          // Reset velocity if starting fresh with keys, to avoid using leftover mouse velocity
          if (!isDragging && !pendingDragStartInfoRef.current) {
            velocityRef.current = { x: 0, y: 0 };
          }
          startMomentumScroll();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        Object.prototype.hasOwnProperty.call(keysPressedRef.current, event.key)
      ) {
        keysPressedRef.current[
          event.key as keyof typeof keysPressedRef.current
        ] = false;
        // The animation loop in startMomentumScroll will handle damping if no keys are pressed
      }
    };

    const isAnyKeyPressed = () => {
      return Object.values(keysPressedRef.current).some(
        (isPressed) => isPressed
      );
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startMomentumScroll, isDragging]); // Added isDragging to re-evaluate if needed

  // MODIFIED: Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Clear hover outline when any mouse button is pressed, as it usually indicates start of another action
    if (hoveredPixelRef.current) {
      hoveredPixelRef.current = null;
    }

    if (e.button === 0) {
      // Left click
      // Stop any ongoing momentum animation (mouse or key)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      velocityRef.current = { x: 0, y: 0 }; // Reset velocity
      // Reset key pressed states
      Object.keys(keysPressedRef.current).forEach((key) => {
        keysPressedRef.current[key as keyof typeof keysPressedRef.current] =
          false;
      });

      // Store initial mouse position but don't start dragging yet
      pendingDragStartInfoRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
      };
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (pendingDragStartInfoRef.current) {
      // Mouse has moved after mousedown, so start the drag
      // Clear hover when drag starts
      if (hoveredPixelRef.current) {
        hoveredPixelRef.current = null;
        drawOverlayCanvas();
      }
      setIsDragging(true);
      const newDragStartX =
        pendingDragStartInfoRef.current.clientX - position.x;
      const newDragStartY =
        pendingDragStartInfoRef.current.clientY - position.y;
      setDragStart({ x: newDragStartX, y: newDragStartY });

      // Initialize lastMousePositionRef for velocity calculation
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY };

      // Update position based on the new drag start
      setPosition({
        x: e.clientX - newDragStartX,
        y: e.clientY - newDragStartY,
      });

      pendingDragStartInfoRef.current = null; // Drag has started, clear the pending info
    } else if (isDragging) {
      // Drag was already in progress
      // Clear hover if somehow active during drag (belt-and-suspenders)
      if (hoveredPixelRef.current) {
        hoveredPixelRef.current = null;
        drawOverlayCanvas();
      }
      if (lastMousePositionRef.current) {
        const deltaX = e.clientX - lastMousePositionRef.current.x;
        const deltaY = e.clientY - lastMousePositionRef.current.y;
        velocityRef.current = { x: deltaX, y: deltaY };
      }
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY };

      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      // Not dragging, handle hover
      const canvas = canvasRef.current; // Use main canvas for coordinate calculations
      const rect = canvas?.getBoundingClientRect();
      // Ensure pixels array is valid before proceeding
      if (
        !rect ||
        !pixels ||
        pixels.length === 0 ||
        !pixels[0] ||
        pixels[0].length === 0
      ) {
        if (hoveredPixelRef.current) {
          // If there was a hover, clear it
          hoveredPixelRef.current = null;
          drawOverlayCanvas();
        }
        return;
      }

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;

      // Calculate grid coordinates from mouse position
      const gridX = Math.floor((mouseX - position.x) / effectivePixelSize);
      const gridY = Math.floor((mouseY - position.y) / effectivePixelSize);

      let newHoveredPixelTarget = null;
      // Check if calculated grid coordinates are within the bounds of the pixels array
      if (
        gridY >= 0 &&
        gridY < pixels.length &&
        gridX >= 0 &&
        gridX < pixels[gridY].length
      ) {
        newHoveredPixelTarget = { x: gridX, y: gridY };
      }

      // Update hover state and redraw outline only if the hovered pixel has changed
      const currentHover = hoveredPixelRef.current;
      if (
        newHoveredPixelTarget?.x !== currentHover?.x ||
        newHoveredPixelTarget?.y !== currentHover?.y
      ) {
        hoveredPixelRef.current = newHoveredPixelTarget;
        drawOverlayCanvas();
      }
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    const wasDragging = isDragging;
    if (isDragging) {
      setIsDragging(false);
      if (
        Math.abs(velocityRef.current.x) > MIN_VELOCITY_THRESHOLD ||
        Math.abs(velocityRef.current.y) > MIN_VELOCITY_THRESHOLD
      ) {
        startMomentumScroll();
      }
    }
    // If it wasn't a drag, and we had a pending drag start (meaning mouse down happened on canvas)
    // then it's a click.
    if (!wasDragging && pendingDragStartInfoRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      if (rect && pixels.length > 0 && pixels[0] && pixels[0].length > 0) {
        const clickX = pendingDragStartInfoRef.current.clientX - rect.left;
        const clickY = pendingDragStartInfoRef.current.clientY - rect.top;

        const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
        const gridX = Math.floor((clickX - position.x) / effectivePixelSize);
        const gridY = Math.floor((clickY - position.y) / effectivePixelSize);

        if (
          gridY >= 0 &&
          gridY < pixels.length &&
          gridX >= 0 &&
          gridX < pixels[gridY].length
        ) {
          // If clicking the same selected pixel, deselect it. Otherwise, select the new one.
          if (
            selectedPixel &&
            selectedPixel.x === gridX &&
            selectedPixel.y === gridY
          ) {
            setSelectedPixel(null); // Deselect
          } else {
            setSelectedPixel({ x: gridX, y: gridY }); // Select new
          }
        } else {
          setSelectedPixel(null); // Clicked outside grid, deselect
        }
      }
    }

    pendingDragStartInfoRef.current = null; // Clear pending drag info
    lastMousePositionRef.current = null; // Clear last mouse position
  };

  // Handle mouse leave to stop dragging
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      // If dragging and mouse leaves, trigger momentum
      if (
        Math.abs(velocityRef.current.x) > MIN_VELOCITY_THRESHOLD ||
        Math.abs(velocityRef.current.y) > MIN_VELOCITY_THRESHOLD
      ) {
        startMomentumScroll();
      }
    }
    pendingDragStartInfoRef.current = null; // Clear pending drag info
    lastMousePositionRef.current = null; // Clear last mouse position

    // Clear hover outline when mouse leaves the canvas
    if (hoveredPixelRef.current) {
      hoveredPixelRef.current = null;
      drawOverlayCanvas();
    }
  };

  // MODIFIED: Handle wheel event for zooming
  const handleWheel = (e: React.WheelEvent) => {
    // Clear hover on wheel, as pixel under mouse changes or zoom invalidates current hover
    if (hoveredPixelRef.current) {
      hoveredPixelRef.current = null;
    }

    // Stop any ongoing momentum animation (mouse or key)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      velocityRef.current = { x: 0, y: 0 };
    }
    // Reset key pressed states
    Object.keys(keysPressedRef.current).forEach((key) => {
      keysPressedRef.current[key as keyof typeof keysPressedRef.current] =
        false;
    });

    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPositionX = mouseX - (mouseX - position.x) * (newZoom / zoom);
    const newPositionY = mouseY - (mouseY - position.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPosition({ x: newPositionX, y: newPositionY });
  };

  return (
    <>
      {" "}
      {/* Use a fragment to return multiple sibling elements */}
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 ${
          isDragging ? "cursor-grabbing" : "cursor-crosshair"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
      <canvas
        ref={overlayCanvasRef}
        className="fixed inset-0 pointer-events-none" // pointer-events-none so it doesn't block main canvas
        // Width and height will be set dynamically in the resize effect
      />
    </>
  );
}
