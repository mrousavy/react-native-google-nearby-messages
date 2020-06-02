# react-native-google-nearby-messages

A Google Nearby Messages API Wrapper for React Native.

## Install

```sh
npm i react-native-google-nearby-messages
```

> This package uses react-native autolinking.

## Usage

### Publishing

```ts
import { connect, publish, unpublish, onError } from 'react-native-google-nearby-messages';

onError((kind, error) => console.error(`${kind}: ${error}`));
await connect('<yourAPIkey>'); // API Key not needed in Android, add to Manifest instead!
await publish('hello !');

// later, e.g. in componentWillUnmount()
await unpublish();
```

### Subscribing

```ts
import { connect, subscribe, unsubscribe, onError } from 'react-native-google-nearby-messages';

onError((kind, error) => console.error(`${kind}: ${error}`));
await connect('<yourAPIkey>'); // API Key not needed in Android, add to Manifest instead!
const removeListener = await subscribe(
  (m) => {
    console.log(`new message found: ${m}`);
  },
  (m) => {
    console.log(`message lost: ${m}`);
  });

// later, e.g. in componentWillUnmount()
removeListener();
await unsubscribe();
```

### Bluetooth Permissions

```ts
import { checkBluetoothPermission } from 'react-native-google-nearby-messages';

const hasPermission = await checkBluetoothPermission();
```
