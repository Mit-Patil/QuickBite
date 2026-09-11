package com.quickbite.restaurant_order_service.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class UpdateItemAddonRequest {
    private String name;
    private BigDecimal price;
    private Boolean isAvailable;
}