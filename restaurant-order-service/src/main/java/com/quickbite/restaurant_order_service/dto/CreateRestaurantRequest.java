package com.quickbite.restaurant_order_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRestaurantRequest {
    
    @NotBlank(message = "Name Is Required")
    private String name;
    
    private String description;
    
    private String cuisineType;
    
    @NotBlank(message = "Restaurant Type Is Required ")
    private String restaurantType;
    
    @NotBlank(message = "Address Is Required ")
    private String addressLine;
    
    @NotBlank(message = "City Is Required ")
    private String city;
    
    @NotBlank(message = "Pincode Is Required ")
    private String pincode;
    
    private Double latitude;
    private Double longitude;
    
    private boolean twentyFourSeven;   
    
    private String openingTime; 
    private String closingTime;         

    
}
