package com.quickbite.restaurant_order_service.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MenuItemResponse {
    private UUID id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private boolean isVeg;
    private boolean isAvailable;
    private Integer stockQuantity;
    private String imageUrl;
    private List<ItemVariantResponse> variants;
    private List<ItemAddonResponse> addons;
}