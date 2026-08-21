package com.quickbite.restaurant_order_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateMenuItemRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private String description;
    @NotNull(message = "Price is required")
    private BigDecimal price;
    private String category;
    @JsonProperty("isVeg")
    private boolean isVeg;
    private Integer stockQuantity;
    private String imageUrl;
}