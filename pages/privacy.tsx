import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - Hippo Polka</title>
        <meta name="description" content="Hippo Polka Privacy Policy - Learn how we protect your child's information" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white text-black font-sans">
        {/* Header */}
        <header className="p-8 pb-0">
          <div className="max-w-7xl mx-auto">
            <Link href="/" className="flex items-center">
              <Image
                src="/HippoPolkaLogo.png"
                alt="Hippo Polka"
                width={80}
                height={80}
                className="w-20 h-20"
              />
              <span className="ml-4 text-2xl font-bold text-black">Hippo Polka</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-8 py-16">
          <h1 className="text-4xl font-black mb-8">Privacy Policy for Hippo Polka</h1>
          
          <p className="text-lg text-gray-600 mb-8">Effective Date: July 24, 2025</p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">About This Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Hippo Polka creates personalized literacy videos for families. We take the privacy and safety of children very seriously. This Privacy Policy explains how we collect, use, and protect information when parents create accounts for their children.
              </p>
              <p className="text-gray-700 leading-relaxed font-semibold">
                <strong>Important:</strong> We comply with the Children's Online Privacy Protection Act (COPPA). Parents must create accounts on behalf of their children and provide consent for any information collection.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3">Information Provided by Parents</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                When you create an account for your child, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-6">
                <li><strong>Child's First Name:</strong> Used to personalize content and activities</li>
                <li><strong>Child's Age:</strong> Helps us provide age-appropriate content and reading levels</li>
                <li><strong>Child's Interests:</strong> Used to customize stories and activities around topics your child enjoys (e.g., animals, sports, adventure)</li>
                <li><strong>Parent Contact Information:</strong> Your email address for account management and communications</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Automatically Collected Information</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed">
                <li><strong>Usage Information:</strong> How your child interacts with stories and activities to track reading progress</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">How We Use Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use your child's information to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed mb-4">
                <li>Create personalized reading content based on their age and interests</li>
                <li>Provide customer support to you as the parent</li>
              </ul>
              <p className="text-gray-700 leading-relaxed font-semibold">
                We do not use children's information for advertising or marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, rent, or share your child's personal information with third parties for their marketing purposes. We may share information only in these limited circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li><strong>Service Providers:</strong> With trusted partners who help us operate our platform (e.g., hosting services), under strict confidentiality agreements</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect the safety of our users</li>
                <li><strong>Business Transfer:</strong> In the unlikely event of a company sale or merger, with equivalent privacy protections</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Your Rights as a Parent</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Under COPPA, you have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed mb-4">
                <li>Review your child's personal information</li>
                <li>Request deletion of your child's personal information</li>
                <li>Refuse further collection or use of your child's information</li>
                <li>Contact us with questions about our privacy practices</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, contact us at <a href="mailto:info@btwnd.com" className="text-blue-600 hover:underline">info@btwnd.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We implement appropriate technical and organizational measures to protect your child's information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed">
                <li>Secure data encryption during transmission</li>
                <li>Limited access to personal information on a need-to-know basis</li>
                <li>Regular security assessments and updates</li>
                <li>Secure data storage practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your child's personal information only as long as necessary to provide our service or as required by law. When you request deletion or close an account, we will delete your child's personal information within 30 days, except where retention is required for legal compliance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. If we make material changes affecting children's information, we will notify parents by email and obtain consent where required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or your child's information, please contact us at <a href="mailto:info@btwnd.com" className="text-blue-600 hover:underline">info@btwnd.com</a>
              </p>
              <p className="text-gray-700 leading-relaxed">
                For complaints about our privacy practices, you may also contact the Federal Trade Commission at <a href="https://consumer.ftc.gov/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://consumer.ftc.gov/</a>
              </p>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-8 py-16">
            {/* Main Footer Content */}
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {/* Logo & Description */}
              <div className="md:col-span-2">
                <div className="flex items-center mb-6">
                  <Image
                    src="/HippoPolkaLogo.png"
                    alt="Hippo Polka"
                    width={60}
                    height={60}
                    className="w-15 h-15 rounded-lg"
                  />
                  <span className="ml-4 text-2xl font-bold text-white">Hippo Polka</span>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                  Personalized videos that spark a love of reading.
                </p>
              </div>

              {/* Company Links */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
                <ul className="space-y-3">
                  <li><Link href="https://app.hippopolka.com/signin" className="text-gray-300 hover:text-white transition-colors">Sign In</Link></li>
                  <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</Link></li>
                  <li><Link href="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/press" className="text-gray-300 hover:text-white transition-colors">Press</Link></li>
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
                <ul className="space-y-3">
                  <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link></li>
                  <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom Border */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-sm">
                  © 2025 Hippo Polka. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
