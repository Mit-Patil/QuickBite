package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemAddonId implements Serializable {
    private UUID cartItemId;
    private UUID addonId;
}