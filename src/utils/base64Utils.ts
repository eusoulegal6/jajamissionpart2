
// Utility functions for handling base64 audio data

export const base64ToAudioBlob = (base64Data: string): Blob => {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64Data.replace(/^data:audio\/[^;]+;base64,/, '');
    
    // Convert base64 to binary
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: 'audio/mpeg' });
  } catch (error) {
    console.error('Error converting base64 to audio blob:', error);
    throw new Error('Failed to convert base64 audio data');
  }
};
