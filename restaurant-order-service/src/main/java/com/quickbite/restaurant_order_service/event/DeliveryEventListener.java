package com.quickbite.restaurant_order_service.event;

import com.quickbite.restaurant_order_service.dto.DeliveryEvent;
import com.quickbite.restaurant_order_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DeliveryEventListener {

    private static final Logger log = LoggerFactory.getLogger(DeliveryEventListener.class);

    private final OrderService orderService;

    @KafkaListener(
            topics = "${kafka.topic.delivery-events}",
            groupId = "${kafka.group.delivery-events}",
            containerFactory = "deliveryEventListenerFactory")
    public void onDeliveryEvent(DeliveryEvent event) {
        log.info("Received DeliveryEvent: type={}, orderId={}, partnerId={}",
                event.getEventType(), event.getOrderId(), event.getPartnerId());

        if ("DELIVERY_ASSIGNED".equals(event.getEventType())) {
            orderService.assignDeliveryPartner(event.getOrderId(), event.getPartnerId());
        }
    }
}