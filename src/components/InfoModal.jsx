import React from 'react';
import { X, Info, User } from 'lucide-react';

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

export function InfoModal({ isOpen, onClose, user, onOpenProfile, onOpenLogin, onOpenMentions }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#EEEEEE] text-[#111111] font-sans overflow-hidden select-none animate-in fade-in duration-200 h-screen w-screen">
      
      {/* TOP LEFT NAVBAR (Logo, Info Active, User Profile) */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2.5 sm:gap-3.5 pointer-events-auto">
        <img
          src="/Artchiv-logo.webp"
          alt="Artchiv"
          className="h-12 sm:h-15 w-auto object-contain cursor-pointer transition-opacity hover:opacity-80 mr-0.5"
          onClick={onClose}
        />
        {/* Info Button - Active Solid Black */}
        <button
          onClick={onClose}
          title="Fermer la page information"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#111111] border-[1.5px] border-[#111111] text-[#EEEEEE] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          <Info className="w-4 h-4 stroke-[2.25]" />
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
          title={user ? `${user.firstName || user.name || ''} ${user.lastName || ''}`.trim() || 'Profil' : 'Se connecter'}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#E2E2E2] flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          <IconUserProfile className="w-4 h-4" />
        </button>
      </div>

      {/* TOP RIGHT CLOSE BUTTON */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 pointer-events-auto">
        <button
          onClick={onClose}
          title="Fermer"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#EEEEEE] border-[1.5px] border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#EEEEEE] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
        >
          <X className="w-4 h-4 stroke-[2.25]" />
        </button>
      </div>

      {/* MAIN CONTENT CONTAINER - 24PX MARGINS FROM SCREEN EDGES */}
      <div className="absolute top-28 bottom-6 left-6 right-6 flex flex-row justify-between items-end overflow-hidden">
        
        {/* LEFT COLUMN: ABOUT ARTCHIV (Width max-w-[480px], overflow-hidden, no scrolling) */}
        <div className="w-full max-w-[480px] text-[#111111] flex flex-col justify-end gap-5 overflow-hidden">
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold italic mb-3">Artchiv’</h1>

            <p className="text-sm sm:text-base leading-relaxed font-normal">
              Artchiv’, c’est la plateforme pensée par d’anciens étudiants en design pour rassembler les portfolios et les mémoires de fin d’études.
            </p>

            <p className="text-sm sm:text-base leading-relaxed font-normal">
              D’un côté, il y a les books. On a tous vu les mêmes appels à l’aide sur les réseaux au moment des recherches pour les écoles : la constitution du portfolio, c’est le sujet qui prend la tête à tout le monde. Artchiv’ permet de partager simplement ses projets et d’aller fouiller dans ceux des autres. C’est l’endroit idéal pour découvrir l’univers créatif des futurs designers et trouver l’inspiration pour ses propres rendus.
            </p>

            <p className="text-sm sm:text-base leading-relaxed font-normal">
              De l’autre, il y a les mémoires. Ce sont des travaux de recherche denses qui demandent des mois d’investissement. L’objectif est de conserver la trace de tous ces écrits précieux et de les valoriser, dans le respect total du travail de chaque auteur. Sans ça, ces mémoires finiraient, pour la plupart, tout simplement perdus à tout jamais dans les méandres d’une clé USB ou sur le disque dur d’un ordi poussiéreux.
            </p>

            <p className="text-sm sm:text-base leading-relaxed font-normal pt-1">
              Partage ton travail sur Artchiv’ et laisse une trace de tes études en design.
            </p>
          </div>

          {/* BOTTOM LEFT SECTION: EMAIL, MENTIONS & PARTNERS LOGOS */}
          <div className="space-y-2 pt-1">
            <a
              href="mailto:contact@archiv.fr"
              className="block text-sm sm:text-base italic font-medium hover:underline text-[#111111]"
            >
              contact@archiv.fr
            </a>

            <button
              onClick={() => onOpenMentions && onOpenMentions()}
              className="block text-sm sm:text-base italic font-medium underline hover:opacity-80 text-[#111111] text-left cursor-pointer"
            >
              mentions légales
            </button>

            {/* LOGOS PARTENAIRES */}
            <div className="flex items-center gap-3.5 pt-2">
              <img
                src="/page_info/Logo_Omniscient_project_gauche.png"
                alt="Omniscient Project"
                className="h-8 sm:h-9 w-auto object-contain"
              />
              <span className="text-sm sm:text-base font-light text-[#111111]">✕</span>
              <img
                src="/page_info/logo_the_blacklilcat_droite.png"
                alt="The Blacklilcat"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TEAM CREATOR CARDS (24px gap between cards, 8px internal gaps) */}
        <div className="flex flex-col gap-[24px] shrink-0 items-start">
          
          {/* Edgar Quéméré */}
          <div className="flex flex-col items-start">
            <img
              src="/page_info/photo_Edgar.webp"
              alt="Edgar Quéméré"
              className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-[10px] grayscale border-0 shadow-sm"
            />
            <h3 className="text-xs sm:text-sm font-semibold mt-[8px] mb-[8px] text-[#111111]">
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
              src="/page_info/Photo_Thomas.webp"
              alt="Thomas Riquier"
              className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-[10px] grayscale border-0 shadow-sm"
            />
            <h3 className="text-xs sm:text-sm font-semibold mt-[8px] mb-[8px] text-[#111111]">
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
              src="/page_info/Photo_Olwen.webp"
              alt="Olwen Planchenault"
              className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-[10px] grayscale border-0 shadow-sm"
            />
            <h3 className="text-xs sm:text-sm font-semibold mt-[8px] mb-[8px] text-[#111111]">
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
