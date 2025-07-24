import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function LeadGenB() {
  return (
    <>
      <Head>
        <title>Hippo Polka - Not all screen time is created equal. Ours builds a love of reading.</title>
        <meta name="description" content="Start with a free plan or upgrade for more personalized videos. Joyful, guilt-free screen time that builds early literacy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white text-black font-sans">
        {/* Header with Logo */}
        <header className="p-8 pb-0">
          <div className="max-w-7xl mx-auto">
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
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-8 py-8 lg:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-left">
                <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
                  Not all screen time<br/>
                  <span className="text-black">is created equal.</span>
                </h1>
                <h2 className="text-3xl lg:text-4xl font-bold mb-12 text-gray-800">
                  Our videos build a love of reading.
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-start">
                  <Link 
                    href="/register?plan=free"
                    className="inline-block bg-gray-600 text-white px-12 py-6 rounded-full text-xl font-bold hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Start FREE Today
                  </Link>
                  <Link 
                    href="/register?plan=paid"
                    className="inline-block bg-black text-white px-12 py-6 rounded-full text-xl font-bold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Get Premium Access
                  </Link>
                </div>
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
                    <h3 className="text-3xl font-bold mb-4 text-black">We start with your child's name—literally.</h3>
                    <p className="text-xl leading-relaxed text-gray-700">Every video is personalized, playful, and built around the way little kids actually learn.</p>
                  </div>
                  
                  <div>
                    <p className="text-xl leading-relaxed text-gray-700">
                      Toddlers and preschoolers thrive on <strong className="text-black">repetition, predictability, and seeing themselves in the story.</strong> That's why Hippo Polka videos are tailored to your child's age, interests, and developmental stage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Promise Section */}
        <section className="px-8 py-20 bg-black text-white">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl lg:text-6xl font-black mb-12">
              Forget autoplay and<br/>
              <span className="text-gray-300">algorithm loops.</span>
            </h2>
            <p className="text-3xl lg:text-4xl font-light mb-16 leading-relaxed">
              We're building readers.<br/>
              <br/>
              One joyful minute at a time.
            </p>
          </div>
        </section>

        {/* Emotional Hook Section */}
        <section className="px-8 py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/marketing/mom-kid-screen.png"
                    alt="Mother and child engaged with personalized content together"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-5xl lg:text-6xl font-black mb-8 leading-tight">
                  When it's all about them, they're all in.
                </h2>
                <p className="text-3xl lg:text-3xl text-black">
                  Personalized videos pull them close... and gently opens the door to learning together, in real life.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Expertise Section */}
        <section className="px-8 py-20 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-5xl lg:text-6xl font-black mb-8 leading-tight">
                  Created by a Mom Who's Helped Millions of Kids Learn
                </h2>
                
                <div className="space-y-6 text-lg leading-relaxed">
                  <p>
                    Hippo Polka was created by <strong className="text-gray-300">Dr. Carla Engelbrecht</strong>, a mom and education technology expert who's built <strong className="text-gray-300">more than 200 games, apps, stories, and interactive shows</strong> for PBS Kids, Sesame Street, Highlights for Children, Netflix, and more.
                  </p>
                  <p>
                    Now, she's bringing that same expertise—and the magic of personalization—straight to your family.
                  </p>
                  <p>
                    Research shows that when young children see themselves in a story, by name, by interest, or by identity, they engage more, retain more, and feel more confident as learners.
                  </p>
                  <p className="text-xl font-semibold text-gray-300">
                    Hippo Polka turns that research into real-life goodness: Fast. Joyful. Guilt-free screen time that actually builds early literacy.
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

        {/* Pricing Section - Version B */}
        <section className="px-8 py-20 bg-black text-white">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-6xl lg:text-7xl font-black mb-16">
              Start with a <span className="text-gray-400">Free Plan</span><br/>
              or <span className="text-gray-400">Upgrade</span> for More
            </h2>
            
            {/* Pricing Cards */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-white text-black p-10 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-gray-300">
                <h3 className="text-4xl font-black mb-6 text-gray-800">Free Plan</h3>
                <div className="text-6xl font-black mb-8 text-gray-600">$0</div>
                <div className="space-y-4 mb-12 text-left">
                  <div className="flex items-center">
                    <span className="text-black mr-4 text-2xl">✅</span>
                    <span className="text-xl">1 personalized video per month</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-black mr-4 text-2xl">✅</span>
                    <span className="text-xl">Full access to non-personalized video library</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-black mr-4 text-2xl">✅</span>
                    <span className="text-xl">Delivered to your inbox and phone</span>
                  </div>
                </div>
                <Link 
                  href="/register?plan=free"
                  className="block bg-gray-600 text-white px-12 py-6 rounded-full text-xl font-bold hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
                >
                  START FREE NOW
                </Link>
              </div>

              {/* Paid Plan */}
              <div className="bg-gray-900 text-white p-10 rounded-3xl shadow-2xl border-4 border-gray-700 relative transform hover:scale-105 transition-all duration-300">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-300 text-black px-6 py-2 rounded-full text-lg font-bold">🔥 MOST POPULAR</span>
                </div>
                <h3 className="text-4xl font-black mb-6">Premium Plan</h3>
                <div className="text-6xl font-black mb-2">$7.99</div>
                <div className="text-xl mb-8 opacity-80">/month</div>
                <div className="space-y-4 mb-12 text-left">
                  <div className="flex items-center">
                    <span className="text-gray-300 mr-4 text-2xl">✅</span>
                    <span className="text-xl font-semibold">2 personalized videos each month</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-300 mr-4 text-2xl">✅</span>
                    <span className="text-xl font-semibold">Full video library access</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-300 mr-4 text-2xl">✅</span>
                    <span className="text-xl font-semibold">Priority personalization</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-300 mr-4 text-2xl">✅</span>
                    <span className="text-xl font-semibold">Cancel anytime</span>
                  </div>
                </div>
                <Link 
                  href="/register?plan=paid"
                  className="block bg-white text-black px-12 py-6 rounded-full text-xl font-bold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
                >
                  START PREMIUM NOW
                </Link>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white/10 backdrop-blur-sm p-12 rounded-3xl mb-12 border border-gray-600">
              <h3 className="text-4xl font-bold mb-12">How It Works</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-300 text-black rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6">1</div>
                  <h4 className="text-xl font-bold mb-4">Tell us about your child</h4>
                  <p className="text-base opacity-90">Name, age, interests, and what lights them up.</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-300 text-black rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6">2</div>
                  <h4 className="text-xl font-bold mb-4">Pick your plan</h4>
                  <p className="text-base opacity-90">Try the free tier or upgrade for more personalized learning.</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-300 text-black rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6">3</div>
                  <h4 className="text-xl font-bold mb-4">Watch, play, and learn together</h4>
                  <p className="text-base opacity-90">Each video includes a playful transition idea and a literacy tip just for you.</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-300 text-black rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-6">4</div>
                  <h4 className="text-xl font-bold mb-4">Enjoy screen time that feels like storytime</h4>
                  <p className="text-base opacity-90">Built for joyful learning—on your schedule, in your kid's world.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-200 text-black p-12 rounded-3xl transform hover:scale-105 transition-all duration-300">
              <p className="text-3xl lg:text-4xl font-black mb-8">
                Ready to see what happens when learning starts with your child's name?
              </p>
              <div className="flex flex-col lg:flex-row gap-6 justify-center">
                <Link 
                  href="/register?plan=free"
                  className="inline-block bg-gray-600 text-white px-12 py-6 rounded-full text-xl font-bold hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
                >
                  START FREE
                </Link>
                <Link 
                  href="/register?plan=paid"
                  className="inline-block bg-black text-white px-12 py-6 rounded-full text-xl font-bold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
                >
                  GET PREMIUM
                </Link>
              </div>
              <p className="text-lg mt-6 opacity-80">
                No credit card required for free plan • Cancel anytime • 100% satisfaction guaranteed
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-8 py-12 border-t border-gray-200">
          <div className="max-w-7xl mx-auto text-center">
            <Image
              src="/HippoPolkaLogo.png"
              alt="Hippo Polka"
              width={80}
              height={80}
              className="w-10 h-10 mx-auto mb-4"
            />
            <p className="text-gray-600">
              © 2025 Hippo Polka. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
