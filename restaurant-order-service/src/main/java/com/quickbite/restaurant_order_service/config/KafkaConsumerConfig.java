package com.quickbite.restaurant_order_service.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.quickbite.restaurant_order_service.dto.DeliveryEvent;
import com.quickbite.restaurant_order_service.dto.OrderEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
@SuppressWarnings("deprecation")
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    @Value("${kafka.group.delivery-events}")
    private String deliveryGroupId;
    
    private ObjectMapper buildObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    private <T> ConsumerFactory<String, T> buildConsumerFactory(Class<T> type, String group) {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, group);
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        JsonDeserializer<T> json = new JsonDeserializer<>(type, buildObjectMapper());
        json.addTrustedPackages("com.quickbite.restaurant_order_service.dto");
        json.setUseTypeHeaders(false);

        return new DefaultKafkaConsumerFactory<>(config,
                new StringDeserializer(),
                new ErrorHandlingDeserializer<>(json));
    }

    private <T> ConcurrentKafkaListenerContainerFactory<String, T> buildContainerFactory(
            ConsumerFactory<String, T> consumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, T> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        return factory;
    }

    @Bean
    public ConsumerFactory<String, OrderEvent> orderEventConsumerFactory() {
        return buildConsumerFactory(OrderEvent.class, groupId);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderEvent> kafkaListenerContainerFactory() {
        return buildContainerFactory(orderEventConsumerFactory());
    }

    @Bean
    public ConsumerFactory<String, DeliveryEvent> deliveryEventConsumerFactory() {
        return buildConsumerFactory(DeliveryEvent.class, deliveryGroupId);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, DeliveryEvent> deliveryEventListenerFactory() {
        return buildContainerFactory(deliveryEventConsumerFactory());
    }
}