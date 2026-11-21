package com.quickbite.restaurant_order_service.util;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

class DeliveryFeePolicyTest {

    private final DeliveryFeePolicy policy = new DeliveryFeePolicy(
            new BigDecimal("20"), new BigDecimal("2"), new BigDecimal("8"), new BigDecimal("80"));

    private void check(String km, String expected) {
        assertEquals(new BigDecimal(expected), policy.feeFor(new BigDecimal(km)));
    }

    @Test void insideIncludedDistance() { check("0.4", "20.00"); check("2", "20.00"); }
    @Test void justOverIncluded()       { check("2.01", "20.08"); }
    @Test void middleDistances()        { check("3.5", "32.00"); check("7.25", "62.00"); }
    @Test void cappedAtMaximum()        { check("10", "80.00"); }
}