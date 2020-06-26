//
// This is the source code of the Google Nearby Messages Strategy Java file (com.google.android.gms.nearby.messages.Strategy).
// Apparently they forgot to add a discovery medium setter functions, so I just added that here.
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package com.google.android.gms.nearby.messages;

import com.google.android.gms.common.internal.Preconditions;
import com.google.android.gms.common.internal.safeparcel.SafeParcelable.Class;

import javax.annotation.concurrent.Immutable;

@Immutable
@Class(
        creator = "StrategyCreator"
)
public class BetterStrategy {
    public static final int DISCOVERY_MEDIUM_DEFAULT = -1;
    public static final int DISCOVERY_MEDIUM_BLE = 2;
    public static final int DISCOVERY_MEDIUM_AUDIO = 4;

    public static class Builder {
        private int discoveryMode = Strategy.DISCOVERY_MODE_DEFAULT;
        private int ttlSeconds = 300;
        private int distanceType = Strategy.DISTANCE_TYPE_DEFAULT;
        private int discoveryMedium = DISCOVERY_MEDIUM_DEFAULT;
        private int zzfy = 0;

        public Builder() {
        }

        public BetterStrategy.Builder setDiscoveryMode(int var1) {
            this.discoveryMode = var1;
            return this;
        }

        public BetterStrategy.Builder setDiscoveryMedium(int var1) {
            this.discoveryMedium = var1;
            return this;
        }

        public BetterStrategy.Builder setTtlSeconds(int var1) {
            Preconditions.checkArgument(var1 == 2147483647 || var1 > 0 && var1 <= 86400, "mTtlSeconds(%d) must either be TTL_SECONDS_INFINITE, or it must be between 1 and TTL_SECONDS_MAX(%d) inclusive", new Object[]{var1, 86400});
            this.ttlSeconds = var1;
            return this;
        }

        public BetterStrategy.Builder setDistanceType(int var1) {
            this.distanceType = var1;
            return this;
        }

        public Strategy build() {
            if (this.discoveryMedium == DISCOVERY_MEDIUM_BLE && this.distanceType == Strategy.DISTANCE_TYPE_EARSHOT) {
                throw new IllegalStateException("Cannot set EARSHOT with BLE only mode.");
            } else {
                return new Strategy(2, 0, this.ttlSeconds, this.distanceType, false, this.discoveryMedium, this.discoveryMode, 0);
            }
        }
    }
}
