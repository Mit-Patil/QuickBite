package com.quickbite.restaurant_order_service.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpdateMenuItemRequest {
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private Boolean isVeg;
    private Boolean isAvailable;
    private Integer stockQuantity;
    private String imageUrl;
}