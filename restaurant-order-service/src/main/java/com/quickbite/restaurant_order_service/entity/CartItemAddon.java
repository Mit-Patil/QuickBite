package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cart_item_addons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemAddon {

    @EmbeddedId
    private CartItemAddonId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("cartItemId")
    @JoinColumn(name = "cart_item_id", nullable = false)
    private CartItem cartItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("addonId")
    @JoinColumn(name = "addon_id", nullable = false)
    private ItemAddon itemAddon;
}