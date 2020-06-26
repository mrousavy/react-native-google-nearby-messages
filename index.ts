import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { useEffect, useState, useCallback } from 'react';

const { GoogleNearbyMessages } = NativeModules;
const nearbyEventEmitter = new NativeEventEmitter(GoogleNearbyMessages);

export type ErrorType = 'BLUETOOTH_ERROR' | 'PERMISSION_ERROR' | 'MESSAGE_NO_DATA_ERROR';
export type EventType = 'MESSAGE_FOUND' | 'MESSAGE_LOST' | ErrorType;
export type DiscoveryMode = 'broadcast' | 'scan';
export type DiscoveryMedium = 'ble' | 'audio';
export type DiscoveryMediumAndroid = 'bluetooth' | 'default' | 'none';
interface BridgeMessageEvent {
  message?: string;
}
interface BridgeErrorEvent {
  message?: string;
}

/**
 * Initialize and connect the Google Nearby Messages API
 * @param apiKey The Google API key to use (only required on iOS) - @see https://console.developers.google.com/flows/enableapi?apiid=copresence&keyType=CLIENT_SIDE_IOS&reusekey=true
 * @returns An unsubscriber function to disconnect the Google Nearby Messages API
 * @example
 * const disconnect = await connect();
 * // ...
 * disconnect();
 */
export async function connect(apiKey?: string): Promise<() => void> {
  if (Platform.OS === 'ios' && apiKey == null) throw new Error('API Key is required on iOS!');
  await GoogleNearbyMessages.connect(apiKey);
  if (discoveryModes == null || discoveryModes.length === 0) {
    discoveryModes = ['broadcast', 'scan'];
  }
  if (discoveryMediums == null || discoveryMediums.length === 0) {
    discoveryMediums = ['ble'];
  }
  if (Platform.OS === 'ios') {
    if (apiKey == null) throw new Error('API Key is required on iOS!');
    // API Key only required on iOS
    await GoogleNearbyMessages.connect(apiKey, discoveryModes, discoveryMediums);
  } else {
    await GoogleNearbyMessages.connect(discoveryModes, discoveryMediums);
  }
  return () => GoogleNearbyMessages.disconnect();
}

/**
 * Disconnect the Google Nearby Messages API. Also removes any existing subscriptions or publications.
 */
export function disconnect(): void {
  GoogleNearbyMessages.disconnect();
}

/**
 * Subscribe to nearby message events. Use onMessageFound and onMessageLost to receive callbacks for found and lost messages. Always call unsubscribe() to stop publishing.
  * @param onMessageFound (Optional) A function to call when a new message has been found
  * @param onMessageLost  (Optional) A function to call when an existing message has been lost
 *  @returns A function to unsubscribe the subscription and the event emitters if supplied.
 *  @example
 *  const unsubscribe = await subscribe(
 *      (m) => console.log(`found: ${m}`),
 *      (m) => console.log(`lost: ${m}`)
 *  );
 *  // ...
 *  unsubscribe();
 */
export async function subscribe(onMessageFound?: (message?: string) => void, onMessageLost?: (message?: string) => void): Promise<() => void> {
  await GoogleNearbyMessages.subscribe();
  const onMessageFoundUnsubscribe = onMessageFound ? onEvent('MESSAGE_FOUND', onMessageFound) : undefined;
  const onMessageLostUnsubscribe = onMessageLost ? onEvent('MESSAGE_LOST', onMessageLost) : undefined;
  return () => {
    if (onMessageFoundUnsubscribe) onMessageFoundUnsubscribe();
    if (onMessageLostUnsubscribe) onMessageLostUnsubscribe();
    unsubscribe();
  };
}

/**
 * Unsubscribe the current subscription.
 */
export function unsubscribe(): void {
  GoogleNearbyMessages.unsubscribe();
}

/**
 * Publish/Broadcast a new message. Always call unpublish() to stop publishing.
 * @param message The message to broadcast.
 * @returns An unsubscriber function to unpublish the currently published message.
 * @example
 * const unpublish = await publish('test');
 * // ...
 * unpublish();
 */
export async function publish(message: string): Promise<() => void> {
  await GoogleNearbyMessages.publish(message);
  return () => unpublish();
}

/**
 * Stop publishing the last message. Can only call after @see publish has been called.
 */
