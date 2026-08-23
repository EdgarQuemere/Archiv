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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 font-sans font-medium text-[#111111] ">
      <div className="fixed inset-0 bg-[#111111]/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-[#EEEEEE] w-full max-w-lg border-[1.5px] border-[#111111] rounded-[14px] shadow-2xl overflow-hidden z-10 flex flex-col p-6 sm:p-8 transform-gpu">
        <button
          onClick={onClose}
          title="Fermer"
          className="absolute top-4 right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm z-20"
        >
          <X className="w-4 h-4 stroke-[2.25]" />
        </button>

        <div className="flex items-center gap-2.5 mb-1 pr-10">
          <h2 className="text-xl font-bold text-[#111111]">Recadrer la photo</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mb-4">
          Ajustez le cadrage de votre photo de profil.
        </p>

        <div className="relative w-full h-[320px] bg-[#E2E2E2] border-[1.5px] border-[#111111] rounded-[14px] overflow-hidden my-2">
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

        <div className="pt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-4 h-4 text-[#111111]" />
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
            <ZoomIn className="w-4 h-4 text-[#111111]" />
          </div>

          <div className="pt-3 border-t-[1.5px] border-[#111111] flex justify-end gap-3 mt-2">
            <button
              onClick={onClose}
              className="h-10 sm:h-11 px-5 bg-[#EEEEEE] text-[#111111] rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-[#E2E2E2] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="h-10 sm:h-11 px-6 bg-[#111111] text-[#EEEEEE] rounded-full border-[1.5px] border-[#111111] text-xs sm:text-sm font-medium hover:bg-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[2.25]" />
              )}
              <span>{isProcessing ? 'Traitement...' : 'Enregistrer'}</span>
            </button>
          </div>
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
