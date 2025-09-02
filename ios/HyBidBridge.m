#import "HyBidBridge.h"
#import <HyBid/HyBid.h>
#import <React/RCTLog.h>
#import <UIKit/UIKit.h>

@interface HyBidBridge() <HyBidInterstitialAdDelegate, HyBidAdViewDelegate>
@property (nonatomic, strong) HyBidInterstitialAd *interstitialAd;
@property (nonatomic, strong) HyBidAdView *bannerAdView;
@end

@implementation HyBidBridge

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onBannerLoaded", @"onBannerFailed", @"onInterstitialLoaded", @"onInterstitialFailed"];
}

RCT_EXPORT_METHOD(initialize:(NSString *)appToken) {
  // CORRECT initialization method
  [HyBid initWithAppToken:appToken completion:^(BOOL success) {
    if (success) {
      RCTLogInfo(@"HyBid initialized successfully");
    } else {
      RCTLogError(@"HyBid initialization failed");
    }
  }];
}

RCT_EXPORT_METHOD(loadBanner:(NSString *)zoneId width:(double)width) {
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTLogInfo(@"Loading banner for zone: %@", zoneId);
    
    // CORRECT banner initialization
    self.bannerAdView = [[HyBidAdView alloc] initWithSize:HyBidAdSize.SIZE_320x50];
    self.bannerAdView.delegate = self;
    [self.bannerAdView loadWithZoneID:zoneId];
  });
}

RCT_EXPORT_METHOD(loadInterstitial:(NSString *)zoneId) {
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTLogInfo(@"Loading interstitial for zone: %@", zoneId);
    
    self.interstitialAd = [[HyBidInterstitialAd alloc] initWithZoneID:zoneId andWithDelegate:self];
    [self.interstitialAd load];
  });
}

RCT_EXPORT_METHOD(showInterstitial) {
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTLogInfo(@"Showing interstitial");
    if (self.interstitialAd && self.interstitialAd.isReady) {
      UIViewController *rootVC = [UIApplication sharedApplication].keyWindow.rootViewController;
      [self.interstitialAd showFromViewController:rootVC];
    } else {
      RCTLogWarn(@"Interstitial not ready to show");
    }
  });
}

#pragma mark - HyBidAdViewDelegate
- (void)adViewDidLoad:(HyBidAdView *)adView {
  // Add banner to view when loaded
  UIViewController *rootVC = [UIApplication sharedApplication].keyWindow.rootViewController;
  adView.frame = CGRectMake(0, rootVC.view.frame.size.height - 50, rootVC.view.frame.size.width, 50);
  [rootVC.view addSubview:adView];
  
  [self sendEventWithName:@"onBannerLoaded" body:nil];
  RCTLogInfo(@"Banner loaded successfully");
}

- (void)adView:(HyBidAdView *)adView didFailWithError:(NSError *)error {
  [self sendEventWithName:@"onBannerFailed" body:@{@"error": error.localizedDescription}];
  RCTLogInfo(@"Banner failed: %@", error.localizedDescription);
}

#pragma mark - HyBidInterstitialAdDelegate
- (void)interstitialDidLoad {
  [self sendEventWithName:@"onInterstitialLoaded" body:nil];
  RCTLogInfo(@"Interstitial loaded");
}

- (void)interstitialDidFailWithError:(NSError *)error {
  [self sendEventWithName:@"onInterstitialFailed" body:@{@"error": error.localizedDescription}];
  RCTLogInfo(@"Interstitial failed: %@", error.localizedDescription);
}

@end
