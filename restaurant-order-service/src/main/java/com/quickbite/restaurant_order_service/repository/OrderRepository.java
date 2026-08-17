package com.quickbite.restaurant_order_service.repository;

import com.quickbite.restaurant_order_service.entity.Order;
import com.quickbite.restaurant_order_service.entity.Order.OrderStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByCustomerIdOrderByPlacedAtDesc(UUID customerId);
    List<Order> findByRestaurantIdAndStatus(UUID restaurantId, OrderStatus status);
}
