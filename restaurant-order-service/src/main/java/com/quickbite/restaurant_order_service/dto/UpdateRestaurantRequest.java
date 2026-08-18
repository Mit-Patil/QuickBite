package com.quickbite.restaurant_order_service.dto;

import lombok.Data;

@Data
public class UpdateRestaurantRequest {
    private String name;
    private String description;
    private String cuisineType;
    private Boolean twentyFourSeven;
    private String openingTime;
    private String closingTime;
    private Boolean isOpen;
    private String addressLine;
    private String city;
    private String pincode;
}