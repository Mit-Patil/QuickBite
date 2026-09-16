package com.quickbite.restaurant_order_service.repository;

import com.quickbite.restaurant_order_service.entity.CartItem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByCartId(UUID cartId);
    
    @Modifying(clearAutomatically = true)
    void deleteByCartId(UUID cartId);
}
