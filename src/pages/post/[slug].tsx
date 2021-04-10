import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { ptBR } from 'date-fns/locale';
import Head from 'next/head';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  uid: string;
  data: {
    subtitle: string;
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  const totalOfWords = post.data.content.reduce(
    (accumulator, current) => {
      const parsedBody = RichText.asText(current.body);

      const extractWords = parsedBody.trim().split(' ');

      accumulator.quantity += extractWords.length;

      return accumulator;
    },
    {
      quantity: 0,
    }
  );

  const timeForLearn = Math.ceil(totalOfWords.quantity / 200);

  if (isFallback) {
    return <h1>Carregando...</h1>;
  }

  const createdAt = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>

      <div className={styles.navbar}>
        <Header />
      </div>

      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>

      <main className={styles.container}>
        <article className={styles.post}>
          <h4>{post.data.title}</h4>
          <div className={styles.information}>
            <div>
              <FiCalendar />
              <time>{createdAt}</time>
            </div>

            <div>
              <FiUser />
              <p>{post.data.author}</p>
            </div>

            <div>
              <FiClock />
              <span>{`${timeForLearn} min`}</span>
            </div>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map((content, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={`${index}`}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 100,
    }
  );

  return {
    paths: posts.results.map(post => ({
      params: {
        slug: post.uid,
      },
    })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();

  const { slug } = context.params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      subtitle: response.data.subtitle,
      title: response.data.title,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };
  return {
    props: {
      post,
    },
  };
};
