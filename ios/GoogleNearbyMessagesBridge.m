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
RCT_EXTERN_METHOD(disconnect:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(publish:(NSString)message resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(unpublish:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(subscribe:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);
RCT_EXTERN_METHOD(unsubscribe:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);

@end
