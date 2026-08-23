package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemAddonId implements Serializable {
    private UUID menuItemId;
    private UUID addonId;
}