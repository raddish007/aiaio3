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
                  What if screen time<br/>
                  <span className="text-black">could spark a love of reading?</span>
                </h1>
                <h2 className="text-3xl lg:text-4xl font-bold mb-12 text-gray-800">
                  Our videos build a love of reading.
                </h2>
                
                <Link 
                  href="/register"
                  className="inline-block bg-black text-white px-12 py-6 rounded-full text-2xl font-bold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
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
                <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/marketing/mom-kid-dino.png"
                    alt="Child in dino costume with mom watching personalized content together"
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

        {/* Pricing Section */}
        <section className="px-8 py-20 bg-black text-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-6xl lg:text-7xl font-black mb-8">
              Try Your First<br/>
              <span className="text-gray-400">Personalized Video</span><br/>
              FREE
            </h2>
            <p className="text-3xl lg:text-4xl font-light mb-16">
              Then get 2 videos per week for just <span className="font-bold text-gray-300">$7.99/month</span>
            </p>
            
            <Link 
              href="/register"
              className="inline-block bg-white text-black px-16 py-6 rounded-full text-2xl font-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Start Now
            </Link>
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
