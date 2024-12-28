"use client";

import Image from "next/image";
import { Target, FileText, Brain } from "lucide-react";

export default function StateOfArtPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">
        Etat de l'art des solutions blockchain dans l'immobilier
      </h1>
      
      <p className="text-lg mb-8">
        Après avoir exploré le contexte actuel de l'investissement dans le secteur des bureaux, 
        nous présentons succinctement les solutions innovantes que la blockchain offre spécifiquement à ce secteur.
      </p>

      <div className="flex items-start gap-4 mb-8">
        <Target className="w-8 h-8 mt-1 text-primary" />
        <div>
          <p className="text-lg">
            La blockchain offre plusieurs solutions innovantes qui peuvent transformer 
            l'investissement dans l'immobilier de bureau :
          </p>
        </div>
      </div>

      <div className="space-y-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-3">
            1. La tokenisation d'un actif réel
          </h3>
          <p>
            Qui consiste à convertir les droits qui lui sont attachés en un enregistrement numérique. 
            C'est une manière de représenter dans le monde digital un actif réel et de pouvoir échanger 
            cet actif en bénéficiant des mécanismes de la blockchain. Ce processus permet de fractionner 
            l'actif en plusieurs tokens numériques (via des standards comme ERC-20 ou ERC-721), facilitant 
            ainsi l'accès à l'investissement pour un plus grand nombre d'investisseurs. Chaque token 
            représente une part de l'actif, ce qui permet de réduire le ticket d'entrée à l'achat et 
            d'échanger ou de vendre facilement.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-3">
            2. Registre distribué
          </h3>
          <p>
            Une fois enregistré sur la blockchain, le token peut être échangé au sein de la communauté 
            et tout l'historique lié à la détention de cet actif est tracé dans les blocs, garantissant 
            ainsi que toutes les transactions sont transparentes et facilement vérifiables.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-primary mb-3">
            3. Les contrats intelligents ("smart contracts")
          </h3>
          <p>
            Ces contrats autonomes s'exécutent automatiquement lorsque les conditions prédéfinies sont 
            remplies, facilitant la rapidité et la fluidité des transactions, sans besoin d'intermédiaire.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Exemples concrètes d'application :</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-semibold">RealT :</h3>
              <p>
                RealT permet la tokenisation d'immeubles, offrant ainsi aux investisseurs 
                la possibilité d'acheter des parts de propriétés locatives. Les paiements 
                de loyers sont distribués aux détenteurs de tokens via des contrats 
                intelligents sur la blockchain Ethereum.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-semibold">Atoa :</h3>
              <p>
                Atoa est une plateforme de transactions immobilières qui utilise la 
                blockchain pour faciliter l'achat et la vente de biens immobiliers.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-lg">
          L'intégration de la blockchain dans le secteur immobilier offre des perspectives 
          prometteuses. En surmontant les défis traditionnels grâce au processus de 
          tokenisation, d'automatisation (via les smart contracts) et de transparence, la 
          blockchain pourrait redéfinir la façon dont les transactions d'espaces de bureau 
          sont menées, ouvrant la voie à un nouveau canal de distribution pour les vendeurs 
          et à une nouvelle ère de l'investissement pour les acheteurs-investisseurs.
        </p>
      </div>
    </main>
  );
}