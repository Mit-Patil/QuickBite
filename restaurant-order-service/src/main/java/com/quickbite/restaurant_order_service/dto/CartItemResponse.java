package com.quickbite.restaurant_order_service.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CartItemResponse {
    private UUID id;
    private String menuItemName;
    private BigDecimal unitPrice;
    private String variantName;
    private List<String> selectedAddonNames;
    private BigDecimal addonsTotal;
    private Integer quantity;
    private BigDecimal lineTotal;
}