package com.quickbite.restaurant_order_service.dto;

public record TrackingInfoResponse(
        Double restaurantLatitude, Double restaurantLongitude,
        Double deliveryLatitude, Double deliveryLongitude) {}