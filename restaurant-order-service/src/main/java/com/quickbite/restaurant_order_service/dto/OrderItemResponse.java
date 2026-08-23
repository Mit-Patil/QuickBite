package com.quickbite.restaurant_order_service.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class OrderItemResponse {
    private String itemName;
    private String variantName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private List<OrderItemAddonResponse> addons;
    private BigDecimal addonsTotal;
    private BigDecimal lineTotal;
    private String specialInstructions;
}