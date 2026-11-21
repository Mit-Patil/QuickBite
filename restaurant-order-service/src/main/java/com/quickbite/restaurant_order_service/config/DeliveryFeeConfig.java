package com.quickbite.restaurant_order_service.config;

import com.quickbite.restaurant_order_service.util.DeliveryFeePolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class DeliveryFeeConfig {

    @Bean
    public DeliveryFeePolicy deliveryFeePolicy(
            @Value("${order.delivery.base-fee:20.00}") BigDecimal baseFee,
            @Value("${order.delivery.included-km:2}") BigDecimal includedKm,
            @Value("${order.delivery.per-km:8.00}") BigDecimal perKm,
            @Value("${order.delivery.max-fee:80.00}") BigDecimal maxFee) {
        return new DeliveryFeePolicy(baseFee, includedKm, perKm, maxFee);
    }
}