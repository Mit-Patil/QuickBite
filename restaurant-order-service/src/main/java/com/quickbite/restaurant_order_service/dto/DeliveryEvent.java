package com.quickbite.restaurant_order_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeliveryEvent {
    private String eventType;
    private UUID orderId;
    private Instant occurredAt;
    private UUID partnerId; 
    private Double distanceKm;
    private String reason; 
}
