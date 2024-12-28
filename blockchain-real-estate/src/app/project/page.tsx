"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, Coins, ChartBar, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="py-16 bg-gradient-to-r from-cyan-600 to-cyan-700">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-6">
            Work Space Token
          </h1>
          <p className="text-xl text-white/90 max-w-3xl">
            Une solution innovante de tokenisation immobilière pour démocratiser
            l&apos;investissement dans l&apos;immobilier de bureau
          </p>
        </div>
      </div>
      {/* Section Conception Juridique */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            La Conception Juridique
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Découvrez comment nous avons conçu notre solution pour répondre aux
            exigences légales et regulatories.
          </p>
          <Link href="/conception-juridique">
            <Button variant="primary" className="mt-4" aria-label="Conception Juridique">
              En savoir plus
            </Button>
          </Link>
        </section>
      </div>


      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Problem Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Le Problème
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Marché Immobilier Traditionnel
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li>• Barrières à l&apos;entrée élevées</li>
                <li>• Manque de liquidité</li>
                <li>• Processus d&apos;investissement complexe</li>
                <li>• Frais de gestion importants</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Enjeux Actuels
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li>• Accès limité aux petits investisseurs</li>
                <li>• Temps de transaction longs</li>
                <li>• Manque de transparence</li>
                <li>• Gestion administrative lourde</li>
              </ul>
            </div>
          </div>
        </section>

        {/* State of Art Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Etat de l'art des Solutions Blockchain dans l'Immobilier
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Découvrez les dernières avancées technologiques et les solutions
            innovantes que la blockchain apporte spécifiquement au secteur de
            l'immobilier.
          </p>
          <Link href="/state-of-art">
            <Button variant="primary" className="mt-4" aria-label="Etat de l'art">
              En savoir plus
            </Button>
          </Link>
        </section>


        {/* Solution Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Notre Solution
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <Building2 className="w-12 h-12 text-cyan-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tokenisation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fractionnement d&apos;actifs immobiliers en tokens numériques
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Coins className="w-12 h-12 text-cyan-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Accessibilité</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Investissement possible à partir de petits montants
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <ChartBar className="w-12 h-12 text-cyan-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Liquidité</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Marché secondaire pour l&apos;échange de tokens
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Shield className="w-12 h-12 text-cyan-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sécurité</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Transactions sécurisées par la blockchain
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Avantages
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Pour les Investisseurs
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li>• Investissement fractionné</li>
                <li>• Liquidité accrue</li>
                <li>• Transparence totale</li>
                <li>• Rendements attractifs</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Pour les Propriétaires
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li>• Valorisation optimisée</li>
                <li>• Gestion simplifiée</li>
                <li>• Liquidité facilitée</li>
                <li>• Nouveaux investisseurs</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Pour le Marché
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li>• Démocratisation de l&apos;investissement</li>
                <li>• Efficacité accrue</li>
                <li>• Innovation technologique</li>
                <li>• Standardisation des processus</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Technologie
          </h2>
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300">
              Notre plateforme s&apos;appuie sur la blockchain Ethereum et les
              contrats intelligents pour garantir :
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li>• Sécurité des transactions</li>
              <li>• Traçabilité des opérations</li>
              <li>• Automatisation des processus</li>
              <li>• Conformité réglementaire</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
