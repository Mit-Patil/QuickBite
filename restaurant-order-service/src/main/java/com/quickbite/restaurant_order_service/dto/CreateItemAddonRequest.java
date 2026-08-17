package com.quickbite.restaurant_order_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateItemAddonRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private BigDecimal price;
}