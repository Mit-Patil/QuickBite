package com.quickbite.restaurant_order_service.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class PaymentRequest {
    private String orderId;
    private String restaurantId;
    private BigDecimal amount;
    private String method;
    private String idempotencyKey;
}
