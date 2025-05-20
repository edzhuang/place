"use client";

import type React from "react";
import { DEFAULT_PIXEL_SIZE, MIN_ZOOM, MAX_ZOOM } from "@/constants/canvas";

import { useRef, useEffect, useCallback, useState } from "react";
import { useCanvas } from "@/contexts/CanvasContext";

// Constants for momentum
const DAMPING_FACTOR = 0.92; // How quickly the momentum slows down (0 to 1)
const MIN_VELOCITY_THRESHOLD = 0.1; // Below this speed, momentum stops
// NEW: Constants for keyboard movement with momentum
const KEY_ACCELERATION = 1; // How much velocity increases per frame when a key is held
const MAX_KEY_VELOCITY = 15; // Maximum velocity achievable with keys

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // REMOVED: const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
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
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
  } | null>(null); // ADDED from OverlayCanvas
  const [mouseEventArgsForHover, setMouseEventArgsForHover] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null); // ADDED state for passing mouse events to OverlayCanvas

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

  // Effect to calculate hovered pixel based on mouse events (from OverlayCanvas)
  useEffect(() => {
    if (!mouseEventArgsForHover) {
      if (hoveredPixel !== null) {
        setHoveredPixel(null);
      }
      return;
    }

    if (
      !pixels ||
      pixels.length === 0 ||
      !pixels[0] ||
      pixels[0].length === 0
    ) {
      if (hoveredPixel !== null) {
        setHoveredPixel(null);
      }
      return;
    }

    const { clientX, clientY } = mouseEventArgsForHover;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
    // Adjust clientX and clientY with rect.left and rect.top for accurate grid calculation relative to the canvas
    const gridX = Math.floor(
      (clientX - rect.left - position.x) / effectivePixelSize
    );
    const gridY = Math.floor(
      (clientY - rect.top - position.y) / effectivePixelSize
    );

    let newHoveredPixelTarget = null;
    if (
      gridY >= 0 &&
      gridY < pixels.length &&
      gridX >= 0 &&
      gridX < pixels[gridY].length
    ) {
      newHoveredPixelTarget = { x: gridX, y: gridY };
    }

    if (
      newHoveredPixelTarget?.x !== hoveredPixel?.x ||
      newHoveredPixelTarget?.y !== hoveredPixel?.y
    ) {
      setHoveredPixel(newHoveredPixelTarget);
    }
  }, [mouseEventArgsForHover, pixels, zoom, position, hoveredPixel, canvasRef]);

  // Draw the canvas (MERGED with drawOverlayCanvas logic)
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return; // Simplified guard

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pixels (original logic)
    if (pixels.length > 0 && pixels[0] && pixels[0].length > 0) {
      const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
      const drawSize = Math.ceil(effectivePixelSize);

      for (let y = 0; y < pixels.length; y++) {
        for (let x = 0; x < pixels[y].length; x++) {
          const currentPixelX = x * effectivePixelSize + position.x;
          const currentPixelY = y * effectivePixelSize + position.y;

          if (
            currentPixelX + effectivePixelSize >= 0 &&
            currentPixelX <= canvas.width &&
            currentPixelY + effectivePixelSize >= 0 &&
            currentPixelY <= canvas.height
          ) {
            const drawX = Math.round(currentPixelX);
            const drawY = Math.round(currentPixelY);

            ctx.fillStyle = pixels[y][x];
            ctx.fillRect(drawX, drawY, drawSize, drawSize);
          }
        }
      }
    }

    // Draw hover outline (from OverlayCanvas)
    if (
      hoveredPixel &&
      pixels.length > 0 &&
      pixels[0] &&
      pixels[0].length > 0
    ) {
      const { x: gridX, y: gridY } = hoveredPixel;

      if (
        gridY >= 0 &&
        gridY < pixels.length &&
        gridX >= 0 &&
        gridX < pixels[gridY].length
      ) {
        const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
        const drawSize = Math.round(effectivePixelSize);
        const outlineX = Math.round(gridX * effectivePixelSize + position.x);
        const outlineY = Math.round(gridY * effectivePixelSize + position.y);

        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        ctx.strokeRect(outlineX, outlineY, drawSize, drawSize);
      }
    }

    // Draw selected pixel outline (from OverlayCanvas)
    if (
      selectedPixel &&
      pixels.length > 0 &&
      pixels[0] &&
      pixels[0].length > 0
    ) {
      const { x: gridX, y: gridY } = selectedPixel;

      if (
        gridY >= 0 &&
        gridY < pixels.length &&
        gridX >= 0 &&
        gridX < pixels[gridY].length
      ) {
        const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
        const drawSize = Math.ceil(effectivePixelSize); // Use Math.ceil for selection for better visibility
        const outlineX = Math.round(gridX * effectivePixelSize + position.x);
        const outlineY = Math.round(gridY * effectivePixelSize + position.y);

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(outlineX, outlineY, drawSize, drawSize);
      }
    }
  }, [pixels, zoom, position, selectedPixel, hoveredPixel]); // ADDED selectedPixel, hoveredPixel

  // Update canvas when relevant state changes
  useEffect(() => {
    drawCanvas();
  }, [pixels, zoom, position, selectedPixel, hoveredPixel, drawCanvas]); // ADDED selectedPixel, hoveredPixel

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
      drawCanvas(); // This will now also redraw overlays
    };

    handleResize(); // Initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCanvas]);

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
    setMouseEventArgsForHover(null); // Clear hover on mouse down

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
      setMouseEventArgsForHover(null); // Clear hover when drag starts
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
      setMouseEventArgsForHover(null); // Clear hover during drag
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
      // Not dragging, handle hover - pass event args to OverlayCanvas
      setMouseEventArgsForHover({ clientX: e.clientX, clientY: e.clientY });
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
    setMouseEventArgsForHover(null); // Clear hover on mouse leave

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
  };

  // MODIFIED: Handle wheel event for zooming
  const handleWheel = (e: React.WheelEvent) => {
    setMouseEventArgsForHover(null); // Clear hover on wheel event
    setIsDragging(false);

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
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 ${
        isDragging ? "cursor-grabbing" : "cursor-crosshair"
      } pointer-events-auto`} // Ensure canvas receives pointer events
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      // Width and height are set dynamically by resize effect
    />
  );
}
