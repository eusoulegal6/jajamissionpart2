import { VoiceArtist } from '@/types/lesson';

export const VOICE_ARTISTS: Record<string, VoiceArtist> = {
  "Mushira Hussien": {
    name: "Mushira Hussien",
    image: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/images/Musghi_HQ%20(1).png",
    flag: "🇺🇸"
  },
  "Nontu": {
    name: "Nontu", 
    image: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/teachers/nontu.png",
    flag: "🇨🇦"
  },
  "Maudy": {
    name: "Maudy",
    image: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/teachers/maudy.png", 
    flag: "🇨🇦"
  },
  "Annie": {
    name: "Annie",
    image: "https://newhorizonsenglishschool.com/wp-content/uploads/2025/05/annie.jpg",
    flag: "🇺🇸"
  },
  "Chad": {
    name: "Chad",
    image: "/images/chad.jpg",
    flag: "🇺🇸"
  },
  "Hugh": {
    name: "Hugh",
    image: "/images/hugh.jpg",
    flag: "🇨🇦"
  }
};

export const getVoiceArtist = (name: string): VoiceArtist | null => {
  console.log('🔍 Looking for voice artist:', name);
  console.log('📋 Available artists:', Object.keys(VOICE_ARTISTS));
  
  if (!name) return null;
  
  // Try exact match first
  let artist = VOICE_ARTISTS[name];
  if (artist) {
    console.log('✅ Found exact match:', artist);
    return artist;
  }
  
  // Try case-insensitive and trimmed match
  const trimmedName = name.trim();
  const exactKey = Object.keys(VOICE_ARTISTS).find(key => 
    key.toLowerCase().trim() === trimmedName.toLowerCase()
  );
  
  if (exactKey) {
    artist = VOICE_ARTISTS[exactKey];
    console.log('✅ Found case-insensitive match:', artist);
    return artist;
  }
  
  console.log('❌ No voice artist found for name:', name);
  return null;
};

export const getVoiceArtistNames = (): string[] => {
  return Object.keys(VOICE_ARTISTS);
};