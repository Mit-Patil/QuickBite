package com.quickbite.restaurant_order_service.util;

import java.util.regex.Pattern;

public final class GeoValidator {

    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");

    private static final double INDIA_MIN_LAT = 6.0, INDIA_MAX_LAT = 38.0;
    private static final double INDIA_MIN_LNG = 68.0, INDIA_MAX_LNG = 98.0;

    private GeoValidator() {}

    public static void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Please pin the restaurant location on the map");
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Invalid map coordinates");
        }
        if (latitude < INDIA_MIN_LAT || latitude > INDIA_MAX_LAT
                || longitude < INDIA_MIN_LNG || longitude > INDIA_MAX_LNG) {
            throw new IllegalArgumentException("Location must be within India");
        }
    }

    public static void validatePincode(String pincode) {
        if (pincode == null || !PINCODE_PATTERN.matcher(pincode).matches()) {
            throw new IllegalArgumentException("Pincode must be a valid 6-digit number");
        }
    }
}