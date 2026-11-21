package com.quickbite.restaurant_order_service.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class GeoUtilsTest {

    @Test
    void samePointIsZero() {
        assertEquals(0.0, GeoUtils.distanceKm(21.14012, 72.87820, 21.14012, 72.87820), 0.001);
    }

    @Test
    void oneDegreeOfLatitude() {
        assertEquals(111.19, GeoUtils.distanceKm(0, 0, 1, 0), 0.1);
    }

    @Test
    void oneDegreeOfLongitudeAt21Degrees() {
        assertEquals(103.8, GeoUtils.distanceKm(21, 72, 21, 73), 0.1);
    }
}