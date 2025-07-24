import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - Hippo Polka</title>
        <meta name="description" content="Hippo Polka Terms of Service - Terms and conditions for using our personalized literacy platform" />
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
          <h1 className="text-4xl font-black mb-8">Terms of Service for Hippo Polka</h1>
          
          <p className="text-lg text-gray-600 mb-8">Effective Date: July 24, 2025</p>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By creating an account for your child on Hippo Polka, you ("Parent," "you," or "your") agree to these Terms of Service on behalf of yourself and your child. If you do not agree to these terms, please do not use our service.
              </p>
              <p className="text-gray-700 leading-relaxed font-semibold">
                <strong>Important:</strong> Hippo Polka is designed for children under 13. Only parents or legal guardians may create accounts for children and agree to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Hippo Polka creates personalized videos for literacy content based on your child's age, interests, and reading level. Our service includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>Personalized stories and reading activities</li>
                <li>Age-appropriate educational content</li>
                <li>Parent dashboards</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Account Creation and Responsibilities</h2>
              
              <h3 className="text-xl font-semibold mb-3">Parent Responsibilities</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                As the account holder, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-6">
                <li>Provide accurate information about yourself and your child</li>
                <li>Maintain the security of your account credentials</li>
                <li>Monitor your child's use of the platform</li>
                <li>Ensure your child uses the service appropriately</li>
                <li>Be responsible for all activity on your child's account</li>
                <li>Comply with all applicable laws and these terms</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Child Account Limitations</h3>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>Children may not create their own accounts</li>
                <li>Children may only use accounts created by their parents</li>
                <li>All communications regarding the account will be with the parent</li>
                <li>Parents are responsible for supervising their child's use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Acceptable Use</h2>
              
              <h3 className="text-xl font-semibold mb-3">Permitted Uses</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                You and your child may use Hippo Polka to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-6">
                <li>Access personalized content</li>
                <li>Engage with age-appropriate literacy materials</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Prohibited Activities</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                You and your child may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>Share account credentials with others</li>
                <li>Attempt to access other users' accounts or information</li>
                <li>Upload or share inappropriate content</li>
                <li>Use the service for any illegal purposes</li>
                <li>Attempt to interfere with or disrupt the service</li>
                <li>Use automated tools to access the service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold mb-3">Our Content</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                All content, features, and functionality on Hippo Polka, including stories, activities, graphics, and software, are owned by Hippo Polka and protected by copyright, trademark, and other laws. You may not copy, distribute, modify, or create derivative works from our content without permission.
              </p>

              <h3 className="text-xl font-semibold mb-3">Limited License</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                We grant you a limited, non-exclusive, non-transferable license to access and use Hippo Polka for your child's personal, educational use only.
              </p>

              <h3 className="text-xl font-semibold mb-3">User-Generated Content</h3>
              <p className="text-gray-700 leading-relaxed">
                If your child creates any content through our platform (such as completing activities), you grant us a non-exclusive license to use that content to provide our service and improve the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Privacy and Data Protection</h2>
              <p className="text-gray-700 leading-relaxed">
                Your child's privacy is governed by our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, which is incorporated into these terms. By using our service, you consent to the collection, use, and sharing of information as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Service Availability</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We strive to provide reliable service, but we cannot guarantee:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                <li>Uninterrupted access to the platform</li>
                <li>Error-free operation</li>
                <li>Compatibility with all devices or browsers</li>
                <li>Availability at all times</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify or discontinue the service with reasonable notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Termination</h2>
              
              <h3 className="text-xl font-semibold mb-3">Your Right to Terminate</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                You may terminate your child's account at any time by contacting us at <a href="mailto:info@btwnd.com" className="text-blue-600 hover:underline">info@btwnd.com</a>. Upon termination, your child's personal information will be deleted in accordance with our Privacy Policy.
              </p>

              <h3 className="text-xl font-semibold mb-3">Our Right to Terminate</h3>
              <p className="text-gray-700 leading-relaxed">
                We may suspend or terminate accounts that violate these terms or for other legitimate business reasons. We will provide reasonable notice when possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-semibold mb-3">Educational Tool Disclaimer</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Hippo Polka is designed to supplement, not replace, traditional reading instruction. We make no guarantees about specific educational outcomes or improvements in your child's reading abilities.
              </p>

              <h3 className="text-xl font-semibold mb-3">Service Disclaimer</h3>
              <p className="text-gray-700 leading-relaxed mb-6 uppercase font-semibold">
                The service is provided "as is" without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>

              <h3 className="text-xl font-semibold mb-3">Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed uppercase font-semibold">
                To the maximum extent permitted by law, Hippo Polka shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to defend, indemnify, and hold harmless Hippo Polka from any claims, damages, or expenses arising from your or your child's use of the service or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold mb-3">Governing Law</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                These terms are governed by the laws of California, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold mb-3">Dispute Process</h3>
              <p className="text-gray-700 leading-relaxed">
                Before pursuing legal action, we encourage you to contact us to resolve any disputes. Any legal disputes will be resolved in the courts of California.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Special Provisions for Children</h2>
              
              <h3 className="text-xl font-semibold mb-3">COPPA Compliance</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                We comply with the Children's Online Privacy Protection Act (COPPA). Parents have specific rights regarding their child's information as outlined in our Privacy Policy.
              </p>

              <h3 className="text-xl font-semibold mb-3">Child Safety</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                We are committed to providing a safe online environment for children. We prohibit inappropriate content and communications on our platform.
              </p>

              <h3 className="text-xl font-semibold mb-3">Parental Supervision</h3>
              <p className="text-gray-700 leading-relaxed">
                We recommend that parents supervise their child's use of digital platforms, including Hippo Polka.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update these Terms of Service from time to time. Material changes will be communicated to parents via email with reasonable advance notice. Continued use of the service after changes indicates acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                If you have questions about these Terms of Service, please contact us at <a href="mailto:info@btwnd.com" className="text-blue-600 hover:underline">info@btwnd.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Severability</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
              </p>
              <p className="text-gray-700 leading-relaxed font-semibold">
                By creating an account for your child, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
