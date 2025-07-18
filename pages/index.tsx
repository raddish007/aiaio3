import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Hippo Polka - For families raising joyful, confident readers</title>
        <meta name="description" content="Twice a week, get a personalized video that sparks literacy, reduces screen-time stress, and supports real-life learning." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white text-black font-sans">
        {/* Header with Logo */}
        <header className="p-8 pb-4">
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
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                  For families raising joyful, confident readers.
                </h1>
                <p className="text-xl lg:text-2xl mb-8 leading-relaxed">
                  Personalized videos for toddlers and preschoolers, designed to build early literacy, ease screen-time guilt, and spark real-world play.
                </p>
                <Link 
                  href="/register"
                  className="inline-block bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors duration-200"
                >
                  Join the Waitlist
                </Link>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="w-80 h-96 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                  <p className="text-gray-500 text-center">Phone preview placeholder<br/>(looping GIF or video)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning They'll Love Section */}
        <section className="px-8 py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                  Learning They'll Love, Because It's About Them
                </h2>
                <div className="space-y-4 text-lg leading-relaxed">
                  <p>
                  Young kids are naturally self-centered. Not because they’re selfish, but because it’s how their brains are wired to learn.
                  </p>
                  <p>
                  That’s why when they hear their name, see their interests, and recognize their world in a story—they light up. And they remember it.
                  </p>
                  <p>
                  Hippo Polka makes learning personal. Every video is built around your child. Because kids learn best when they’re the star of the show.
                  </p>
                </div>
              </div>
              <div className="flex justify-center lg:justify-start">
                <div className="w-80 h-80 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                  <p className="text-gray-500 text-center">Happy child watching<br/>personalized video</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guilt-Free Screen Time Section */}
        <section className="px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                <div className="w-80 h-80 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                  <p className="text-gray-500 text-center">Parent and child<br/>enjoying screen time</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                  Learning You'll Love, Because It's Guilt-Free Screen Time
                </h2>
                <div className="space-y-4 text-lg leading-relaxed">
                  <p>
                    Not all screen time is created equal.
                  </p>
                  <p>
                  Hippo Polka gives you short, personalized videos that support your child’s development and give you a moment to breathe. It’s screen time that feels like quality time.
                  </p>
                  <p className="font-semibold">
                    You can feel good pressing play.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-3 mt-1">✅</span>
                      <span><strong>Purposeful, not passive:</strong> Every video builds literacy skills using your child's name, interests, and developmental stage.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-3 mt-1">✅</span>
                      <span><strong>Research-backed:</strong> Grounded in what works: personalization, early language exposure, and joyful connection.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-3 mt-1">✅</span>
                      <span><strong>Parent-supported:</strong> Each video comes with one simple idea to help bring the learning to life, because the real magic happens off screen.</span>
                    </li>
                  </ul>
                  <p className="font-semibold mt-6">
                    This isn't a screen-time compromise. It's screen time that helps your kid grow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-8 py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                How It Works
              </h2>
              <p className="text-xl max-w-4xl mx-auto leading-relaxed">
                Twice a week, Hippo Polka sends you and your child a personalized video—delivered by text and email. No logins, no algorithm rabbit holes. Just smart screen time that fits your day.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold mb-3">Short & playful</h3>
                <p className="text-lg leading-relaxed">
                  Most videos end with an invitation to do something together in real life,making screen-to-play transitions smoother.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold mb-3">Real-life literacy tips</h3>
                <p className="text-lg leading-relaxed">
                  Each video includes a research-backed parent tip to help you extend the learning during everyday moments, like bath time, the car ride, or standing in line at the grocery store.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold mb-3">Want More Videos?</h3>
                <p className="text-lg leading-relaxed">
                  Your child also gets access to our growing library of enriching, non-personalized videos. Whether you need 3 minutes to make a sandwich or 15 to finish a call, we've got you..
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-2xl h-64 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                <p className="text-gray-500 text-center">Sample video player</p>
              </div>
            </div>
          </div>
        </section>

        {/* Personalization Section */}
        <section className="px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                  The Power of Personalization in Early Literacy
                </h2>
                <div className="space-y-4 text-lg leading-relaxed">
                  <p>
                    Hippo Polka is created by Dr. Carla Engelbrecht, a mom and edtech expert who's built more than 200 educational games, apps, stories, and interactive shows for places like PBS Kids, Sesame Street, Highlights for Children, and Netflix. Her work has helped millions of kids learn through joy, connection, and play. Now, she's bringing the power of personalized entertainment straight to your family.
                  </p>
                  <p>
                    Research shows that when young children see themselves in a story, by name, by interest, or by identity, they're more engaged, retain more language, and feel more confident as learners.
                  </p>
                  <p>
                    Hippo Polka combines that research with the real-life needs of parents: Fast. Meaningful. Guilt-free.
                  </p>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="w-80 h-80 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                  <p className="text-gray-500 text-center">Dr. Carla's headshot</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Start Now Section */}
        <section className="px-8 py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8">
              Start Now for Free
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <p className="text-lg font-semibold">Tell us about your child</p>
                <p className="text-base mt-2">Name, age, interests, and what lights them up.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <p className="text-lg font-semibold">Receive 2 personalized videos each week</p>
                <p className="text-base mt-2">Delivered straight to your inbox and phone.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <p className="text-lg font-semibold">Watch together, learn together</p>
                <p className="text-base mt-2">Every video ends with a built-in transition idea and a short tip for you.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
                <p className="text-lg font-semibold">Explore more</p>
                <p className="text-base mt-2">Unlock access to our full video library for even more literacy-rich fun.</p>
              </div>
            </div>

            <p className="text-xl mb-8 font-semibold">
              See what happens when learning starts with your child's name.
            </p>

            <Link 
              href="/register"
              className="inline-block bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors duration-200"
            >
              Get Started
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