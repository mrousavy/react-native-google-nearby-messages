import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

export * from './hooks';

const { GoogleNearbyMessages } = NativeModules;
const nearbyEventEmitter = new NativeEventEmitter(GoogleNearbyMessages);

/**
 * The error descriptor used to distinguish between error events
 */
export type ErrorType = 'BLUETOOTH_ERROR' | 'PERMISSION_ERROR' | 'MESSAGE_NO_DATA_ERROR';
/**
 * Used to distinguish any event emitted by the library.
 */
export type EventType = 'MESSAGE_FOUND' | 'MESSAGE_LOST' | ErrorType;
/**
 * Discovery Modes for the publish and subscribe API.
 *
 *
 * `'broadcast'`: To discover which devices are nearby, broadcast a pairing code for others to scan.
 *
 *
 * `'scan'`: To discover which devices are nearby, scan for other devices' pairing codes.
 *
 *
 * Use both (`['broadcast', 'scan']`) to combine broadcasting and scanning.
 */
export type DiscoveryMode = 'broadcast' | 'scan';
/**
 * Discovery Mediums for the publish and subscribe API.
 *
 *
 * `'ble'`: Use Bluetooth Low Energy as a publish/subscribe medium.
 *
 *
 * `'audio'`: Use Microphone and Speakers as a publish/subscribe medium.
 *
 *
 * Use both (`['ble', 'audio']`) to combine bluetooth and audio.
 *
 * Note that on Android the values `'bluetooth'`, `'none'` and `'default'` are also accepted, but aren't guaranteed to work.
 */
export type DiscoveryMedium = 'ble' | 'audio';

/**
 * The config used for the Nearby API connect function.
 */
export interface NearbyConfig {
  /**
   * The Google API key to use (only required on iOS) - @see https://console.developers.google.com/flows/enableapi?apiid=copresence&keyType=CLIENT_SIDE_IOS&reusekey=true
   */
  apiKey?: string;
  /**
   * _(optional)_ The modes used for discovering nearby devices (e.g.: Bluetooth Pairing codes). When `undefined`, the default discovery modes are used.
   *
   * @default ['broadcast', 'scan']
   */
  discoveryModes?: DiscoveryMode[];
  /**
   * _(optional)_ The mediums used for publishing and subscribing. When `undefined`, the default discovery mediums are used.
   *
   * Note that on Android the values `'bluetooth'`, `'none'` and `'default'` are also accepted, but aren't guaranteed to work.
   *
   * @default ['ble']
   */
  discoveryMediums?: DiscoveryMedium[];
}

interface BridgeMessageEvent {
  message?: string;
}
interface BridgeErrorEvent {
  message?: string;
}

/**
 * Initialize and connect the Google Nearby Messages API
 * @param config The Nearby API configuration object to use. Default: `{ discoveryModes: ['broadcast', 'scan'], discoveryMediums: ['ble'] }`
 * @returns An unsubscriber function to disconnect the Google Nearby Messages API
 * @example
 * const disconnect = await connect(API_KEY, ['broadcast', 'scan'], ['ble', 'audio']);
 * // ...
 * disconnect();
 */
export async function connect(config: NearbyConfig): Promise<() => void> {
  let { apiKey, discoveryMediums, discoveryModes } = config;
  if (discoveryModes == null || discoveryModes.length === 0) {
    discoveryModes = ['broadcast', 'scan'];
  }
  if (discoveryMediums == null || discoveryMediums.length === 0) {
    discoveryMediums = ['ble'];
  }
  if (Platform.OS === 'ios') {
    if (apiKey == null) throw new Error('API Key is required on iOS!');
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
 *  @returns A function to unsubscribe the subscription and remove the event emitters if supplied.
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
 * Unsubscribe the current subscription. Also removes all event listeners for `MESSAGE_FOUND` and `MESSAGE_LOST`.
 */
export function unsubscribe(): void {
  GoogleNearbyMessages.unsubscribe();
  removeAllListeners('MESSAGE_FOUND');
  removeAllListeners('MESSAGE_LOST');
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
 * @param callback The function to call when an error occurs. `kind` is the Error Type. e.g.: User turns Bluetooth off, callback gets called with ('BLUETOOTH_ERROR', "Bluetooth is powered off/unavailable!").
 */
export function addOnErrorListener(callback: (kind: ErrorType, message?: string) => void): () => void {
  const listeners = [
    onErrorEvent('BLUETOOTH_ERROR', (m) => callback('BLUETOOTH_ERROR', m)),
    onErrorEvent('PERMISSION_ERROR', (m) => callback('PERMISSION_ERROR', m)),
    onErrorEvent('MESSAGE_NO_DATA_ERROR', (m) => callback('MESSAGE_NO_DATA_ERROR', m)),
  ];
  return () => {
    listeners.map(l => l());
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

function removeAllListeners(event: EventType): void {
  nearbyEventEmitter.removeAllListeners(event);
}
