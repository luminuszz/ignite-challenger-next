import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { RichText } from 'prismic-dom';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [isHasMorePages, setIsHasMorePages] = useState(
    !!postsPagination.next_page
  );

  const handleRenderMorePosts = async (): Promise<void> => {
    const response = await fetch(postsPagination.next_page);

    const data = (await response.json()) as ApiSearchResponse;

    const newPosts = data.results.map<Post>(post => ({
      uid: post.slugs[0],
      data: {
        author: RichText.asText(post.data.author),
        subtitle: RichText.asText(post.data.subtitle),
        title: RichText.asText(post.data.title),
      },
      first_publication_date: new Date(
        post.first_publication_date
      ).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    }));

    setPosts(old => [...old, ...newPosts]);
    setIsHasMorePages(!!data.next_page);
  };

  return (
    <>
      <Head>
        <title>Posts</title>
      </Head>

      <main className={styles.container}>
        <header className={styles.header}>
          <img src="/Logo.svg" alt="logo" />
        </header>

        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/posts/${post.uid}`} key={post.uid}>
              <a>
                <h4>{post.data.title}</h4>
                <p>{post.data.subtitle}</p>
                <footer className={styles.footer}>
                  <div>
                    <img src=" /user.svg" alt="calendar" />
                    <p> {post.data.author}</p>
                  </div>

                  <div>
                    <img src="/calendar.svg" alt="author" />
                    <p> {post.first_publication_date}</p>
                  </div>
                </footer>
              </a>
            </Link>
          ))}

          {isHasMorePages && (
            <div className={styles.morePosts}>
              <button type="button" onClick={handleRenderMorePosts}>
                Carregar mais posts
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map<Post>(post => ({
    uid: post.slugs[0],
    data: {
      author: RichText.asText(post.data.author),
      subtitle: RichText.asText(post.data.subtitle),
      title: RichText.asText(post.data.title),
    },
    first_publication_date: new Date(
      post.first_publication_date
    ).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }));

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
