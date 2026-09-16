package com.quickbite.restaurant_order_service.repository;

import com.quickbite.restaurant_order_service.entity.CartItemAddon;
import com.quickbite.restaurant_order_service.entity.CartItemAddonId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;


public interface CartItemAddonRepository extends JpaRepository<CartItemAddon, CartItemAddonId> {
    List<CartItemAddon> findByIdCartItemId(UUID cartItemId);
    
    @Modifying(clearAutomatically = true)
    void deleteByIdCartItemId(UUID cartItemId);
}