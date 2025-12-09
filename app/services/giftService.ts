
import { supabase } from '@/app/integrations/supabase/client';

export interface Gift {
  id: string;
  name: string;
  description: string;
  price_sek: number;
  icon_url: string | null;
  animation_url: string | null;
  created_at?: string;
}

export interface GiftEvent {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  gift_id: string;
  price_sek: number;
  created_at: string;
}

/**
 * Fetch all available gifts
 */
export async function fetchGifts(): Promise<{ data: Gift[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .order('price_sek', { ascending: true });

    return { data, error };
  } catch (error) {
    console.error('Error fetching gifts:', error);
    return { data: null, error };
  }
}

/**
 * Purchase a gift for another user
 * This will:
 * 1. Check if sender has sufficient balance
 * 2. Deduct the cost from sender's wallet
 * 3. Create a transaction record
 * 4. Create a gift event record
 */
export async function purchaseGift(
  giftId: string,
  senderId: string,
  receiverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch gift details
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .single();

    if (giftError || !gift) {
      return { success: false, error: 'Gift not found' };
    }

    // Fetch sender's wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', senderId)
      .single();

    if (walletError || !wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const currentBalance = parseFloat(wallet.balance);
    const giftPrice = gift.price_sek;

    // Check if sender has sufficient balance
    if (currentBalance < giftPrice) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Deduct from sender's wallet
    const { error: updateWalletError } = await supabase
      .from('wallet')
      .update({
        balance: currentBalance - giftPrice,
        last_updated: new Date().toISOString(),
      })
      .eq('user_id', senderId);

    if (updateWalletError) {
      console.error('Error updating wallet:', updateWalletError);
      return { success: false, error: 'Failed to update wallet' };
    }

    // Create transaction record
    const { error: transactionError } = await supabase.from('transactions').insert({
      user_id: senderId,
      amount: -giftPrice,
      type: 'gift_purchase',
      payment_method: 'wallet',
      source: 'gift_purchase',
      status: 'completed',
    });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Attempt to rollback wallet update
      await supabase
        .from('wallet')
        .update({
          balance: currentBalance,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', senderId);
      return { success: false, error: 'Failed to create transaction' };
    }

    // Create gift event record
    const { error: giftEventError } = await supabase.from('gift_events').insert({
      sender_user_id: senderId,
      receiver_user_id: receiverId,
      gift_id: giftId,
      price_sek: giftPrice,
    });

    if (giftEventError) {
      console.error('Error creating gift event:', giftEventError);
      return { success: false, error: 'Failed to record gift event' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in purchaseGift:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch gift events for a user (sent or received)
 */
export async function fetchGiftEvents(
  userId: string,
  type: 'sent' | 'received'
): Promise<{ data: any[] | null; error: any }> {
  try {
    const column = type === 'sent' ? 'sender_user_id' : 'receiver_user_id';
    
    const { data, error } = await supabase
      .from('gift_events')
      .select(`
        *,
        gift:gifts(*),
        sender:sender_user_id(username, display_name, avatar_url),
        receiver:receiver_user_id(username, display_name, avatar_url)
      `)
      .eq(column, userId)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error fetching gift events:', error);
    return { data: null, error };
  }
}