export function unpublish(): void {
  GoogleNearbyMessages.unpublish();
}

/**
 * Checks if the app is allowed to use the Bluetooth API.
 *
 * **On Android**, this function checks if both `BLUETOOTH` and `BLUETOOTH_ADMIN` permissions are granted in the ContextCompat.
 *
 * **On iOS**, this function checks if the User has given Bluetooth Permission using the CoreBluetooth API (`CBManager.authorization`). If not yet asked, a "grant permission?" dialog will pop up.
 */
export function checkBluetoothPermission(): Promise<boolean> {
  return GoogleNearbyMessages.checkBluetoothPermission();
}

/**
 * Checks if the device supports the Bluetooth operations required by Google Nearby Messages (BLE Publishing and Subscribing)
 *
 * **On Android**, this function checks if a `BluetoothAdapter` can be found, and if the Google Play Services are available (required for Google Nearby API).
 *
 * **On iOS**, this function powers on the `CBCentralManager` and returns `true` if it was successfully turned on. If no callback was sent within `10` seconds, a timeout error will be thrown.
 */
export function checkBluetoothAvailability(): Promise<boolean> {
  return GoogleNearbyMessages.checkBluetoothAvailability();
}

/**
 * Subscribe to any errors.
 * @param callback The function to call when an error occurs. `kind` is the Error Type. e.g.: User turns Bluetooth off, callback gets called with ('BLUETOOTH_ERROR', true). When the User turns Bluetooth back on, callback gets called again with ('BLUETOOTH_ERROR', false).
 */
export function addOnErrorListener(callback: (kind: ErrorType, message?: string) => void): () => void {
  const bluetoothErrorUnsubscribe = onErrorEvent('BLUETOOTH_ERROR', (m) => callback('BLUETOOTH_ERROR', m));
  const permissionErrorUnsubscribe = onErrorEvent('PERMISSION_ERROR', (m) => callback('PERMISSION_ERROR', m));
  const messageNoDataErrorUnsubscribe = onErrorEvent('MESSAGE_NO_DATA_ERROR', (m) => callback('MESSAGE_NO_DATA_ERROR', m));
  return () => {
    bluetoothErrorUnsubscribe();
    permissionErrorUnsubscribe();
    messageNoDataErrorUnsubscribe();
  };
}

function onEvent(event: EventType, callback: (message?: string) => void): () => void {
  const subscription = nearbyEventEmitter.addListener(event, (data: BridgeMessageEvent) => callback(data.message));
  return () => subscription.remove();
}

function onErrorEvent(event: ErrorType, callback: (message?: string) => void): () => void {
  const subscription = nearbyEventEmitter.addListener(event, (data: BridgeErrorEvent) => callback(data.message));
  return () => subscription.remove();
}




// MARK: REACT HOOKS
/**
 * The current state of the Google Nearby API (used in hooks)
 */
export type NearbyState = 'disconnected' | 'connecting' | 'published' | 'subscribed' | 'error' | 'denied' | 'unavailable';
/**
 * The state of a current Subscription. (used in hooks)
 */
export interface SubscriptionState {
  nearbyMessages: string[];
  nearbyState: NearbyState;
}
/**
 * The state of a current Subscription-Search. (used in hooks)
 */
export interface SearchState {
  isNearby: boolean;
  nearbyState: NearbyState;
}

/**
 * Publish a simple message and return the current state of the nearby API.
 *
 * Also calls `checkBluetoothAvailability()` and `checkBluetoothPermission()`.
 * @param apiKey The Google API Key - required on iOS
 * @param message The message to publish
 * @returns The current state of the Nearby API
 */
export function useNearbyPublication(apiKey: string, message: string): NearbyState {
  const [nearbyState, setNearbyState] = useState<NearbyState>('connecting');

  useEffect(() => {
    const start = async () => {
      try {
        const available = await checkBluetoothAvailability();
        if (!available) {
          setNearbyState('unavailable');
          return;
        }
        const permission = await checkBluetoothPermission();
        if (!permission) {
          setNearbyState('denied');
          return;
        }

        await connect(apiKey);
        await publish(message);
        setNearbyState('published');
      } catch (e) {
        setNearbyState('error');
      }
    };

    start();
    const removeListener = addOnErrorListener((kind, message) => {
      console.log(`[NEARBY] Error: ${kind}: ${message}`);
      setNearbyState('error');
    });
    return () => {
      removeListener();
      unpublish();
      disconnect();
      setNearbyState('disconnected');
    };
  }, [setNearbyState, apiKey, message, setNearbyState]);

  return nearbyState;
}

