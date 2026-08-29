package com.quickbite.restaurant_order_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CancelOrderRequest {
    @NotBlank(message = "Cancellation reason is required")
    private String reason;
}