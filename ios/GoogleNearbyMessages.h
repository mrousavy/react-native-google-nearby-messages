#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <GNSMessages.h>

@interface GoogleNearbyMessages : NSObject <RCTBridgeModule>

/// GNSPublication to keep track of the currently published message.
@property(nonatomic, strong) id<GNSPublication> publication;

/// GNSSubscription to keep track of the current subscription.
@property(nonatomic, strong) id<GNSSubscription> subscription;

@end