/**
 * Subscribe to nearby messages and return an instance of the `SubscriptionState` object.
 *
 * Also calls `checkBluetoothAvailability()` and `checkBluetoothPermission()`.
 * @param apiKey The Google API Key - required on iOS
 * @returns A state of all nearby messages
 */
export function useNearbySubscription(apiKey: string): SubscriptionState {
  const [nearbyMessages, setNearbyMessages] = useState<string[]>([]);
  const [nearbyState, setNearbyState] = useState<NearbyState>('connecting');

  const messageFound = useCallback((message) => {
    // avoid duplicates
    if (nearbyMessages.findIndex(m => m === message) === -1) {
      nearbyMessages.push(message);
      setNearbyMessages(nearbyMessages);
    }
  }, [nearbyMessages, setNearbyMessages]);
  const messageLost = useCallback((message) => {
    const index = nearbyMessages.findIndex((m) => m === message);
    if (index > -1) {
      nearbyMessages.splice(index, 1);
      setNearbyMessages(nearbyMessages);
    }
  }, [nearbyMessages, setNearbyMessages]);

  useEffect(() => {
    const start = async () => {
      try {
        const available = await checkBluetoothAvailability();
        if (!available) {
          setNearbyState('unavailable');
          return;
        }
        const permission = await checkBluetoothPermission();
        if (!permission) {
          setNearbyState('denied');
          return;
        }

        await connect(apiKey);
        await subscribe(messageFound, messageLost);
        setNearbyState('subscribed');
      } catch (e) {
        setNearbyState('error');
      }
    };

    start();
    const removeListener = addOnErrorListener((kind, message) => {
      console.log(`[NEARBY] Error: ${kind}: ${message}`);
      setNearbyState('error');
    });
    return () => {
      removeListener();
      unpublish();
      disconnect();
      setNearbyState('disconnected');
    };
  }, [apiKey, messageFound, messageLost, setNearbyState]);

  return { nearbyMessages, nearbyState };
}

/**
 * Search for a specific message using the nearby messages API. Returns a state whether the message has been found or not.
 *
 * Also calls `checkBluetoothAvailability()` and `checkBluetoothPermission()`.
 * @param apiKey The Google API Key - required on iOS
 * @param searchFor The string to perform the nearby search for
 * @returns A state whether the message has been found or not.
 */
export function useNearbySearch(apiKey: string, searchFor: string): SearchState {
  const [isNearby, setIsNearby] = useState(false);
  const [nearbyState, setNearbyState] = useState<NearbyState>('connecting');

  const messageFound = useCallback((message) => {
    if (message === searchFor) setIsNearby(true);
  }, [searchFor, setIsNearby]);
  const messageLost = useCallback((message) => {
    if (message === searchFor) setIsNearby(false);
  }, [searchFor, setIsNearby]);

  useEffect(() => {
    const start = async () => {
      try {
        const available = await checkBluetoothAvailability();
        if (!available) {
          setNearbyState('unavailable');
          return;
        }
        const permission = await checkBluetoothPermission();
        if (!permission) {
          setNearbyState('denied');
          return;
        }

        await connect(apiKey);
        await subscribe(messageFound, messageLost);
        setNearbyState('subscribed');
      } catch (e) {
        setNearbyState('error');
      }
    };

    start();
    const removeListener = addOnErrorListener((kind, message) => {
      console.log(`[NEARBY] Error: ${kind}: ${message}`);
      setNearbyState('error');
    });
    return () => {
      removeListener();
      unsubscribe();
      disconnect();
      setNearbyState('disconnected');
    };
  }, [apiKey, messageFound, messageLost, setNearbyState]);

  return { isNearby, nearbyState };
}

/**
 * Add an error listener which automatically disposes when the component unmounts.
 * @param callback The function to call when an error occurs.
 */
export function useNearbyErrorCallback(callback: (kind: ErrorType, message?: string) => void) {
  useEffect(() => addOnErrorListener(callback), [callback])
}
