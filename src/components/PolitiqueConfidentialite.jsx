import React from 'react';

export function PolitiqueConfidentialite() {
  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#EEEEEE] text-[#111111] font-sans p-6 md:p-12 overflow-y-auto z-50">
      <div className="max-w-3xl mx-auto bg-[#EEEEEE] border-[1.5px] border-[#111111] rounded-[14px] p-6 md:p-12 shadow-sm">
        <button
          onClick={handleBack}
          aria-label="Retour à l'accueil"
          className="mb-8 px-5 h-10 border-[1.5px] border-[#111111] rounded-full text-sm font-medium hover:bg-[#E2E2E2] transition-colors flex items-center gap-2 cursor-pointer"
        >
          &larr; Retour
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">Politique de Confidentialité & RGPD</h1>

        <div className="space-y-8 text-sm md:text-base leading-relaxed">
          <p>
            La présente politique de confidentialité a pour objectif de vous informer de manière claire et transparente sur la manière dont <strong>Artchiv'</strong> (accessible à l'adresse <strong>https://artchiv.fr</strong>) collecte, utilise, stocke et protège vos données à caractère personnel, conformément au <strong>Règlement Général sur la Protection des Données (RGPD 2016/679)</strong> et à la <strong>Loi Informatique et Libertés</strong>.
          </p>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">1 - Responsables du traitement</h2>
            <p>
              Les données personnelles collectées sur le Site sont traitées conjointement par les co-éditeurs d'Artchiv' :
              <br /><br />
              • <strong>Edgar Quéméré</strong> (edgarquemere2645@gmail.com)<br />
              • <strong>Thomas Riquier</strong> (viturnapro@gmail.com)<br />
              • <strong>Olwen Planchenault</strong> (olwen.pht@gmail.com)<br /><br />
              Contact dédié aux questions de confidentialité : <strong>contact@artchiv.fr</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">2 - Données collectées</h2>
            <p>
              Nous collectons uniquement les informations nécessaires au fonctionnement de la plateforme :
              <br /><br />
              • <strong>Compte utilisateur :</strong> Nom, prénom, pseudo public, adresse email, mot de passe chiffré, photo de profil, école / établissement d'études, rôle (Étudiant, Diplômé, etc.), liens vers vos réseaux professionnels (Behance, Instagram, site personnel).<br />
              • <strong>Projets publiés :</strong> Titre, description, fichiers PDF, images de couverture, domaine de design, année de soutenance et école associée.<br />
              • <strong>Historique de consentement :</strong> Date et heure de votre acceptation des conditions d'utilisation et de la politique de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">3 - Finalités et base légale du traitement</h2>
            <p>
              Vos données sont traitées pour :
              <br /><br />
              1. <strong>Création et gestion de votre compte</strong> (Base légale : exécution du contrat / service).<br />
              2. <strong>Publication, consultation et partage de vos mémoires et books</strong> de design (Base légale : exécution du service).<br />
              3. <strong>Envoi d'e-mails de vérification et de réinitialisation de mot de passe</strong> (Base légale : sécurité et exécution du service).<br />
              4. <strong>Respect des obligations légales</strong> et gestion des demandes de suppression de compte (Base légale : obligation légale).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">4 - Hébergement et destinataires des données</h2>
            <p>
              Vos données sont hébergées au sein de l'Union Européenne :
              <br /><br />
              • <strong>Serveur et base de données :</strong> Hetzner Online GmbH (Allemagne).<br />
              • <strong>Stockage des fichiers médias (PDF et couvertures) :</strong> Stockage objet S3 sécurisé.<br />
              • <strong>Envoi des e-mails transactionnels :</strong> Mailjet (SAS française, serveurs situés en UE).<br /><br />
              <strong>Vos données personnelles ne sont jamais vendues, louées ou cédées à des tiers à des fins commerciales ou publicitaires.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">5 - Durée de conservation</h2>
            <p>
              • <strong>Données de compte et projets :</strong> Conservées tant que votre compte reste actif.<br />
              • <strong>En cas de suppression de compte :</strong> Votre compte ainsi que l'ensemble de vos projets et fichiers associés sont immédiatement et définitivement supprimés de nos serveurs de production. Un registre d'audit anonymisé de la suppression est conservé uniquement pour justifier de la conformité légale.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">6 - Vos droits (Droit d'accès, de rectification et à l'oubli)</h2>
            <p>
              Conformément à la réglementation RGPD, vous disposez des droits suivants :
              <br /><br />
              • <strong>Droit d'accès et de rectification :</strong> Vous pouvez modifier vos informations à tout moment depuis votre tiroir de profil.<br />
              • <strong>Droit à l'effacement (« droit à l'oubli ») :</strong> Vous pouvez supprimer votre compte et l'intégralité de vos projets directement depuis le bouton « Supprimer mon compte » dans votre profil ou en nous écrivant.<br />
              • <strong>Droit d'opposition et de limitation du traitement.</strong><br /><br />
              Pour exercer ces droits ou pour toute question : <strong>contact@artchiv.fr</strong>. Vous pouvez également adresser une réclamation auprès de la CNIL (www.cnil.fr).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 border-b-[1.5px] border-[#111111] pb-2 inline-block">7 - Cookies & Traceurs</h2>
            <p>
              Artchiv' n'utilise aucun cookie publicitaire ni traceur de profilage tiers.
              <br /><br />
              • <strong>Cookie de session :</strong> Un cookie technique sécurisé (JWT) est utilisé pour maintenir votre connexion.<br />
              • <strong>Statistiques d'audience :</strong> Nous utilisons <strong>Umami Analytics</strong>, une solution open-source hébergée en Europe, anonyme et sans cookies, exempte de consentement selon les recommandations de la CNIL.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PolitiqueConfidentialite;
