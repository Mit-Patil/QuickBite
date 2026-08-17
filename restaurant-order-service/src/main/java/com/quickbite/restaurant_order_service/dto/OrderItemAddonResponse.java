package com.quickbite.restaurant_order_service.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class OrderItemAddonResponse {
    private String addonName;
    private BigDecimal addonPrice;
}