package com.quickbite.restaurant_order_service.repository;

import com.quickbite.restaurant_order_service.entity.Restaurant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantRepository extends JpaRepository<Restaurant,UUID> {
    
    List<Restaurant> findByOwnerId(UUID ownerId);
    List<Restaurant> findByCityAndIsActiveTrue(String city);
    
}
