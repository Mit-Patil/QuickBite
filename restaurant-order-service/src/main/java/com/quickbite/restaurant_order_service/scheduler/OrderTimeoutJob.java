package com.quickbite.restaurant_order_service.scheduler;

import com.quickbite.restaurant_order_service.entity.Order;
import com.quickbite.restaurant_order_service.entity.Order.OrderStatus;
import com.quickbite.restaurant_order_service.repository.OrderRepository;
import com.quickbite.restaurant_order_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class OrderTimeoutJob {

    private static final Logger log = LoggerFactory.getLogger(OrderTimeoutJob.class);

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Value("${order.accept-timeout-seconds:120}")
    private long acceptTimeoutSeconds;

    @Scheduled(fixedDelayString = "${order.accept-sweep-interval-ms:10000}")
    public void cancelUnansweredOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(acceptTimeoutSeconds);
        for (Order o : orderRepository.findByStatusAndPlacedAtBefore(OrderStatus.CONFIRMED, cutoff)) {
            try {
                orderService.cancelUnansweredOrder(o.getId());
            } catch (Exception e) {
                log.error("Timeout cancel failed for order {}: {}", o.getId(), e.getMessage());
            }
        }
    }
}