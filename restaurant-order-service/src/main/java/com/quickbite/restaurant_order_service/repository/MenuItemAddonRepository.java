package com.quickbite.restaurant_order_service.repository;

import com.quickbite.restaurant_order_service.entity.MenuItemAddon;
import com.quickbite.restaurant_order_service.entity.MenuItemAddonId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;


public interface MenuItemAddonRepository extends JpaRepository<MenuItemAddon, MenuItemAddonId>{
    
    List<MenuItemAddon> findByIdMenuItemId(UUID menuItemId);
}
