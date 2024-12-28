"use client";

import { Building2, Scale, Shield, FileCheck } from "lucide-react";

export default function ConceptionJuridiquePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="py-16 bg-gradient-to-r from-cyan-600 to-cyan-700">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-6">
            Conception Juridique du Projet
          </h1>
          <p className="text-xl text-white/90">
            Aspect juridique et législatif de notre projet
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Overview Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Overview sur le Projet
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Application décentralisée proposant d&apos;investir dans de l&apos;immobilier professionnel en France par l&apos;achat de tokens représentant numériquement chacun une fraction des actifs. Possibilité de revendre les tokens à d&apos;autres utilisateurs sur l&apos;application. Possibilité via staking/loking des tokens de percevoir un rendement corrélé au rendement de l&apos;actif réel.
          </p>
        </section>

        {/* Legal Points Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Points d&apos;attention juridiques identifiés
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col space-y-4">
              <Scale className="w-8 h-8 text-cyan-500" />
              <h3 className="text-xl font-semibold">Qualification juridique du token</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Mise en place d&apos;une structure juridique adéquate
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              <Building2 className="w-8 h-8 text-cyan-500" />
              <h3 className="text-xl font-semibold">Structure juridique</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Régime d&apos;application décentralisée
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              <Shield className="w-8 h-8 text-cyan-500" />
              <h3 className="text-xl font-semibold">Conformité réglementaire</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Respect des normes et réglementations en vigueur
              </p>
            </div>
          </div>
        </section>

        {/* Key Partners Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Partenaires clés
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="border-l-4 border-cyan-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Juriste</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Spécialisation IT/Immobilier
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Veille juridique continue pour assurer la conformité légale et réglementaire
                </p>
              </div>
              <div className="border-l-4 border-cyan-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Avocat</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Spécialisation IT et droit bancaire et financier à security manager
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="border-l-4 border-cyan-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Comptable</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Vérification des implications fiscales et comptables
                </p>
              </div>
              <div className="border-l-4 border-cyan-500 pl-4">
                <h3 className="text-xl font-semibold mb-2">Notaire</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Actes Constitutifs - Fiducie - Bénéficiaires
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cost Structure Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Postes de dépenses
          </h2>
          <div className="space-y-6">
            <div className="border-l-4 border-cyan-500 pl-4">
              <h3 className="text-lg font-semibold mb-2">Poste de dépense n°1</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Variable selon l&apos;étendue, la durée (forfaits mensuels ou annuels)
                l&apos;automatisation, l&apos;accompagnement
                (base 500€-1500€ HT mensuel)
              </p>
            </div>
            <div className="border-l-4 border-cyan-500 pl-4">
              <h3 className="text-lg font-semibold mb-2">Poste de dépense n°2</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Avis sur la qualification du token 2K-6K€ HT
                Analyse de la situation du projet 4K-10K HT
                Rédaction de contrats : 4K HT
              </p>
            </div>
            <div className="border-l-4 border-cyan-500 pl-4">
              <h3 className="text-lg font-semibold mb-2">Total des dépenses estimées</h3>
              <p className="text-gray-600 dark:text-gray-300">
                35K€ HT (hors licences et autorisations)
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}