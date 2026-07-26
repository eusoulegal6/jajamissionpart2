import React from "react";
import { CompressibleImage } from "@/components/CompressibleImage";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DEMO_IMAGES = [
  {
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_45_49%20PM%20(1).png",
    label: "Food & Drinks Lesson 1",
  },
  {
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_47_33%20PM%20(1).png",
    label: "Food & Drinks Lesson 2",
  },
  {
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_49_27%20PM%20(1).png",
    label: "Lesson 2",
  },
  {
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/c/rel.png",
    label: "Audio Flashcards Icon",
  },
  {
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/images/ETS_Logo%20(1).png",
    label: "TOEFL Logo",
  },
  {
    url: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2007_46_45%20PM%20(1).png",
    label: "PNL Image",
  },
];

export default function CompressImageDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            Image Compression Demo
          </h1>
          <p className="text-slate-600 mt-2">
            Click "Compress image" on any image below to optimize it via TinyPNG.
            The compressed version will be stored in the compressed-images bucket.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {DEMO_IMAGES.map((img, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
            >
              <h3 className="font-semibold text-slate-800 mb-3">{img.label}</h3>
              <CompressibleImage
                src={img.url}
                alt={img.label}
                className="w-full h-auto rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
