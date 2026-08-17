package com.quickbite.restaurant_order_service.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class PlaceOrderRequest {
    @NotNull(message = "Delivery address is required")
    private UUID deliveryAddressId;
}