import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Content {
  heading: string;
  body: {
    text: string;
  };
}

interface Post {
  first_publication_date: string | null;
  data: {
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

export default function Post(): JSX.Element {
  return <h1>testr</h1>;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 100,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.slugs[0],
    },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();

  const { slug } = context.params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),

    data: {
      title: RichText.asText(response.data.title),
      author: RichText.asText(response.data.author),
      banner: response.data.banner.url,
      content: response.data.content.map(item => ({
        heading: RichText.asText(item.heading),
        body: item.body.map(e => ({
          text: e.text,
        })),
      })),
    },
  };

  const texts = post.data.content[0].body;

  const wordTotal = texts.reduce(
    (acc, current) => {
      const parsed = current.text.trim().split(' ');

      acc.quantity += parsed.length;

      return acc;
    },
    { quantity: 0 }
  );

  return {
    props: {},
  };
};
