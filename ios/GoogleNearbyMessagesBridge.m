//
//  GoogleNearbyMessagesBridge.m
//  GoogleNearbyMessages
//
//  Created by Marc Rousavy on 02.06.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

#import "GoogleNearbyMessagesBridge.h"
#import <RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(GoogleNearbyMessages, NearbyMessages, NSObject)

RCT_EXTERN_METHOD(connect);
RCT_EXTERN_METHOD(disconnect);
RCT_EXTERN_METHOD(publish);
RCT_EXTERN_METHOD(unpublish);
RCT_EXTERN_METHOD(subscribe);
RCT_EXTERN_METHOD(unsubscribe);

@end
