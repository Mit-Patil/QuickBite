package com.quickbite.restaurant_order_service.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ItemAddonResponse {
    private UUID id;
    private String name;
    private BigDecimal price;
}