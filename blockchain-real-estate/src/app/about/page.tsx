"use client";

import Image from "next/image";
import { Building2, Cpu, Users, Target, Leaf } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
      {/* Header */}
      <div className="bg-cyan-400 text-white p-8 md:p-16 rounded-lg">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          QUI SOMMES NOUS ?
        </h1>
      </div>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="relative h-[300px] w-full">
            <Image
              src="/images/about/classification-immeubles-bureaux-1.jpg"
              alt="Building Exterior"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Notre Mission
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Nous démocratisons l&apos;accès à l&apos;immobilier de bureau
              grâce à la tokenisation. En fractionnant des actifs
              traditionnellement coûteux en tokens accessibles à tous, nous
              réinventons l&apos;investissement immobilier pour qu&apos;il
              devienne inclusif, transparent et liquide.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative h-[300px] w-full">
            <Image
              src="/images/about/immeuble-bureaux-architecture-contemporaine-paysage-urbain-perspective-personnelle_1417-5648.jpg"
              alt="Modern Office"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Notre Vision
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Nous démocratisons l&apos;accès à l&apos;immobilier de bureau
              grâce à la tokenisation. En fractionnant des actifs
              traditionnellement coûteux en tokens accessibles à tous, nous
              réinventons l&apos;investissement immobilier pour qu&apos;il
              devienne inclusif, transparent et liquide.
            </p>
          </div>
        </div>
      </div>

      {/* Notre Technologie */}
      <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Notre Technologie
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Cpu className="w-6 h-6 text-cyan-500 mt-1" />
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                Une infrastructure décentralisée pour sécuriser et automatiser
                les transactions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Target className="w-6 h-6 text-cyan-500 mt-1" />
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                Tokenisation 100 % automatisée pour des investissements
                simplifiés
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notre Équipe */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Notre Équipe Multidisciplinaire
        </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Farid Boulil */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4">
                <Image
                  src="/images/team/farid-boulil.jpg"
                  alt="Farid Boulil"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Farid Boulil
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Consultant Blockchain
              </p>
            </div>

            {/* Mathieu Carreres */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4">
                <Image
                  src="/images/team/mathieu-carreres.jpg"
                  alt="Mathieu Carreres"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Mathieu Carreres
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Consultant Blockchain
              </p>
            </div>

            {/* Frédéric Goll */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4">
                <Image
                  src="/images/team/frederic-goll.png"
                  alt="Frédéric Goll"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Frédéric Goll
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Consultant Blockchain
              </p>
            </div>

            {/* Thomas Berrod */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4">
                <Image
                  src="/images/team/thomas-berrod.jpg"
                  alt="Thomas Berrod"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Thomas Berrod
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Développeur Web 3 / Blockchain
              </p>
            </div>
          </div>
      </div>

      {/* Stratégie et Engagements */}
      <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Notre Stratégie et Engagements
        </h2>
        <div className="space-y-8">
          {/* Gestion Dynamique */}
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Gestion Dynamique et Adaptative des Actifs
            </h3>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Nos stratégies locatives sont spécifiquement conçues pour
                maximiser les rendements tout en préservant la valeur des actifs
                sur le long terme.
              </p>
              <ul className="space-y-2 list-disc list-inside text-gray-600 dark:text-gray-300">
                <li>Flexibilité locative - Adaptation aux usages modernes</li>
                <li>Optimisation des rendements - Gestion proactive</li>
                <li>
                  Maintenance proactive - Administration des biens optimisée
                </li>
              </ul>
            </div>
          </div>

          {/* Performance Énergétique */}
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Performance Énergétique et Transition Écologique
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Leaf className="w-6 h-6 text-cyan-500 mt-1" />
                <div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Nous intégrons les préoccupations environnementales au cœur
                    de notre stratégie immobilière en sélectionnant des actifs à
                    fort potentiel énergétique.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
