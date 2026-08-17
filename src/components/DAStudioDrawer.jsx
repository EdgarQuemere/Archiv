import React, { useEffect, useRef } from 'react';
import { X, Palette, Check, Sparkles, Sliders, Moon, Sun, Layers, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { playClickSound, playHoverSound, playModalOpenSound } from '../utils/audioEngine';

export const DA_PRESETS = {
  reference: {
    id: 'reference',
    name: 'Référence (Original)',
    bgColor: '#e4e7ec',
    gridPattern: 'lines',
    gridColor: 'rgba(160, 170, 185, 0.4)',
    accentColor: '#1b00ee',
    cardStyle: 'realistic',
    textColor: 'light'
  },
  darkStudio: {
    id: 'darkStudio',
    name: 'Studio Sombre',
    bgColor: '#0f172a',
    gridPattern: 'lines',
    gridColor: 'rgba(51, 65, 85, 0.5)',
    accentColor: '#8b5cf6',
    cardStyle: 'glowing',
    textColor: 'dark'
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint Architecte',
    bgColor: '#002b49',
    gridPattern: 'lines',
    gridColor: 'rgba(255, 255, 255, 0.25)',
    accentColor: '#00d2ff',
    cardStyle: 'hard-retro',
    textColor: 'dark'
  },
  editorialWarm: {
    id: 'editorialWarm',
    name: 'Éditorial Chaud',
    bgColor: '#f4efe6',
    gridPattern: 'lines',
    gridColor: 'rgba(195, 180, 160, 0.35)',
    accentColor: '#e05638',
    cardStyle: 'realistic',
    textColor: 'light'
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome Minimal',
    bgColor: '#ffffff',
    gridPattern: 'dots',
    gridColor: 'rgba(100, 116, 139, 0.3)',
    accentColor: '#0f172a',
    cardStyle: 'flat-border',
    textColor: 'light'
  }
};

export function DAStudioDrawer({ isOpen, onClose, daConfig, setDaConfig }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      playModalOpenSound();

      gsap.timeline()
        .fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        )
        .fromTo(
          panelRef.current,
          { x: '100%' },
          { x: '0%', duration: 0.4, ease: 'power3.out' },
          '-=0.2'
        );
    }
  }, [isOpen]);

  const handleClose = () => {
    playClickSound();
    if (panelRef.current && backdropRef.current) {
      gsap.timeline({
        onComplete: () => {
          onClose();
        }
      })
      .to(panelRef.current, { x: '100%', duration: 0.3, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.2 }, '-=0.15');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const applyPreset = (presetKey) => {
    playClickSound();
    const p = DA_PRESETS[presetKey];
    if (p) {
      setDaConfig(p);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={panelRef}
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 transform-gpu"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Palette className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-bold tracking-tight">Studio Direction Artistique (DA)</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Testez en direct les combinaisons visuelles
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              onMouseEnter={playHoverSound}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Presets Grid */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Thèmes Presets Rapides
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.values(DA_PRESETS).map((p) => {
                  const isActive = daConfig.bgColor === p.bgColor && daConfig.accentColor === p.accentColor;
                  return (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      onMouseEnter={playHoverSound}
                      className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        isActive
                          ? 'border-blue-600 ring-2 ring-blue-600/30 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">{p.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-inner"
                          style={{ backgroundColor: p.bgColor }}
                          title="Couleur de fond"
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-inner"
                          style={{ backgroundColor: p.accentColor }}
                          title="Couleur bouton"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* Background Color Picker */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Couleur de Fond du Canva
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={daConfig.bgColor}
                  onChange={(e) => setDaConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                  className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={daConfig.bgColor}
                  onChange={(e) => setDaConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Accent / Button Color Picker */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Couleur d'Accent des Boutons
              </label>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="color"
                  value={daConfig.accentColor}
                  onChange={(e) => setDaConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                  className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={daConfig.accentColor}
                  onChange={(e) => setDaConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-2">
                {['#1b00ee', '#0f172a', '#e05638', '#059669', '#7c3aed', '#ec4899'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      playClickSound();
                      setDaConfig((prev) => ({ ...prev, accentColor: c }));
                    }}
                    onMouseEnter={playHoverSound}
                    className={`w-7 h-7 rounded-full border border-slate-300 shadow-sm transition-transform ${
                      daConfig.accentColor === c ? 'scale-125 ring-2 ring-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Grid Pattern Type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Style du Quadrillage (Grid Pattern)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'lines', label: 'Lignes' },
                  { id: 'dots', label: 'Points' },
                  { id: 'none', label: 'Aucun' }
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      playClickSound();
                      setDaConfig((prev) => ({ ...prev, gridPattern: g.id }));
                    }}
                    onMouseEnter={playHoverSound}
                    className={`py-2 text-xs font-semibold rounded border transition-all ${
                      daConfig.gridPattern === g.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Shadow & Frame Style */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Style d'Ombre des Couvertures
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'realistic', label: 'Douce (Book Shadow)' },
                  { id: 'hard-retro', label: 'Rétro (Hard offset)' },
                  { id: 'flat-border', label: 'Minimal (Flat border)' },
                  { id: 'glowing', label: 'Néon Ambient' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      playClickSound();
                      setDaConfig((prev) => ({ ...prev, cardStyle: s.id }));
                    }}
                    onMouseEnter={playHoverSound}
                    className={`py-2 px-3 text-xs font-semibold rounded border text-left transition-all ${
                      daConfig.cardStyle === s.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => applyPreset('reference')}
              onMouseEnter={playHoverSound}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset DA originale</span>
            </button>

            <button
              onClick={handleClose}
              onMouseEnter={playHoverSound}
              className="px-5 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Terminer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
