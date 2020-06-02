import { NativeModules } from 'react-native';

const { GoogleNearbyMessages } = NativeModules;

export namespace NearbyMessages {
    const callbacks: ((message: string) => void)[] = [];

    function subscribe(callback: (message: string) => void): Promise<void> {
        console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
        callbacks.push(callback);
        // TODO: register callback
        return GoogleNearbyMessages.subscribe();
    }

    function unsubscribe(callback: (message: string) => void): Promise<void> {
        console.log('Nearby Messages invoked. Native Module: ', GoogleNearbyMessages);
        const index = callbacks.findIndex(c => c === callback);
        if (index < 1) throw new Error('The supplied callback is not subscribed!');
        callbacks.splice(index, 1);
        // TODO: remove callback
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
}
