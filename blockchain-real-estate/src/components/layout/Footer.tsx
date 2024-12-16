import Image from 'next/image';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaPinterestP, FaRss } from 'react-icons/fa';

export function Footer() {
  const partners = [
    { name: 'Journal du Net', src: '/images/partners/journaldunet.png', alt: 'Journal du Net Logo' },
    { name: 'Gecina', src: '/images/partners/gecina.png', alt: 'Gecina Logo' },
    { name: 'Aumann', src: '/images/partners/aumann.png', alt: 'Aumann Logo' },
    { name: 'La French Tech', src: '/images/partners/frenchtech.png', alt: 'La French Tech Logo' },
    { name: 'Coinbase', src: '/images/partners/coinbase.png', alt: 'Coinbase Logo' },
    { name: 'Cryptonews', src: '/images/partners/cryptonews.png', alt: 'Cryptonews Logo' },
    { name: 'BPI France', src: '/images/partners/bpifrance.png', alt: 'BPI France Logo' },
    { name: 'BNP Paribas', src: '/images/partners/bnp.png', alt: 'BNP Paribas Logo' },
    { name: 'CBRE', src: '/images/partners/cbre.png', alt: 'CBRE Logo' },
  ];

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Partners Section */}
        <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
          {partners.map((partner) => (
            <div key={partner.name} className="relative w-24 h-12">
              <Image
                src={partner.src}
                alt={partner.alt}
                fill
                className="object-contain filter dark:brightness-0 dark:invert"
              />
            </div>
          ))}
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Work Space Token</h3>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Société</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cgu" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  CGU Work Space Token
                </Link>
              </li>
              <li>
                <Link href="/fiducie" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  Comprendre la "Fiducie"
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  Qui sommes-nous ?
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Mentions</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  Contactez nous
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex justify-center space-x-4">
          <a href="#" className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <FaFacebookF className="w-5 h-5" />
          </a>
          <a href="#" className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-400 dark:hover:text-blue-400">
            <FaTwitter className="w-5 h-5" />
          </a>
          <a href="#" className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <FaLinkedinIn className="w-5 h-5" />
          </a>
          <a href="#" className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
            <FaPinterestP className="w-5 h-5" />
          </a>
          <a href="#" className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400">
            <FaRss className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
