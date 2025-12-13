import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { supabaseAdmin } from './supabase-admin';

const expo = new Expo();

export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  try {
    // 1. Get user's push token
    const { data: devices, error } = await supabaseAdmin
      .from('user_devices')
      .select('push_token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !devices || devices.length === 0) {
      console.log('No active devices found for user', userId);
      return;
    }

    const messages: ExpoPushMessage[] = [];

    for (const device of devices) {
      if (!Expo.isExpoPushToken(device.push_token)) {
        console.error(`Push token ${device.push_token} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: device.push_token,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
    
    // Log results (optional)
    console.log('Push notifications sent:', tickets);

  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
