import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move } from 'lucide-react';

/**
 * ImageCropper - A component to crop/fit images to a target aspect ratio
 * Uses Canvas API for high-quality image processing
 */
export default function ImageCropper({
  image,
  onCrop,
  onCancel,
  aspectRatio = 4/3, // Default to product card aspect ratio
  maxWidth = 1200,
  maxHeight = 900,
  quality = 0.92
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageObj(img);
      // Calculate initial scale to fit image in container
      const containerAspect = aspectRatio;
      const imageAspect = img.width / img.height;

      let initialScale;
      if (imageAspect > containerAspect) {
        // Image is wider - fit by height
        initialScale = containerSize.height / img.height;
      } else {
        // Image is taller - fit by width
        initialScale = containerSize.width / img.width;
      }

      // Ensure image covers the entire crop area
      const minScaleX = containerSize.width / img.width;
      const minScaleY = containerSize.height / img.height;
      initialScale = Math.max(initialScale, minScaleX, minScaleY);

      setScale(initialScale);

      // Center the image
      const scaledWidth = img.width * initialScale;
      const scaledHeight = img.height * initialScale;
      setPosition({
        x: (containerSize.width - scaledWidth) / 2,
        y: (containerSize.height - scaledHeight) / 2
      });
    };
    img.src = image;
  }, [image, aspectRatio, containerSize]);

  // Update container size based on aspect ratio
  useEffect(() => {
    const maxContainerWidth = Math.min(window.innerWidth - 80, 500);
    const height = maxContainerWidth / aspectRatio;
    setContainerSize({ width: maxContainerWidth, height: Math.min(height, 400) });
  }, [aspectRatio]);

  // Draw image on canvas for preview
  const drawPreview = useCallback(() => {
    if (!canvasRef.current || !imageObj) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = containerSize.width;
    canvas.height = containerSize.height;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw scaled and positioned image
    const scaledWidth = imageObj.width * scale;
    const scaledHeight = imageObj.height * scale;

    ctx.drawImage(
      imageObj,
      position.x,
      position.y,
      scaledWidth,
      scaledHeight
    );
  }, [imageObj, scale, position, containerSize]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Handle mouse/touch drag
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !imageObj) return;

    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    let newX = clientX - dragStart.x;
    let newY = clientY - dragStart.y;

    // Calculate boundaries to keep image covering the crop area
    const scaledWidth = imageObj.width * scale;
    const scaledHeight = imageObj.height * scale;

    // Clamp position so image always covers the crop area
    const maxX = 0;
    const minX = containerSize.width - scaledWidth;
    const maxY = 0;
    const minY = containerSize.height - scaledHeight;

    newX = Math.min(maxX, Math.max(minX, newX));
    newY = Math.min(maxY, Math.max(minY, newY));

    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart, imageObj, scale, containerSize]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  // Zoom controls
  const handleZoom = (delta) => {
    if (!imageObj) return;

    const minScaleX = containerSize.width / imageObj.width;
    const minScaleY = containerSize.height / imageObj.height;
    const minScale = Math.max(minScaleX, minScaleY);
    const maxScale = minScale * 4;

    const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));

    // Adjust position to zoom towards center
    const scaleDiff = newScale / scale;
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;

    const newX = centerX - (centerX - position.x) * scaleDiff;
    const newY = centerY - (centerY - position.y) * scaleDiff;

    // Clamp position
    const scaledWidth = imageObj.width * newScale;
    const scaledHeight = imageObj.height * newScale;
    const maxX = 0;
    const minX = containerSize.width - scaledWidth;
    const maxY = 0;
    const minY = containerSize.height - scaledHeight;

    setScale(newScale);
    setPosition({
      x: Math.min(maxX, Math.max(minX, newX)),
      y: Math.min(maxY, Math.max(minY, newY))
    });
  };

  // Reset to initial position
  const handleReset = () => {
    if (!imageObj) return;

    const minScaleX = containerSize.width / imageObj.width;
    const minScaleY = containerSize.height / imageObj.height;
    const initialScale = Math.max(minScaleX, minScaleY);

    setScale(initialScale);
    const scaledWidth = imageObj.width * initialScale;
    const scaledHeight = imageObj.height * initialScale;
    setPosition({
      x: (containerSize.width - scaledWidth) / 2,
      y: (containerSize.height - scaledHeight) / 2
    });
  };

  // Generate cropped image
  const handleCrop = () => {
    if (!imageObj) return;

    // Create output canvas at high quality
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');

    // Calculate output dimensions maintaining aspect ratio
    let outputWidth = maxWidth;
    let outputHeight = maxWidth / aspectRatio;

    if (outputHeight > maxHeight) {
      outputHeight = maxHeight;
      outputWidth = maxHeight * aspectRatio;
    }

    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;

    // Calculate source rectangle from the visible crop area
    const scaleRatio = outputWidth / containerSize.width;

    // Calculate the portion of the original image that's visible
    const sourceX = -position.x / scale;
    const sourceY = -position.y / scale;
    const sourceWidth = containerSize.width / scale;
    const sourceHeight = containerSize.height / scale;

    // Draw the cropped portion at high quality
    outputCtx.imageSmoothingEnabled = true;
    outputCtx.imageSmoothingQuality = 'high';

    outputCtx.drawImage(
      imageObj,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    // Convert to blob with high quality
    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          onCrop(file, previewUrl);
        }
      },
      'image/jpeg',
      quality
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Adjust Image</h3>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Crop Area */}
          <div className="p-4">
            <div
              ref={containerRef}
              className="relative mx-auto rounded-xl overflow-hidden cursor-move border-2 border-dashed border-indigo-400"
              style={{ width: containerSize.width, height: containerSize.height }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
              />

              {/* Drag Instructions Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 text-white/80 text-xs">
                  <Move size={14} />
                  Drag to position
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>

              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
                {Math.round(scale * 100)}%
              </div>

              <button
                onClick={() => handleZoom(0.1)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                title="Reset"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              Drag to reposition • Zoom to adjust • Image will be optimized for best display
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Check size={16} />
              Apply
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
