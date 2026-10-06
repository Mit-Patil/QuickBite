package com.quickbite.restaurant_order_service.event;

import com.quickbite.restaurant_order_service.dto.OrderEvent;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.order-events}")
    private String topic;

    public void publish(OrderEvent event) {
        try {
            kafkaTemplate.send(topic, event.getOrderId().toString(), event);
        } catch (Exception e) {
            log.error("Failed to publish OrderEvent for order {}: {}", event.getOrderId(), e.getMessage());
        }
    }
}