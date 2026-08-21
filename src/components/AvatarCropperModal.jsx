import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export function AvatarCropperModal({ imageSrc, onComplete, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const compressedBlob = await imageCompression(croppedBlob, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/webp'
      });
      // create a new File from the blob
      const file = new File([compressedBlob], 'avatar.webp', { type: 'image/webp' });
      onComplete(file);
    } catch (e) {
      console.error(e);
      alert('Erreur lors du recadrage');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-[#EEEEEE] w-full max-w-lg border-2 border-[#111111] overflow-hidden flex flex-col">
        <div className="p-4 border-b-2 border-[#111111] flex justify-between items-center bg-white">
          <h3 className="font-bold text-[#111111]">Recadrer la photo</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 border-2 border-transparent hover:border-[#111111] transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative w-full h-[400px] bg-slate-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-6 bg-white border-t-2 border-[#111111] flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-slate-500" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-full accent-[#111111] cursor-pointer"
            />
            <ZoomIn className="w-5 h-5 text-slate-500" />
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isProcessing}
            className="w-full py-3 bg-[#111111] text-[#EEEEEE] font-bold border-2 border-[#111111] flex items-center justify-center gap-2 hover:bg-[#EEEEEE] hover:text-[#111111] transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Traitement...' : 'Enregistrer'} <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Fonction utilitaire pour recadrer l'image via Canvas
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file);
      } else {
        reject(new Error('Erreur de canvas'));
      }
    }, 'image/webp', 1);
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}
