import React, { useRef, useState, useEffect, useCallback } from "react";
import { useCanvas } from "../contexts/CanvasContext";
import {
  DEFAULT_PIXEL_SIZE,
  DAMPING_FACTOR,
  MIN_VELOCITY_THRESHOLD,
  KEY_ACCELERATION,
  MAX_KEY_VELOCITY,
} from "../constants/canvas";
import { Coordinates } from "../types/canvas";
import { calculateGridCoordinates, isPixelInBounds } from "../utils/canvas"; // Assuming these utils exist

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pendingDragStartInfoRef = useRef<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const lastMousePositionRef = useRef<Coordinates | null>(null);
  const velocityRef = useRef<Coordinates>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const keysPressedRef = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });
  const lastTouchDistanceRef = useRef<number | null>(null);
  const touchCenterRef = useRef<Coordinates | null>(null);
  const isPinchGestureRef = useRef<boolean>(false);
  const lastTouchPositionRef = useRef<Coordinates | null>(null);
  const touchStartPositionRef = useRef<Coordinates | null>(null);
  const isTouchDraggingRef = useRef<boolean>(false);
  const [mouseEventArgsForHover, setMouseEventArgsForHover] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const [selectedPixelUser, setSelectedPixelUser] = useState<string | null>(
    null
  );
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameDrawRef = useRef<number | null>(null);

  const {
    pixels,
    hoveredPixel,
    setHoveredPixel,
    selectedPixel,
    setSelectedPixel,
    zoom,
    adjustZoom,
    position,
    setClampedPosition,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
  } = useCanvas();

  // Refs for stable access to state/props in callbacks
  const zoomRef = useRef(zoom);
  const pixelsRef = useRef(pixels);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    pixelsRef.current = pixels;
  }, [pixels]);

  // Utility function to stop animations and reset states
  const stopAndResetAnimations = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    velocityRef.current = { x: 0, y: 0 };
    Object.keys(keysPressedRef.current).forEach((key) => {
      keysPressedRef.current[key as keyof typeof keysPressedRef.current] =
        false;
    });
  }, []);

  // Effect to update the off-screen canvas when pixel data changes
  useEffect(() => {
    if (
      !pixels ||
      pixels.length === 0 ||
      !pixels[0] ||
      pixels[0].length === 0
    ) {
      offscreenCanvasRef.current = null; // Clear if no pixels
      // Trigger a redraw of the main canvas if it was cleared
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const gridWidth = pixels[0].length;
    const gridHeight = pixels.length;

    let canvas = offscreenCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      offscreenCanvasRef.current = canvas;
    }

    if (canvas.width !== gridWidth || canvas.height !== gridHeight) {
      canvas.width = gridWidth;
      canvas.height = gridHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(gridWidth, gridHeight);
    const data = imageData.data;

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const color = pixels[y][x].color;
        const index = (y * gridWidth + x) * 4;
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    // The main drawing useEffect will pick up this change via 'pixels' dependency and schedule a redraw.
  }, [pixels]);

  // NEW EFFECT: Fetch Clerk username for selected pixel
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchUsername = async (userId: string) => {
      try {
        const response = await fetch(`/api/users/${userId}`, { signal });
        if (!response.ok) {
          // If the response status is 404, it means the user was not found
          if (response.status === 404) {
            console.log(`User not found for ID: ${userId}`);
            return null; // Return null or a default/anonymous username
          }
          throw new Error(`Error fetching username: ${response.statusText}`);
        }
        const data = await response.json();
        return data.username;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("Fetch username aborted");
          return null;
        }
        console.error("Failed to fetch username from API:", error);
        return `User_${userId.substring(0, 5)}`; // Fallback to mock/placeholder on error
      }
    };

    if (
      selectedPixel &&
      pixels &&
      pixels[selectedPixel.y] &&
      pixels[selectedPixel.y][selectedPixel.x]
    ) {
      const placerId = pixels[selectedPixel.y][selectedPixel.x].placedBy;
      if (placerId) {
        fetchUsername(placerId)
          .then(setSelectedPixelUser)
          .catch((err) => {
            console.error("Failed to fetch username:", err);
            setSelectedPixelUser(null);
          });
      } else {
        setSelectedPixelUser(null);
      }
    } else {
      setSelectedPixelUser(null);
    }

    return () => {
      // Cleanup function to reset selected pixel user when the selected pixel changes
      // And abort the fetch request if it's in progress
      controller.abort();
    };
  }, [selectedPixel, pixels]);

  // Effect to calculate hovered pixel based on mouse events (from OverlayCanvas)
  useEffect(() => {
    if (!mouseEventArgsForHover) {
      return;
    }

    const { clientX, clientY } = mouseEventArgsForHover;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { gridX, gridY } = calculateGridCoordinates(
      clientX,
      clientY,
      rect,
      position,
      zoom
    );

    let newHoveredPixelTarget = null;
    if (isPixelInBounds(gridX, gridY, pixels)) {
      newHoveredPixelTarget = { x: gridX, y: gridY };
    }

    if (
      newHoveredPixelTarget?.x !== hoveredPixel?.x ||
      newHoveredPixelTarget?.y !== hoveredPixel?.y
    ) {
      setHoveredPixel(newHoveredPixelTarget);
    }
  }, [
    mouseEventArgsForHover,
    pixels,
    zoom,
    position,
    hoveredPixel,
    setHoveredPixel,
    canvasRef,
  ]);

  // Draw the canvas (MERGED with drawOverlayCanvas logic)
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return; // Simplified guard

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pixels from off-screen canvas
    if (
      offscreenCanvasRef.current &&
      pixels.length > 0 &&
      pixels[0] &&
      pixels[0].length > 0
    ) {
      const offscreen = offscreenCanvasRef.current;
      const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;

      ctx.imageSmoothingEnabled = false;
      // (ctx as any).mozImageSmoothingEnabled = false; // For Firefox if needed
      // (ctx as any).webkitImageSmoothingEnabled = false; // For Webkit if needed
      // (ctx as any).msImageSmoothingEnabled = false; // For IE/Edge if needed

      ctx.drawImage(
        offscreen,
        position.x, // dx on main canvas
        position.y, // dy on main canvas
        offscreen.width * effectivePixelSize, // dWidth on main canvas
        offscreen.height * effectivePixelSize // dHeight on main canvas
      );
    }

    // Draw hover outline (from OverlayCanvas)
    if (
      hoveredPixel &&
      isPixelInBounds(hoveredPixel.x, hoveredPixel.y, pixels)
    ) {
      const { x: gridX, y: gridY } = hoveredPixel;

      // No need for an additional check here as isPixelInBounds already covers it
      const drawSize = DEFAULT_PIXEL_SIZE * zoom;
      const outlineX = gridX * drawSize + position.x;
      const outlineY = gridY * drawSize + position.y;

      ctx.strokeStyle = "gray";
      ctx.lineWidth = 1;
      ctx.strokeRect(outlineX, outlineY, drawSize, drawSize);
    }

    // Draw selected pixel outline (from OverlayCanvas)
    if (
      selectedPixel &&
      isPixelInBounds(selectedPixel.x, selectedPixel.y, pixels)
    ) {
      const { x: gridX, y: gridY } = selectedPixel;

      // No need for an additional check here as isPixelInBounds already covers it
      const drawSize = DEFAULT_PIXEL_SIZE * zoom;
      const outlineX = gridX * drawSize + position.x;
      const outlineY = gridY * drawSize + position.y;

      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.strokeRect(outlineX, outlineY, drawSize, drawSize);

      // Draw username if available
      if (selectedPixelUser) {
        const FONT_SIZE = 14; // Using the user's preferred font size
        const PADDING_X = 12;
        const PADDING_Y = 8;
        ctx.font = `500 ${FONT_SIZE}px Geist`; // Added font weight
        ctx.textAlign = "center";
        const text = `Placed by ${selectedPixelUser}`;
        const textX = outlineX + drawSize / 2;
        const textY = outlineY - 18;

        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;

        // Approximate text height based on font size, can be more precise if needed
        const textHeight = textMetrics.actualBoundingBoxAscent;
        const rectWidth = textWidth + PADDING_X * 2;
        const rectHeight = textHeight + PADDING_Y * 2;
        // Position the rectangle centered above the pixel selection
        // outlineY - 15 was the original text Y, so we base the rect Y on that
        const rectX = textX - textWidth / 2 - PADDING_X;
        const rectY = textY - textHeight - PADDING_Y; // Adjusted to center the text better

        // Draw speech bubble tail (black triangle pointing down)
        const triangleSize = 10;
        const triangleX = textX; // Center the triangle horizontally
        const triangleTopY = rectY + rectHeight - 2; // Start at bottom of rectangle

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.moveTo(triangleX - triangleSize, triangleTopY); // Top point of triangle
        ctx.lineTo(triangleX, triangleTopY + triangleSize); // Bottom left
        ctx.lineTo(triangleX + triangleSize, triangleTopY); // Bottom right
        ctx.closePath();
        ctx.fill();

        // Draw black background rectangle
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectWidth, rectHeight, rectHeight / 2);
        ctx.fill();

        // Draw username text (white for contrast)
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(text, textX, textY);
      }
    }
  }, [pixels, zoom, position, selectedPixel, hoveredPixel, selectedPixelUser]); // ADDED selectedPixelUser

  // Update canvas when relevant state changes, using requestAnimationFrame
  useEffect(() => {
    const scheduleDraw = () => {
      if (animationFrameDrawRef.current) {
        cancelAnimationFrame(animationFrameDrawRef.current);
      }
      animationFrameDrawRef.current = requestAnimationFrame(() => {
        drawCanvas();
      });
    };

    scheduleDraw();

    return () => {
      if (animationFrameDrawRef.current) {
        cancelAnimationFrame(animationFrameDrawRef.current);
        animationFrameDrawRef.current = null;
      }
    };
  }, [pixels, zoom, position, selectedPixel, hoveredPixel, drawCanvas]);

  // Effect for cleaning up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Effect to add native wheel event listener to prevent browser zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Check if the event is a zoom gesture (typically has ctrlKey on macOS)
      if (e.ctrlKey || Math.abs(e.deltaY) > 50) {
        e.preventDefault();
      }
    };

    canvas.addEventListener("wheel", handleWheelNative, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheelNative);
    };
  }, []);

  // Effect to add canvas-specific touch event prevention
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartedOnCanvas = false;

    const preventDefaultTouch = (e: TouchEvent) => {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return;

      if (e.type === "touchstart") {
        // Check if touch started on canvas
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        touchStartedOnCanvas = element === canvas || canvas.contains(element);
        if (touchStartedOnCanvas) {
          e.preventDefault();
        }
      } else if (e.type === "touchmove" || e.type === "touchend") {
        // Only prevent if touch started on canvas
        if (touchStartedOnCanvas) {
          e.preventDefault();
        }
        // Reset flag on touchend
        if (e.type === "touchend") {
          touchStartedOnCanvas = false;
        }
      }
    };

    const preventDefaultWheel = (e: WheelEvent) => {
      // Prevent default zoom/scroll behaviors for wheel events on canvas
      if (e.ctrlKey || Math.abs(e.deltaY) > 50) {
        e.preventDefault();
      }
    };

    // Add canvas-specific touch event listeners
    canvas.addEventListener("touchstart", preventDefaultTouch, {
      passive: false,
    });
    canvas.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });
    canvas.addEventListener("touchend", preventDefaultTouch, {
      passive: false,
    });
    canvas.addEventListener("wheel", preventDefaultWheel, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", preventDefaultTouch);
      canvas.removeEventListener("touchmove", preventDefaultTouch);
      canvas.removeEventListener("touchend", preventDefaultTouch);
      canvas.removeEventListener("wheel", preventDefaultWheel);
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

      if (!isActivelyKeyScrolling) {
        velX *= DAMPING_FACTOR;
        velY *= DAMPING_FACTOR;
      }

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

      setClampedPosition((prevPos) => ({
        x: prevPos.x + velX,
        y: prevPos.y + velY,
      }));

      velocityRef.current = { x: velX, y: velY };
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Ensure velocity is not zero if starting momentum, otherwise it might stop immediately.
    // This check might be too aggressive if a very small flick is intended.
    // Consider if MIN_VELOCITY_THRESHOLD handles this sufficiently.
    if (
      Math.abs(velocityRef.current.x) >= MIN_VELOCITY_THRESHOLD ||
      Math.abs(velocityRef.current.y) >= MIN_VELOCITY_THRESHOLD ||
      keysPressedRef.current.ArrowUp ||
      keysPressedRef.current.ArrowDown || // also start if keys are initiating
      keysPressedRef.current.ArrowLeft ||
      keysPressedRef.current.ArrowRight
    ) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // If velocity is already below threshold and no keys, ensure it's zeroed.
      velocityRef.current = { x: 0, y: 0 };
    }
  }, [
    setClampedPosition /*, DAMPING_FACTOR, MIN_VELOCITY_THRESHOLD, etc. are constants */,
  ]);

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
      stopAndResetAnimations(); // Use the utility function

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
      setClampedPosition({
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

      setClampedPosition({
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
        // Keep initial pixel data check
        const { gridX, gridY } = calculateGridCoordinates(
          pendingDragStartInfoRef.current.clientX,
          pendingDragStartInfoRef.current.clientY,
          rect,
          position,
          zoom
        );

        if (isPixelInBounds(gridX, gridY, pixels)) {
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

      setSelectedPixelUser(null); // Clear selected pixel user on click
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

    stopAndResetAnimations(); // Use the utility function

    // More responsive zoom based on deltaY magnitude
    // Normalize deltaY and apply sensitivity scaling
    const sensitivity = 0.01; // Adjust this value to fine-tune responsiveness
    const zoomDelta = -e.deltaY * sensitivity; // Negative because positive deltaY means zoom out

    // Clamp the zoom delta to prevent extreme jumps
    const clampedDelta = Math.max(-0.1, Math.min(0.1, zoomDelta));

    // Convert to multiplication factor (1 = no change, >1 = zoom in, <1 = zoom out)
    const multFactor = 1 + clampedDelta;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    adjustZoom(multFactor, { x: mouseX, y: mouseY });
  };

  // NEW: Handle touch events for pinch-to-zoom and panning
  const handleTouchStart = (e: React.TouchEvent) => {
    setMouseEventArgsForHover(null); // Clear hover on touch start

    if (e.touches.length === 2) {
      // Pinch gesture
      stopAndResetAnimations();
      setIsDragging(false);
      isTouchDraggingRef.current = false;
      isPinchGestureRef.current = true; // Mark that we're in a pinch gesture

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      lastTouchDistanceRef.current = distance;
      touchCenterRef.current = { x: centerX, y: centerY };
    } else if (e.touches.length === 1) {
      // Single touch - prepare for panning only if not coming from a pinch
      if (!isPinchGestureRef.current) {
        stopAndResetAnimations();

        const touch = e.touches[0];
        touchStartPositionRef.current = { x: touch.clientX, y: touch.clientY };
        lastTouchPositionRef.current = { x: touch.clientX, y: touch.clientY };
        isTouchDraggingRef.current = false;
      }

      // Reset pinch state
      lastTouchDistanceRef.current = null;
      touchCenterRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      e.touches.length === 2 &&
      lastTouchDistanceRef.current &&
      touchCenterRef.current
    ) {
      // Pinch-to-zoom for two fingers

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      const scale = distance / lastTouchDistanceRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();

      if (rect) {
        const touchX = centerX - rect.left;
        const touchY = centerY - rect.top;

        adjustZoom(scale, { x: touchX, y: touchY });
      }

      lastTouchDistanceRef.current = distance;
      touchCenterRef.current = { x: centerX, y: centerY };
    } else if (
      e.touches.length === 1 &&
      !isPinchGestureRef.current && // Only allow single finger panning if not in/from a pinch
      lastTouchPositionRef.current &&
      touchStartPositionRef.current
    ) {
      // Single finger panning
      const touch = e.touches[0];
      const currentTouchPosition = { x: touch.clientX, y: touch.clientY };
      const lastPos = lastTouchPositionRef.current; // Ensure lastPos is not null before use

      if (lastPos) {
        const deltaX = currentTouchPosition.x - lastPos.x;
        const deltaY = currentTouchPosition.y - lastPos.y;

        // Update velocity for momentum (similar to mouse movement)
        velocityRef.current = { x: deltaX, y: deltaY };

        setClampedPosition((prevPos) => ({
          x: prevPos.x + deltaX,
          y: prevPos.y + deltaY,
        }));

        // Update last touch position for next move event
        lastTouchPositionRef.current = currentTouchPosition;

        // Determine if dragging started (optional, based on original logic)
        if (!isTouchDraggingRef.current) {
          const distMoved = Math.sqrt(
            Math.pow(touch.clientX - touchStartPositionRef.current!.x, 2) +
              Math.pow(touch.clientY - touchStartPositionRef.current!.y, 2)
          );
          if (distMoved > 5) {
            // Threshold to start dragging
            isTouchDraggingRef.current = true;
          }
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      // Reset pinch state when pinch ends
      lastTouchDistanceRef.current = null;
      touchCenterRef.current = null;
    }

    if (e.touches.length === 0) {
      // All touches ended
      const wasPinchGesture = isPinchGestureRef.current;

      // Reset velocity if we were in a pinch gesture to prevent slingshot
      if (wasPinchGesture) {
        velocityRef.current = { x: 0, y: 0 };
      }

      if (isTouchDraggingRef.current && !wasPinchGesture) {
        // Was dragging and not from a pinch, trigger momentum if velocity is sufficient
        if (
          Math.abs(velocityRef.current.x) > MIN_VELOCITY_THRESHOLD ||
          Math.abs(velocityRef.current.y) > MIN_VELOCITY_THRESHOLD
        ) {
          startMomentumScroll();
        }
      } else if (touchStartPositionRef.current && !wasPinchGesture) {
        // Was a tap, not a drag - handle pixel selection
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect();
        if (rect && pixels.length > 0 && pixels[0] && pixels[0].length > 0) {
          const { gridX, gridY } = calculateGridCoordinates(
            touchStartPositionRef.current.x,
            touchStartPositionRef.current.y,
            rect,
            position,
            zoom
          );

          if (isPixelInBounds(gridX, gridY, pixels)) {
            // If tapping the same selected pixel, deselect it. Otherwise, select the new one.
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
            setSelectedPixel(null); // Tapped outside grid, deselect
          }
        }

        setSelectedPixelUser(null);
      }

      // Reset touch state
      lastTouchPositionRef.current = null;
      touchStartPositionRef.current = null;
      isTouchDraggingRef.current = false;
      isPinchGestureRef.current = false; // Reset pinch gesture flag
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 ${
        isDragging ? "cursor-grabbing" : "cursor-crosshair"
      } pointer-events-auto`}
      style={{
        touchAction: "none", // Disable all touch gestures (panning, zooming, etc.)
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none", // Disable callout on iOS
        WebkitTapHighlightColor: "transparent", // Disable tap highlight
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
