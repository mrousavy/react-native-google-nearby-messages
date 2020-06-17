<p align="center">
  <img src="img/nearby-messages-icon.png" height="120" />
  <h2 align="center">react-native-google-nearby-messages</h2>
</p>

An async **Google Nearby Messages** API Wrapper for **React Native** (Android & iOS), using the newest API Version (`17`). Also, this is a good example on how to use _Swift_ in a React Native Native Module.

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

> Note (iOS): Everytime you run `pod install` an entry called `Assets.car` is created in your **Build Phases** -> **[CP] Copy Pods Resources** which causes the build to fail. This is a known bug in the Google **NearbyMessages** pod. A workaround is to manually remove this file everytime you run `pod install`. I've tried creating a `post_install` hook for the Podfile, but I haven't got it working. Please [create a PR here](https://github.com/mrousavy/react-native-google-nearby-messages/pulls) if you found a fix for this!

## Usage

See the [example app](example/).

### iOS Setup

> See: https://developers.google.com/nearby/messages/ios/get-started

1. Add bluetooth permissions (`NSBluetoothPeripheralUsageDescription`, `NSBluetoothAlwaysUsageDescription`) to `Info.plist`
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
        <uses-permission android:name="android.permission.BLUETOOTH" />
        <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />

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
const disconnect = await connect('<youriOSAPIkey>');
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
const disconnect = await connect('<youriOSAPIkey>');
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

#### usePublication

Publishes a message.

```ts
export default function App() {
  usePublication(API_KEY, 'Hello from Nearby!');
  // ...
}
```

#### usePublicationWithState

Publishes a message and returns a state which describes the Nearby API status.

```ts
export default function App() {
  const nearbyState = usePublicationWithState(API_KEY, 'Hello from Nearby!');

  if (nearbyState === 'published') console.log('Nearby has published!');
  // ...
}
```

#### useSubscription

Subscribe to nearby messages and return a state for all messages in an array.

```tsx
export default function App() {
  const nearbyMessages = useSubscription(API_KEY);
  return (
    <FlatList
      data={nearbyMessages}
      renderItem={({ item }) => <Text>{item}</Text>}
      />
  );
}
```

#### useNearbySearch

Search for a specific message using nearby messages.

```tsx
export default function App() {
  const isNearby = useNearbySearch(API_KEY, 'iPhone 11');
  return (
    <Text>{isNearby ? 'iPhone 11 is nearby!' : 'iPhone 11 is far, far away.'}</Text>
  );
}
```

#### useNearbyErrorCallback

Subscribe to any errors occuring in the Nearby API.

```ts
export default function App() {
  useNearbyErrorCallback((kind, message) => {
    console.log(`Nearby API Error: ${kind}: ${message}`)
  });
}
```

## Troubleshooting

If you're having any trouble getting the Nearby API working, please make sure you're aware of these steps:

1. The library only supports BLE (bluetooth low energy). You can change it in the `GoogleNearbyMessagesModule.kt` and `GoogleNearbyMessages.swift` files yourself, or create a pull-request with a customizable constructor.
2. The JS error codes (promise rejectors) should tell you enough information on what went wrong, check [this doc page](https://developers.google.com/android/reference/com/google/android/gms/nearby/messages/NearbyMessagesStatusCodes) on more information about each individual error code.
3. Make sure your device has BLE capabilities and the App has Permission to use those. Include the required Permissions in `Info.plist` and `AndroidManifest.xml`. Also try adding the `INTERNET`, `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions if nothing else works.
4. Make sure your API Key is valid!
5. If you're having build problems on iOS, check if your **Build Phases** -> **[CP] Copy Pods Resources** contains the `Assets.car` entry. If yes, remove it. See: [iOS Setup](#ios-setup)
6. On the iOS Simulator the App may crash (`EXC_BAD_ACCESS`) when trying to use the API. This is because the Simulator does not have Bluetooth functionality, and I don't think I can generally detect this before calling connect/subscribe/publish. Make sure to check if bluetooth is available using a library like [react-native-permissions](https://github.com/react-native-community/react-native-permissions). You don't have to request permission, as the react-native-google-nearby-messages library does that for you on subscribe/publish calls. Only call this library when react-native-permissions check returns anything else than `unavailable`.

If you're still having problems, [create an issue](https://github.com/mrousavy/react-native-google-nearby-messages/issues).

<a href='https://ko-fi.com/F1F8CLXG' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi2.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
