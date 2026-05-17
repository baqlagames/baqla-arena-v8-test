const pendingRewardedAds = new Map();
let rewardedRequestSeq = 1;
let configuredRewardedProvider = null;
let rewardedAdOptions = {
  devFallback: true,
  timeoutMs: 30000,
};

export function configureRewardedAds(options = {}) {
  if (options.provider) configuredRewardedProvider = options.provider;
  if (typeof options.devFallback === 'boolean') rewardedAdOptions.devFallback = options.devFallback;
  if (Number.isFinite(options.timeoutMs)) rewardedAdOptions.timeoutMs = Math.max(1000, options.timeoutMs);
}

globalThis.BaqlaRegisterRewardedAdsProvider = globalThis.BaqlaRegisterRewardedAdsProvider || function baqlaRegisterRewardedAdsProvider(provider, options) {
  configureRewardedAds({ ...(options || {}), provider });
  return true;
};

function resolveReward(result, onReward, onUnavailable) {
  if (result === false || (result && result.rewarded === false)) onUnavailable();
  else onReward();
}

function registerNativeRewardRequest(placement, callbacks) {
  const id = 'baqla-reward-' + rewardedRequestSeq++;
  const timeout = setTimeout(() => {
    const pending = pendingRewardedAds.get(id);
    if (!pending) return;
    pendingRewardedAds.delete(id);
    pending.onUnavailable();
  }, rewardedAdOptions.timeoutMs);
  pendingRewardedAds.set(id, { ...callbacks, timeout });
  return { id, placement };
}

globalThis.BaqlaRewardedAdResult = globalThis.BaqlaRewardedAdResult || function baqlaRewardedAdResult(id, result) {
  const callbacks = pendingRewardedAds.get(id);
  if (!callbacks) return false;
  pendingRewardedAds.delete(id);
  clearTimeout(callbacks.timeout);
  resolveReward(result, callbacks.onReward, callbacks.onUnavailable);
  return true;
};

export function showRewardedAd(placement, callbacks = {}) {
  const provider = configuredRewardedProvider || globalThis.BaqlaRewardedAds;
  const onReward = typeof callbacks.onReward === 'function' ? callbacks.onReward : (() => {});
  const onUnavailable = typeof callbacks.onUnavailable === 'function' ? callbacks.onUnavailable : (() => {});

  const providerShow = provider && (provider.show || provider.showRewarded || provider.showRewardedAd);
  if (typeof providerShow === 'function') {
    try {
      const result = providerShow.call(provider, placement);
      if (result && typeof result.then === 'function') {
        result.then(value => {
          if (value === false || (value && value.rewarded === false)) onUnavailable();
          else onReward();
        }).catch(onUnavailable);
      } else if (result === false || (result && result.rewarded === false)) {
        onUnavailable();
      } else {
        onReward();
      }
      return true;
    } catch (_) {
      onUnavailable();
      return false;
    }
  }

  const nativeRequest = registerNativeRewardRequest(placement, { onReward, onUnavailable });
  const androidBridge = globalThis.BaqlaAndroidAds || globalThis.AndroidBaqlaAds;
  const androidShow = androidBridge && (androidBridge.showRewarded || androidBridge.showRewardedAd);
  if (typeof androidShow === 'function') {
    try {
      androidShow.call(androidBridge, nativeRequest.placement, nativeRequest.id);
      return true;
    } catch (_) {
      clearTimeout(pendingRewardedAds.get(nativeRequest.id)?.timeout);
      pendingRewardedAds.delete(nativeRequest.id);
      onUnavailable();
      return false;
    }
  }

  const iosBridge = globalThis.webkit
    && globalThis.webkit.messageHandlers
    && globalThis.webkit.messageHandlers.baqlaRewardedAd;
  if (iosBridge && typeof iosBridge.postMessage === 'function') {
    try {
      iosBridge.postMessage(nativeRequest);
      return true;
    } catch (_) {
      clearTimeout(pendingRewardedAds.get(nativeRequest.id)?.timeout);
      pendingRewardedAds.delete(nativeRequest.id);
      onUnavailable();
      return false;
    }
  }
  clearTimeout(pendingRewardedAds.get(nativeRequest.id)?.timeout);
  pendingRewardedAds.delete(nativeRequest.id);

  // Development fallback: reward immediately until a mobile ad SDK is wired.
  if (rewardedAdOptions.devFallback) {
    onReward();
    return true;
  }
  onUnavailable();
  return false;
}
