import { GetStaticProps } from 'next';
import Head from 'next/head';

//client-serve dentro do component
//server-side GetServerSideProps from next = SSR
//statice site generation GetStaticProps from next = SSG

import styles from './home.module.scss';
import {SubscribeButton} from '../components/SubscribeButton/index';
import { stripe } from '../services/stripe';

interface HomeProps {
  product: {
    priceId: string;
    amount: string;
  }
}

export default function Home({ product } : HomeProps) {
  return (
    <>
    <Head>
      <title>Home | Ig.news</title>
    </Head>
    <main className={styles.contentContainer}>
      <section className={styles.hero}>
          <span>👏 Hey, welcome</span>

          <h1>new about the <span>React</span> world.</h1>

          <p>
            Get access to all the publications <br />
            <span>for {product.amount} month</span>
          </p>

          <SubscribeButton/>
      </section>

      <img src="/images/avatar.svg" alt="Girl coding" />
    </main>
    </>
  )
}

//export const getServerSideProps: GetServerSideProps = async () => {
  export const getStaticProps: GetStaticProps = async () => {
  const price = await stripe.prices.retrieve('price_1JFqYaH7TVuk6me0bixfybjh', {
    expand: ['product']
  });

  return{
    props:{
      product:{
        priceId: price.id,
        amount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(price.unit_amount / 100),
      }
    },
    revalidate: 60 * 60 * 24, // 24 hours
  }
}
