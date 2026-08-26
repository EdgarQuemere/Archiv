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
          className="mb-8 px-5 h-10 border-[1.5px] border-[#111111] rounded-full text-sm font-medium hover:bg-[#E2E2E2] transition-colors flex items-center gap-2 cursor-pointer"
        >
          &larr; Retour
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">Mentions Légales</h1>

        <div className="space-y-8 text-sm md:text-base leading-relaxed">
          <p>
            Conformément aux dispositions des articles 6-III et 19 de la Loi n°2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (L.C.E.N.), il est porté à la connaissance des utilisateurs et visiteurs du site <strong>https://artchiv.fr</strong>, ci-après dénommé "le Site", les présentes mentions légales.
            <br /><br />
            La connexion et la navigation sur le Site par tout utilisateur, ci-après dénommé "l'Utilisateur", impliquent l'acceptation pleine et entière des présentes mentions légales. Ces dernières sont accessibles à tout moment dans la rubrique « Mentions légales » du Site.
          </p>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">1 - Informations légales</h2>
            <p>
              <strong>Propriétaires et co-éditeurs du site :</strong>
              <br />
              • <strong>QUEMERE Edgar</strong> — Tél : 06 95 81 77 27 — Email : edgarquemere2645@gmail.com
              <br />
              • <strong>RIQUIER Thomas</strong> — Tél : 07 89 42 64 95 — Email : viturnapro@gmail.com
              <br />
              • <strong>PLANCHENAULT Olwen</strong> — Tél : 07 86 15 63 55 — Email : olwen.pht@gmail.com
              <br /><br />
              <strong>Responsables de la publication :</strong>
              <br />
              Edgar Quéméré, Thomas Riquier et Olwen Planchenault
              <br />
              Adresse email de contact : contact@artchiv.fr
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">2 - Hébergement</h2>
            <p>
              Le site est hébergé par :
              <br />
              <strong>Hetzner Online GmbH</strong>
              <br />
              Siège social : Industriestr. 25, 91710 Gunzenhausen, Allemagne
              <br />
              Contact : info@hetzner.com
              <br />
              Site web : https://www.hetzner.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">3 - Principe général</h2>
            <p>
              Est considéré comme Utilisateur toute personne accédant au site artchiv.fr et l’utilisant.
              <br /><br />
              Le Site est régulièrement mis à jour par les éditeurs. Ceux-ci s'efforcent de fournir des informations aussi précises que possible sur le Site. Toutefois, ils ne peuvent garantir l'exactitude, la complétude ou l'actualité des informations publiées, qu'elles soient de leur fait ou fournies par des partenaires tiers. Par conséquent, l'Utilisateur reconnaît utiliser ces informations à titre indicatif, sous sa responsabilité exclusive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">4 - Accès au site</h2>
            <p>
              Le site artchiv.fr est accessible 24 heures sur 24, 7 jours sur 7, sauf en cas d'interruption pour des besoins de maintenance ou de force majeure. En cas d'indisponibilité du service, artchiv.fr s'efforcera de rétablir l'accès au plus vite et de communiquer à l'avance aux utilisateurs les dates et heures de l'intervention. Le site ne saurait être tenu pour responsable de tout dommage résultant d'une indisponibilité du service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">5 - Propriété Intellectuelle</h2>
            <p>
              Les contenus soumis par les Utilisateurs restent la propriété de ces derniers.
              <br /><br />
              En soumettant un contenu, l’Utilisateur accorde à l’Éditeur une licence non exclusive, perpétuelle, mondiale, gratuite, pour utiliser, reproduire, modifier, diffuser et afficher ce contenu dans le cadre du fonctionnement et de la promotion du Site.
              <br /><br />
              L’Utilisateur s’engage à détenir l’ensemble des droits nécessaires ou à avoir obtenu toutes les autorisations requises pour publier ce contenu.
              <br /><br />
              En cas d’utilisation de contenus protégés par des licences (Creative Commons, etc.), l’Utilisateur s’engage à en respecter les conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">6 - Liens externes</h2>
            <p>
              Le Site peut contenir des liens vers des sites web externes. artchiv.fr ne peut être tenu responsable du contenu de ces sites tiers ni de leurs pratiques en matière de confidentialité. L'Utilisateur accède à ces liens externes à ses propres risques.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">7 - Responsabilité des Contenus Utilisateurs</h2>
            <p>
              Les éditeurs ne peuvent être tenus responsables de la vérification systématique de la licéité de chaque contenu soumis par les Utilisateurs, mais s’engagent à retirer tout contenu dont la contrefaçon ou l’illégalité leur est signalée. En cas de violation de droits de tiers par un Utilisateur, celui‑ci s’engage à indemniser les éditeurs pour tout dommage résultant de cette violation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">8 - Cookies et Mesure d'audience</h2>
            <p>
              Le Site utilise des cookies techniques strictement nécessaires au bon fonctionnement de l'application (authentification et gestion de session).
              <br /><br />
              Pour la mesure d'audience, le Site utilise <strong>Umami</strong>, un outil d'analyse respectueux de la vie privée. Ce système ne stocke aucun cookie publicitaire ni donnée personnelle, ce qui le dispense de l'affichage d'un bandeau de consentement conformément aux règles de la CNIL.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">9 - Modifications des mentions légales</h2>
            <p>
              Nous nous réservons le droit de modifier ces mentions légales à tout moment. Toute modification prendra effet dès sa publication sur ce site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">10 - Contact</h2>
            <p>
              Pour toute question ou remarque concernant ces mentions légales, vous pouvez nous contacter à l'adresse suivante : contact@artchiv.fr.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default MentionsLegales;