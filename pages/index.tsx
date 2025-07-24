import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Hippo Polka - Not all screen time is created equal. Ours builds a love of reading.</title>
        <meta name="description" content="Get your first personalized video free, then just $7.99/month for joyful, guilt-free screen time that builds early literacy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white text-black font-sans">
        {/* Header with Logo */}
        <header className="p-8 pb-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Image
                  src="/HippoPolkaLogo.png"
                  alt="Hippo Polka"
                  width={80}
                  height={80}
                  className="w-20 h-20"
                />
                <span className="ml-4 text-2xl font-bold text-black">Hippo Polka</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/signin" className="text-gray-600 hover:text-black transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-8 py-8 lg:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-left">
                <h1 className="text-[32px] lg:text-[48px] font-black mb-6 leading-[1.2] lg:leading-[1.3]">
                  What if screen time<br/>
                  <span className="text-black">could spark a love of reading?</span>
                </h1>
                <h2 className="text-[20px] lg:text-[28px] font-medium mb-8 text-gray-800 leading-[1.4]">
                  With Hippo Polka, you can.<br/><br/>
                  Our videos are <strong className="font-semibold text-black">personalized</strong> for your child's interests, supporting <strong className="font-semibold text-black">real-life literacy moments</strong> you can build on together.
                </h2>
                
                <Link 
                  href="/register"
                  className="inline-block bg-black text-white px-12 py-6 rounded-full text-[16px] lg:text-[18px] font-bold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Start Now for Free
                </Link>
              </div>
              
              {/* Hero Image */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-lg aspect-square rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="/marketing/kid-dad-screen.png"
                    alt="Child's face lighting up while watching personalized video with dad"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Section */}
        <section className="px-8 py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="flex justify-center">
                <div className="relative w-full max-w-md aspect-video rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/marketing/wishLor_1.jpg"
                    alt="Child enjoying personalized content with family"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-[24px] lg:text-[32px] font-bold mb-4 text-black leading-[1.3]">We Start With Your Child's Name—Literally</h3>
                    <p className="text-[18px] lg:text-[20px] leading-[1.5] text-gray-700">Every video is <strong className="font-semibold text-black">personalized</strong> with your child's name, interests, and developmental stage. Because when toddlers see themselves in the story, magic happens.</p>
                  </div>
                  
                  <div>
                    <p className="text-[18px] lg:text-[20px] leading-[1.5] text-gray-700">
                      Watch your 3-year-old light up when they hear their name in the story.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Promise Section */}
        <section className="px-8 py-20 bg-black text-white">
          <div className="max-w-6xl mx-auto">
            {/* Full-width headline */}
            <div className="text-center mb-16">
              <h2 className="text-[32px] lg:text-[48px] font-black leading-[1.2] lg:leading-[1.3]">
                Not All Screen Time Is Created Equal
              </h2>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-center lg:text-left">
                <p className="text-[20px] lg:text-[26px] font-light mb-8 leading-[1.4]">
                  Forget autoplay and algorithm loops that leave kids zoned out.
                </p>
                <p className="text-[20px] lg:text-[26px] font-light mb-8 leading-[1.4]">
                  Hippo Polka videos use <strong className="font-semibold">repetition, predictability, and personalization</strong>—exactly how little kids actually learn. Each joyful minute builds real reading skills.
                </p>
                <p className="text-[20px] lg:text-[26px] font-light mb-16 leading-[1.4]">
                  And because we understand the "just one more video" battle, we give you simple ways to transition from each video into <strong className="font-semibold">real-life learning moments together</strong>.
                </p>
              </div>
              
              {/* Dino Image */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/marketing/mom-kid-dino.png"
                    alt="Child in dino costume with mom watching personalized content together"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Expertise Section */}
        <section className="px-8 py-20 bg-gray-50 text-black">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-[32px] lg:text-[48px] font-black mb-8 leading-[1.2] lg:leading-[1.3]">
                  Created by a Mom and EdTech Expert
                </h2>
                
                <div className="space-y-6 text-[16px] lg:text-[18px] leading-[1.5]">
                  <p>
                    Hippo Polka was created by <strong className="text-gray-700">Dr. Carla Engelbrecht</strong>, a mom and education technology expert who's built <strong className="text-gray-700">more than 200 games, apps, stories, and interactive shows</strong> for PBS Kids, Sesame Street, Highlights for Children, Netflix, and more.
                  </p>
                  <p>
                    Now, she's bringing that same expertise—and the magic of personalization—straight to your family.
                  </p>
                  <p>
                    Research shows that when young children see themselves in a story, by name, by interest, or by identity, they engage more, retain more, and feel more confident as learners.
                  </p>
                  <p className="text-[18px] lg:text-[20px] font-semibold text-gray-700">
                    Hippo Polka turns that research into guilt-free screen time goodness that actually works.
                  </p>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/marketing/carla-grat.jpg"
                    alt="Dr. Carla Engelbrecht, creator of Hippo Polka"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-8 py-20 bg-black text-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-[40px] lg:text-[56px] font-black mb-8 leading-[1.2]">
              Try Your First<br/>
              <span className="text-gray-400">Personalized Video</span><br/>
              FREE
            </h2>
            <p className="text-[20px] lg:text-[28px] font-light mb-16 leading-[1.4]">
              Then get 2 videos per week for just <span className="font-bold text-gray-300">$7.99/month</span>
            </p>
            
            <Link 
              href="/register"
              className="inline-block bg-white text-black px-16 py-6 rounded-full text-[18px] lg:text-[20px] font-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Start Now
            </Link>
          </div>
        </section>

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
                  <li><Link href="/signin" className="text-gray-300 hover:text-white transition-colors">Sign In</Link></li>
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
