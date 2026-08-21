package com.quickbite.restaurant_order_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateItemVariantRequest {
    @NotBlank(message = "Name is required")
    private String name;
    @NotNull(message = "Price is required")
    private BigDecimal price;
    @JsonProperty("isDefault")
    private boolean isDefault;
}   