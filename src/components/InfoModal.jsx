import { getUserDisplayName } from '../utils/userUtils';
import React from 'react';
import { X, Info, User } from 'lucide-react';
import SEO from './SEO';

const LinkSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 256 256">
    <path d="M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48,54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z"></path>
  </svg>
);

const LinkedinSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 256 256">
    <path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216V216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z"></path>
  </svg>
);

const InstagramSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 256 256">
    <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
  </svg>
);

const IconUserProfile = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z" />
  </svg>
);

const IconAddDocument = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M216.49,79.51l-56-56A12,12,0,0,0,152,20H56A20,20,0,0,0,36,40V216a20,20,0,0,0,20,20H200a20,20,0,0,0,20-20V88A12,12,0,0,0,216.49,79.51ZM160,57l23,23H160ZM60,212V44h76V92a12,12,0,0,0,12,12h48V212Zm104-60a12,12,0,0,1-12,12H140v12a12,12,0,0,1-24,0V164H104a12,12,0,0,1,0-24h12V128a12,12,0,0,1,24,0v12h12A12,12,0,0,1,164,152Z" />
  </svg>
);

export function InfoModal({ isOpen, onClose, user, onOpenProfile, onOpenLogin, onOpenMentions, onOpenSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#EEEEEE] text-[#111111] font-sans font-medium overflow-hidden animate-in fade-in duration-200 h-[100dvh] w-full">
      <SEO
        title="À propos | Artchiv'"
        description="Découvrez Artchiv', la plateforme collaborative créée par des étudiants pour rassembler et valoriser les books et mémoires d'études en design."
        url="/info"
      />
      {/* TOP HEADER (Exact clone of Navbar.jsx header wrapper) */}
      <header className="fixed top-3 left-3 right-3 sm:top-6 sm:left-6 sm:right-6 z-50 flex items-center justify-between gap-1 sm:gap-3.5 pointer-events-none font-sans max-w-full">
        {/* Top Left Buttons Group */}
        <div className="flex items-center gap-1 xs:gap-2 sm:gap-3.5 pointer-events-auto shrink-0">
          <picture onClick={onClose} className="cursor-pointer mr-0.5 shrink-0 flex items-center">
            <source media="(max-width: 639px)" srcSet="/archiv_logo_condesed.webp" />
            <img
              src="/artchiv-logo.webp"
              alt="Artchiv"
              className="h-9 xs:h-10 sm:h-13 md:h-14 w-auto object-contain block"
            />
          </picture>
          {/* Info Button - Active Solid Black */}
          <button
            onClick={onClose}
            title="Fermer la page information"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#111111] border-[1.5px] border-[#111111] text-[#EEEEEE] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Info className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>
          {/* User Profile Button */}
          <button
            onClick={() => {
              if (user) {
                onClose();
                onOpenProfile?.();
              } else {
                onOpenLogin?.();
              }
            }}
            title={user ? getUserDisplayName(user) || 'Profil' : 'Se connecter'}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <IconUserProfile className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => onOpenSubmit?.()}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
            title="Ajouter mon travail"
          >
            <IconAddDocument className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Top Right Group */}
        <div className="pointer-events-auto flex items-center gap-1 xs:gap-1.5 sm:gap-3.5 shrink-0">
          <button
            onClick={onClose}
            title="Fermer"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[1.5px] border-[#111111] bg-[#EEEEEE] hover:bg-[#E2E2E2] text-[#111111] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-4 sm:h-4 stroke-[2.25]" />
          </button>
        </div>
      </header>

      {/* MOBILE LAYOUT (< 768px): SCROLLABLE VERTICAL FLOW WITH 3 HORIZONTAL PHOTOS */}
      <div className="md:hidden absolute top-20 bottom-0 left-4 right-4 overflow-y-auto pb-24 pt-2 text-[#111111] flex flex-col gap-9">
        {/* 1. TEXT SECTION */}
        <div className="space-y-4 pt-1">
          <h1 className="text-2xl font-bold italic mb-4 text-[#111111] leading-tight">Artchiv’</h1>

          <p className="text-sm leading-relaxed font-medium">
            Artchiv’, c’est la plateforme pensée par d’anciens étudiants en design pour rassembler les books et les mémoires de fin d’études.
          </p>

          <p className="text-sm leading-relaxed font-medium">
            D’un côté, il y a les books. On a tous vu les mêmes appels à l’aide sur les réseaux au moment des recherches pour les écoles : la constitution du book, c’est le sujet qui prend la tête à tout le monde. Artchiv’ permet de partager simplement ses projets et d’aller fouiller dans ceux des autres. C’est l’endroit idéal pour découvrir l’univers créatif des futurs designers et trouver l’inspiration pour ses propres rendus.
          </p>

          <p className="text-sm leading-relaxed font-medium">
            De l’autre, il y a les mémoires. Ce sont des travaux de recherche denses qui demandent des mois d’investissement. L’objectif est de conserver la trace de tous ces écrits précieux et de les valoriser, dans le respect total du travail de chaque auteur. Sans ça, ces mémoires finiraient, pour la plupart, tout simplement perdus à tout jamais dans les méandres d’une clé USB ou sur le disque dur d’un ordi poussiéreux.
          </p>

          <p className="text-sm leading-relaxed font-medium pt-1">
            Partage ton travail sur Artchiv’ et laisse une trace de tes études en design.
          </p>
        </div>

        {/* 2. MOBILE ONLY: 3 PROFILE CARDS HORIZONTALLY ALIGNED */}
        <div className="flex flex-row justify-between items-start gap-3 my-1 w-full">
          {/* Edgar Quéméré */}
          <div className="flex flex-col items-start w-[30%]">
            <img
              src="/page_info/photo_edgar.webp"
              alt="Edgar Quéméré"
              className="w-full aspect-square object-cover rounded-[10px] grayscale border-0 shadow-sm"
            />
            <h3 className="text-xs font-semibold mt-2 mb-1 text-[#111111] leading-snug">
              Edgar Quéméré
            </h3>
            <div className="flex items-center gap-1.5 text-[#111111]">
              <a
                href="https://www.linkedin.com/in/edgar-quemere/"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="hover:opacity-70 transition-opacity"
              >
                <LinkedinSVG />
              </a>
              <a
                href="https://www.edgar-quemere.fr/"
                target="_blank"
                rel="noopener noreferrer"
                title="Site Web"
                className="hover:opacity-70 transition-opacity"
              >
                <LinkSVG />
              </a>
            </div>
          </div>

          {/* Thomas Riquier */}
          <div className="flex flex-col items-start w-[30%]">
            <img
              src="/page_info/photo_thomas.webp"
              alt="Thomas Riquier"
              className="w-full aspect-square object-cover rounded-[10px] grayscale border-0 shadow-sm"
            />
            <h3 className="text-xs font-semibold mt-2 mb-1 text-[#111111] leading-snug">
              Thomas Riquier
            </h3>
            <div className="flex items-center gap-1.5 text-[#111111]">
              <a
                href="https://www.linkedin.com/in/thomas-riq/"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="hover:opacity-70 transition-opacity"
              >
                <LinkedinSVG />
              </a>
              <a
                href="https://thomas-riquier.viturna.fr/"
                target="_blank"
                rel="noopener noreferrer"
                title="Site Web"
                className="hover:opacity-70 transition-opacity"
              >
                <LinkSVG />
              </a>
            </div>
          </div>

          {/* Olwen Planchenault */}
          <div className="flex flex-col items-start w-[30%]">
            <img
              src="/page_info/photo_olwen.webp"
              alt="Olwen Planchenault"
              className="w-full aspect-square object-cover rounded-[10px] grayscale border-0 shadow-sm"
            />
            <h3 className="text-xs font-semibold mt-2 mb-1 text-[#111111] leading-snug">
              Olwen Planchenault
            </h3>
            <div className="flex items-center gap-1.5 text-[#111111]">
              <a
                href="https://www.instagram.com/theblacklilcat/"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="hover:opacity-70 transition-opacity"
              >
                <InstagramSVG />
              </a>
            </div>
          </div>
        </div>

        {/* 3. CONTACT & PARTNERS SECTION */}
        <div className="space-y-3 pt-2">
          <a
            href="mailto:contact@artchiv.fr"
            className="block text-sm italic font-medium hover:underline text-[#111111]"
          >
            contact@artchiv.fr
          </a>

          <button
            onClick={() => onOpenMentions && onOpenMentions()}
            className="block text-sm italic font-medium underline hover:opacity-80 text-[#111111] text-left cursor-pointer"
          >
            mentions légales
          </button>

          {/* LOGOS PARTENAIRES */}
          <div className="flex items-center gap-4 pt-3">
            <a
              href="https://www.instagram.com/omniscientproject/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img
                src="/page_info/logo_omniscient_project_gauche.png"
                alt="Omniscient Project"
                className="h-8 w-auto object-contain"
              />
            </a>
            <span className="text-sm font-light text-[#111111]">✕</span>
            <a
              href="https://www.instagram.com/theblacklilcat/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img
                src="/page_info/logo_olwen_droite.png"
                alt="Olwen"
                className="h-8 w-auto object-contain"
              />
            </a>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT (>= 768px): FIXED 24px FROM BOTTOM & EDGES */}
      {/* DESKTOP LEFT SECTION (TEXT + CONTACT): FIXED BOTTOM-6 LEFT-6 (24px) */}
      <div className="hidden md:flex flex-col fixed top-24 bottom-6 left-6 z-40 max-w-[580px] lg:max-w-[640px] text-[#111111] pointer-events-auto overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mt-auto flex flex-col gap-7 lg:gap-8 pb-2">
          <div className="space-y-4 lg:space-y-5">
            <h1 className="text-3xl font-bold italic mb-4 lg:mb-5 text-[#111111] leading-tight">Artchiv’</h1>

            <p className="text-base leading-relaxed font-medium">
              Artchiv’, c’est la plateforme pensée par d’anciens étudiants en design pour rassembler les books et les mémoires de fin d’études.
            </p>

            <p className="text-base leading-relaxed font-medium">
              D’un côté, il y a les books. On a tous vu les mêmes appels à l’aide sur les réseaux au moment des recherches pour les écoles : la constitution du book, c’est le sujet qui prend la tête à tout le monde. Artchiv’ permet de partager simplement ses projets et d’aller fouiller dans ceux des autres. C’est l’endroit idéal pour découvrir l’univers créatif des futurs designers et trouver l’inspiration pour ses propres rendus.
            </p>

            <p className="text-base leading-relaxed font-medium">
              De l’autre, il y a les mémoires. Ce sont des travaux de recherche denses qui demandent des mois d’investissement. L’objectif est de conserver la trace de tous ces écrits précieux et de les valoriser, dans le respect total du travail de chaque auteur. Sans ça, ces mémoires finiraient, pour la plupart, tout simplement perdus à tout jamais dans les méandres d’une clé USB ou sur le disque dur d’un ordi poussiéreux.
            </p>

            <p className="text-base leading-relaxed font-medium pt-1">
              Partage ton travail sur Artchiv’ et laisse une trace de tes études en design.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href="mailto:contact@artchiv.fr"
              className="block text-base italic font-medium hover:underline text-[#111111]"
            >
              contact@artchiv.fr
            </a>

            <button
              onClick={() => onOpenMentions && onOpenMentions()}
              className="block text-base italic font-medium underline hover:opacity-80 text-[#111111] text-left cursor-pointer"
            >
              mentions légales
            </button>

            {/* LOGOS PARTENAIRES */}
            <div className="flex items-center gap-4 pt-3 lg:pt-4">
              <a
                href="https://www.instagram.com/omniscientproject/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img
                  src="/page_info/logo_omniscient_project_gauche.png"
                  alt="Omniscient Project"
                  className="h-9 w-auto object-contain"
                />
              </a>
              <span className="text-base font-light text-[#111111]">✕</span>
              <a
                href="https://www.instagram.com/theblacklilcat/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img
                  src="/page_info/logo_olwen_droite.png"
                  alt="Olwen"
                  className="h-9 w-auto object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP RIGHT SECTION (TEAM CARDS): FIXED BOTTOM-6 RIGHT-6 (24px) */}
      <div className="hidden md:flex flex-col fixed top-24 bottom-6 right-6 z-40 shrink-0 items-start pointer-events-auto overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mt-auto flex flex-col gap-[24px] pb-2">
          {/* Edgar Quéméré */}
          <div className="flex flex-col items-start">
            <img
              src="/page_info/photo_edgar.webp"
              alt="Edgar Quéméré"
              className="w-32 h-32 object-cover rounded-[10px] grayscale border-0 shadow-sm"
            />
            <h3 className="text-sm font-semibold mt-[8px] mb-[8px] text-[#111111]">
              Edgar Quéméré
            </h3>
            <div className="flex items-center gap-2 text-[#111111]">
              <a
                href="https://www.linkedin.com/in/edgar-quemere/"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="hover:opacity-70 transition-opacity"
              >
                <LinkedinSVG />
              </a>
              <a
                href="https://www.edgar-quemere.fr/"
                target="_blank"
                rel="noopener noreferrer"
                title="Site Web"
                className="hover:opacity-70 transition-opacity"
              >
                <LinkSVG />
              </a>
            </div>
          </div>

          {/* Thomas Riquier */}
          <div className="flex flex-col items-start">
            <img
              src="/page_info/photo_thomas.webp"
              alt="Thomas Riquier"
              className="w-32 h-32 object-cover rounded-[10px] grayscale border-0 shadow-sm"
            />
            <h3 className="text-sm font-semibold mt-[8px] mb-[8px] text-[#111111]">
              Thomas Riquier
            </h3>
            <div className="flex items-center gap-2 text-[#111111]">
              <a
                href="https://www.linkedin.com/in/thomas-riq/"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="hover:opacity-70 transition-opacity"
              >
                <LinkedinSVG />
              </a>
              <a
                href="https://thomas-riquier.viturna.fr/"
                target="_blank"
                rel="noopener noreferrer"
                title="Site Web"
                className="hover:opacity-70 transition-opacity"
              >
                <LinkSVG />
              </a>
            </div>
          </div>

          {/* Olwen Planchenault */}
          <div className="flex flex-col items-start">
            <img
              src="/page_info/photo_olwen.webp"
              alt="Olwen Planchenault"
              className="w-32 h-32 object-cover rounded-[10px] grayscale border-0 shadow-sm"
            />
            <h3 className="text-sm font-semibold mt-[8px] mb-[8px] text-[#111111]">
              Olwen Planchenault
            </h3>
            <div className="flex items-center gap-2 text-[#111111]">
              <a
                href="https://www.instagram.com/theblacklilcat/"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="hover:opacity-70 transition-opacity"
              >
                <InstagramSVG />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoModal;
