// Test script to verify the letter deduplication logic
const nameToTest = 'Christopher';

// Simulate the getLettersArray function
function getLettersArray(childName) {
  if (!childName) return [];
  const letters = childName.toUpperCase().split('');
  return letters.filter((letter, index) => letters.indexOf(letter) === index);
}

// Simulate the payload initialization logic  
function simulatePayloadInit(nameToUse) {
  const allLetters = nameToUse.toUpperCase().split('');
  const letters = allLetters.filter((letter, index) => allLetters.indexOf(letter) === index);
  
  console.log(`\n=== Testing for name: ${nameToUse} ===`);
  console.log('All letters (with duplicates):', allLetters);
  console.log('Unique letters (for assets):', letters);
  console.log('getLettersArray() result:', getLettersArray(nameToUse));
  
  // Simulate letter audio assets creation
  const letterAudios = {};
  letters.forEach(letter => {
    letterAudios[letter] = {
      type: 'audio',
      name: `Letter ${letter} Audio`,
      status: 'ready',
      url: `https://example.com/audio/${letter}.mp3`
    };
  });
  
  console.log('Letter audio assets created:', Object.keys(letterAudios));
  
  // Simulate video generation - check if all letters have audio
  const missingAudio = [];
  allLetters.forEach(letter => {
    if (!letterAudios[letter]) {
      missingAudio.push(letter);
    }
  });
  
  console.log('Missing audio for video generation:', missingAudio.length === 0 ? 'None (✅)' : missingAudio);
  
  // Simulate React key generation
  const reactKeys = getLettersArray(nameToUse);
  const duplicateKeys = reactKeys.filter((key, index) => reactKeys.indexOf(key) !== index);
  console.log('React key duplicates:', duplicateKeys.length === 0 ? 'None (✅)' : duplicateKeys);
}

// Test with Christopher
simulatePayloadInit('Christopher');

// Test with other names
simulatePayloadInit('Anna');
simulatePayloadInit('Bob');
simulatePayloadInit('Mississippi');
