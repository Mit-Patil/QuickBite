package com.quickbite.restaurant_order_service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class AddToCartRequest {
    @NotNull(message = "Menu item is required")
    private UUID menuItemId;
    private UUID variantId;
    private List<UUID> addonIds;
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    private String specialInstructions;
}