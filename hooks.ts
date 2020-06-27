import { useEffect, useState, useCallback, useReducer } from 'react';
import { checkBluetoothAvailability, NearbyConfig, checkBluetoothPermission, connect, publish, addOnErrorListener, unpublish, disconnect, subscribe, unsubscribe, ErrorType } from 'index';

/**
 * The current status of the Google Nearby API (used in hooks)
 */
export type NearbyStatus = 'disconnected' | 'connecting' | 'published' | 'subscribed' | 'error' | 'denied' | 'unavailable';
/**
 * The state of a current Subscription. (used in hooks)
 */
export interface SubscriptionState {
  nearbyMessages: string[];
  nearbyStatus: NearbyStatus;
}
/**
 * The state of a current Subscription-Search. (used in hooks)
 */
export interface SearchState {
  isNearby: boolean;
  nearbyStatus: NearbyStatus;
}

/**
 * Publish a simple message and return the current status of the nearby API.
 *
 * Also calls `checkBluetoothAvailability()` and `checkBluetoothPermission()`.
 * @param config The Nearby API configuration object to use.
 * @param message The message to publish
 * @returns The current status of the Nearby API
 */
export function useNearbyPublication(config: NearbyConfig, message: string): NearbyStatus {
  const [nearbyStatus, setNearbyStatus] = useState<NearbyStatus>('connecting');

  useEffect(() => {
    const start = async () => {
      try {
        const available = await checkBluetoothAvailability();
        if (!available) {
          setNearbyStatus('unavailable');
          return;
        }
        const permission = await checkBluetoothPermission();
        if (!permission) {
          setNearbyStatus('denied');
          return;
        }

        await connect(config);
        await publish(message);
        setNearbyStatus('published');
      } catch (e) {
        setNearbyStatus('error');
      }
    };

    start();
    const removeListener = addOnErrorListener((kind, message) => {
      console.log(`[NEARBY] Error: ${kind}: ${message}`);
      setNearbyStatus('error');
    });
    return () => {
      removeListener();
      unpublish();
      disconnect();
      setNearbyStatus('disconnected');
    };
  }, [setNearbyStatus, config, message, setNearbyStatus]);

  return nearbyStatus;
}

interface ReducerPayload {
	addMessages?: string[];
	removeMessages?: string[];
}

function reducer(messages: string[], payload: ReducerPayload): string[] {
	const removeIndices = payload.removeMessages?.map((removeMessage) => messages.findIndex((message) => removeMessage === message));
	removeIndices?.forEach((i) => {
		if (i > -1) messages.splice(i, 1);
	});
	payload.addMessages?.forEach((u) => {
		if (messages.indexOf(u) === -1) messages.push(u);
	});
	return [...messages];
}

/**
 * Subscribe to nearby messages and return an instance of the `SubscriptionState` object.
 *
 * Also calls `checkBluetoothAvailability()` and `checkBluetoothPermission()`.
 * @param config The Nearby API configuration object to use.
 * @returns A state of all nearby messages
 */
export function useNearbySubscription(config: NearbyConfig): SubscriptionState {
  const [nearbyMessages, dispatch] = useReducer(reducer, []);
  const [nearbyStatus, setNearbyStatus] = useState<NearbyStatus>('connecting');

  const messageFound = useCallback((message) => {
    dispatch({ addMessages: [message] });
  }, [dispatch]);
  const messageLost = useCallback((message) => {
    dispatch({ removeMessages: [message] });
  }, [dispatch]);

  useEffect(() => {
    const start = async () => {
      try {
        const available = await checkBluetoothAvailability();
        if (!available) {
          setNearbyStatus('unavailable');
          return;
        }
        const permission = await checkBluetoothPermission();
        if (!permission) {
          setNearbyStatus('denied');
          return;
        }

        await connect(config);
        await subscribe(messageFound, messageLost);
        setNearbyStatus('subscribed');
      } catch (e) {
        setNearbyStatus('error');
      }
    };

    start();
    const removeListener = addOnErrorListener((kind, message) => {
      console.log(`[NEARBY] Error: ${kind}: ${message}`);
      setNearbyStatus('error');
    });
    return () => {
      removeListener();
      unpublish();
      disconnect();
      setNearbyStatus('disconnected');
    };
  }, [config, messageFound, messageLost, setNearbyStatus]);

  return { nearbyMessages, nearbyStatus };
}

/**
 * Search for a specific message using the nearby messages API. Returns an instance of the `SearchState` interface.
 *
 * Also calls `checkBluetoothAvailability()` and `checkBluetoothPermission()`.
 * @param config The Nearby API configuration object to use.
 * @param searchFor The string to perform the nearby search for
 * @returns A state whether the message has been found or not.
 */
export function useNearbySearch(config: NearbyConfig, searchFor: string): SearchState {
  const [isNearby, setIsNearby] = useState(false);
  const [nearbyStatus, setNearbyStatus] = useState<NearbyStatus>('connecting');

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
          setNearbyStatus('unavailable');
          return;
        }
        const permission = await checkBluetoothPermission();
        if (!permission) {
          setNearbyStatus('denied');
          return;
        }

        await connect(config);
        await subscribe(messageFound, messageLost);
        setNearbyStatus('subscribed');
      } catch (e) {
        setNearbyStatus('error');
      }
    };

    start();
    const removeListener = addOnErrorListener((kind, message) => {
      console.log(`[NEARBY] Error: ${kind}: ${message}`);
      setNearbyStatus('error');
    });
    return () => {
      removeListener();
      unsubscribe();
      disconnect();
      setNearbyStatus('disconnected');
    };
  }, [config, messageFound, messageLost, setNearbyStatus]);

  return { isNearby, nearbyStatus };
}

/**
 * Add an error listener which automatically disposes when the component unmounts.
 * @param callback The function to call when an error occurs.
 */
export function useNearbyErrorCallback(callback: (kind: ErrorType, message?: string) => void) {
  useEffect(() => addOnErrorListener(callback), [callback])
}
