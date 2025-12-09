
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
  livestream_id?: string;
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
 * Purchase a gift for another user during a livestream
 * This will:
 * 1. Check if sender has sufficient balance
 * 2. Deduct the cost from sender's wallet
 * 3. Add the amount to receiver's wallet
 * 4. Create transaction records for both users
 * 5. Create a gift event record
 * 6. Broadcast the gift event to all viewers
 */
export async function purchaseGift(
  giftId: string,
  senderId: string,
  receiverId: string,
  livestreamId?: string
): Promise<{ success: boolean; error?: string; giftEvent?: any }> {
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
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', senderId)
      .single();

    if (senderWalletError || !senderWallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const senderBalance = parseFloat(senderWallet.balance);
    const giftPrice = gift.price_sek;

    // Check if sender has sufficient balance
    if (senderBalance < giftPrice) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Fetch receiver's wallet (or create if doesn't exist)
    let { data: receiverWallet, error: receiverWalletError } = await supabase
      .from('wallet')
      .select('balance')
      .eq('user_id', receiverId)
      .single();

    if (receiverWalletError || !receiverWallet) {
      // Create wallet for receiver if it doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('wallet')
        .insert({ user_id: receiverId, balance: 0 })
        .select('balance')
        .single();

      if (createError || !newWallet) {
        return { success: false, error: 'Failed to create receiver wallet' };
      }
      receiverWallet = newWallet;
    }

    const receiverBalance = parseFloat(receiverWallet.balance);

    // Deduct from sender's wallet
    const { error: updateSenderWalletError } = await supabase
      .from('wallet')
      .update({
        balance: senderBalance - giftPrice,
        last_updated: new Date().toISOString(),
      })
      .eq('user_id', senderId);

    if (updateSenderWalletError) {
      console.error('Error updating sender wallet:', updateSenderWalletError);
      return { success: false, error: 'Failed to update sender wallet' };
    }

    // Add to receiver's wallet
    const { error: updateReceiverWalletError } = await supabase
      .from('wallet')
      .update({
        balance: receiverBalance + giftPrice,
        last_updated: new Date().toISOString(),
      })
      .eq('user_id', receiverId);

    if (updateReceiverWalletError) {
      console.error('Error updating receiver wallet:', updateReceiverWalletError);
      // Rollback sender wallet update
      await supabase
        .from('wallet')
        .update({
          balance: senderBalance,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', senderId);
      return { success: false, error: 'Failed to update receiver wallet' };
    }

    // Create transaction record for sender (deduction)
    const { error: senderTransactionError } = await supabase.from('transactions').insert({
      user_id: senderId,
      amount: -giftPrice,
      type: 'gift_purchase',
      payment_method: 'wallet',
      source: 'gift_purchase',
      status: 'completed',
    });

    if (senderTransactionError) {
      console.error('Error creating sender transaction:', senderTransactionError);
    }

    // Create transaction record for receiver (addition)
    const { error: receiverTransactionError } = await supabase.from('transactions').insert({
      user_id: receiverId,
      amount: giftPrice,
      type: 'creator_tip',
      payment_method: 'wallet',
      source: 'gift_purchase',
      status: 'completed',
    });

    if (receiverTransactionError) {
      console.error('Error creating receiver transaction:', receiverTransactionError);
    }

    // Fetch sender info for the gift event
    const { data: senderInfo } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', senderId)
      .single();

    // Create gift event record
    const { data: giftEventData, error: giftEventError } = await supabase
      .from('gift_events')
      .insert({
        sender_user_id: senderId,
        receiver_user_id: receiverId,
        gift_id: giftId,
        price_sek: giftPrice,
        livestream_id: livestreamId,
      })
      .select('*')
      .single();

    if (giftEventError) {
      console.error('Error creating gift event:', giftEventError);
      return { success: false, error: 'Failed to record gift event' };
    }

    // Return gift event with additional info for broadcasting
    const giftEventWithInfo = {
      ...giftEventData,
      gift,
      sender_username: senderInfo?.display_name || senderInfo?.username || 'Anonymous',
    };

    return { success: true, giftEvent: giftEventWithInfo };
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

/**
 * Get gift tier based on price
 */
export function getGiftTier(price: number): 'cheap' | 'medium' | 'high' {
  if (price <= 20) return 'cheap';
  if (price <= 500) return 'medium';
  return 'high';
}
