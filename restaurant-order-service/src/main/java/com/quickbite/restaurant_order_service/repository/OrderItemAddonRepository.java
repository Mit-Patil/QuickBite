package com.quickbite.restaurant_order_service.repository;

import com.quickbite.restaurant_order_service.entity.OrderItemAddon;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemAddonRepository extends JpaRepository<OrderItemAddon, UUID> {
    List<OrderItemAddon> findByOrderItemId(UUID orderItemId);
}
