import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/client';

import { query as q } from 'faunadb';

import { fauna } from '../../../services/fauna';

import { stripe } from '../../../services/stripe';

type User = {
  ref: {
    id: string,
  },
  data: {
    stripe_customer_id: string,
  }
}


export default async (req:NextApiRequest, res:NextApiResponse) => {
  const session = await getSession({req});
  if(req.method === 'POST') {
    const user = await fauna.query<User>(
      q.Get(
        q.Match(
          q.Index('user_by_email'),
          q.Casefold(session.user.email)
        )
      )
    )

    let customerId = user.data.stripe_customer_id;

    if(!customerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email,
      })
  
      await fauna.query(
        q.Update(
          q.Ref(q.Collection('users'), user.ref.id),
          {
            data: {
              stripe_customer_id: stripeCustomer.id,
            }
          }
        )
      )

      customerId = stripeCustomer.id;
    }

    const stripeCheckoutSession = await stripe.checkout.sessions.create(({
      customer: customerId,
      success_url: process.env.STRYPE_SUCCESS_URL,
      cancel_url: process.env.STRYPE_CANCEL_URL,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
       line_items: [
        {price: 'price_1JFqYaH7TVuk6me0bixfybjh', quantity: 1},
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
    }));

    return res.status(200).json({ sessionId: stripeCheckoutSession})
  }else {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method not allowed');
  }
}