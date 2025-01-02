'use client';

import { Building2, UserCheck, Coins, Share2 } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
      {/* Header */}
      <div className="bg-[#93d2d9] text-white p-8 md:p-16 rounded-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <h1 className="text-4xl md:text-5xl font-bold">
            COMMENT ÇA MARCHE ?
          </h1>
          <img
            src="/images/OIG4.jpeg"
            alt="Work Space Token Logo"
            className="w-32 h-32 object-contain"
          />
        </div>
      </div>

      {/* Process for Properties */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
          Le Processus
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                SOURCING & SELECTION DES BIENS
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Les vendeurs professionnels nous proposent leurs espaces de bureaux.
              Après expertise et négociations nous acceptons ou rejetons le projet.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                MISE A DISPOSITION
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Nous définissons le nombre de tokens du projet et ouvrons les ventes, limitées
              dans le temps et uniquement pour nos utilisateurs whitelistés (ayant passé avec
              succès le KYC).
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                <Coins className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                TOKENISATION
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Une fois le bien entièrement financé, nous réglons les démarches
              administratives et réglementaires nécessaires à la fiduciarisation
              (constitution d&apos;une fiducie et transfert des droits du constituant vers les bénéficiaires).
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                <Share2 className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                DISTRIBUTION DES TOKENS
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Permettant aux détenteurs de bénéficier des rendements locatifs via le staking ou
              la revente entre utilisateurs whitelistés sur la plateforme.
            </p>
          </div>
        </div>
      </div>

      {/* For Investors Section */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
          ET POUR L&apos;INVESTISSEUR ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              L&apos;INSCRIPTION
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              et le passage du KYC sont obligatoires pour investir sur notre plateforme.
              C&apos;est une mesure essentielle dans la lutte contre le blanchiment d&apos;argent et le
              financement du terrorisme.
              Une fois le KYC validé, c&apos;est fini, bravo ! vous êtes whitelistés !
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              INVESTISSEMENTS SUR LA PLATEFORME
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Vous pouvez investir sur les biens proposés.
              Le nombre de parts par investisseur n&apos;est pas
              limité, vous pouvez en acheter autant que vous
              voulez. Premier arrivé, premier servi !
              Le prix d&apos;un part (donc du token associé à cette
              part) est fixé à 50 EUR.
              Si un projet ne reçoit pas le financement
              nécessaire dans le temps imparti, rassurez-vous,
              vos fonds seront restitués.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              USAGE DES TOKENS
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Une fois le bien entièrement financé, et
              les démarches administratives achevées,
              vos tokens seront directement
              disponibles dans votre wallet. Bravo !
              Il existe pour ces tokens l&apos;obligation de
              garde d&apos;une année minimum pour une
              durée d&apos;au moins 1 mois pour bénéficier
              du rendement locatif en cours, ou de les
              revendre sur notre plateforme.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
