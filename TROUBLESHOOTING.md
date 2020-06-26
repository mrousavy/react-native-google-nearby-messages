# Troubleshooting

The library isn't battle-tested for each scenario, so make sure you're aware of the following points:

1. The library only supports BLE (bluetooth low energy). You can change it in the `GoogleNearbyMessagesModule.kt` and `GoogleNearbyMessages.swift` files yourself, or create a pull-request with a customizable constructor.
2. The JS error codes (promise rejectors) should tell you enough information on what went wrong, check [this doc page](https://developers.google.com/android/reference/com/google/android/gms/nearby/messages/NearbyMessagesStatusCodes) on more information about each individual error code.
3. Make sure your device has BLE capabilities and the App has Permission to use those. Include the required Permissions in `Info.plist` and `AndroidManifest.xml`. Also try adding the `INTERNET`, `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions if nothing else works.
4. Make sure your API Key is valid!
5. If you're having build problems on iOS, check if your **Build Phases** -> **[CP] Copy Pods Resources** contains the `Assets.car` entry. If yes, remove it. See: [iOS Setup](#ios-setup). You can also add a fix at the top of your Podfile to do this automatically (`install! 'cocoapods', :disable_input_output_paths => true`), but this greatly increases your build time. See: [#4 (comment)](https://github.com/mrousavy/react-native-google-nearby-messages/issues/4#issuecomment-649961499) and [#8422 (CocoaPods/CodoaPods)](https://github.com/CocoaPods/CocoaPods/issues/8122)
6. On the iOS Simulator the App may crash (`EXC_BAD_ACCESS`) when trying to use the API. This is because the Simulator does not have Bluetooth functionality, and I don't think I can generally detect this before calling connect/subscribe/publish. Make sure to check if bluetooth is available using a library like [react-native-permissions](https://github.com/react-native-community/react-native-permissions). You don't have to request permission, as the react-native-google-nearby-messages library does that for you on subscribe/publish calls. Only call this library when react-native-permissions check returns anything else than `unavailable`.
7. If you're having the build error `duplicate symbol 'google::RemoveLogSink(google::LogSink*)'` on iOS, include a small `post_install` "patcher" script in your Podfile:
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
    > Thanks [@zaptrem](https://github.com/zaptrem)

If you're still having problems, [create an issue](https://github.com/mrousavy/react-native-google-nearby-messages/issues).
