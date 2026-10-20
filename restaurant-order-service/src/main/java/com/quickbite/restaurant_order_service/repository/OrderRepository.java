package com.quickbite.restaurant_order_service.repository;

import com.quickbite.restaurant_order_service.entity.Order;
import com.quickbite.restaurant_order_service.entity.Order.OrderStatus;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByCustomerIdOrderByPlacedAtDesc(UUID customerId);
    List<Order> findByRestaurantIdAndStatus(UUID restaurantId, OrderStatus status);
    List<Order> findByRestaurantIdOrderByPlacedAtDesc(UUID restaurantId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Order> findWithLockById(UUID id);
    List<Order> findByStatusAndPlacedAtBefore(OrderStatus status, LocalDateTime cutoff);
}
