package com.quickbite.restaurant_order_service.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEvent {
    private String eventType;
    
    private UUID orderId;
    private UUID customerId;
    private UUID restaurantId;
    private String status;
    private String previousStatus;
    private BigDecimal totalAmount;
    private String cancellationReason; 
    private Instant occurredAt;
}
