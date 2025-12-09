
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const { userId, clubId, creatorId, monthlyPriceCents, currency } = await req.json();

    console.log('Creating subscription:', {
      userId,
      clubId,
      creatorId,
      monthlyPriceCents,
      currency,
    });

    if (!userId || !clubId || !creatorId || !monthlyPriceCents) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;

    if (!email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if customer already exists
    let customerId: string;
    const { data: existingMembership } = await supabase
      .from('creator_club_memberships')
      .select('stripe_customer_id')
      .eq('member_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (existingMembership?.stripe_customer_id) {
      customerId = existingMembership.stripe_customer_id;
      console.log('Using existing customer:', customerId);
    } else {
      // Create Stripe customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email,
          'metadata[user_id]': userId,
        }),
      });

      if (!customerResponse.ok) {
        const error = await customerResponse.text();
        console.error('Stripe customer creation error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const customer = await customerResponse.json();
      customerId = customer.id;
      console.log('✅ Customer created:', customerId);
    }

    // Create price for this subscription
    const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'currency': currency.toLowerCase(),
        'unit_amount': monthlyPriceCents.toString(),
        'recurring[interval]': 'month',
        'product_data[name]': 'Creator Club Membership',
        'metadata[club_id]': clubId,
        'metadata[creator_id]': creatorId,
      }),
    });

    if (!priceResponse.ok) {
      const error = await priceResponse.text();
      console.error('Stripe price creation error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create price' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const price = await priceResponse.json();
    console.log('✅ Price created:', price.id);

    // Create subscription
    const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        'items[0][price]': price.id,
        'metadata[club_id]': clubId,
        'metadata[creator_id]': creatorId,
        'metadata[user_id]': userId,
        'payment_behavior': 'default_incomplete',
        'payment_settings[save_default_payment_method]': 'on_subscription',
        'expand[0]': 'latest_invoice.payment_intent',
      }),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      console.error('Stripe subscription creation error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create subscription' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subscription = await subscriptionResponse.json();
    console.log('✅ Subscription created:', subscription.id);

    // Update membership with Stripe IDs
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    await supabase
      .from('creator_club_memberships')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        renews_at: renewsAt.toISOString(),
        is_active: true,
      })
      .eq('club_id', clubId)
      .eq('member_id', userId);

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        customerId: customerId,
        status: subscription.status,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
