package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "menu_item_addons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItemAddon {
    
    @EmbeddedId
    private MenuItemAddonId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("menuItemId")
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("addonId")
    @JoinColumn(name = "addon_id", nullable = false)
    private ItemAddon itemAddon;
    
}
