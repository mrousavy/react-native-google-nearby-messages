<p align="center">
  <img src="img/nearby-messages-icon.png" height="120" />
  <h2 align="center">react-native-google-nearby-messages</h2>
</p>

An async **Google Nearby Messages** API Wrapper for **React Native** (Android & iOS), supporting autolinking, custom discovery modes (`broadcast`, `scan`, ..), custom discovery mediums (`bluetooth`, `audio`, ..), awaitable native invokations and React hooks!

> Also, this is a good example on how to use _Swift_ in a React Native - Native Module.

[![react-native-google-nearby-messages](https://badge.fury.io/js/react-native-google-nearby-messages.svg)](https://badge.fury.io/js/react-native-google-nearby-messages)
[![GitHub stars](https://img.shields.io/github/stars/mrousavy/react-native-google-nearby-messages.svg?style=social&label=Star&maxAge=259000)](https://GitHub.com/mrousavy/react-native-google-nearby-messages/stargazers/)
[![GitHub followers](https://img.shields.io/github/followers/mrousavy.svg?style=social&label=Follow&maxAge=259000)](https://github.com/mrousavy?tab=followers)

<a href='https://ko-fi.com/F1F8CLXG' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi2.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## Install

> This packages uses React Native autolinking (> 0.60)

```sh
npm i react-native-google-nearby-messages
# for iOS
cd ios && pod install && cd ..
```

> Note (iOS): Everytime you run `pod install` an entry called `Assets.car` is created in your **Build Phases** -> **[CP] Copy Pods Resources** which causes the build to fail. This is a known bug in the Google **NearbyMessages** pod. A workaround is to manually remove this file everytime you run `pod install`. See [#4 (comment)](https://github.com/mrousavy/react-native-google-nearby-messages/issues/4#issuecomment-649961499) for an automatic fix. Please [create a PR here](https://github.com/mrousavy/react-native-google-nearby-messages/pulls) if you found a better solution for this!

## Usage

See the [example app](example/).

### iOS Setup

> See: https://developers.google.com/nearby/messages/ios/get-started

1. Add bluetooth permissions (`NSBluetoothPeripheralUsageDescription`, `NSBluetoothAlwaysUsageDescription` for 'ble', and `NSMicrophoneUsageDescription` for 'audio') to `Info.plist`
2. Create your API Key at [the Google Developer Console](https://console.developers.google.com/flows/enableapi?apiid=copresence&keyType=CLIENT_SIDE_IOS&reusekey=true).
3. (Optionally): Add the [react-native-permissions](https://github.com/react-native-community/react-native-permissions) library to check if Bluetooth is available on the device (it's `'unavailable'` on iOS Simulators!) If it's `'unavailable'`, calls to subscribe or publish might crash the app (`EXC_BAD_ACCESS`) so only call if Bluetooth permission is `denied`, `granted` or `blocked`. This library will handle the permission checking for you when you call `publish()` or `subscribe()` for the first time.
4. Pass the generated API Key as a parameter using the `connect` function

### Android Setup

> See: https://developers.google.com/nearby/messages/android/get-started

1. Create your API Key at [the Google Developer Console](https://console.developers.google.com/flows/enableapi?apiid=copresence&keyType=CLIENT_SIDE_ANDROID&reusekey=true).
2. Add your generated API Key and Permissions to your `AndroidManifest.xml`:

    ```xml
    <manifest xmlns:android="http://schemas.android.com/apk/res/android"
        package="com.google.sample.app" >
        <!-- For BLE/Bluetooth -->
        <uses-permission android:name="android.permission.BLUETOOTH" />
        <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
        <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

        <!-- For Audio -->
        <uses-permission android:name="android.permission.RECORD_AUDIO" />

        <application ...>
            <meta-data
                android:name="com.google.android.nearby.messages.API_KEY"
                android:value="API_KEY" />
            <activity>
            ...
            </activity>
        </application>
    </manifest>
    ```

3. (Optionally): Call `checkBluetoothAvailability()` to ensure that Bluetooth capabilities are available on the current device.
4. Call `connect` without any key.

### Publishing

```ts
import { connect, publish, addOnErrorListener } from 'react-native-google-nearby-messages';

const removeListener = addOnErrorListener((kind, message) => console.error(`${kind}: ${message}`));
const disconnect = await connect({ apiKey: GOOGLE_API_KEY });
const unpublish = await publish('hello !');

// later, e.g. in componentWillUnmount()
removeListener();
unpublish();
disconnect();
```

> Make sure to unpublish, disconnect and remove any listeners as they won't be removed automatically! I don't know if that's possible, if so, please create a Pull Request.

### Subscribing

```ts
import { connect, subscribe, addOnErrorListener } from 'react-native-google-nearby-messages';

const removeListener = addOnErrorListener((kind, message) => console.error(`${kind}: ${message}`));
const disconnect = await connect({ apiKey: GOOGLE_API_KEY });
const unsubscribe = await subscribe(
  (m) => {
    console.log(`new message found: ${m}`);
  },
  (m) => {
    console.log(`message lost: ${m}`);
  });

// later, e.g. in componentWillUnmount()
removeListener();
unsubscribe();
disconnect();
```

> Make sure to unpublish, disconnect and remove any listeners as they won't be removed automatically! I don't know if that's possible, if so, please create a Pull Request.

### Bluetooth Availability

Check if the user has granted Bluetooth Permissions. This feature is experimental, and strongly differs between iOS and Android.

```ts
import { checkBluetoothPermission } from 'react-native-google-nearby-messages';

const hasPermission = await checkBluetoothPermission();
```

Check if bluetooth is available on this device. This feature is experimental, and strongly differs between iOS and Android. Make sure to use a library like **react-native-permissions** to check if Bluetooth is really available, otherwise your Application might crash with a `EXEC_BAD_ACCESS` error. See [troubleshooting](#troubleshooting)

```ts
import { checkBluetoothAvailability } from 'react-native-google-nearby-messages';

const isBluetoothAvailable = await checkBluetoothAvailability();
```

### React Hooks

This library also provides react hooks for common use cases. In case you're not familiar with hooks, please read the [hooks documentation](https://reactjs.org/docs/hooks-intro.html). When the component unmounts, the hooks automatically stop publishing, subscribing, remove error listeners and disconnect for you. You can also look into the [hooks source code](https://github.com/mrousavy/react-native-google-nearby-messages/blob/master/index.ts#L140-L259) and tweak them for your use case.

Make sure to memoize the `NearbyConfig` object using `useMemo`, otherwise the hooks will fall into an infinite loop of re-renders because the config object gets re-created each time and therefore _has changed_. (See: [react useEffect's deps](https://reactjs.org/docs/hooks-effect.html#tip-optimizing-performance-by-skipping-effects))

#### useNearbyPublication

Publishes a message and returns a state which describes the Nearby API status. (e.g.: `connecting`, `published`, `error`, ...)

```ts
export default function App() {
  const nearbyConfig = useMemo<NearbyConfig>(() => { apiKey: GOOGLE_API_KEY }, []);
  const nearbyStatus = useNearbyPublication(nearbyConfig, 'Hello from Nearby!');
  // ...
}
```

#### useNearbySubscription

Subscribe to nearby messages and return a state for all messages in an array, as well as a state describing the Nearby API Status. (e.g.: `connecting`, `published`, `error`, ...)

```tsx
export default function App() {
  const nearbyConfig = useMemo<NearbyConfig>(() => { apiKey: GOOGLE_API_KEY }, []);
  const { nearbyMessages, nearbyStatus } = useNearbySubscription(nearbyConfig);
  return (
    <FlatList
      data={nearbyMessages}
      renderItem={({ item }) => <Text>{item}</Text>}
      />
  );
}
```

#### useNearbySearch

Search for a specific message using nearby messages. The `isNearby` local specifies whether the string `iPhone 11` could be found using the Nearby API, and the `nearbyStatus` local describes the current status of the Nearby API. (e.g.: `connecting`, `published`, `error`, ...)

```tsx
export default function App() {
  const nearbyConfig = useMemo<NearbyConfig>(() => { apiKey: GOOGLE_API_KEY }, []);
  const { isNearby, nearbyStatus } = useNearbySearch(nearbyConfig, 'iPhone 11');
  return (
    <Text>{isNearby ? 'iPhone 11 is nearby!' : 'iPhone 11 is far, far away.'}</Text>
  );
}
```

#### useNearbyErrorCallback

Subscribe to any errors emitted from the Nearby API.

```ts
export default function App() {
  useNearbyErrorCallback((kind, message) => {
    console.log(`Nearby API Error: ${kind}: ${message}`)
  });
}
```

## Troubleshooting

If you're having any trouble getting the Nearby API working, please make sure you've read [the Troubleshooting Page](./TROUBLESHOOTING.md).

If that doesn't help either, [create an issue](https://github.com/mrousavy/react-native-google-nearby-messages/issues).

<a href='https://ko-fi.com/F1F8CLXG' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi2.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## Resources

* [This medium article](https://teabreak.e-spres-oh.com/swift-in-react-native-the-ultimate-guide-part-1-modules-9bb8d054db03)
