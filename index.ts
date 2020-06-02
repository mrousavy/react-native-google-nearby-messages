import { NativeModules, NativeEventEmitter } from 'react-native';

const { GoogleNearbyMessages } = NativeModules;
const nearbyEventEmitter = new NativeEventEmitter(GoogleNearbyMessages);

export type EventType = 'MESSAGE_FOUND' | 'MESSAGE_LOST' | 'BLUETOOTH_ERROR' | 'PERMISSION_ERROR';

export namespace NearbyMessages {
    const callbacks: ((message: string) => void)[] = [];

    function connect(): Promise<void> {
        console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
        return GoogleNearbyMessages.connect();
    }

    function disconnect(): Promise<void> {
        return GoogleNearbyMessages.disconnect();
    }

    function subscribe(): Promise<() => void> {
        console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
        return GoogleNearbyMessages.subscribe();
    }

    function unsubscribe(callback: (message: string) => void): Promise<void> {
        console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
        return GoogleNearbyMessages.unsubscribe();
    }

    function publish(message: string): Promise<void> {
        console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
        return GoogleNearbyMessages.publish(message);
    }

    function unpublish(): Promise<void> {
        console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
        return GoogleNearbyMessages.unpublish();
    }

    function onMessageFound(callback: (message: string) => void) {
        return onEvent('MESSAGE_FOUND', callback);
    }

    function onMessageLost(callback: (message: string) => void) {
        return onEvent('MESSAGE_FOUND', callback);
    }

    function onEvent(event: EventType, callback: (message: string) => void) {
        return nearbyEventEmitter.addListener(event, callback);
    }
}
