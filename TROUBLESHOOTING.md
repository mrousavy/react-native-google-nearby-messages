# Troubleshooting

The library is a rather low-level API, so make sure you roughly understand what each functions does since there are a lot of wrong ways to use the API.

## API Usage Notes

* you need to call `connect(...)` before publishing or subscribing
* you _can_ call `checkBluetoothPermissions()` and `checkBluetoothAvailability()` before any other calls to make sure bluetooth is available. (Use [react-native-permissions](https://github.com/react-native-community/react-native-permissions) to actually request permissions)
* you need to manually call `disconnect(...)` to stop publishing, otherwise nearby subscribers will still see you as nearby even when you e.g. close the app.
* it is recommended to use React Hooks, since those are cleaner code and less error-prone.
  - when you are using hooks, be aware that you can only use a single hook in the same context at a time. (With the exception of the `useNearbyError` hook) This is because the Nearby Messages API is a global/singleton instance, so when you call `connect(...)` twice (which will happen if you have multiple hooks), an error gets thrown. You can write your custom Hooks if you inted on doing more complex logic.
* all errors are thrown as Promise rejectors, so make sure you surround your calls with a try/catch. For error events, use the `addOnErrorListener(...)` function or `useNearbyError(...)` hook.

## Troubleshooting

If you're still having trouble, be aware of the following:

1. The JS error codes (promise rejectors) should tell you enough information on what went wrong, check [this doc page](https://developers.google.com/android/reference/com/google/android/gms/nearby/messages/NearbyMessagesStatusCodes) on more information about each individual error code.
2. If you are receiving seemingly random promise rejectors, it is likely that the metro bundler has caused some issues with the state cache. Try reloading the App. (pressing <kbd>r</kbd> in the metro bundler console)
3. Make sure your device has BLE capabilities and the App has Permission to use those. Include the required Permissions in `Info.plist` and `AndroidManifest.xml`. Also try adding the `INTERNET`, `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions if nothing else works.
4. Make sure your API Key is valid!
5. The Nearby Messages API is available on Android devices with [Google Play services](https://developers.google.com/android/guides/overview) 7.8.0 or higher. Devices running Android 2.3 or higher that have the Google Play Store app automatically receive updates to Google Play services. To check which version of Google Play services is installed on your device, go to **Settings > Apps > Google Play services**. See: [here](https://developers.google.com/nearby/messages/android/get-started)
6. If you're having build problems on iOS, check if your **Build Phases** -> **[CP] Copy Pods Resources** contains the `Assets.car` entry. If yes, remove it. See: [iOS Setup](#ios-setup). You can also add a fix at the top of your Podfile to do this automatically (`install! 'cocoapods', :disable_input_output_paths => true`), but this greatly increases your build time. See: [#4 (comment)](https://github.com/mrousavy/react-native-google-nearby-messages/issues/4#issuecomment-649961499) and [#8422 (CocoaPods/CodoaPods)](https://github.com/CocoaPods/CocoaPods/issues/8122)
7. On the iOS Simulator the App may crash (`EXC_BAD_ACCESS`) when trying to use the API. This is because the Simulator does not have Bluetooth functionality, and I don't think I can generally detect this before calling connect/subscribe/publish. Make sure to check if bluetooth is available using a library like [react-native-permissions](https://github.com/react-native-community/react-native-permissions). You don't have to request permission, as the react-native-google-nearby-messages library does that for you on subscribe/publish calls. Only call this library when react-native-permissions check returns anything else than `unavailable`.
8. If you're having the build error `duplicate symbol 'google::RemoveLogSink(google::LogSink*)'` on iOS, include a small `post_install` "patcher" script in your Podfile:
    ```ruby
    def rename_logging_functions(installer)
      puts "Renaming logging functions"

      root = File.dirname(installer.pods_project.path)
      Dir.chdir(root);
      Dir.glob("**/*.{h,cc,cpp,in}") {|filename|
        filepath = root + "/" + filename
        text = File.read(filepath)
        addText = text.gsub!(/(?<!React)AddLogSink/, "ReactAddLogSink")
        if addText
          File.chmod(0644, filepath)
          f = File.open(filepath, "w")
          f.write(addText)
          f.close
        end

        text2 = addText ? addText : text
        removeText = text2.gsub!(/(?<!React)RemoveLogSink/, "ReactRemoveLogSink")
        if removeText
          File.chmod(0644, filepath)
          f = File.open(filepath, "w")
          f.write(removeText)
          f.close
        end
      }
    end

    # ...
    target 'yourapp' do
      # ...
      # [your pods here]
      # ...
      post_install do |installer|
        # flipper_post_install(installer)
        rename_logging_functions(installer)
      end
    end
    ```
9. Try debugging your app with Xcode/Android Studio. Native Logs get printed in the Logs/Logcat windows, and you can set breakpoints in the native code as well.

If you're still having problems, [create an issue](https://github.com/mrousavy/react-native-google-nearby-messages/issues), I'm happy to help.
