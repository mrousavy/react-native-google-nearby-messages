//
//  GoogleNearbyMessagesBridge.m
//  GoogleNearbyMessages
//
//  Created by Marc Rousavy on 02.06.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "GoogleNearbyMessagesBridge.h"
#import "RCTBridgeModule.h"
#import "RCTEventEmitter.h"

@interface RCT_EXTERN_REMAP_MODULE(GoogleNearbyMessages, NearbyMessages, NSObject)

RCT_EXTERN_METHOD(connect:(NSString)apiKey resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(disconnect);
RCT_EXTERN_METHOD(publish:(NSString)message resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(unpublish);
RCT_EXTERN_METHOD(subscribe:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(unsubscribe);
RCT_EXTERN_METHOD(checkBluetoothPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);

- (void)invalidate
{
	// TODO: disconnect bluetooth here?
	printf("GNM_BLE: invalidate!");
}


@end
