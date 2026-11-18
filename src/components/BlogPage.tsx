import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { BlogPost } from '../types/store';

interface BlogPageProps {
  posts: BlogPost[];
  initialSlug?: string;
}

export function BlogPage({ posts, initialSlug }: BlogPageProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug || null);
  const selectedPost = posts.find((p) => p.slug === activeSlug);

  if (selectedPost) {
    return (
      <div className="bg-[#FDF8F5]">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          <button
            type="button"
            onClick={() => setActiveSlug(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#EFE4DE] text-xs font-semibold text-[#6F4E42] hover:bg-[#FDEEF4] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Todos os artigos</span>
          </button>

          <header className="space-y-3">
            <p className="text-xs text-[#725B53] flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#FDEEF4] font-bold text-[#8C4B68]">
                {selectedPost.category}
              </span>
              <span>{selectedPost.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedPost.readTime}</span>
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3D2A24] leading-tight">
              {selectedPost.title}
            </h1>
          </header>

          <div className="rounded-3xl overflow-hidden border border-[#EFE4DE] bg-white soft-card-shadow">
            <img
              src={selectedPost.coverImage}
              alt={selectedPost.title}
              referrerPolicy="no-referrer"
              className="w-full aspect-[16/9] object-cover"
            />
          </div>

          <div className="bg-white border border-[#EFE4DE] rounded-3xl p-6 sm:p-8 soft-card-shadow space-y-4 text-base text-[#3D2A24] leading-relaxed whitespace-pre-line">
            {selectedPost.content}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="bg-[#FDF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div>
          <p className="font-script text-2xl text-[#6F4E42] leading-none">
            Conteúdo educativo
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3D2A24] mt-1">
            Caderno de Ideias da Prof
          </h1>
          <p className="text-sm text-[#725B53] mt-1.5">
            Sugestões práticas de aplicação para sala de aula, consultório e rotina familiar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {posts
            .filter((p) => p.published)
            .map((post) => (
              <article
                key={post.id}
                className="group bg-white border border-[#EFE4DE] rounded-3xl overflow-hidden flex flex-col soft-card-shadow soft-card-shadow-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-[#FAF3EE] overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-[#725B53] flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FDEEF4] font-bold text-[#8C4B68]">
                        {post.category}
                      </span>
                      <span>{post.readTime}</span>
                    </p>
                    <h2 className="font-display text-lg font-bold text-[#3D2A24] leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-sm text-[#725B53] line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSlug(post.slug)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6F4E42] hover:underline self-start"
                  >
                    <span>Ler artigo</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}
