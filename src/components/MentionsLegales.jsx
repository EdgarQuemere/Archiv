import React from 'react';

export function MentionsLegales() {
  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#EEEEEE] text-[#111111] font-sans p-6 md:p-12 overflow-y-auto z-50">
      <div className="max-w-3xl mx-auto bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] p-6 md:p-12 shadow-sm">
        <button
          onClick={handleBack}
          className="mb-8 px-5 h-10 border-[1.5px] border-[#111111] rounded-full text-sm font-medium hover:bg-[#E2E2E2] transition-colors flex items-center gap-2"
        >
          &larr; Retour
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">Mentions Légales</h1>

        <div className="space-y-8 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">1. Éditeur du site</h2>
            <p>
              Le site <strong>Archiv</strong> (ci-après "le Site") est édité par l'association / collectif <strong>Omniscient Design</strong>.
              <br />
              <strong>Siège social :</strong> [Adresse, ex: 123 Rue de la République, 75001 Paris]
              <br />
              <strong>Email de contact :</strong> contact@omniscientdesign.fr
              <br />
              <strong>Directeur de la publication :</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">2. Hébergement</h2>
            <p>
              Ce site est hébergé par :
              <br />
              <strong>Hetzner Online GmbH</strong>
              <br />
              Industriestr. 25, 91710 Gunzenhausen, Allemagne
              <br />
              Site web : https://www.hetzner.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">3. Propriété Intellectuelle</h2>
            <p>
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle.
              Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
              <br /><br />
              Les travaux (documents, images, portfolios, mémoires) hébergés sur le Site restent la propriété intellectuelle exclusive de leurs auteurs respectifs.
              Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle, de ces différents éléments est strictement interdite sans l'accord exprès par écrit de l'auteur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">4. Données Personnelles (RGPD)</h2>
            <p>
              Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée, et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression des données vous concernant.
              <br /><br />
              Les données personnelles collectées via le Site (création de compte, dépôt de portfolio, informations de profil) sont strictement utilisées pour le fonctionnement du service Archiv. Vous pouvez exercer vos droits en nous contactant à l'adresse email mentionnée dans l'article 1, ou en supprimant directement votre compte depuis les paramètres de votre profil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">5. Cookies</h2>
            <p>
              Le Site peut être amené à vous demander l'acceptation des cookies pour des besoins de statistiques et d'affichage. Un cookie est une information déposée sur votre disque dur par le serveur du site que vous visitez.
              <br /><br />
              Le Site utilise principalement des cookies de session strictement nécessaires au fonctionnement de l'application (comme le maintien de votre session de connexion et la sécurité).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">6. Responsabilité</h2>
            <p>
              Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement remis à jour. Omniscient Design ne saurait être tenu pour responsable des erreurs, d'une absence de disponibilité des informations ou de la présence de virus sur le site.
              Les auteurs des documents publiés sur le Site sont seuls responsables du contenu qu'ils diffusent.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default MentionsLegales;
