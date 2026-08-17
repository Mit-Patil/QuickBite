package com.quickbite.restaurant_order_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;
import com.quickbite.restaurant_order_service.entity.ItemAddon;

public interface ItemAddonRepository extends JpaRepository<ItemAddon, UUID> {
    
    List<ItemAddon> findByMenuItemId(UUID menuItemId);
    
}
