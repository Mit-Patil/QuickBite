package com.quickbite.restaurant_order_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties({"veg", "available"})
@Data
@Builder
public class MenuItemResponse {
    private UUID id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    
    @JsonProperty("isVeg")
    private boolean isVeg;
    
    @JsonProperty("isAvailable")
    private boolean isAvailable;
    private Integer stockQuantity;
    private String imageUrl;
    private List<ItemVariantResponse> variants;
    private List<ItemAddonResponse> addons;
}