package com.quickbite.restaurant_order_service.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class DeliveryFeePolicy {

    private final BigDecimal baseFee;
    private final BigDecimal includedKm;
    private final BigDecimal perKm;
    private final BigDecimal maxFee;

    public DeliveryFeePolicy(BigDecimal baseFee, BigDecimal includedKm, BigDecimal perKm, BigDecimal maxFee) {
        this.baseFee = baseFee;
        this.includedKm = includedKm;
        this.perKm = perKm;
        this.maxFee = maxFee;
    }

    public BigDecimal feeFor(BigDecimal distanceKm) {
        BigDecimal extraKm = distanceKm.subtract(includedKm).max(BigDecimal.ZERO);
        BigDecimal fee = baseFee.add(extraKm.multiply(perKm)).min(maxFee);
        return fee.setScale(2, RoundingMode.HALF_UP);
    }
}