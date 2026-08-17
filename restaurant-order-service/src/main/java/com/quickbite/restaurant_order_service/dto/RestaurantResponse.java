package com.quickbite.restaurant_order_service.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RestaurantResponse {
    private UUID id;
    private String name;
    private String description;
    private String cuisineType;
    private String restaurantType;
    private String addressLine;
    private String city;
    private String pincode;
    private boolean is24x7;
    private String openingTime;
    private String closingTime;
    private boolean isOpen;
    private LocalDateTime createdAt;
}