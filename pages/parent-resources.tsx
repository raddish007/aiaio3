import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ParentResourcesPage() {
  return (
    <>
      <Head>
        <title>Parent Resources - Supporting Your Child's Early Literacy</title>
        <meta name="description" content="Resources and tips for supporting your child's early literacy development" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-2xl font-bold text-gray-900">Parent Resources</h1>
              
              <nav className="flex items-center space-x-6">
                <Link 
                  href="/demo-andrew" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Demo Videos
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="prose max-w-none">
            <h1 className="text-4xl font-bold text-black mb-8">Supporting Your Child's Early Literacy</h1>
            
            <p className="text-lg text-black leading-relaxed mb-6">
              Helping your child learn to read doesn't mean flashcards or long lessons—it means noticing letters on a cereal box, singing their name in the car, and turning everyday moments into joyful, shared experiences. The foundation of literacy is built through connection, repetition, and play, especially in the early years.
            </p>

            <p className="text-lg text-black leading-relaxed mb-8">
              Every video in this series is designed to spark curiosity, introduce foundational skills, and give you fun ways to keep the learning going long after the screen turns off.
            </p>

            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">Why Video?</h2>
            
            <p className="text-lg text-black leading-relaxed mb-4">
              Think of video as a starting point, not a substitute. These short, personalized videos are designed to:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2 text-lg text-black">
              <li>Introduce letters, words, and concepts in playful, familiar ways</li>
              <li>Connect to your child's interests and routines</li>
              <li>Invite you to join in, pause, and build on what you see together</li>
            </ul>

            <p className="text-lg text-black leading-relaxed mb-8">
              The real magic happens when you bring the ideas into your everyday life—no special materials or prep required.
            </p>

            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">Extension Ideas by Video</h2>

            <div className="space-y-8">
              <div className="border-l-4 border-gray-300 pl-6">
                <h3 className="text-xl font-bold text-black mb-3">1. Letter Hunt</h3>
                <p className="text-base text-black mb-3">
                  <strong>What it teaches:</strong> Visual recognition of the first letter of your child's name in different settings
                </p>
                <p className="text-base text-black mb-2"><strong>Try this:</strong></p>
                <p className="text-base text-black leading-relaxed">
                  Look for your child's special letter on signs, food packages, or book covers. Each time they find one, do a "letter dance" together! This builds recognition across contexts, a key skill in early reading.
                </p>
              </div>

              <div className="border-l-4 border-gray-300 pl-6">
                <h3 className="text-xl font-bold text-black mb-3">2. Name Song</h3>
                <p className="text-base text-black mb-3">
                  <strong>What it teaches:</strong> Letter identification and name recognition
                </p>
                <p className="text-base text-black mb-2"><strong>Try this:</strong></p>
                <p className="text-base text-black leading-relaxed">
                  Cut out letters from magazines or ads and help your child make a name collage. Seeing their name in different fonts boosts print awareness—and pride in learning to read something so personal.
                </p>
              </div>

              <div className="border-l-4 border-gray-300 pl-6">
                <h3 className="text-xl font-bold text-black mb-3">3. Sleepy Song</h3>
                <p className="text-base text-black mb-3">
                  <strong>What it teaches:</strong> Language patterns, routines, emotional connection
                </p>
                <p className="text-base text-black mb-2"><strong>Try this:</strong></p>
                <p className="text-base text-black leading-relaxed">
                  As part of your bedtime routine, say goodnight to the same characters from the video—"Goodnight, dino," "Goodnight, skeleton." Predictable phrasing and repetition help build language memory and emotional security.
                </p>
              </div>

              <div className="border-l-4 border-gray-300 pl-6">
                <h3 className="text-xl font-bold text-black mb-3">4. Positional Words</h3>
                <p className="text-base text-black mb-3">
                  <strong>What it teaches:</strong> Spatial language (on, under, next to), comprehension, and listening
                </p>
                <p className="text-base text-black mb-2"><strong>Try this:</strong></p>
                <p className="text-base text-black leading-relaxed">
                  Grab a box and a stuffed animal and let your child give the directions—"Put it under the box!" Acting it out turns abstract words into something they can see and do, reinforcing comprehension through play.
                </p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-base text-black leading-relaxed">
                Remember: The goal isn't perfection—it's connection. Every small moment of shared discovery builds your child's confidence and love of learning. You're already doing more than you know.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
