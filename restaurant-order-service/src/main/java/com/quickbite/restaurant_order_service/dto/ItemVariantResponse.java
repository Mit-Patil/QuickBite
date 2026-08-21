package com.quickbite.restaurant_order_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@JsonIgnoreProperties({"default"})
@Data
@Builder
public class ItemVariantResponse {
    private UUID id;
    private String name;
    private BigDecimal price;
    
    @JsonProperty("isDefault")
    private boolean isDefault;
}