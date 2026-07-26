export interface StaticImageEntry {
  id: string;
  description?: string;
  url: string;
}

export const STATIC_IMAGES: StaticImageEntry[] = [
  // === Supabase Lesson Images (pows bucket) ===
  {
    id: "food-drinks-lesson-1",
    description: "Food & Drinks Lesson 1 image",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_45_49%20PM%20(1).png",
  },
  {
    id: "food-drinks-lesson-2",
    description: "Food & Drinks Lesson 2 image",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_47_33%20PM%20(1).png",
  },
  {
    id: "lesson-2-breakfast",
    description: "Lesson 2 Breakfast & Preferences",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_49_27%20PM%20(1).png",
  },
  {
    id: "lesson-2-page-2",
    description: "Lesson 2 Page 2 image",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_51_07%20PM%20(1).png",
  },
  {
    id: "lesson-3-meals",
    description: "Lesson 3 Meals & Preferences",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_53_26%20PM%20(1).png",
  },
  {
    id: "lesson-4-languages",
    description: "Lesson 4 Languages & Study",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2005_09_17%20PM%20(1).png",
  },
  {
    id: "lesson-4-page-2",
    description: "Lesson 4 Page 2 image",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2005_12_38%20PM%20(1).png",
  },
  {
    id: "lesson-5-countries",
    description: "Lesson 5 Live, Study & Countries",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2006_21_37%20PM%20(1).png",
  },
  {
    id: "lesson-5-page-2",
    description: "Lesson 5 Page 2 image (Gemini)",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/Gemini_Generated_Image_524ock524ock524o%20(1).png",
  },
  {
    id: "lesson-3-page-2",
    description: "Lesson 3 Page 2 image (Gemini)",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/Gemini_Generated_Image_s8s5rrs8s5rrs8s5%20(1)%20(1).png",
  },
  {
    id: "lesson-6-family",
    description: "Lesson 6 Family, Work & Travel",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/Gemini_Generated_Image_npqbpvnpqbpvnpqb%20(1).png",
  },
  {
    id: "lesson-6-page-2",
    description: "Lesson 6 Page 2 image (Gemini)",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/Gemini_Generated_Image_1t6vgr1t6vgr1t6v%20(1).png",
  },
  {
    id: "pnl-image",
    description: "PNL slides image",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2007_46_45%20PM%20(1).png",
  },

  // === HomeScreen icons ===
  {
    id: "audio-flashcards-icon",
    description: "Audio Flashcards icon (rel.png)",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/c/rel.png",
  },
  {
    id: "toefl-logo",
    description: "TOEFL / ETS Logo",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/images/ETS_Logo%20(1).png",
  },
  {
    id: "curso-completo-icon",
    description: "Curso Completo icon",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/c/5779405.png",
  },

  // === Voice Artists (teachers) ===
  {
    id: "voice-artist-mushira",
    description: "Mushira Hussien voice artist photo",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/images/Musghi_HQ%20(1).png",
  },
  {
    id: "voice-artist-nontu",
    description: "Nontu voice artist photo",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/teachers/nontu.png",
  },
  {
    id: "voice-artist-maudy",
    description: "Maudy voice artist photo",
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/teachers/maudy.png",
  },

  // === External images (Annie voice artist) ===
  {
    id: "voice-artist-annie",
    description: "Annie voice artist photo (external)",
    url: "https://newhorizonsenglishschool.com/wp-content/uploads/2025/05/annie.jpg",
  },

  // === Unsplash demo images ===
  {
    id: "unsplash-demo-1",
    description: "Demo content image 1 (Unsplash)",
    url: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800",
  },
  {
    id: "unsplash-demo-2",
    description: "Demo content image 2 (Unsplash)",
    url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800",
  },

  // === Role-play scenario images (lovable-uploads) ===
  {
    id: "roleplay-restaurante",
    description: "Pedindo comida em um restaurante",
    url: "/lovable-uploads/a68bf82c-eb4c-4380-bbec-e8e1527fc2f6.png",
  },
  {
    id: "roleplay-hotel",
    description: "Fazendo check-in em um hotel",
    url: "/lovable-uploads/9e883479-caef-491b-b300-2ca01457d1e3.png",
  },
  {
    id: "roleplay-conhecendo",
    description: "Conhecendo alguém novo",
    url: "/lovable-uploads/86f4f001-ba07-4cfa-bf48-77095857dfe1.png",
  },
  {
    id: "roleplay-roupas",
    description: "Comprando roupas em uma loja",
    url: "/lovable-uploads/82276f08-08ee-40c9-9b60-e39a0281dc8d.png",
  },
  {
    id: "roleplay-aeroporto",
    description: "Resolvendo um problema no aeroporto",
    url: "/lovable-uploads/c9cd7c2d-5f51-4a4b-87b0-808eebc87dba.png",
  },
  {
    id: "roleplay-informacao",
    description: "Pedindo informação na rua",
    url: "/lovable-uploads/252c22bd-747f-49ab-b72b-ba72241df587.png",
  },
  {
    id: "roleplay-cultura",
    description: "Conversando sobre cultura brasileira",
    url: "/lovable-uploads/a39ba523-30a0-4818-b278-bd008ff209a8.png",
  },
  {
    id: "roleplay-reuniao",
    description: "Participando de uma reunião de trabalho",
    url: "/lovable-uploads/eb44e6a5-e675-464b-9aad-2d703558a5c4.png",
  },
  {
    id: "roleplay-passeio",
    description: "Fazendo um passeio com alguém novo",
    url: "/lovable-uploads/4d31893c-2dc1-4fde-9bfd-1e0e0be8edde.png",
  },

  // === HomeScreen menu icons (lovable-uploads) ===
  {
    id: "tutor-virtual-logo",
    description: "Tutor Virtual main logo",
    url: "/lovable-uploads/27a9e05b-01c1-4f55-9cc2-6f5e6758c158.png",
  },
  {
    id: "tutor-virtual-logo-2",
    description: "Tutor Virtual secondary logo",
    url: "/lovable-uploads/fd26bb69-cb53-49fe-95d0-fa9a31c08976.png",
  },
  {
    id: "tutorial-icon",
    description: "Tutorial menu icon",
    url: "/lovable-uploads/357aec70-5e1c-49ea-a612-aae2b59f98d3.png",
  },
  {
    id: "books-icon",
    description: "Lições Completas / Books icon",
    url: "/lovable-uploads/8cefaa7d-f6b6-44e6-845c-3142e001cd09.png",
  },
  {
    id: "question-icon",
    description: "Pergunte ao professor icon",
    url: "/lovable-uploads/8fb056c5-eff7-4a39-a6a5-a715bf7d5bbe.png",
  },
  {
    id: "chat-icon",
    description: "Prática de conversação icon",
    url: "/lovable-uploads/a1bf6644-92da-4ed0-9da9-c34382604b7c.png",
  },
  {
    id: "content-icon",
    description: "Conteúdo icon",
    url: "/lovable-uploads/6ca0809f-bb35-458b-9f7f-a4a88fe3d76e.png",
  },
  {
    id: "briefcase-icon",
    description: "Entrevista de emprego icon",
    url: "/lovable-uploads/e85a76b3-d1d4-41b2-9695-c38f8c500b41.png",
  },
  {
    id: "quiz-icon",
    description: "Quiz icon",
    url: "/lovable-uploads/quiz-icon.png",
  },
  {
    id: "headphones-icon",
    description: "Prática de escuta / Headphones icon",
    url: "/lovable-uploads/16005237-1509-4d95-adc0-01010196e5f5.png",
  },
  {
    id: "questions-icon",
    description: "Perguntas icon",
    url: "/lovable-uploads/366d67d6-53af-4a58-935d-5443882eb8ff.png",
  },
  {
    id: "roleplay-icon",
    description: "Simulação / Role Play icon",
    url: "/lovable-uploads/ca8effea-3d23-4b67-ace1-a9c2256cc58e.png",
  },
  {
    id: "private-lessons-icon",
    description: "Aulas particulares icon",
    url: "/lovable-uploads/8772b1a6-925c-4a0b-bcc6-083cb8a79c3d.png",
  },

  // === Other lovable-uploads images found ===
  {
    id: "upload-00c1aa71",
    description: "Lovable upload image",
    url: "/lovable-uploads/00c1aa71-6381-4e1b-8756-ccdf8d6e88f7.png",
  },
  {
    id: "upload-0c206ebd",
    description: "Lovable upload image",
    url: "/lovable-uploads/0c206ebd-e2a8-46d4-a111-a4806c35a226.png",
  },
  {
    id: "upload-0c2a3d8f",
    description: "Lovable upload image",
    url: "/lovable-uploads/0c2a3d8f-8cb6-4729-bc09-18726ed268ee.png",
  },
  {
    id: "upload-2ec8899c",
    description: "Lovable upload image",
    url: "/lovable-uploads/2ec8899c-17b7-47a4-9ce6-134bfff996be.png",
  },
  {
    id: "upload-3f53c167",
    description: "Lovable upload image",
    url: "/lovable-uploads/3f53c167-f664-4ad2-ad04-74b89837d6ac.png",
  },
  {
    id: "upload-4bed8bef",
    description: "Lovable upload image",
    url: "/lovable-uploads/4bed8bef-5a0f-43f9-a482-7a1fb903e9ab.png",
  },
  {
    id: "upload-4ee6fe6a",
    description: "Lovable upload image",
    url: "/lovable-uploads/4ee6fe6a-45f0-47a2-a5f3-e53c8c9ddbc4.png",
  },
  {
    id: "upload-5faa929e",
    description: "Lovable upload image",
    url: "/lovable-uploads/5faa929e-7341-4eb4-9ee3-3503964850fc.png",
  },
  {
    id: "upload-6bd4a1ef",
    description: "Lovable upload image",
    url: "/lovable-uploads/6bd4a1ef-5908-4c0e-a061-a684c421433d.png",
  },
  {
    id: "upload-74718599",
    description: "Lovable upload image",
    url: "/lovable-uploads/74718599-c509-4db8-801e-12d543851f06.png",
  },
  {
    id: "upload-93246f36",
    description: "Lovable upload image",
    url: "/lovable-uploads/93246f36-db8a-40e7-acf0-55f534ae4baf.png",
  },
  {
    id: "upload-b0fa3a04",
    description: "Lovable upload image",
    url: "/lovable-uploads/b0fa3a04-a542-4277-9557-54154560c976.png",
  },
  {
    id: "upload-d1f745a9",
    description: "Lovable upload image",
    url: "/lovable-uploads/d1f745a9-80ec-4a72-8f47-77d2e872d135.png",
  },
  {
    id: "upload-d947f73c",
    description: "Lovable upload image",
    url: "/lovable-uploads/d947f73c-6c6d-469e-a100-cddb94497b05.png",
  },
  {
    id: "upload-e6476c19",
    description: "Lovable upload image",
    url: "/lovable-uploads/e6476c19-e289-4a22-871f-2a800c559128.png",
  },
  {
    id: "upload-ee17148f",
    description: "Lovable upload image",
    url: "/lovable-uploads/ee17148f-42bc-4604-b957-e1eef4503b88.png",
  },
];
