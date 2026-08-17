package com.quickbite.restaurant_order_service.repository;

import com.quickbite.restaurant_order_service.entity.MenuItem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID>{    
    List<MenuItem> findByRestaurantId(UUID RestaurantId);
    List<MenuItem> findByRestaurantIdAndIsAvailableTrue(UUID restaurantId);   
}
