package com.quickbite.restaurant_order_service.event;

import com.quickbite.restaurant_order_service.dto.OrderEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);

    @KafkaListener(topics = "${kafka.topic.order-events}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderEvent(OrderEvent event) {
        log.info("Received OrderEvent: type={}, orderId={}, status={} (was {}), occurredAt={}",
                event.getEventType(), event.getOrderId(), event.getStatus(),
                event.getPreviousStatus(), event.getOccurredAt());
    }
}